import { createError, type H3Event } from 'h3'
import type {
  ConversationMessagesPage,
  ConversationSummary
} from '#shared/types/chat'
import {
  DEFAULT_CONVERSATION_TITLE,
  DEFAULT_MESSAGES_PAGE_LIMIT
} from '#shared/constants/polargpt'
import {
  groupAttachmentsByMessageId,
  mapConversationMessagesPage,
  mapConversationSummary
} from '../utils/conversation-mappers'
import { measureRequestMetric } from '../utils/request-metrics'
import { getSupabaseAdminClient } from '../utils/supabase-admin'
import type {
  AttachmentInsertRow,
  AttachmentRow,
  ConversationRow,
  MessageRow
} from '../types/database'
import { removeStoredAttachments } from './attachment-service'

const MAX_MESSAGES_PAGE_LIMIT = 100
type ConversationSchemaMode = 'unknown' | 'multi-user' | 'legacy'

let cachedConversationSchemaMode: ConversationSchemaMode = 'unknown'

const CONVERSATION_SELECT = 'id, user_id, title, summary, created_at, updated_at, last_message_at'
const LEGACY_CONVERSATION_SELECT = 'id, title, summary, created_at, updated_at, last_message_at'
const MESSAGE_SELECT = 'id, user_id, conversation_id, role, content, model, status, created_at'
const LEGACY_MESSAGE_SELECT = 'id, conversation_id, role, content, model, status, created_at'
const ATTACHMENT_SELECT = 'id, user_id, message_id, kind, original_name, mime_type, size_bytes, storage_path, gemini_file_name, gemini_file_uri, extracted_text, created_at'
const LEGACY_ATTACHMENT_SELECT = 'id, message_id, kind, original_name, mime_type, size_bytes, storage_path, gemini_file_name, gemini_file_uri, created_at'

function normalizeMessagesPageLimit(limit?: number | null) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_MESSAGES_PAGE_LIMIT
  }

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_MESSAGES_PAGE_LIMIT)
}

function requireAuthenticatedUserId(event?: H3Event) {
  const userId = event?.context.userSession?.userId

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication is required.'
    })
  }

  return userId
}

function getErrorCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : ''
}

function getErrorMessage(error: unknown) {
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message.toLowerCase()
    : ''
}

export function isLegacySchemaUserScopeError(error: unknown) {
  const code = getErrorCode(error)
  const message = getErrorMessage(error)

  if (code === '42703' && message.includes('user_id')) {
    return true
  }

  return code === 'PGRST204' && message.includes('user_id')
}

export function isMissingClaimLegacyRpcError(error: unknown) {
  const code = getErrorCode(error)
  const message = getErrorMessage(error)

  return (
    (code === '42883' || code === 'PGRST202')
    && message.includes('claim_legacy_chat_records')
  )
}

export function isLegacyAttachmentExtractedTextError(error: unknown) {
  const code = getErrorCode(error)
  const message = getErrorMessage(error)

  if (code === '42703' && message.includes('extracted_text')) {
    return true
  }

  return code === 'PGRST204' && message.includes('extracted_text')
}

function getConversationSelect(legacySchema: boolean) {
  return legacySchema ? LEGACY_CONVERSATION_SELECT : CONVERSATION_SELECT
}

function getMessageSelect(legacySchema: boolean) {
  return legacySchema ? LEGACY_MESSAGE_SELECT : MESSAGE_SELECT
}

function getAttachmentSelect(legacySchema: boolean) {
  return legacySchema ? LEGACY_ATTACHMENT_SELECT : ATTACHMENT_SELECT
}

function markSchemaMode(legacySchema: boolean) {
  cachedConversationSchemaMode = legacySchema ? 'legacy' : 'multi-user'
}

function normalizeAttachmentRow(
  row: Omit<AttachmentRow, 'user_id' | 'extracted_text'> & {
    user_id?: string | null
    extracted_text?: string | null
  },
  legacySchema: boolean
): AttachmentRow {
  return {
    ...row,
    user_id: legacySchema ? null : row.user_id ?? null,
    extracted_text: row.extracted_text ?? null
  }
}

async function runWithLegacySchemaFallback<T extends { error: unknown }>(
  execute: (legacySchema: boolean) => Promise<T>
) {
  const preferLegacySchema = cachedConversationSchemaMode === 'legacy'
  const initialResult = await execute(preferLegacySchema)

  if (!initialResult.error) {
    markSchemaMode(preferLegacySchema)
    return initialResult
  }

  if (!preferLegacySchema && isLegacySchemaUserScopeError(initialResult.error)) {
    markSchemaMode(true)
    return execute(true)
  }

  return initialResult
}

function getConversationRepository(event?: H3Event) {
  const client = getSupabaseAdminClient()
  const userId = requireAuthenticatedUserId(event)

  return {
    async listConversations(searchQuery?: string) {
      const { data, error } = await runWithLegacySchemaFallback(async (legacySchema) => {
        let request = client
          .from('conversations')
          .select(getConversationSelect(legacySchema))
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .order('updated_at', { ascending: false })

        if (!legacySchema) {
          request = request.eq('user_id', userId)
        }

        if (searchQuery) {
          const sanitized = searchQuery.replace(/[,%()]/g, ' ').trim()

          if (sanitized) {
            request = request.or(`title.ilike.%${sanitized}%,summary.ilike.%${sanitized}%`)
          }
        }

        return measureRequestMetric(event, 'dbMs', async () => request)
      })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load conversation history.'
        })
      }

      return (data ?? []) as unknown as ConversationRow[]
    },
    async createConversation() {
      const now = new Date().toISOString()
      const { data, error } = await runWithLegacySchemaFallback((legacySchema) =>
        measureRequestMetric(event, 'dbMs', async () => client
          .from('conversations')
          .insert({
            ...(!legacySchema ? { user_id: userId } : {}),
            title: DEFAULT_CONVERSATION_TITLE,
            summary: '',
            created_at: now,
            updated_at: now,
            last_message_at: null
          })
          .select(getConversationSelect(legacySchema))
          .single()))

      if (error || !data) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create a conversation.'
        })
      }

      return data as unknown as ConversationRow
    },
    async getConversation(conversationId: string) {
      const { data, error } = await runWithLegacySchemaFallback((legacySchema) => {
        let request = client
          .from('conversations')
          .select(getConversationSelect(legacySchema))
          .eq('id', conversationId)

        if (!legacySchema) {
          request = request.eq('user_id', userId)
        }

        return measureRequestMetric(event, 'dbMs', async () => request.maybeSingle())
      })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load the conversation.'
        })
      }

      return (data as unknown as ConversationRow | null) ?? null
    },
    async getMessage(messageId: string) {
      const { data, error } = await runWithLegacySchemaFallback((legacySchema) => {
        let request = client
          .from('messages')
          .select(getMessageSelect(legacySchema))
          .eq('id', messageId)

        if (!legacySchema) {
          request = request.eq('user_id', userId)
        }

        return measureRequestMetric(event, 'dbMs', async () => request.maybeSingle())
      })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load conversation messages.'
        })
      }

      return (data as unknown as MessageRow | null) ?? null
    },
    async listMessages(conversationId: string) {
      const { data, error } = await runWithLegacySchemaFallback((legacySchema) => {
        let request = client
          .from('messages')
          .select(getMessageSelect(legacySchema))
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (!legacySchema) {
          request = request.eq('user_id', userId)
        }

        return measureRequestMetric(event, 'dbMs', async () => request)
      })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load conversation messages.'
        })
      }

      return (data ?? []) as unknown as MessageRow[]
    },
    async listMessagesPage(conversationId: string, input: {
      beforeMessageId?: string | null
      limit?: number | null
    }) {
      const limit = normalizeMessagesPageLimit(input.limit)
      let beforeCreatedAt: string | null = null

      if (input.beforeMessageId) {
        const cursorMessage = await this.getMessage(input.beforeMessageId)

        if (!cursorMessage || cursorMessage.conversation_id !== conversationId) {
          throw createError({
            statusCode: 404,
            statusMessage: 'Conversation not found.'
          })
        }

        beforeCreatedAt = cursorMessage.created_at
      }

      const { data, error } = await runWithLegacySchemaFallback((legacySchema) => {
        let request = client
          .from('messages')
          .select(getMessageSelect(legacySchema))
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(limit + 1)

        if (!legacySchema) {
          request = request.eq('user_id', userId)
        }

        if (beforeCreatedAt) {
          request = request.lt('created_at', beforeCreatedAt)
        }

        return measureRequestMetric(event, 'dbMs', async () => request)
      })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load conversation messages.'
        })
      }

      const rows = (data ?? []) as unknown as MessageRow[]
      const hasOlder = rows.length > limit
      const selected = (hasOlder ? rows.slice(0, limit) : rows).reverse()

      return {
        messages: selected,
        nextCursor: hasOlder ? selected[0]?.id ?? null : null,
        limit
      }
    },
    async listAttachmentsByMessageIds(messageIds: string[]) {
      if (messageIds.length === 0) {
        return [] as AttachmentRow[]
      }

      const { data, error } = await runWithLegacySchemaFallback((legacySchema) => {
        const request = (client as any)
          .from('attachments')
          .select(getAttachmentSelect(legacySchema))
          .in('message_id', messageIds)
          .order('created_at', { ascending: true })

        if (!legacySchema) {
          return measureRequestMetric(event, 'dbMs', async () => request.eq('user_id', userId))
        }

        return measureRequestMetric(event, 'dbMs', async () => request)
      })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load message attachments.'
        })
      }

      const legacySchema = cachedConversationSchemaMode === 'legacy'

      return ((data ?? []) as Array<Parameters<typeof normalizeAttachmentRow>[0]>)
        .map((row) => normalizeAttachmentRow(row, legacySchema))
    },
    async listAttachmentsByIds(attachmentIds: string[]) {
      if (attachmentIds.length === 0) {
        return [] as AttachmentRow[]
      }

      const { data, error } = await runWithLegacySchemaFallback((legacySchema) => {
        const request = (client as any)
          .from('attachments')
          .select(getAttachmentSelect(legacySchema))
          .in('id', attachmentIds)

        if (!legacySchema) {
          return measureRequestMetric(event, 'dbMs', async () => request.eq('user_id', userId))
        }

        return measureRequestMetric(event, 'dbMs', async () => request)
      })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load message attachments.'
        })
      }

      const legacySchema = cachedConversationSchemaMode === 'legacy'

      return ((data ?? []) as Array<Parameters<typeof normalizeAttachmentRow>[0]>)
        .map((row) => normalizeAttachmentRow(row, legacySchema))
    },
    async insertMessage(input: {
      conversationId: string
      role: MessageRow['role']
      content: string
      model?: string | null
      status: MessageRow['status']
    }) {
      const now = new Date().toISOString()
      const { data, error } = await runWithLegacySchemaFallback((legacySchema) =>
        measureRequestMetric(event, 'dbMs', async () => client
          .from('messages')
          .insert({
            ...(!legacySchema ? { user_id: userId } : {}),
            conversation_id: input.conversationId,
            role: input.role,
            content: input.content,
            model: input.model ?? null,
            status: input.status,
            created_at: now
          })
          .select(getMessageSelect(legacySchema))
          .single()))

      if (error || !data) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save the message.'
        })
      }

      return data as unknown as MessageRow
    },
    async deleteMessage(messageId: string) {
      const { error } = await runWithLegacySchemaFallback((legacySchema) => {
        let request = client
          .from('messages')
          .delete()
          .eq('id', messageId)

        if (!legacySchema) {
          request = request.eq('user_id', userId)
        }

        return measureRequestMetric(event, 'dbMs', async () => request)
      })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to roll back the message.'
        })
      }
    },
    async insertAttachments(rows: AttachmentInsertRow[]) {
      if (rows.length === 0) {
        return [] as AttachmentRow[]
      }

      const now = new Date().toISOString()
      const { data, error } = await runWithLegacySchemaFallback((legacySchema) => {
        const request = (client as any)
          .from('attachments')
          .insert(rows.map((row) => ({
            message_id: row.message_id,
            kind: row.kind,
            original_name: row.original_name,
            mime_type: row.mime_type,
            size_bytes: row.size_bytes,
            storage_path: row.storage_path,
            gemini_file_name: row.gemini_file_name,
            gemini_file_uri: row.gemini_file_uri,
            ...(!legacySchema ? { user_id: userId, extracted_text: row.extracted_text } : {}),
            created_at: now
          })))
          .select(getAttachmentSelect(legacySchema))

        return measureRequestMetric(event, 'dbMs', async () => request)
      })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save attachment metadata.'
        })
      }

      const legacySchema = cachedConversationSchemaMode === 'legacy'

      return ((data ?? []) as Array<Parameters<typeof normalizeAttachmentRow>[0]>)
        .map((row) => normalizeAttachmentRow(row, legacySchema))
    },
    async updateAttachmentExtractedText(attachmentId: string, extractedText: string) {
      const { error } = await runWithLegacySchemaFallback((legacySchema) => {
        let request = client
          .from('attachments')
          .update({
            extracted_text: extractedText
          })
          .eq('id', attachmentId)

        if (!legacySchema) {
          request = request.eq('user_id', userId)
        }

        return measureRequestMetric(event, 'dbMs', async () => request)
      })

      if (error) {
        if (isLegacyAttachmentExtractedTextError(error)) {
          return
        }

        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save attachment metadata.'
        })
      }
    },
    async updateConversation(conversationId: string, patch: Partial<ConversationRow>) {
      const { user_id: _ignoredUserId, ...safePatch } = patch
      const { data, error } = await runWithLegacySchemaFallback((legacySchema) => {
        let request = client
          .from('conversations')
          .update({
            ...safePatch,
            updated_at: patch.updated_at ?? new Date().toISOString()
          })
          .eq('id', conversationId)

        if (!legacySchema) {
          request = request.eq('user_id', userId)
        }

        return measureRequestMetric(event, 'dbMs', async () => request
          .select(getConversationSelect(legacySchema))
          .single())
      })

      if (error || !data) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to update the conversation.'
        })
      }

      return data as unknown as ConversationRow
    },
    async deleteConversation(conversationId: string) {
      const { error } = await runWithLegacySchemaFallback((legacySchema) => {
        let request = client
          .from('conversations')
          .delete()
          .eq('id', conversationId)

        if (!legacySchema) {
          request = request.eq('user_id', userId)
        }

        return measureRequestMetric(event, 'dbMs', async () => request)
      })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to delete the conversation.'
        })
      }
    }
  }
}

export async function claimLegacyChatRecords(userId: string, event?: H3Event) {
  const client = getSupabaseAdminClient()
  const { error } = await measureRequestMetric(event, 'dbMs', async () => client.rpc('claim_legacy_chat_records', {
    claim_user_id: userId
  }))

  if (error) {
    if (isMissingClaimLegacyRpcError(error)) {
      markSchemaMode(true)
      return
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to claim existing conversation history.'
    })
  }
}

function mapMessagesPage(input: {
  conversationId: string
  messages: MessageRow[]
  attachments: AttachmentRow[]
  nextCursor: string | null
  limit: number
}): ConversationMessagesPage {
  return mapConversationMessagesPage({
    conversationId: input.conversationId,
    messages: input.messages,
    attachmentsByMessageId: groupAttachmentsByMessageId(input.attachments),
    nextCursor: input.nextCursor,
    limit: input.limit
  })
}

export async function listConversationSummaries(searchQuery?: string, event?: H3Event): Promise<ConversationSummary[]> {
  const repository = getConversationRepository(event)
  const rows = await repository.listConversations(searchQuery)
  return rows.map(mapConversationSummary)
}

export async function createConversation(event?: H3Event): Promise<ConversationSummary> {
  const repository = getConversationRepository(event)
  const row = await repository.createConversation()
  return mapConversationSummary(row)
}

export async function getConversationMessagesPageOrThrow(
  conversationId: string,
  input: {
    beforeMessageId?: string | null
    limit?: number | null
  } = {},
  event?: H3Event
) {
  const repository = getConversationRepository(event)
  const conversation = await repository.getConversation(conversationId)

  if (!conversation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Conversation not found.'
    })
  }

  const pageResult = await repository.listMessagesPage(conversationId, input)
  const attachments = await repository.listAttachmentsByMessageIds(pageResult.messages.map((message) => message.id))

  return {
    conversation: mapConversationSummary(conversation),
    page: mapMessagesPage({
      conversationId,
      messages: pageResult.messages,
      attachments,
      nextCursor: pageResult.nextCursor,
      limit: pageResult.limit
    })
  }
}

export async function getConversationMessagesOnlyOrThrow(
  conversationId: string,
  input: {
    beforeMessageId?: string | null
    limit?: number | null
  } = {},
  event?: H3Event
) {
  const result = await getConversationMessagesPageOrThrow(conversationId, input, event)

  return result.page
}

export async function listAttachmentsByIds(attachmentIds: string[], event?: H3Event) {
  const repository = getConversationRepository(event)
  return repository.listAttachmentsByIds(attachmentIds)
}

export async function renameConversation(conversationId: string, title: string, event?: H3Event) {
  const repository = getConversationRepository(event)
  const existing = await repository.getConversation(conversationId)

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Conversation not found.'
    })
  }

  const updated = await repository.updateConversation(conversationId, {
    title
  })

  return mapConversationSummary(updated)
}

export async function deleteConversation(conversationId: string, event?: H3Event) {
  const repository = getConversationRepository(event)
  const conversation = await repository.getConversation(conversationId)

  if (!conversation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Conversation not found.'
    })
  }

  const messages = await repository.listMessages(conversationId)
  const attachments = await repository.listAttachmentsByMessageIds(messages.map((message) => message.id))
  await removeStoredAttachments(attachments)
  await repository.deleteConversation(conversationId)
}

export function getConversationDataAccess(event?: H3Event) {
  return getConversationRepository(event)
}

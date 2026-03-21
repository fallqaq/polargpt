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

function normalizeMessagesPageLimit(limit?: number | null) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_MESSAGES_PAGE_LIMIT
  }

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_MESSAGES_PAGE_LIMIT)
}

function getConversationRepository(event?: H3Event) {
  const client = getSupabaseAdminClient()

  return {
    async listConversations(searchQuery?: string) {
      let request = client
        .from('conversations')
        .select('id, title, summary, created_at, updated_at, last_message_at')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })

      if (searchQuery) {
        const sanitized = searchQuery.replace(/[,%()]/g, ' ').trim()

        if (sanitized) {
          request = request.or(`title.ilike.%${sanitized}%,summary.ilike.%${sanitized}%`)
        }
      }

      const { data, error } = await measureRequestMetric(event, 'dbMs', async () => request)

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load conversation history.'
        })
      }

      return (data ?? []) as ConversationRow[]
    },
    async createConversation() {
      const now = new Date().toISOString()
      const { data, error } = await measureRequestMetric(event, 'dbMs', async () => client
        .from('conversations')
        .insert({
          title: DEFAULT_CONVERSATION_TITLE,
          summary: '',
          created_at: now,
          updated_at: now,
          last_message_at: null
        })
        .select('id, title, summary, created_at, updated_at, last_message_at')
        .single())

      if (error || !data) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create a conversation.'
        })
      }

      return data as ConversationRow
    },
    async getConversation(conversationId: string) {
      const { data, error } = await measureRequestMetric(event, 'dbMs', async () => client
        .from('conversations')
        .select('id, title, summary, created_at, updated_at, last_message_at')
        .eq('id', conversationId)
        .maybeSingle())

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load the conversation.'
        })
      }

      return (data as ConversationRow | null) ?? null
    },
    async getMessage(messageId: string) {
      const { data, error } = await measureRequestMetric(event, 'dbMs', async () => client
        .from('messages')
        .select('id, conversation_id, role, content, model, status, created_at')
        .eq('id', messageId)
        .maybeSingle())

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load conversation messages.'
        })
      }

      return (data as MessageRow | null) ?? null
    },
    async listMessages(conversationId: string) {
      const { data, error } = await measureRequestMetric(event, 'dbMs', async () => client
        .from('messages')
        .select('id, conversation_id, role, content, model, status, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }))

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load conversation messages.'
        })
      }

      return (data ?? []) as MessageRow[]
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

      let request = client
        .from('messages')
        .select('id, conversation_id, role, content, model, status, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit + 1)

      if (beforeCreatedAt) {
        request = request.lt('created_at', beforeCreatedAt)
      }

      const { data, error } = await measureRequestMetric(event, 'dbMs', async () => request)

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load conversation messages.'
        })
      }

      const rows = (data ?? []) as MessageRow[]
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

      const { data, error } = await measureRequestMetric(event, 'dbMs', async () => client
        .from('attachments')
        .select('id, message_id, kind, original_name, mime_type, size_bytes, storage_path, gemini_file_name, gemini_file_uri, created_at')
        .in('message_id', messageIds)
        .order('created_at', { ascending: true }))

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load message attachments.'
        })
      }

      return (data ?? []) as AttachmentRow[]
    },
    async listAttachmentsByIds(attachmentIds: string[]) {
      if (attachmentIds.length === 0) {
        return [] as AttachmentRow[]
      }

      const { data, error } = await measureRequestMetric(event, 'dbMs', async () => client
        .from('attachments')
        .select('id, message_id, kind, original_name, mime_type, size_bytes, storage_path, gemini_file_name, gemini_file_uri, created_at')
        .in('id', attachmentIds))

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load message attachments.'
        })
      }

      return (data ?? []) as AttachmentRow[]
    },
    async insertMessage(input: {
      conversationId: string
      role: MessageRow['role']
      content: string
      model?: string | null
      status: MessageRow['status']
    }) {
      const now = new Date().toISOString()
      const { data, error } = await measureRequestMetric(event, 'dbMs', async () => client
        .from('messages')
        .insert({
          conversation_id: input.conversationId,
          role: input.role,
          content: input.content,
          model: input.model ?? null,
          status: input.status,
          created_at: now
        })
        .select('id, conversation_id, role, content, model, status, created_at')
        .single())

      if (error || !data) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save the message.'
        })
      }

      return data as MessageRow
    },
    async deleteMessage(messageId: string) {
      const { error } = await measureRequestMetric(event, 'dbMs', async () => client
        .from('messages')
        .delete()
        .eq('id', messageId))

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
      const { data, error } = await measureRequestMetric(event, 'dbMs', async () => client
        .from('attachments')
        .insert(rows.map((row) => ({
          ...row,
          created_at: now
        })))
        .select('id, message_id, kind, original_name, mime_type, size_bytes, storage_path, gemini_file_name, gemini_file_uri, created_at'))

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save attachment metadata.'
        })
      }

      return (data ?? []) as AttachmentRow[]
    },
    async updateConversation(conversationId: string, patch: Partial<ConversationRow>) {
      const { data, error } = await measureRequestMetric(event, 'dbMs', async () => client
        .from('conversations')
        .update({
          ...patch,
          updated_at: patch.updated_at ?? new Date().toISOString()
        })
        .eq('id', conversationId)
        .select('id, title, summary, created_at, updated_at, last_message_at')
        .single())

      if (error || !data) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to update the conversation.'
        })
      }

      return data as ConversationRow
    },
    async deleteConversation(conversationId: string) {
      const { error } = await measureRequestMetric(event, 'dbMs', async () => client
        .from('conversations')
        .delete()
        .eq('id', conversationId))

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to delete the conversation.'
        })
      }
    }
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

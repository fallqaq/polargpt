import { createError } from 'h3'
import { DEFAULT_CONVERSATION_TITLE } from '#shared/constants/polargpt'
import type { ConversationDetail, ConversationSummary } from '#shared/types/chat'
import { mapConversationDetail, mapConversationSummary } from '../utils/conversation-mappers'
import { getSupabaseAdminClient } from '../utils/supabase-admin'
import type { AttachmentInsertRow, AttachmentRow, ConversationRow, MessageRow } from '../types/database'
import { createSignedAttachmentUrls, removeStoredAttachments } from './attachment-service'

function getConversationRepository() {
  const client = getSupabaseAdminClient()

  return {
    async listConversations(searchQuery?: string) {
      let request = client
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })

      if (searchQuery) {
        const sanitized = searchQuery.replace(/[,%()]/g, ' ').trim()

        if (sanitized) {
          request = request.or(`title.ilike.%${sanitized}%,summary.ilike.%${sanitized}%`)
        }
      }

      const { data, error } = await request

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
      const { data, error } = await client
        .from('conversations')
        .insert({
          title: DEFAULT_CONVERSATION_TITLE,
          summary: '',
          created_at: now,
          updated_at: now,
          last_message_at: null
        })
        .select('*')
        .single()

      if (error || !data) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create a conversation.'
        })
      }

      return data as ConversationRow
    },
    async getConversation(conversationId: string) {
      const { data, error } = await client
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle()

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load the conversation.'
        })
      }

      return (data as ConversationRow | null) ?? null
    },
    async listMessages(conversationId: string) {
      const { data, error } = await client
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to load conversation messages.'
        })
      }

      return (data ?? []) as MessageRow[]
    },
    async listAttachmentsByMessageIds(messageIds: string[]) {
      if (messageIds.length === 0) {
        return [] as AttachmentRow[]
      }

      const { data, error } = await client
        .from('attachments')
        .select('*')
        .in('message_id', messageIds)
        .order('created_at', { ascending: true })

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
      const { data, error } = await client
        .from('messages')
        .insert({
          conversation_id: input.conversationId,
          role: input.role,
          content: input.content,
          model: input.model ?? null,
          status: input.status,
          created_at: now
        })
        .select('*')
        .single()

      if (error || !data) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save the message.'
        })
      }

      return data as MessageRow
    },
    async deleteMessage(messageId: string) {
      const { error } = await client.from('messages').delete().eq('id', messageId)

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
      const { data, error } = await client
        .from('attachments')
        .insert(rows.map((row) => ({
          ...row,
          created_at: now
        })))
        .select('*')

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save attachment metadata.'
        })
      }

      return (data ?? []) as AttachmentRow[]
    },
    async updateConversation(conversationId: string, patch: Partial<ConversationRow>) {
      const { data, error } = await client
        .from('conversations')
        .update({
          ...patch,
          updated_at: patch.updated_at ?? new Date().toISOString()
        })
        .eq('id', conversationId)
        .select('*')
        .single()

      if (error || !data) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to update the conversation.'
        })
      }

      return data as ConversationRow
    },
    async deleteConversation(conversationId: string) {
      const { error } = await client.from('conversations').delete().eq('id', conversationId)

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to delete the conversation.'
        })
      }
    }
  }
}

export async function listConversationSummaries(searchQuery?: string): Promise<ConversationSummary[]> {
  const repository = getConversationRepository()
  const rows = await repository.listConversations(searchQuery)
  return rows.map(mapConversationSummary)
}

export async function createConversation(): Promise<ConversationSummary> {
  const repository = getConversationRepository()
  const row = await repository.createConversation()
  return mapConversationSummary(row)
}

export async function getConversationDetailOrThrow(conversationId: string): Promise<ConversationDetail> {
  const repository = getConversationRepository()
  const conversation = await repository.getConversation(conversationId)

  if (!conversation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Conversation not found.'
    })
  }

  const messages = await repository.listMessages(conversationId)
  const attachments = await repository.listAttachmentsByMessageIds(messages.map((message) => message.id))
  const signedUrls = await createSignedAttachmentUrls(attachments)

  return mapConversationDetail({
    conversation,
    messages,
    attachments,
    signedUrls
  })
}

export async function renameConversation(conversationId: string, title: string) {
  const repository = getConversationRepository()
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

export async function deleteConversation(conversationId: string) {
  const repository = getConversationRepository()
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

export function getConversationDataAccess() {
  return getConversationRepository()
}

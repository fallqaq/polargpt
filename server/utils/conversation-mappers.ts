import type { AttachmentRow, ConversationRow, MessageRow } from '../types/database'
import type {
  AttachmentRecord,
  ChatMessage,
  ConversationMessagesPage,
  ConversationSummary
} from '#shared/types/chat'

export function mapConversationSummary(row: ConversationRow): ConversationSummary {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at
  }
}

export function mapAttachmentRecord(row: AttachmentRow): AttachmentRecord {
  return {
    id: row.id,
    messageId: row.message_id,
    kind: row.kind,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at
  }
}

export function groupAttachmentsByMessageId(attachments: AttachmentRow[]) {
  const grouped = new Map<string, AttachmentRow[]>()

  for (const attachment of attachments) {
    const current = grouped.get(attachment.message_id)

    if (current) {
      current.push(attachment)
    }
    else {
      grouped.set(attachment.message_id, [attachment])
    }
  }

  return grouped
}

export function mapMessageRecord(row: MessageRow, attachments: AttachmentRow[]): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    model: row.model,
    status: row.status,
    createdAt: row.created_at,
    attachments: attachments.map(mapAttachmentRecord)
  }
}

export function mapConversationMessagesPage(input: {
  conversationId: string
  messages: MessageRow[]
  attachmentsByMessageId: Map<string, AttachmentRow[]>
  nextCursor: string | null
  limit: number
}): ConversationMessagesPage {
  return {
    conversationId: input.conversationId,
    messages: input.messages.map((message) =>
      mapMessageRecord(message, input.attachmentsByMessageId.get(message.id) ?? [])),
    nextCursor: input.nextCursor,
    limit: input.limit
  }
}

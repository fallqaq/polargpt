import type { AttachmentRow, ConversationRow, MessageRow } from '../types/database'
import type { AttachmentRecord, ChatMessage, ConversationDetail, ConversationSummary } from '#shared/types/chat'

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

export function mapAttachmentRecord(row: AttachmentRow, downloadUrl: string | null): AttachmentRecord {
  return {
    id: row.id,
    messageId: row.message_id,
    kind: row.kind,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    downloadUrl
  }
}

export function mapMessageRecord(
  row: MessageRow,
  attachments: AttachmentRow[],
  signedUrls: Map<string, string | null>
): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    model: row.model,
    status: row.status,
    createdAt: row.created_at,
    attachments: attachments
      .filter((attachment) => attachment.message_id === row.id)
      .map((attachment) => mapAttachmentRecord(attachment, signedUrls.get(attachment.id) ?? null))
  }
}

export function mapConversationDetail(input: {
  conversation: ConversationRow
  messages: MessageRow[]
  attachments: AttachmentRow[]
  signedUrls: Map<string, string | null>
}): ConversationDetail {
  return {
    ...mapConversationSummary(input.conversation),
    messages: input.messages.map((message) => mapMessageRecord(message, input.attachments, input.signedUrls))
  }
}

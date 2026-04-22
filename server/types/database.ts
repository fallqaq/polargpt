import type { SupportedAttachmentKind } from '#shared/constants/polargpt'
import type { ChatRole, MessageStatus } from '#shared/types/chat'

export interface ConversationRow {
  id: string
  user_id: string | null
  title: string
  summary: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

export interface MessageRow {
  id: string
  user_id: string | null
  conversation_id: string
  role: ChatRole
  content: string
  model: string | null
  status: MessageStatus
  created_at: string
}

export interface AttachmentRow {
  id: string
  user_id: string | null
  message_id: string
  kind: SupportedAttachmentKind
  original_name: string
  mime_type: string
  size_bytes: number
  storage_path: string
  gemini_file_name: string | null
  gemini_file_uri: string | null
  extracted_text: string | null
  created_at: string
}

export interface AttachmentInsertRow {
  message_id: string
  kind: SupportedAttachmentKind
  original_name: string
  mime_type: string
  size_bytes: number
  storage_path: string
  gemini_file_name: string | null
  gemini_file_uri: string | null
  extracted_text: string | null
}

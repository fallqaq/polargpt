import type { SupportedAttachmentKind } from '../constants/polargpt'

export type ChatRole = 'user' | 'assistant'
export type MessageStatus = 'completed' | 'error'

export interface ConversationSummary {
  id: string
  title: string
  summary: string
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
}

export interface AttachmentRecord {
  id: string
  messageId: string
  kind: SupportedAttachmentKind
  originalName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  role: ChatRole
  content: string
  model: string | null
  status: MessageStatus
  createdAt: string
  attachments: AttachmentRecord[]
}

export interface ConversationMessagesPage {
  conversationId: string
  messages: ChatMessage[]
  nextCursor: string | null
  limit: number
}

export interface AttachmentUrlRecord {
  attachmentId: string
  downloadUrl: string | null
}

export interface LoginResponse {
  ok: true
}

export interface ConversationListResponse {
  conversations: ConversationSummary[]
}

export interface ConversationDetailPageResponse {
  conversation: ConversationSummary
  page: ConversationMessagesPage
}

export interface ConversationMessagesPageResponse {
  page: ConversationMessagesPage
}

export interface ConversationSummaryResponse {
  conversation: ConversationSummary
}

export interface SendMessageDeltaResponse {
  conversation: ConversationSummary
  appendedMessages: ChatMessage[]
}

export interface AttachmentUrlResponse {
  attachments: AttachmentUrlRecord[]
}

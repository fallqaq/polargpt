/**
 * Shared constants are kept here so client and server code validate against the
 * same attachment and session rules.
 */
export const APP_NAME = 'PolarGPT'
export const DEFAULT_CONVERSATION_TITLE = 'New conversation'
export const DEFAULT_AI_PROVIDER = 'deepseek'
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat'
export const ATTACHMENT_BUCKET = 'chat-attachments'
export const MAX_ATTACHMENTS_PER_MESSAGE = 4
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024
export const AUTH_PASSWORD_MIN_LENGTH = 6
export const DEEPSEEK_MAX_DOCUMENT_CHARS = 30_000
export const DEEPSEEK_MAX_TOTAL_DOCUMENT_CHARS = 120_000
export const USER_SESSION_COOKIE_NAME = 'polargpt_user_session'
export const USER_HINT_COOKIE_NAME = 'polargpt_user_hint'
export const USER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
export const SIGNED_ATTACHMENT_URL_TTL_SECONDS = 60 * 5
export const DEFAULT_MESSAGES_PAGE_LIMIT = 50

export type ModelProvider = 'gemini' | 'deepseek'
export type SupportedAttachmentKind = 'image' | 'document'

export interface AttachmentRule {
  extension: string
  kind: SupportedAttachmentKind
  maxBytes: number
  mimeTypes: string[]
}

export const ATTACHMENT_RULES: AttachmentRule[] = [
  {
    extension: 'png',
    kind: 'image',
    maxBytes: MAX_IMAGE_BYTES,
    mimeTypes: ['image/png']
  },
  {
    extension: 'jpg',
    kind: 'image',
    maxBytes: MAX_IMAGE_BYTES,
    mimeTypes: ['image/jpeg']
  },
  {
    extension: 'jpeg',
    kind: 'image',
    maxBytes: MAX_IMAGE_BYTES,
    mimeTypes: ['image/jpeg']
  },
  {
    extension: 'webp',
    kind: 'image',
    maxBytes: MAX_IMAGE_BYTES,
    mimeTypes: ['image/webp']
  },
  {
    extension: 'pdf',
    kind: 'document',
    maxBytes: MAX_DOCUMENT_BYTES,
    mimeTypes: ['application/pdf']
  },
  {
    extension: 'txt',
    kind: 'document',
    maxBytes: MAX_DOCUMENT_BYTES,
    mimeTypes: ['text/plain']
  },
  {
    extension: 'md',
    kind: 'document',
    maxBytes: MAX_DOCUMENT_BYTES,
    mimeTypes: ['text/markdown', 'text/plain', 'text/x-markdown']
  }
]

export function normalizeModelProvider(value?: string | null): ModelProvider {
  return value === 'gemini' ? 'gemini' : DEFAULT_AI_PROVIDER
}

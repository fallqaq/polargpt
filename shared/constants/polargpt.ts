/**
 * Shared constants are kept here so client and server code validate against the
 * same attachment and session rules.
 */
export const APP_NAME = 'polarGPT'
export const DEFAULT_CONVERSATION_TITLE = 'New conversation'
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
export const ATTACHMENT_BUCKET = 'chat-attachments'
export const MAX_ATTACHMENTS_PER_MESSAGE = 4
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024
export const ADMIN_SESSION_COOKIE_NAME = 'polargpt_admin_session'
export const ADMIN_HINT_COOKIE_NAME = 'polargpt_admin_hint'
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
export const SIGNED_ATTACHMENT_URL_TTL_SECONDS = 60

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

export const ACCEPT_ATTRIBUTE = [
  'image/png',
  'image/jpeg',
  'image/webp',
  '.pdf',
  '.txt',
  '.md'
].join(',')

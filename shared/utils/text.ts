import { DEFAULT_CONVERSATION_TITLE } from '../constants/polargpt'

export function normalizeMessageText(value: string | null | undefined) {
  return (value ?? '').replace(/\r\n/g, '\n').trim()
}

export function truncateText(value: string, maxLength: number) {
  const normalized = value.trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

/**
 * The first user prompt sets the initial title unless the signed-in user edits
 * it later. The title stays deterministic so it can be regenerated in tests.
 */
export function buildConversationTitle(source: string | null | undefined) {
  const normalized = normalizeMessageText(source)

  if (!normalized) {
    return DEFAULT_CONVERSATION_TITLE
  }

  return truncateText(normalized, 48)
}

export function buildConversationSummary(input: {
  userSnippet: string
  assistantSnippet?: string | null
}) {
  const userSnippet = truncateText(normalizeMessageText(input.userSnippet) || 'Attachment message', 110)
  const assistantSnippet = truncateText(normalizeMessageText(input.assistantSnippet) || '', 140)

  if (!assistantSnippet) {
    return `User: ${userSnippet}`
  }

  return `User: ${userSnippet} | AI: ${assistantSnippet}`
}

export function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value
}

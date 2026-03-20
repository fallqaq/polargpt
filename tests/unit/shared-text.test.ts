import { describe, expect, it } from 'vitest'
import {
  buildConversationSummary,
  buildConversationTitle,
  normalizeMessageText,
  truncateText
} from '#shared/utils/text'

describe('shared text utilities', () => {
  it('normalizes message text by trimming and unifying line endings', () => {
    expect(normalizeMessageText(' hello\r\nworld \n')).toBe('hello\nworld')
  })

  it('builds a stable conversation title from the first user prompt', () => {
    expect(buildConversationTitle('  Explain the quarterly revenue delta in plain English  ')).toBe(
      'Explain the quarterly revenue delta in plain En…'
    )
  })

  it('builds a search-friendly conversation summary', () => {
    expect(buildConversationSummary({
      userSnippet: 'Compare the latest two files for changes',
      assistantSnippet: 'The second file adds deployment steps and clarifies the environment variables.'
    })).toBe(
      'User: Compare the latest two files for changes | AI: The second file adds deployment steps and clarifies the environment variables.'
    )
  })

  it('truncates text with an ellipsis when needed', () => {
    expect(truncateText('123456', 5)).toBe('1234…')
  })
})

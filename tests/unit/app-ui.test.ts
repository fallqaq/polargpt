import { describe, expect, it } from 'vitest'
import { getRequestErrorMessage } from '@/app/utils/request-errors'
import {
  resolveEnglishUiText,
  resolveUiText,
  resolveUiTheme,
  translateKnownErrorMessage
} from '@/app/utils/ui'

describe('app ui utilities', () => {
  it('renders translated copy with interpolation', () => {
    expect(resolveUiText('zh-CN', 'composerHint', { count: 4 })).toContain('4')
    expect(resolveUiText('en-US', 'toolbarThemeDark')).toBe('Dark')
  })

  it('can force decorative copy to remain in English', () => {
    expect(resolveEnglishUiText('loginTitle')).toBe('polarGPT control room')
    expect(resolveEnglishUiText('threadEmptyTitle')).toBe('Start with a direct prompt or upload context first.')
  })

  it('resolves the theme from the stored preference or system fallback', () => {
    expect(resolveUiTheme('light', true)).toBe('light')
    expect(resolveUiTheme(null, true)).toBe('dark')
    expect(resolveUiTheme(undefined, false)).toBe('light')
  })

  it('translates known exact and pattern-based error messages', () => {
    expect(translateKnownErrorMessage('zh-CN', 'Conversation not found.')).toBe('未找到该会话。')
    expect(translateKnownErrorMessage('zh-CN', 'report.pdf exceeds the size limit of 20 MB.')).toBe(
      'report.pdf 超过大小限制 20 MB。'
    )
  })

  it('keeps unknown error text intact for diagnostics', () => {
    expect(translateKnownErrorMessage('zh-CN', 'Network exploded.')).toBe('Network exploded.')
  })

  it('localizes request fallbacks when no useful error text is available', () => {
    expect(getRequestErrorMessage({}, {
      locale: 'zh-CN',
      fallbackKey: 'errorSendMessage'
    })).toBe('发送消息失败。')
  })

  it('localizes plain Error instances through the shared error mapping', () => {
    expect(getRequestErrorMessage(new Error('Failed to load conversation history.'), {
      locale: 'zh-CN',
      fallbackKey: 'errorGeneric'
    })).toBe('加载会话历史失败。')
  })
})

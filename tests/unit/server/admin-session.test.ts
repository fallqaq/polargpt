import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdminSessionToken, parseAdminSessionToken } from '#server/utils/admin-session'

describe('admin session tokens', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('round-trips a signed session token', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-20T00:00:00.000Z'))

    const token = createAdminSessionToken('test-secret')
    const payload = parseAdminSessionToken(token, 'test-secret')

    expect(payload).not.toBeNull()
    expect(payload?.version).toBe(1)
  })

  it('rejects an expired session token', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-20T00:00:00.000Z'))

    const token = createAdminSessionToken('test-secret')
    vi.setSystemTime(new Date('2026-04-01T00:00:00.000Z'))

    expect(parseAdminSessionToken(token, 'test-secret')).toBeNull()
  })
})

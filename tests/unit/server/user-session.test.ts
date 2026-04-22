import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import { createUserSessionToken, parseUserSessionToken } from '#server/utils/user-session'

describe('user session tokens', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('round-trips a signed session token with user identity fields', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-20T00:00:00.000Z'))

    const token = createUserSessionToken({
      userId: 'user-1',
      email: 'person@example.com'
    }, 'test-secret')
    const payload = parseUserSessionToken(token, 'test-secret')

    expect(payload).not.toBeNull()
    expect(payload?.version).toBe(1)
    expect(payload?.userId).toBe('user-1')
    expect(payload?.email).toBe('person@example.com')
  })

  it('rejects an expired session token', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-20T00:00:00.000Z'))

    const token = createUserSessionToken({
      userId: 'user-1',
      email: 'person@example.com'
    }, 'test-secret')
    vi.setSystemTime(new Date('2026-04-01T00:00:00.000Z'))

    expect(parseUserSessionToken(token, 'test-secret')).toBeNull()
  })

  it('rejects a token when required identity fields are missing', () => {
    const encodedPayload = Buffer.from(JSON.stringify({
      version: 1,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000
    }), 'utf8').toString('base64url')
    const signature = createHmac('sha256', 'test-secret').update(encodedPayload).digest('base64url')

    expect(parseUserSessionToken(`${encodedPayload}.${signature}`, 'test-secret')).toBeNull()
  })
})

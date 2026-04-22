import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAuthService,
  isTransientAuthProviderError,
  mapSupabaseLoginError,
  mapSupabaseRegisterError,
  parseAuthCredentials,
  runAuthProviderOperation
} from '#server/services/auth-service'

const { createUserSessionToken, setUserSessionCookies } = vi.hoisted(() => ({
  createUserSessionToken: vi.fn(() => 'signed-token'),
  setUserSessionCookies: vi.fn()
}))

const { reportServerError } = vi.hoisted(() => ({
  reportServerError: vi.fn()
}))

vi.mock('#server/utils/runtime-config', () => ({
  requireServerConfigValue: vi.fn(() => 'test-session-secret')
}))

vi.mock('#server/utils/user-session', () => ({
  clearUserSessionCookies: vi.fn(),
  createUserSessionToken,
  readUserSession: vi.fn(),
  requireUserSession: vi.fn(),
  setUserSessionCookies
}))

vi.mock('#server/utils/logger', () => ({
  reportServerError
}))

describe('auth service', () => {
  beforeEach(() => {
    createUserSessionToken.mockClear()
    setUserSessionCookies.mockClear()
    reportServerError.mockClear()
  })

  it('normalizes valid email/password credentials', () => {
    expect(parseAuthCredentials({
      email: ' Person@Example.com ',
      password: 'secret-123'
    })).toEqual({
      email: 'person@example.com',
      password: 'secret-123'
    })
  })

  it('rejects invalid email and short password inputs', () => {
    expect(() => parseAuthCredentials({
      email: 'not-an-email',
      password: '12345'
    })).toThrow('Email address is invalid.')
  })

  it('registers a user, claims legacy data, and issues a signed session', async () => {
    const service = createAuthService({
      createUser: vi.fn().mockResolvedValue({
        id: 'user-1',
        email: 'person@example.com'
      }),
      signInWithPassword: vi.fn(),
      claimLegacyData: vi.fn().mockResolvedValue(undefined)
    })

    const event = {} as any
    const user = await service.register(event, {
      email: 'person@example.com',
      password: 'secret-123'
    })

    expect(user).toEqual({
      id: 'user-1',
      email: 'person@example.com'
    })
    expect(createUserSessionToken).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'person@example.com'
    }, 'test-session-secret')
    expect(setUserSessionCookies).toHaveBeenCalledWith(event, 'signed-token')
  })

  it('logs a user in and issues a signed session cookie', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      id: 'user-2',
      email: 'user2@example.com'
    })
    const service = createAuthService({
      createUser: vi.fn(),
      signInWithPassword,
      claimLegacyData: vi.fn()
    })

    await service.login({} as any, {
      email: 'user2@example.com',
      password: 'secret-123'
    })

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'user2@example.com',
      password: 'secret-123'
    })
    expect(createUserSessionToken).toHaveBeenCalledWith({
      userId: 'user-2',
      email: 'user2@example.com'
    }, 'test-session-secret')
  })

  it('detects transient upstream auth connectivity errors', () => {
    const error = new TypeError('fetch failed', {
      cause: Object.assign(new Error('socket disconnected before tls connection was established'), {
        code: 'ECONNRESET'
      })
    })

    expect(isTransientAuthProviderError(error)).toBe(true)
  })

  it('retries transient auth provider operations once', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new TypeError('fetch failed', {
        cause: Object.assign(new Error('socket disconnected before tls connection was established'), {
          code: 'ECONNRESET'
        })
      }))
      .mockResolvedValueOnce('ok')

    await expect(runAuthProviderOperation(operation)).resolves.toBe('ok')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('maps transient login failures to a 502 instead of invalid credentials', () => {
    const error = new TypeError('fetch failed', {
      cause: Object.assign(new Error('socket disconnected before tls connection was established'), {
        code: 'ECONNRESET'
      })
    })

    expect(() => {
      throw mapSupabaseLoginError(error)
    }).toThrow('Authentication service is temporarily unavailable.')
    expect(reportServerError).toHaveBeenCalledWith('auth.login', error)
  })

  it('maps duplicate registration errors to a 409 conflict', () => {
    expect(() => {
      throw mapSupabaseRegisterError(new Error('User already registered'))
    }).toThrow('An account with this email already exists.')
    expect(reportServerError).not.toHaveBeenCalled()
  })
})

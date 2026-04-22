import { createHmac, timingSafeEqual } from 'node:crypto'
import { createError, deleteCookie, getCookie, setCookie, type H3Event } from 'h3'
import {
  USER_HINT_COOKIE_NAME,
  USER_SESSION_COOKIE_NAME,
  USER_SESSION_MAX_AGE_SECONDS
} from '#shared/constants/polargpt'

export interface UserSessionPayload {
  version: 1
  userId: string
  email: string
  issuedAt: number
  expiresAt: number
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url')
}

export function createUserSessionToken(
  input: {
    userId: string
    email: string
  },
  secret: string,
  now = Date.now()
) {
  const payload: UserSessionPayload = {
    version: 1,
    userId: input.userId,
    email: input.email,
    issuedAt: now,
    expiresAt: now + (USER_SESSION_MAX_AGE_SECONDS * 1000)
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = signPayload(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export function parseUserSessionToken(token: string | undefined, secret: string): UserSessionPayload | null {
  if (!token) {
    return null
  }

  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = signPayload(encodedPayload, secret)

  if (signature.length !== expectedSignature.length) {
    return null
  }

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<UserSessionPayload>

    if (
      payload.version !== 1
      || typeof payload.userId !== 'string'
      || !payload.userId
      || typeof payload.email !== 'string'
      || !payload.email
      || typeof payload.expiresAt !== 'number'
      || payload.expiresAt < Date.now()
    ) {
      return null
    }

    return payload as UserSessionPayload
  }
  catch {
    return null
  }
}

export function setUserSessionCookies(event: H3Event, token: string) {
  const secure = process.env.NODE_ENV === 'production'

  setCookie(event, USER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: USER_SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure
  })

  setCookie(event, USER_HINT_COOKIE_NAME, '1', {
    httpOnly: false,
    maxAge: USER_SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure
  })
}

export function clearUserSessionCookies(event: H3Event) {
  deleteCookie(event, USER_SESSION_COOKIE_NAME, { path: '/' })
  deleteCookie(event, USER_HINT_COOKIE_NAME, { path: '/' })
}

export function readUserSession(event: H3Event, secret: string) {
  const token = getCookie(event, USER_SESSION_COOKIE_NAME)
  return parseUserSessionToken(token, secret)
}

export function requireUserSession(event: H3Event, secret: string) {
  const session = readUserSession(event, secret)

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication is required.'
    })
  }

  return session
}

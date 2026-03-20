import { createHmac, timingSafeEqual } from 'node:crypto'
import { createError, deleteCookie, getCookie, setCookie, type H3Event } from 'h3'
import {
  ADMIN_HINT_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS
} from '#shared/constants/polargpt'

export interface AdminSessionPayload {
  version: 1
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

export function createAdminSessionToken(secret: string, now = Date.now()) {
  const payload: AdminSessionPayload = {
    version: 1,
    issuedAt: now,
    expiresAt: now + (ADMIN_SESSION_MAX_AGE_SECONDS * 1000)
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = signPayload(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export function parseAdminSessionToken(token: string | undefined, secret: string): AdminSessionPayload | null {
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
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminSessionPayload

    if (payload.version !== 1 || payload.expiresAt < Date.now()) {
      return null
    }

    return payload
  }
  catch {
    return null
  }
}

export function setAdminSessionCookies(event: H3Event, token: string) {
  const secure = process.env.NODE_ENV === 'production'

  setCookie(event, ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure
  })

  setCookie(event, ADMIN_HINT_COOKIE_NAME, '1', {
    httpOnly: false,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure
  })
}

export function clearAdminSessionCookies(event: H3Event) {
  deleteCookie(event, ADMIN_SESSION_COOKIE_NAME, { path: '/' })
  deleteCookie(event, ADMIN_HINT_COOKIE_NAME, { path: '/' })
}

export function readAdminSession(event: H3Event, secret: string) {
  const token = getCookie(event, ADMIN_SESSION_COOKIE_NAME)
  return parseAdminSessionToken(token, secret)
}

export function requireAdminSession(event: H3Event, secret: string) {
  const session = readAdminSession(event, secret)

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Administrator session is required.'
    })
  }

  return session
}

import { createError, type H3Event } from 'h3'
import { AUTH_PASSWORD_MIN_LENGTH } from '#shared/constants/polargpt'
import type { AuthUser } from '#shared/types/chat'
import { claimLegacyChatRecords } from './conversation-service'
import { reportServerError } from '../utils/logger'
import { getSupabaseAdminClient } from '../utils/supabase-admin'
import { getSupabaseAuthClient } from '../utils/supabase-auth'
import { requireServerConfigValue } from '../utils/runtime-config'
import {
  clearUserSessionCookies,
  createUserSessionToken,
  readUserSession,
  requireUserSession as requireUserSessionFromToken,
  setUserSessionCookies
} from '../utils/user-session'

export interface AuthCredentials {
  email: string
  password: string
}

interface AuthServiceDependencies {
  createUser: (credentials: AuthCredentials) => Promise<AuthUser>
  signInWithPassword: (credentials: AuthCredentials) => Promise<AuthUser>
  claimLegacyData: (userId: string, event?: H3Event) => Promise<void>
}

const AUTH_PROVIDER_MAX_ATTEMPTS = 2
const AUTH_PROVIDER_RETRY_DELAY_MS = 150

function normalizeEmail(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function toAuthUser(input: { id: string, email?: string | null }, fallbackEmail?: string): AuthUser {
  const email = normalizeEmail(input.email ?? fallbackEmail)

  if (!email) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Authenticated user is missing an email address.'
    })
  }

  return {
    id: input.id,
    email
  }
}

export function parseAuthCredentials(body: unknown): AuthCredentials {
  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const email = normalizeEmail(typeof payload.email === 'string' ? payload.email : '')
  const password = typeof payload.password === 'string' ? payload.password : ''

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required.'
    })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email address is invalid.'
    })
  }

  if (!password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password is required.'
    })
  }

  if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`
    })
  }

  return {
    email,
    password
  }
}

export function mapSupabaseRegisterError(error: unknown) {
  const message = getErrorMessage(error)

  if (
    message.includes('already')
    && (message.includes('registered') || message.includes('exists') || message.includes('belongs'))
  ) {
    return createError({
      statusCode: 409,
      statusMessage: 'An account with this email already exists.'
    })
  }

  reportServerError('auth.register', error)

  return createError({
    statusCode: 502,
    statusMessage: 'Authentication service is temporarily unavailable.'
  })
}

export function mapSupabaseLoginError(error: unknown) {
  const message = getErrorMessage(error)

  if (
    message.includes('invalid login credentials')
    || message.includes('invalid email or password')
    || message.includes('email not confirmed')
  ) {
    return createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password.'
    })
  }

  reportServerError('auth.login', error)

  return createError({
    statusCode: 502,
    statusMessage: 'Authentication service is temporarily unavailable.'
  })
}

function getErrorMessage(error: unknown): string {
  const messages: string[] = []
  let current = error

  while (current && typeof current === 'object') {
    if ('message' in current && typeof current.message === 'string') {
      messages.push(current.message.toLowerCase())
    }

    current = 'cause' in current ? current.cause : null
  }

  return messages.join(' ')
}

function getErrorCode(error: unknown): string {
  let current = error

  while (current && typeof current === 'object') {
    if ('code' in current && typeof current.code === 'string') {
      return current.code.toUpperCase()
    }

    current = 'cause' in current ? current.cause : null
  }

  return ''
}

export function isTransientAuthProviderError(error: unknown) {
  const code = getErrorCode(error)
  const message = getErrorMessage(error)

  if (['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
    return true
  }

  return (
    message.includes('fetch failed')
    || message.includes('network')
    || message.includes('socket disconnected')
    || message.includes('tls connection')
    || message.includes('ssl')
    || message.includes('timed out')
  )
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function runAuthProviderOperation<T>(operation: () => Promise<T>) {
  let lastError: unknown

  for (let attempt = 1; attempt <= AUTH_PROVIDER_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation()
    }
    catch (error) {
      lastError = error

      if (!isTransientAuthProviderError(error) || attempt === AUTH_PROVIDER_MAX_ATTEMPTS) {
        throw error
      }

      await sleep(AUTH_PROVIDER_RETRY_DELAY_MS * attempt)
    }
  }

  throw lastError
}

function issueUserSession(event: H3Event, user: AuthUser) {
  const secret = requireServerConfigValue('sessionSecret')
  const token = createUserSessionToken({
    userId: user.id,
    email: user.email
  }, secret)
  setUserSessionCookies(event, token)
}

async function createSupabaseUser(credentials: AuthCredentials): Promise<AuthUser> {
  const client = getSupabaseAdminClient()

  let data: { user: { id: string, email?: string | null } | null } | null = null

  try {
    const response = await runAuthProviderOperation(() => client.auth.admin.createUser({
      email: credentials.email,
      password: credentials.password,
      email_confirm: true
    }))
    data = response.data ?? null

    if (response.error || !response.data?.user) {
      throw response.error
    }
  }
  catch (error) {
    throw mapSupabaseRegisterError(error)
  }

  if (!data?.user) {
    throw mapSupabaseRegisterError(null)
  }

  return toAuthUser(data.user, credentials.email)
}

async function signInSupabaseUser(credentials: AuthCredentials): Promise<AuthUser> {
  const client = getSupabaseAuthClient()

  let data: { user: { id: string, email?: string | null } | null } | null = null

  try {
    const response = await runAuthProviderOperation(() => client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    }))
    data = response.data ?? null

    if (response.error || !response.data?.user) {
      throw response.error
    }
  }
  catch (error) {
    throw mapSupabaseLoginError(error)
  }

  if (!data?.user) {
    throw mapSupabaseLoginError(null)
  }

  return toAuthUser(data.user, credentials.email)
}

export function createAuthService(dependencies: AuthServiceDependencies) {
  return {
    async register(event: H3Event, credentials: AuthCredentials) {
      const user = await dependencies.createUser(credentials)
      await dependencies.claimLegacyData(user.id, event)
      issueUserSession(event, user)
      return user
    },
    async login(event: H3Event, credentials: AuthCredentials) {
      const user = await dependencies.signInWithPassword(credentials)
      issueUserSession(event, user)
      return user
    }
  }
}

function getAuthService() {
  return createAuthService({
    createUser: createSupabaseUser,
    signInWithPassword: signInSupabaseUser,
    claimLegacyData: claimLegacyChatRecords
  })
}

export async function registerUser(event: H3Event, credentials: AuthCredentials) {
  return getAuthService().register(event, credentials)
}

export async function loginUser(event: H3Event, credentials: AuthCredentials) {
  return getAuthService().login(event, credentials)
}

export function logoutUser(event: H3Event) {
  clearUserSessionCookies(event)
}

export function getUserSession(event: H3Event) {
  const secret = requireServerConfigValue('sessionSecret')
  return readUserSession(event, secret)
}

export function requireUserSession(event: H3Event) {
  const secret = requireServerConfigValue('sessionSecret')
  return requireUserSessionFromToken(event, secret)
}

import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import {
  clearAdminSessionCookies,
  createAdminSessionToken,
  readAdminSession,
  requireAdminSession as requireAdminSessionFromToken,
  setAdminSessionCookies
} from '../utils/admin-session'
import { requireServerConfigValue } from '../utils/runtime-config'

export async function verifyAdminPassword(password: string) {
  const hash = requireServerConfigValue('adminPasswordHash')
  return bcrypt.compare(password, hash)
}

export function issueAdminSession(event: H3Event) {
  const secret = requireServerConfigValue('sessionSecret')
  const token = createAdminSessionToken(secret)
  setAdminSessionCookies(event, token)
}

export function logoutAdmin(event: H3Event) {
  clearAdminSessionCookies(event)
}

export function getAdminSession(event: H3Event) {
  const secret = requireServerConfigValue('sessionSecret')
  return readAdminSession(event, secret)
}

export function requireAdminSession(event: H3Event) {
  const secret = requireServerConfigValue('sessionSecret')
  return requireAdminSessionFromToken(event, secret)
}

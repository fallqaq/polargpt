import { getRequestURL } from 'h3'
import { requireAdminSession } from '../services/auth-service'

const PUBLIC_ADMIN_API_PATHS = new Set([
  '/api/admin/session/login',
  '/api/admin/session/logout'
])

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname

  if (!pathname.startsWith('/api/admin/')) {
    return
  }

  if (PUBLIC_ADMIN_API_PATHS.has(pathname)) {
    return
  }

  event.context.adminSession = requireAdminSession(event)
})

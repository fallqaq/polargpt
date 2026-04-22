import { getRequestURL } from 'h3'
import { requireUserSession } from '../services/auth-service'

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname

  if (!pathname.startsWith('/api/admin/')) {
    return
  }

  event.context.userSession = requireUserSession(event)
})

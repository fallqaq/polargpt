import { getRequestURL, sendRedirect } from 'h3'
import { getAdminSession } from '../services/auth-service'

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname
  const hasSession = Boolean(getAdminSession(event))

  if (pathname === '/login' && hasSession) {
    return sendRedirect(event, '/chat')
  }

  if ((pathname === '/chat' || pathname.startsWith('/chat/')) && !hasSession) {
    return sendRedirect(event, '/login')
  }
})

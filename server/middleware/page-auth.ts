import { getRequestURL, sendRedirect } from 'h3'
import { getUserSession } from '../services/auth-service'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname
  const previewMode = process.env.NODE_ENV !== 'production' && url.searchParams.get('preview') === '1'
  const hasSession = Boolean(getUserSession(event))

  if (previewMode) {
    return
  }

  if (pathname === '/login' && hasSession) {
    return sendRedirect(event, '/chat')
  }

  if ((pathname === '/chat' || pathname.startsWith('/chat/')) && !hasSession) {
    return sendRedirect(event, '/login')
  }
})

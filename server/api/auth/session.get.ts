import type { SessionResponse } from '#shared/types/chat'
import { getUserSession } from '#server/services/auth-service'

export default defineEventHandler((event): SessionResponse => {
  const session = getUserSession(event)

  if (!session) {
    return {
      user: null
    }
  }

  return {
    user: {
      id: session.userId,
      email: session.email
    }
  }
})

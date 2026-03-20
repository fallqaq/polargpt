import type { LoginResponse } from '#shared/types/chat'
import { logoutAdmin } from '#server/services/auth-service'

export default defineEventHandler((event): LoginResponse => {
  logoutAdmin(event)

  return {
    ok: true
  }
})

import { logoutUser } from '#server/services/auth-service'

export default defineEventHandler((event) => {
  logoutUser(event)

  return {
    ok: true
  }
})

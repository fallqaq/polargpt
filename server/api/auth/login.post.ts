import { readBody } from 'h3'
import type { AuthResponse } from '#shared/types/chat'
import { loginUser, parseAuthCredentials } from '#server/services/auth-service'

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const credentials = parseAuthCredentials(await readBody(event))
  const user = await loginUser(event, credentials)

  return {
    ok: true,
    user
  }
})

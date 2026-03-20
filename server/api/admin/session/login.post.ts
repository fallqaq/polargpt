import { createError, readBody } from 'h3'
import { z } from 'zod'
import type { LoginResponse } from '#shared/types/chat'
import { issueAdminSession, verifyAdminPassword } from '#server/services/auth-service'

const loginSchema = z.object({
  password: z.string().min(1, 'Password is required.')
})

export default defineEventHandler(async (event): Promise<LoginResponse> => {
  const body = loginSchema.parse(await readBody(event))
  const isValid = await verifyAdminPassword(body.password)

  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid administrator password.'
    })
  }

  issueAdminSession(event)

  return {
    ok: true
  }
})

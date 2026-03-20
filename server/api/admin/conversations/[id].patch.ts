import { createError, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import type { ConversationSummaryResponse } from '#shared/types/chat'
import { renameConversation } from '#server/services/conversation-service'

const renameSchema = z.object({
  title: z.string().trim().min(1, 'A title is required.').max(120, 'Title is too long.')
})

export default defineEventHandler(async (event): Promise<ConversationSummaryResponse> => {
  const conversationId = getRouterParam(event, 'id')

  if (!conversationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Conversation id is required.'
    })
  }

  const body = renameSchema.parse(await readBody(event))
  const conversation = await renameConversation(conversationId, body.title)

  return {
    conversation
  }
})

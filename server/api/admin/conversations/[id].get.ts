import { createError, getRouterParam } from 'h3'
import type { ConversationDetailResponse } from '#shared/types/chat'
import { getConversationDetailOrThrow } from '#server/services/conversation-service'

export default defineEventHandler(async (event): Promise<ConversationDetailResponse> => {
  const conversationId = getRouterParam(event, 'id')

  if (!conversationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Conversation id is required.'
    })
  }

  const conversation = await getConversationDetailOrThrow(conversationId)

  return {
    conversation
  }
})

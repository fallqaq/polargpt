import { createError, getRouterParam } from 'h3'
import { deleteConversation } from '#server/services/conversation-service'

export default defineEventHandler(async (event) => {
  const conversationId = getRouterParam(event, 'id')

  if (!conversationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Conversation id is required.'
    })
  }

  await deleteConversation(conversationId)

  return {
    ok: true
  }
})

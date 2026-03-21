import type { ConversationSummaryResponse } from '#shared/types/chat'
import { createConversation } from '#server/services/conversation-service'
import { setResponseBytes } from '#server/utils/request-metrics'

export default defineEventHandler(async (event): Promise<ConversationSummaryResponse> => {
  const conversation = await createConversation(event)

  const response = {
    conversation
  }

  setResponseBytes(event, response)
  return response
})

import type { ConversationSummaryResponse } from '#shared/types/chat'
import { createConversation } from '#server/services/conversation-service'

export default defineEventHandler(async (): Promise<ConversationSummaryResponse> => {
  const conversation = await createConversation()

  return {
    conversation
  }
})

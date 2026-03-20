import { getQuery } from 'h3'
import { z } from 'zod'
import type { ConversationListResponse } from '#shared/types/chat'
import { listConversationSummaries } from '#server/services/conversation-service'

const querySchema = z.object({
  q: z.string().optional()
})

export default defineEventHandler(async (event): Promise<ConversationListResponse> => {
  const query = querySchema.parse(getQuery(event))
  const conversations = await listConversationSummaries(query.q)

  return {
    conversations
  }
})

import { createError, getQuery, getRouterParam } from 'h3'
import { z } from 'zod'
import type { ConversationMessagesPageResponse } from '#shared/types/chat'
import { DEFAULT_MESSAGES_PAGE_LIMIT } from '#shared/constants/polargpt'
import { getConversationMessagesOnlyOrThrow } from '#server/services/conversation-service'
import { incrementCountMetric, setResponseBytes } from '#server/utils/request-metrics'

const querySchema = z.object({
  before: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
})

export default defineEventHandler(async (event): Promise<ConversationMessagesPageResponse> => {
  const conversationId = getRouterParam(event, 'id')

  if (!conversationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Conversation id is required.'
    })
  }

  const query = querySchema.parse(getQuery(event))
  const page = await getConversationMessagesOnlyOrThrow(conversationId, {
    beforeMessageId: query.before,
    limit: query.limit ?? DEFAULT_MESSAGES_PAGE_LIMIT
  }, event)

  const response = { page }

  incrementCountMetric(event, 'messageCount', page.messages.length)
  incrementCountMetric(event, 'attachmentCount', page.messages.reduce((count, message) =>
    count + message.attachments.length, 0))
  setResponseBytes(event, response)

  return response
})

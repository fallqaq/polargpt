import { createError, getRouterParam, readMultipartFormData } from 'h3'
import type { SendMessageDeltaResponse } from '#shared/types/chat'
import { validateAttachmentParts } from '#server/services/attachment-service'
import { sendConversationMessage } from '#server/services/message-service'
import { incrementCountMetric, setResponseBytes } from '#server/utils/request-metrics'

export default defineEventHandler(async (event): Promise<SendMessageDeltaResponse> => {
  const conversationId = getRouterParam(event, 'id')

  if (!conversationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Conversation id is required.'
    })
  }

  const formParts = await readMultipartFormData(event)

  if (!formParts) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Multipart form data is required.'
    })
  }

  const text = formParts
    .filter((part) => part.name === 'text' && !part.filename)
    .map((part) => part.data.toString('utf8'))
    .join('\n')

  const fileParts = formParts.filter((part) =>
    Boolean(part.filename) && (part.name === 'files' || part.name === 'files[]'))
  const attachments = validateAttachmentParts(fileParts)
  const response = await sendConversationMessage({
    conversationId,
    text,
    attachments,
    event
  })

  incrementCountMetric(event, 'messageCount', response.appendedMessages.length)
  incrementCountMetric(event, 'attachmentCount', response.appendedMessages.reduce((count, message) =>
    count + message.attachments.length, 0))
  setResponseBytes(event, response)

  return response
})

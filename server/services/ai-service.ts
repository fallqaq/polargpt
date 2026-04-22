import { createError, type H3Event } from 'h3'
import type { AttachmentRow, MessageRow } from '../types/database'
import { getServerRuntimeConfig } from '../utils/runtime-config'
import { generateDeepSeekAssistantReply } from './deepseek-service'
import { generateAssistantReply as generateGeminiAssistantReply } from './gemini-service'

export function getCurrentModelProvider() {
  return getServerRuntimeConfig().aiProvider
}

export async function generateAssistantReply(input: {
  messages: Array<MessageRow & { attachments: AttachmentRow[] }>
  event?: H3Event
}) {
  const provider = getCurrentModelProvider()

  if (provider === 'gemini') {
    return generateGeminiAssistantReply(input)
  }

  if (provider === 'deepseek') {
    return generateDeepSeekAssistantReply(input)
  }

  throw createError({
    statusCode: 500,
    statusMessage: `Unsupported AI provider: ${provider}`
  })
}

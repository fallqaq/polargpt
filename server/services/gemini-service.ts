import { GoogleGenAI } from '@google/genai'
import { createError, type H3Event } from 'h3'
import { DEFAULT_GEMINI_MODEL } from '#shared/constants/polargpt'
import type { AttachmentRow, MessageRow } from '../types/database'
import { buildGeminiContents } from '../utils/gemini-content'
import { reportServerError } from '../utils/logger'
import { measureRequestMetric } from '../utils/request-metrics'
import { getServerRuntimeConfig, requireServerConfigValue } from '../utils/runtime-config'

let cachedClient: GoogleGenAI | null = null

function getGeminiClient() {
  if (cachedClient) {
    return cachedClient
  }

  const apiKey = requireServerConfigValue('geminiApiKey')
  cachedClient = new GoogleGenAI({ apiKey })
  return cachedClient
}

function extractResponseText(response: { text?: string | null }) {
  return response.text?.trim() ?? ''
}

export async function uploadGeminiFile(input: {
  buffer: Buffer
  mimeType: string
  fileName: string
  event?: H3Event
}) {
  const client = getGeminiClient()

  return measureRequestMetric(input.event, 'modelMs', async () => client.files.upload({
    file: new Blob([new Uint8Array(input.buffer)], {
      type: input.mimeType
    }),
    config: {
      mimeType: input.mimeType,
      displayName: input.fileName
    }
  }))
}

export async function deleteGeminiFile(fileName: string) {
  const client = getGeminiClient()
  return client.files.delete({ name: fileName })
}

/**
 * The Gemini call stays isolated in one module so the future SSE/streaming work
 * only needs to replace this boundary instead of the entire route stack.
 */
export async function generateAssistantReply(input: {
  messages: Array<MessageRow & { attachments: AttachmentRow[] }>
  event?: H3Event
}) {
  const client = getGeminiClient()
  const config = getServerRuntimeConfig()

  try {
    const response = await measureRequestMetric(input.event, 'modelMs', async () => client.models.generateContent({
      model: config.geminiModel || DEFAULT_GEMINI_MODEL,
      contents: buildGeminiContents(input.messages),
      config: {
        systemInstruction: [
          'You are PolarGPT, an internal assistant for an authenticated user.',
          'Answer clearly, use the uploaded files when they are relevant, and do not mention hidden implementation details.',
          'If a document or image is unclear, say what is missing instead of fabricating content.'
        ].join(' ')
      }
    }))

    const text = extractResponseText(response)

    if (!text) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Gemini returned an empty response.'
      })
    }

    return {
      text,
      model: config.geminiModel || DEFAULT_GEMINI_MODEL
    }
  }
  catch (error) {
    reportServerError('generateAssistantReply', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to generate a response from Gemini.'
    })
  }
}

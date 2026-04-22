import OpenAI from 'openai'
import { createError, type H3Event } from 'h3'
import {
  ATTACHMENT_BUCKET,
  DEFAULT_DEEPSEEK_MODEL
} from '#shared/constants/polargpt'
import type { AttachmentRow, MessageRow } from '../types/database'
import { buildDeepSeekMessages } from '../utils/deepseek-content'
import { reportServerError } from '../utils/logger'
import { measureRequestMetric } from '../utils/request-metrics'
import { getServerRuntimeConfig, requireServerConfigValue } from '../utils/runtime-config'
import { getSupabaseAdminClient } from '../utils/supabase-admin'
import { extractDocumentText } from '../utils/document-extractor'

let cachedClient: OpenAI | null = null

function getDeepSeekClient() {
  if (cachedClient) {
    return cachedClient
  }

  const apiKey = requireServerConfigValue('deepseekApiKey')
  cachedClient = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com'
  })
  return cachedClient
}

function extractResponseText(response: OpenAI.Chat.Completions.ChatCompletion) {
  const content = response.choices[0]?.message?.content
  return typeof content === 'string' ? content.trim() : ''
}

async function downloadAttachmentBuffer(attachment: AttachmentRow, event?: H3Event) {
  const client = getSupabaseAdminClient()
  const { data, error } = await measureRequestMetric(event, 'storageMs', async () => client.storage
    .from(ATTACHMENT_BUCKET)
    .download(attachment.storage_path))

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load ${attachment.original_name} from storage.`
    })
  }

  return Buffer.from(await data.arrayBuffer())
}

async function persistExtractedText(attachmentId: string, extractedText: string, event?: H3Event) {
  const client = getSupabaseAdminClient()
  const { error } = await measureRequestMetric(event, 'dbMs', async () => client
    .from('attachments')
    .update({
      extracted_text: extractedText
    })
    .eq('id', attachmentId))

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save attachment metadata.'
    })
  }
}

async function hydrateDocumentAttachment(attachment: AttachmentRow, event?: H3Event): Promise<AttachmentRow> {
  if (attachment.kind !== 'document' || attachment.extracted_text !== null) {
    return attachment
  }

  const buffer = await downloadAttachmentBuffer(attachment, event)
  const extractedText = await extractDocumentText({
    buffer,
    fileName: attachment.original_name,
    mimeType: attachment.mime_type
  })

  try {
    await persistExtractedText(attachment.id, extractedText, event)
  }
  catch (error) {
    reportServerError('hydrateDocumentAttachment.persistExtractedText', error, {
      attachmentId: attachment.id
    })
  }

  return {
    ...attachment,
    extracted_text: extractedText
  }
}

async function hydrateDeepSeekMessages(
  messages: Array<MessageRow & { attachments: AttachmentRow[] }>,
  event?: H3Event
) {
  return Promise.all(messages.map(async (message) => ({
    ...message,
    attachments: await Promise.all(message.attachments.map((attachment) =>
      hydrateDocumentAttachment(attachment, event)))
  })))
}

export async function generateDeepSeekAssistantReply(input: {
  messages: Array<MessageRow & { attachments: AttachmentRow[] }>
  event?: H3Event
}) {
  const client = getDeepSeekClient()
  const config = getServerRuntimeConfig()
  const preparedMessages = await hydrateDeepSeekMessages(input.messages, input.event)

  try {
    const response = await measureRequestMetric(input.event, 'modelMs', async () => client.chat.completions.create({
      model: config.deepseekModel || DEFAULT_DEEPSEEK_MODEL,
      messages: [
        {
          role: 'system',
          content: [
            'You are PolarGPT, an internal assistant for an authenticated user.',
            'Answer clearly, use the uploaded files when they are relevant, and do not mention hidden implementation details.',
            'If a document is unclear or incomplete, say what is missing instead of fabricating content.'
          ].join(' ')
        },
        ...buildDeepSeekMessages(preparedMessages)
      ]
    }))

    const text = extractResponseText(response)

    if (!text) {
      throw createError({
        statusCode: 502,
        statusMessage: 'DeepSeek returned an empty response.'
      })
    }

    return {
      text,
      model: response.model || config.deepseekModel || DEFAULT_DEEPSEEK_MODEL
    }
  }
  catch (error) {
    reportServerError('generateDeepSeekAssistantReply', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to generate a response from DeepSeek.'
    })
  }
}

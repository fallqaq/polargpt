import type { Content, Part } from '@google/genai'
import type { AttachmentRow, MessageRow } from '../types/database'

export interface GeminiMessagePartSource extends MessageRow {
  attachments: AttachmentRow[]
}

/**
 * The content builder is pure on purpose so it can be unit-tested without
 * calling the Gemini SDK.
 */
export function buildGeminiContents(messages: GeminiMessagePartSource[]): Content[] {
  return messages.map((message) => {
    const parts: Part[] = []

    if (message.content.trim()) {
      parts.push({ text: message.content })
    }

    for (const attachment of message.attachments) {
      if (!attachment.gemini_file_uri) {
        continue
      }

      parts.push({
        fileData: {
          fileUri: attachment.gemini_file_uri,
          mimeType: attachment.mime_type
        }
      })
    }

    if (parts.length === 0) {
      parts.push({ text: 'The user sent an empty message.' })
    }

    return {
      role: message.role === 'assistant' ? 'model' : 'user',
      parts
    }
  })
}

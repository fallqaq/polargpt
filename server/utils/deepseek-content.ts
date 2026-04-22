import {
  DEEPSEEK_MAX_DOCUMENT_CHARS,
  DEEPSEEK_MAX_TOTAL_DOCUMENT_CHARS
} from '#shared/constants/polargpt'
import type { AttachmentRow, MessageRow } from '../types/database'

export interface DeepSeekMessagePartSource extends MessageRow {
  attachments: AttachmentRow[]
}

interface DeepSeekDocumentBudget {
  truncatedText: string | null
  truncated: boolean
  omitted: boolean
  unavailable: boolean
}

function normalizeExtractedText(value: string | null | undefined) {
  return (value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .trim()
}

function buildDocumentBudgetMap(messages: DeepSeekMessagePartSource[]) {
  const budgets = new Map<string, DeepSeekDocumentBudget>()
  let remainingChars = DEEPSEEK_MAX_TOTAL_DOCUMENT_CHARS

  for (const message of [...messages].reverse()) {
    for (const attachment of [...message.attachments].reverse()) {
      if (attachment.kind !== 'document') {
        continue
      }

      const normalizedText = normalizeExtractedText(attachment.extracted_text)

      if (attachment.extracted_text === null) {
        budgets.set(attachment.id, {
          truncatedText: null,
          truncated: false,
          omitted: false,
          unavailable: true
        })
        continue
      }

      if (!normalizedText) {
        budgets.set(attachment.id, {
          truncatedText: '',
          truncated: false,
          omitted: false,
          unavailable: false
        })
        continue
      }

      if (remainingChars <= 0) {
        budgets.set(attachment.id, {
          truncatedText: null,
          truncated: false,
          omitted: true,
          unavailable: false
        })
        continue
      }

      const allowedChars = Math.min(DEEPSEEK_MAX_DOCUMENT_CHARS, remainingChars)
      const truncatedText = normalizedText.slice(0, allowedChars)

      budgets.set(attachment.id, {
        truncatedText,
        truncated: truncatedText.length < normalizedText.length,
        omitted: false,
        unavailable: false
      })

      remainingChars -= truncatedText.length
    }
  }

  return budgets
}

function buildUserMessageContent(
  message: DeepSeekMessagePartSource,
  budgets: Map<string, DeepSeekDocumentBudget>
) {
  const sections: string[] = []
  const normalizedContent = message.content.trim()

  if (normalizedContent) {
    sections.push(normalizedContent)
  }

  const imageCount = message.attachments.filter((attachment) => attachment.kind === 'image').length

  if (imageCount > 0) {
    sections.push(
      imageCount === 1
        ? 'One image attachment was omitted because the current AI provider accepts document text only.'
        : `${imageCount} image attachments were omitted because the current AI provider accepts document text only.`
    )
  }

  for (const attachment of message.attachments) {
    if (attachment.kind !== 'document') {
      continue
    }

    const budget = budgets.get(attachment.id)

    if (!budget || budget.unavailable) {
      sections.push(`Attached document "${attachment.original_name}" could not be loaded for the current AI provider.`)
      continue
    }

    if (budget.omitted) {
      sections.push(`Attached document "${attachment.original_name}" was omitted because the document context limit was reached.`)
      continue
    }

    if (!budget.truncatedText) {
      sections.push(`Attached document "${attachment.original_name}" did not contain extractable text.`)
      continue
    }

    sections.push([
      `Attached document: ${attachment.original_name}`,
      `MIME type: ${attachment.mime_type}`,
      '',
      budget.truncatedText,
      budget.truncated ? '' : '',
      budget.truncated ? '[Document content truncated for model context.]' : ''
    ].filter(Boolean).join('\n'))
  }

  if (sections.length === 0) {
    return 'The user sent an empty message.'
  }

  return sections.join('\n\n')
}

export function buildDeepSeekMessages(messages: DeepSeekMessagePartSource[]) {
  const budgets = buildDocumentBudgetMap(messages)

  return messages.map((message) => ({
    role: message.role,
    content: message.role === 'assistant'
      ? (message.content.trim() || 'The assistant sent an empty message.')
      : buildUserMessageContent(message, budgets)
  }))
}

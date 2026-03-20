import { createError } from 'h3'
import { DEFAULT_CONVERSATION_TITLE } from '#shared/constants/polargpt'
import { buildAttachmentOnlyLabel } from '#shared/utils/files'
import {
  buildConversationSummary,
  buildConversationTitle,
  normalizeMessageText
} from '#shared/utils/text'
import type { AttachmentRow, ConversationRow, MessageRow } from '../types/database'
import { getConversationDetailOrThrow, getConversationDataAccess } from './conversation-service'
import { uploadMessageAttachments, type ValidatedAttachmentUpload } from './attachment-service'
import { generateAssistantReply } from './gemini-service'

export interface MessageServiceDependencies {
  getConversation: (conversationId: string) => Promise<ConversationRow | null>
  insertMessage: (input: {
    conversationId: string
    role: MessageRow['role']
    content: string
    model?: string | null
    status: MessageRow['status']
  }) => Promise<MessageRow>
  deleteMessage: (messageId: string) => Promise<void>
  insertAttachments: (rows: Array<{
    message_id: string
    kind: AttachmentRow['kind']
    original_name: string
    mime_type: string
    size_bytes: number
    storage_path: string
    gemini_file_name: string | null
    gemini_file_uri: string | null
  }>) => Promise<AttachmentRow[]>
  listMessages: (conversationId: string) => Promise<MessageRow[]>
  listAttachmentsByMessageIds: (messageIds: string[]) => Promise<AttachmentRow[]>
  updateConversation: (conversationId: string, patch: Partial<ConversationRow>) => Promise<ConversationRow>
  uploadMessageAttachments: typeof uploadMessageAttachments
  generateAssistantReply: typeof generateAssistantReply
  getConversationDetailOrThrow: typeof getConversationDetailOrThrow
}

export function createMessageService(dependencies: MessageServiceDependencies) {
  return {
    async sendMessage(input: {
      conversationId: string
      text: string
      attachments: ValidatedAttachmentUpload[]
    }) {
      const normalizedText = normalizeMessageText(input.text)

      if (!normalizedText && input.attachments.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'A message must include text, attachments, or both.'
        })
      }

      const conversation = await dependencies.getConversation(input.conversationId)

      if (!conversation) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Conversation not found.'
        })
      }

      const userMessage = await dependencies.insertMessage({
        conversationId: input.conversationId,
        role: 'user',
        content: normalizedText,
        status: 'completed'
      })

      let storedAttachments: AttachmentRow[] = []

      try {
        const attachmentRows = await dependencies.uploadMessageAttachments({
          conversationId: input.conversationId,
          messageId: userMessage.id,
          attachments: input.attachments
        })

        storedAttachments = await dependencies.insertAttachments(attachmentRows)
      }
      catch (error) {
        await dependencies.deleteMessage(userMessage.id)
        throw error
      }

      const userSnippet = normalizedText || buildAttachmentOnlyLabel(storedAttachments.map((attachment) => attachment.original_name))
      const nextTitle = conversation.title === DEFAULT_CONVERSATION_TITLE
        ? buildConversationTitle(userSnippet)
        : conversation.title

      await dependencies.updateConversation(input.conversationId, {
        title: nextTitle,
        summary: buildConversationSummary({ userSnippet }),
        last_message_at: userMessage.created_at
      })

      const messages = await dependencies.listMessages(input.conversationId)
      const attachments = await dependencies.listAttachmentsByMessageIds(messages.map((message) => message.id))
      const messagesWithAttachments = messages.map((message) => ({
        ...message,
        attachments: attachments.filter((attachment) => attachment.message_id === message.id)
      }))

      const assistantReply = await dependencies.generateAssistantReply({
        messages: messagesWithAttachments
      })

      const assistantMessage = await dependencies.insertMessage({
        conversationId: input.conversationId,
        role: 'assistant',
        content: assistantReply.text,
        model: assistantReply.model,
        status: 'completed'
      })

      await dependencies.updateConversation(input.conversationId, {
        title: nextTitle,
        summary: buildConversationSummary({
          userSnippet,
          assistantSnippet: assistantReply.text
        }),
        last_message_at: assistantMessage.created_at
      })

      return dependencies.getConversationDetailOrThrow(input.conversationId)
    }
  }
}

export async function sendConversationMessage(input: {
  conversationId: string
  text: string
  attachments: ValidatedAttachmentUpload[]
}) {
  const repository = getConversationDataAccess()
  const messageService = createMessageService({
    ...repository,
    uploadMessageAttachments,
    generateAssistantReply,
    getConversationDetailOrThrow
  })

  return messageService.sendMessage(input)
}

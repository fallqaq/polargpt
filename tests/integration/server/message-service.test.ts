import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMessageService } from '#server/services/message-service'
import type { AttachmentRow, ConversationRow, MessageRow } from '#server/types/database'

function createConversationRow(): ConversationRow {
  return {
    id: 'conversation-1',
    user_id: 'user-1',
    title: 'New conversation',
    summary: '',
    created_at: '2026-03-20T00:00:00.000Z',
    updated_at: '2026-03-20T00:00:00.000Z',
    last_message_at: null
  }
}

function createUserMessage(): MessageRow {
  return {
    id: 'message-user',
    user_id: 'user-1',
    conversation_id: 'conversation-1',
    role: 'user',
    content: 'Summarize this report',
    model: null,
    status: 'completed',
    created_at: '2026-03-20T00:01:00.000Z'
  }
}

function createAssistantMessage(): MessageRow {
  return {
    id: 'message-assistant',
    user_id: 'user-1',
    conversation_id: 'conversation-1',
    role: 'assistant',
    content: 'The report focuses on deployment, storage policies, and admin access.',
    model: 'gemini-2.5-flash',
    status: 'completed',
    created_at: '2026-03-20T00:01:05.000Z'
  }
}

function createAttachmentRow(): AttachmentRow {
  return {
    id: 'attachment-1',
    user_id: 'user-1',
    message_id: 'message-user',
    kind: 'document',
    original_name: 'report.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1024,
    storage_path: 'conversation-1/message-user/report.pdf',
    gemini_file_name: 'files/report',
    gemini_file_uri: 'https://example.com/files/report',
    extracted_text: null,
    created_at: '2026-03-20T00:01:01.000Z'
  }
}

describe('message service integration', () => {
  const baseConversation = createConversationRow()
  const userMessage = createUserMessage()
  const assistantMessage = createAssistantMessage()
  const attachmentRow = createAttachmentRow()

  let dependencies: Parameters<typeof createMessageService>[0]

  beforeEach(() => {
    dependencies = {
      getConversation: vi.fn().mockResolvedValue(baseConversation),
      insertMessage: vi
        .fn()
        .mockResolvedValueOnce(userMessage)
        .mockResolvedValueOnce(assistantMessage),
      deleteMessage: vi.fn().mockResolvedValue(undefined),
      insertAttachments: vi.fn().mockResolvedValue([attachmentRow]),
      listMessages: vi.fn().mockResolvedValue([userMessage]),
      listAttachmentsByMessageIds: vi.fn().mockResolvedValue([attachmentRow]),
      updateConversation: vi.fn().mockImplementation(async (_conversationId, patch) => ({
        ...baseConversation,
        ...patch,
        updated_at: baseConversation.updated_at
      })),
      uploadMessageAttachments: vi.fn().mockResolvedValue([
        {
          message_id: 'message-user',
          kind: 'document',
          original_name: 'report.pdf',
          mime_type: 'application/pdf',
          size_bytes: 1024,
          storage_path: 'conversation-1/message-user/report.pdf',
          gemini_file_name: 'files/report',
          gemini_file_uri: 'https://example.com/files/report',
          extracted_text: null
        }
      ]),
      generateAssistantReply: vi.fn().mockResolvedValue({
        text: assistantMessage.content,
        model: assistantMessage.model
      })
    }
  })

  it('persists user and assistant turns and updates conversation metadata', async () => {
    const service = createMessageService(dependencies)
    const result = await service.sendMessage({
      conversationId: 'conversation-1',
      text: 'Summarize this report',
      attachments: [
        {
          fileName: 'report.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
          buffer: Buffer.from('pdf'),
          kind: 'document'
        }
      ]
    })

    expect(dependencies.generateAssistantReply).toHaveBeenCalledTimes(1)
    expect(dependencies.updateConversation).toHaveBeenCalledTimes(2)
    expect(dependencies.updateConversation).toHaveBeenNthCalledWith(1, 'conversation-1', {
      title: 'Summarize this report',
      summary: 'User: Summarize this report',
      last_message_at: userMessage.created_at
    })
    expect(dependencies.updateConversation).toHaveBeenNthCalledWith(2, 'conversation-1', {
      title: 'Summarize this report',
      summary: 'User: Summarize this report | AI: The report focuses on deployment, storage policies, and admin access.',
      last_message_at: assistantMessage.created_at
    })
    expect(result.conversation.title).toBe('Summarize this report')
    expect(result.appendedMessages).toEqual([
      {
        id: 'message-user',
        conversationId: 'conversation-1',
        role: 'user',
        content: 'Summarize this report',
        model: null,
        status: 'completed',
        createdAt: '2026-03-20T00:01:00.000Z',
        attachments: [
          {
            id: 'attachment-1',
            messageId: 'message-user',
            kind: 'document',
            originalName: 'report.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 1024,
            createdAt: '2026-03-20T00:01:01.000Z'
          }
        ]
      },
      {
        id: 'message-assistant',
        conversationId: 'conversation-1',
        role: 'assistant',
        content: 'The report focuses on deployment, storage policies, and admin access.',
        model: 'gemini-2.5-flash',
        status: 'completed',
        createdAt: '2026-03-20T00:01:05.000Z',
        attachments: []
      }
    ])
  })

  it('rolls back the user message when attachment persistence fails', async () => {
    dependencies.uploadMessageAttachments = vi.fn().mockRejectedValue(new Error('storage failed'))
    const service = createMessageService(dependencies)

    await expect(service.sendMessage({
      conversationId: 'conversation-1',
      text: 'Summarize this report',
      attachments: [
        {
          fileName: 'report.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
          buffer: Buffer.from('pdf'),
          kind: 'document'
        }
      ]
    })).rejects.toThrow('storage failed')

    expect(dependencies.deleteMessage).toHaveBeenCalledWith('message-user')
  })
})

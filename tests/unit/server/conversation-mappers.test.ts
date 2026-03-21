import { describe, expect, it } from 'vitest'
import {
  groupAttachmentsByMessageId,
  mapConversationMessagesPage
} from '#server/utils/conversation-mappers'

describe('conversation mappers', () => {
  it('groups attachments once by message id and maps a paged response', () => {
    const attachmentsByMessageId = groupAttachmentsByMessageId([
      {
        id: 'attachment-1',
        message_id: 'message-1',
        kind: 'document',
        original_name: 'report.pdf',
        mime_type: 'application/pdf',
        size_bytes: 1024,
        storage_path: 'conversation-1/message-1/report.pdf',
        gemini_file_name: 'files/report',
        gemini_file_uri: 'https://example.com/files/report',
        created_at: '2026-03-20T00:00:01.000Z'
      }
    ])

    const page = mapConversationMessagesPage({
      conversationId: 'conversation-1',
      messages: [
        {
          id: 'message-1',
          conversation_id: 'conversation-1',
          role: 'user',
          content: 'Summarize this report',
          model: null,
          status: 'completed',
          created_at: '2026-03-20T00:00:00.000Z'
        }
      ],
      attachmentsByMessageId,
      nextCursor: 'message-1',
      limit: 50
    })

    expect(page).toEqual({
      conversationId: 'conversation-1',
      messages: [
        {
          id: 'message-1',
          conversationId: 'conversation-1',
          role: 'user',
          content: 'Summarize this report',
          model: null,
          status: 'completed',
          createdAt: '2026-03-20T00:00:00.000Z',
          attachments: [
            {
              id: 'attachment-1',
              messageId: 'message-1',
              kind: 'document',
              originalName: 'report.pdf',
              mimeType: 'application/pdf',
              sizeBytes: 1024,
              createdAt: '2026-03-20T00:00:01.000Z'
            }
          ]
        }
      ],
      nextCursor: 'message-1',
      limit: 50
    })
  })
})

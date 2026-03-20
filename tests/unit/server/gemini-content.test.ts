import { describe, expect, it } from 'vitest'
import { buildGeminiContents } from '#server/utils/gemini-content'

describe('Gemini content builder', () => {
  it('maps stored messages and attachments to Gemini content parts', () => {
    const contents = buildGeminiContents([
      {
        id: 'msg-user',
        conversation_id: 'conversation-1',
        role: 'user',
        content: 'Summarize the attachment.',
        model: null,
        status: 'completed',
        created_at: '2026-03-20T00:00:00.000Z',
        attachments: [
          {
            id: 'attachment-1',
            message_id: 'msg-user',
            kind: 'document',
            original_name: 'notes.pdf',
            mime_type: 'application/pdf',
            size_bytes: 1024,
            storage_path: 'conversation-1/msg-user/notes.pdf',
            gemini_file_name: 'files/abc',
            gemini_file_uri: 'https://generativelanguage.googleapis.com/file/abc',
            created_at: '2026-03-20T00:00:00.000Z'
          }
        ]
      }
    ])

    expect(contents).toHaveLength(1)
    expect(contents[0]?.role).toBe('user')
    expect(contents[0]?.parts?.[0]?.text).toBe('Summarize the attachment.')
    expect(contents[0]?.parts?.[1]?.fileData?.fileUri).toBe('https://generativelanguage.googleapis.com/file/abc')
  })
})

import { describe, expect, it } from 'vitest'
import { buildDeepSeekMessages } from '#server/utils/deepseek-content'

describe('DeepSeek content builder', () => {
  it('injects document text, truncates newer files first, and notes omitted image inputs', () => {
    const messages = buildDeepSeekMessages([
      {
        id: 'msg-user-1',
        conversation_id: 'conversation-1',
        role: 'user',
        content: '',
        model: null,
        status: 'completed',
        created_at: '2026-03-20T00:00:00.000Z',
        attachments: [
          {
            id: 'image-1',
            message_id: 'msg-user-1',
            kind: 'image',
            original_name: 'diagram.png',
            mime_type: 'image/png',
            size_bytes: 1024,
            storage_path: 'conversation-1/msg-user-1/diagram.png',
            gemini_file_name: null,
            gemini_file_uri: null,
            extracted_text: null,
            created_at: '2026-03-20T00:00:01.000Z'
          },
          {
            id: 'doc-1',
            message_id: 'msg-user-1',
            kind: 'document',
            original_name: 'legacy.pdf',
            mime_type: 'application/pdf',
            size_bytes: 1024,
            storage_path: 'conversation-1/msg-user-1/legacy.pdf',
            gemini_file_name: null,
            gemini_file_uri: null,
            extracted_text: 'A'.repeat(50_000),
            created_at: '2026-03-20T00:00:02.000Z'
          }
        ]
      },
      {
        id: 'msg-assistant-1',
        conversation_id: 'conversation-1',
        role: 'assistant',
        content: 'Noted.',
        model: 'deepseek-chat',
        status: 'completed',
        created_at: '2026-03-20T00:00:03.000Z',
        attachments: []
      },
      {
        id: 'msg-user-2',
        conversation_id: 'conversation-1',
        role: 'user',
        content: 'Latest docs',
        model: null,
        status: 'completed',
        created_at: '2026-03-20T00:00:04.000Z',
        attachments: ['doc-2', 'doc-3', 'doc-4', 'doc-5'].map((id, index) => ({
          id,
          message_id: 'msg-user-2',
          kind: 'document' as const,
          original_name: `report-${index + 1}.md`,
          mime_type: 'text/markdown',
          size_bytes: 1024,
          storage_path: `conversation-1/msg-user-2/report-${index + 1}.md`,
          gemini_file_name: null,
          gemini_file_uri: null,
          extracted_text: String.fromCharCode(66 + index).repeat(50_000),
          created_at: `2026-03-20T00:00:0${5 + index}.000Z`
        }))
      }
    ])

    expect(messages[0]).toEqual({
      role: 'user',
      content: [
        'One image attachment was omitted because the current AI provider accepts document text only.',
        'Attached document "legacy.pdf" was omitted because the document context limit was reached.'
      ].join('\n\n')
    })
    expect(messages[1]).toEqual({
      role: 'assistant',
      content: 'Noted.'
    })
    expect(messages[2]?.role).toBe('user')
    expect(messages[2]?.content).toContain('Latest docs')
    expect(messages[2]?.content).toContain('Attached document: report-4.md')
    expect(messages[2]?.content).toContain('[Document content truncated for model context.]')
  })
})

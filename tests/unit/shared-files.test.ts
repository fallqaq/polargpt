import { describe, expect, it } from 'vitest'
import {
  buildAcceptAttribute,
  enforceAttachmentCount,
  findAttachmentRule,
  validateAttachmentDescriptor
} from '#shared/utils/files'

describe('shared file utilities', () => {
  it('accepts supported image uploads within the size limit', () => {
    const result = validateAttachmentDescriptor({
      fileName: 'diagram.png',
      mimeType: 'image/png',
      sizeBytes: 1024
    })

    expect(result.valid).toBe(true)
    expect(result.rule?.kind).toBe('image')
  })

  it('rejects unsupported file types', () => {
    const result = validateAttachmentDescriptor({
      fileName: 'payload.exe',
      mimeType: 'application/octet-stream',
      sizeBytes: 1024
    })

    expect(result.valid).toBe(false)
  })

  it('enforces the per-message attachment count', () => {
    expect(enforceAttachmentCount(5)).toContain('up to 4')
  })

  it('finds a rule by extension even when the MIME type is missing', () => {
    expect(findAttachmentRule('notes.md', undefined)?.kind).toBe('document')
  })

  it('rejects image uploads for DeepSeek while keeping document formats', () => {
    expect(validateAttachmentDescriptor({
      fileName: 'diagram.png',
      mimeType: 'image/png',
      sizeBytes: 1024
    }, 'deepseek')).toEqual({
      valid: false,
      reason: 'Images are not supported with the current AI provider. Use PDF, TXT, or Markdown files instead.'
    })

    expect(validateAttachmentDescriptor({
      fileName: 'notes.md',
      mimeType: 'text/markdown',
      sizeBytes: 1024
    }, 'deepseek').valid).toBe(true)
  })

  it('builds provider-aware file input accept lists', () => {
    expect(buildAcceptAttribute('gemini')).toContain('image/png')
    expect(buildAcceptAttribute('deepseek')).not.toContain('image/png')
    expect(buildAcceptAttribute('deepseek')).toContain('.pdf')
  })
})

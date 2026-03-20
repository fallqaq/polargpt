import {
  ATTACHMENT_RULES,
  MAX_ATTACHMENTS_PER_MESSAGE,
  type AttachmentRule,
  type SupportedAttachmentKind
} from '../constants/polargpt'

export interface AttachmentDescriptor {
  fileName: string
  mimeType?: string | null
  sizeBytes: number
}

export interface AttachmentValidationResult {
  valid: boolean
  reason?: string
  rule?: AttachmentRule
}

/**
 * Normalizes user-provided filenames before they are reused in storage paths or
 * UI surfaces.
 */
export function normalizeFileName(fileName: string) {
  return fileName.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase()
}

export function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase()
  const lastDot = normalized.lastIndexOf('.')
  return lastDot === -1 ? '' : normalized.slice(lastDot + 1)
}

export function findAttachmentRule(fileName: string, mimeType?: string | null) {
  const extension = getFileExtension(fileName)

  return ATTACHMENT_RULES.find((rule) => {
    if (rule.extension === extension) {
      return true
    }

    return Boolean(mimeType && rule.mimeTypes.includes(mimeType))
  })
}

export function validateAttachmentDescriptor(descriptor: AttachmentDescriptor): AttachmentValidationResult {
  const rule = findAttachmentRule(descriptor.fileName, descriptor.mimeType)

  if (!rule) {
    return {
      valid: false,
      reason: 'Unsupported file type. Allowed formats are PNG, JPEG, WebP, PDF, TXT, and Markdown.'
    }
  }

  if (descriptor.sizeBytes > rule.maxBytes) {
    return {
      valid: false,
      reason: `${descriptor.fileName} exceeds the size limit of ${formatBytes(rule.maxBytes)}.`,
      rule
    }
  }

  return { valid: true, rule }
}

export function enforceAttachmentCount(count: number) {
  if (count > MAX_ATTACHMENTS_PER_MESSAGE) {
    return `You can upload up to ${MAX_ATTACHMENTS_PER_MESSAGE} attachments per message.`
  }

  return null
}

export function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`
  }

  const units = ['KB', 'MB', 'GB']
  let size = value / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

export function getAttachmentKindLabel(kind: SupportedAttachmentKind) {
  return kind === 'image' ? 'Image' : 'Document'
}

export function buildAttachmentOnlyLabel(fileNames: string[]) {
  if (fileNames.length === 0) {
    return 'Attachment message'
  }

  if (fileNames.length === 1) {
    return `Attachment: ${fileNames[0]}`
  }

  return `Attachments: ${fileNames.slice(0, 2).join(', ')}${fileNames.length > 2 ? '...' : ''}`
}

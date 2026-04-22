import {
  ATTACHMENT_RULES,
  type ModelProvider,
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

export function isAttachmentRuleSupportedForProvider(rule: AttachmentRule, provider: ModelProvider) {
  if (provider === 'gemini') {
    return true
  }

  return rule.kind === 'document'
}

export function getSupportedAttachmentRules(provider: ModelProvider) {
  return ATTACHMENT_RULES.filter((rule) => isAttachmentRuleSupportedForProvider(rule, provider))
}

export function getAllowedAttachmentFormatsLabel(provider: ModelProvider) {
  return provider === 'gemini'
    ? 'PNG, JPEG, WebP, PDF, TXT, and Markdown'
    : 'PDF, TXT, and Markdown'
}

export function buildAcceptAttribute(provider: ModelProvider) {
  return getSupportedAttachmentRules(provider)
    .flatMap((rule) => {
      const [primaryMimeType] = rule.mimeTypes
      return primaryMimeType
        ? [primaryMimeType, `.${rule.extension}`]
        : [`.${rule.extension}`]
    })
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(',')
}

export function validateAttachmentDescriptor(
  descriptor: AttachmentDescriptor,
  provider: ModelProvider = 'gemini'
): AttachmentValidationResult {
  const rule = findAttachmentRule(descriptor.fileName, descriptor.mimeType)

  if (!rule) {
    return {
      valid: false,
      reason: `Unsupported file type. Allowed formats are ${getAllowedAttachmentFormatsLabel(provider)}.`
    }
  }

  if (!isAttachmentRuleSupportedForProvider(rule, provider)) {
    return {
      valid: false,
      reason: 'Images are not supported with the current AI provider. Use PDF, TXT, or Markdown files instead.'
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

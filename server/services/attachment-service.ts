import { createError, type H3Event } from 'h3'
import {
  ATTACHMENT_BUCKET,
  SIGNED_ATTACHMENT_URL_TTL_SECONDS,
  type SupportedAttachmentKind
} from '#shared/constants/polargpt'
import {
  enforceAttachmentCount,
  normalizeFileName,
  validateAttachmentDescriptor
} from '#shared/utils/files'
import type { AttachmentInsertRow, AttachmentRow } from '../types/database'
import { getSupabaseAdminClient } from '../utils/supabase-admin'
import { reportServerError } from '../utils/logger'
import { measureRequestMetric } from '../utils/request-metrics'
import { deleteGeminiFile, uploadGeminiFile } from './gemini-service'

export interface MultipartAttachmentPart {
  data: Buffer
  name?: string
  filename?: string
  type?: string
}

export interface ValidatedAttachmentUpload {
  fileName: string
  mimeType: string
  sizeBytes: number
  buffer: Buffer
  kind: SupportedAttachmentKind
}

export function validateAttachmentParts(parts: MultipartAttachmentPart[]) {
  const countError = enforceAttachmentCount(parts.length)

  if (countError) {
    throw createError({
      statusCode: 400,
      statusMessage: countError
    })
  }

  return parts.map((part) => {
    if (!part.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Every uploaded attachment must include a file name.'
      })
    }

    const fileName = part.filename

    const validation = validateAttachmentDescriptor({
      fileName,
      mimeType: part.type,
      sizeBytes: part.data.byteLength
    })

    if (!validation.valid || !validation.rule) {
      throw createError({
        statusCode: 400,
        statusMessage: validation.reason ?? 'Attachment validation failed.'
      })
    }

    const resolvedMimeType = part.type || validation.rule.mimeTypes[0]

    if (!resolvedMimeType) {
      throw createError({
        statusCode: 400,
        statusMessage: `Could not determine a MIME type for ${fileName}.`
      })
    }

    return {
      fileName,
      mimeType: resolvedMimeType,
      sizeBytes: part.data.byteLength,
      buffer: part.data,
      kind: validation.rule.kind
    } satisfies ValidatedAttachmentUpload
  })
}

function buildStoragePath(conversationId: string, messageId: string, fileName: string) {
  const normalized = normalizeFileName(fileName) || 'attachment'
  return `${conversationId}/${messageId}/${Date.now()}-${normalized}`
}

async function runWithConcurrencyLimit<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>
) {
  const executing = new Set<Promise<void>>()

  for (const [index, item] of items.entries()) {
    const task = worker(item, index).finally(() => {
      executing.delete(task)
    })

    executing.add(task)

    if (executing.size >= limit) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
}

export async function uploadMessageAttachments(input: {
  conversationId: string
  messageId: string
  attachments: ValidatedAttachmentUpload[]
  event?: H3Event
}) {
  const client = getSupabaseAdminClient()
  const createdRows: AttachmentInsertRow[] = []
  const uploadedStoragePaths: string[] = []
  const uploadedGeminiFiles: string[] = []

  try {
    await runWithConcurrencyLimit(input.attachments, 2, async (attachment, index) => {
      const storagePath = buildStoragePath(input.conversationId, input.messageId, attachment.fileName)
      const [uploadResult, geminiFile] = await Promise.all([
        measureRequestMetric(input.event, 'storageMs', async () => client.storage
          .from(ATTACHMENT_BUCKET)
          .upload(storagePath, attachment.buffer, {
            contentType: attachment.mimeType,
            upsert: false
          })),
        uploadGeminiFile({
          buffer: attachment.buffer,
          mimeType: attachment.mimeType,
          fileName: attachment.fileName,
          event: input.event
        })
      ])

      if (uploadResult.error) {
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to upload ${attachment.fileName} to Supabase Storage.`
        })
      }

      uploadedStoragePaths.push(storagePath)

      if (geminiFile.name) {
        uploadedGeminiFiles.push(geminiFile.name)
      }

      createdRows[index] = {
        message_id: input.messageId,
        kind: attachment.kind,
        original_name: attachment.fileName,
        mime_type: attachment.mimeType,
        size_bytes: attachment.sizeBytes,
        storage_path: storagePath,
        gemini_file_name: geminiFile.name ?? null,
        gemini_file_uri: geminiFile.uri ?? null
      }
    })
  }
  catch (error) {
    await cleanupUploadedArtifacts(uploadedStoragePaths, uploadedGeminiFiles)
    throw error
  }

  return createdRows
}

export async function cleanupUploadedArtifacts(storagePaths: string[], geminiFileNames: string[]) {
  const client = getSupabaseAdminClient()

  if (storagePaths.length > 0) {
    const { error } = await client.storage.from(ATTACHMENT_BUCKET).remove(storagePaths)

    if (error) {
      reportServerError('cleanupUploadedArtifacts.storage', error, { storagePaths })
    }
  }

  await Promise.allSettled(
    geminiFileNames.map(async (fileName) => {
      try {
        await deleteGeminiFile(fileName)
      }
      catch (error) {
        reportServerError('cleanupUploadedArtifacts.gemini', error, { fileName })
      }
    })
  )
}

export async function createSignedAttachmentUrls(attachments: AttachmentRow[]) {
  const client = getSupabaseAdminClient()
  const urlMap = new Map<string, string | null>()

  await Promise.all(attachments.map(async (attachment) => {
    const { data, error } = await client.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUrl(attachment.storage_path, SIGNED_ATTACHMENT_URL_TTL_SECONDS)

    if (error) {
      reportServerError('createSignedAttachmentUrls', error, {
        attachmentId: attachment.id,
        storagePath: attachment.storage_path
      })
      urlMap.set(attachment.id, null)
      return
    }

    urlMap.set(attachment.id, data.signedUrl)
  }))

  return urlMap
}

export async function createAttachmentUrlRecords(attachments: AttachmentRow[], event?: H3Event) {
  const urlMap = await measureRequestMetric(event, 'signUrlMs', async () => createSignedAttachmentUrls(attachments))

  return attachments.map((attachment) => ({
    attachmentId: attachment.id,
    downloadUrl: urlMap.get(attachment.id) ?? null
  }))
}

export async function removeStoredAttachments(attachments: AttachmentRow[]) {
  const client = getSupabaseAdminClient()
  const storagePaths = attachments.map((attachment) => attachment.storage_path)
  const geminiFileNames = attachments
    .map((attachment) => attachment.gemini_file_name)
    .filter((fileName): fileName is string => Boolean(fileName))

  if (storagePaths.length > 0) {
    const { error } = await client.storage.from(ATTACHMENT_BUCKET).remove(storagePaths)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to remove attachments from storage.'
      })
    }
  }

  await Promise.allSettled(
    geminiFileNames.map(async (fileName) => {
      try {
        await deleteGeminiFile(fileName)
      }
      catch (error) {
        reportServerError('removeStoredAttachments.gemini', error, { fileName })
      }
    })
  )
}

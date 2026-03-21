import { readBody } from 'h3'
import { z } from 'zod'
import type { AttachmentUrlResponse } from '#shared/types/chat'
import { createAttachmentUrlRecords } from '#server/services/attachment-service'
import { listAttachmentsByIds } from '#server/services/conversation-service'
import { incrementCountMetric, setResponseBytes } from '#server/utils/request-metrics'

const bodySchema = z.object({
  attachmentIds: z.array(z.string().min(1)).min(1).max(50)
})

export default defineEventHandler(async (event): Promise<AttachmentUrlResponse> => {
  const body = bodySchema.parse(await readBody(event))
  const attachmentIds = [...new Set(body.attachmentIds)]
  const attachments = await listAttachmentsByIds(attachmentIds, event)
  const signedAttachments = await createAttachmentUrlRecords(attachments, event)
  const urlMap = new Map(signedAttachments.map((entry) => [entry.attachmentId, entry.downloadUrl]))
  const response = {
    attachments: attachmentIds.map((attachmentId) => ({
      attachmentId,
      downloadUrl: urlMap.get(attachmentId) ?? null
    }))
  }

  incrementCountMetric(event, 'attachmentCount', response.attachments.length)
  setResponseBytes(event, response)

  return response
})

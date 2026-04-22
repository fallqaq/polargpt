import { createError } from 'h3'
import { extractText } from 'unpdf'
import { getFileExtension } from '#shared/utils/files'

function normalizeExtractedText(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .trim()
}

async function extractPdfText(buffer: Buffer) {
  const { text } = await extractText(new Uint8Array(buffer), {
    mergePages: true
  })

  return normalizeExtractedText(text)
}

function extractUtf8Text(buffer: Buffer) {
  return normalizeExtractedText(new TextDecoder('utf-8', {
    fatal: false
  }).decode(buffer))
}

export async function extractDocumentText(input: {
  buffer: Buffer
  fileName: string
  mimeType: string
}) {
  const extension = getFileExtension(input.fileName)

  try {
    if (input.mimeType === 'application/pdf' || extension === 'pdf') {
      return await extractPdfText(input.buffer)
    }

    if (input.mimeType === 'text/plain' || input.mimeType === 'text/markdown' || input.mimeType === 'text/x-markdown'
      || extension === 'txt' || extension === 'md') {
      return extractUtf8Text(input.buffer)
    }
  }
  catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: `Failed to extract readable text from ${input.fileName}.`,
      cause: error
    })
  }

  throw createError({
    statusCode: 400,
    statusMessage: `DeepSeek only supports PDF, TXT, and Markdown attachments.`
  })
}

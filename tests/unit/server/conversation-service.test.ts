import { describe, expect, it } from 'vitest'
import {
  isLegacyAttachmentExtractedTextError,
  isLegacySchemaUserScopeError,
  isMissingClaimLegacyRpcError
} from '#server/services/conversation-service'

describe('conversation service schema compatibility', () => {
  it('detects missing user_id column errors from Postgres and PostgREST', () => {
    expect(isLegacySchemaUserScopeError({
      code: '42703',
      message: 'column conversations.user_id does not exist'
    })).toBe(true)

    expect(isLegacySchemaUserScopeError({
      code: 'PGRST204',
      message: "Could not find the 'user_id' column of 'conversations' in the schema cache"
    })).toBe(true)
  })

  it('detects a missing claim_legacy_chat_records rpc', () => {
    expect(isMissingClaimLegacyRpcError({
      code: '42883',
      message: 'function public.claim_legacy_chat_records(uuid) does not exist'
    })).toBe(true)

    expect(isMissingClaimLegacyRpcError({
      code: 'PGRST202',
      message: 'Could not find the function public.claim_legacy_chat_records(claim_user_id) in the schema cache'
    })).toBe(true)
  })

  it('detects legacy attachment tables that do not expose extracted_text', () => {
    expect(isLegacyAttachmentExtractedTextError({
      code: '42703',
      message: 'column attachments.extracted_text does not exist'
    })).toBe(true)

    expect(isLegacyAttachmentExtractedTextError({
      code: 'PGRST204',
      message: "Could not find the 'extracted_text' column of 'attachments' in the schema cache"
    })).toBe(true)
  })
})

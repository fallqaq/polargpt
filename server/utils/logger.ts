/**
 * Logging stays intentionally simple in v1 so the same helper can later be
 * swapped to Sentry or another error sink without touching business handlers.
 */
export function reportServerError(context: string, error: unknown, metadata?: Record<string, unknown>) {
  console.error(`[polarGPT] ${context}`, {
    error,
    metadata
  })
}

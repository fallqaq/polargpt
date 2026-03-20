import { FetchError } from 'ofetch'

export function getRequestErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (error instanceof FetchError) {
    return (error.data as { statusMessage?: string } | undefined)?.statusMessage
      || error.statusMessage
      || fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

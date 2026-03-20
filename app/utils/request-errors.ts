import { FetchError } from 'ofetch'
import type { UiLocale, UiTextKey } from './ui'
import { translateKnownErrorMessage } from './ui'

export function getRequestErrorMessage(
  error: unknown,
  options: {
    locale: UiLocale
    fallbackKey?: UiTextKey
  }
) {
  const fallbackKey = options.fallbackKey ?? 'errorGeneric'

  if (error instanceof FetchError) {
    return translateKnownErrorMessage(
      options.locale,
      (error.data as { statusMessage?: string } | undefined)?.statusMessage || error.statusMessage,
      fallbackKey
    )
  }

  if (error instanceof Error) {
    return translateKnownErrorMessage(options.locale, error.message, fallbackKey)
  }

  return translateKnownErrorMessage(options.locale, null, fallbackKey)
}

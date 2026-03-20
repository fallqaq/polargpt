import {
  DEFAULT_UI_LOCALE,
  SSR_FALLBACK_UI_THEME,
  UI_LOCALE_COOKIE_NAME,
  UI_PREFERENCE_MAX_AGE_SECONDS,
  UI_THEME_COOKIE_NAME,
  normalizeUiLocale,
  normalizeUiTheme,
  resolveUiText,
  resolveUiTheme,
  translateKnownErrorMessage,
  type UiLocale,
  type UiTextKey,
  type UiTextParams,
  type UiTheme
} from '../utils/ui'

let hasRegisteredSystemThemeListener = false

export function useUiPreferences() {
  const localeCookie = useCookie<UiLocale>(UI_LOCALE_COOKIE_NAME, {
    default: () => DEFAULT_UI_LOCALE,
    maxAge: UI_PREFERENCE_MAX_AGE_SECONDS,
    sameSite: 'lax'
  })
  const themeCookie = useCookie<UiTheme | null>(UI_THEME_COOKIE_NAME, {
    default: () => null,
    maxAge: UI_PREFERENCE_MAX_AGE_SECONDS,
    sameSite: 'lax'
  })
  const locale = useState<UiLocale>('polargpt-ui-locale', () => normalizeUiLocale(localeCookie.value))
  const theme = useState<UiTheme>('polargpt-ui-theme', () => normalizeUiTheme(themeCookie.value) ?? SSR_FALLBACK_UI_THEME)
  const themeReady = useState<boolean>('polargpt-ui-theme-ready', () => Boolean(normalizeUiTheme(themeCookie.value)))

  function applyThemeToDocument(nextTheme: UiTheme) {
    if (!import.meta.client) {
      return
    }

    document.documentElement.dataset.theme = nextTheme
    document.documentElement.style.colorScheme = nextTheme
  }

  function applyLocaleToDocument(nextLocale: UiLocale) {
    if (!import.meta.client) {
      return
    }

    document.documentElement.lang = nextLocale
  }

  function setLocale(nextLocale: UiLocale) {
    const normalized = normalizeUiLocale(nextLocale)
    locale.value = normalized
    localeCookie.value = normalized
    applyLocaleToDocument(normalized)
  }

  function setTheme(nextTheme: UiTheme) {
    theme.value = nextTheme
    themeCookie.value = nextTheme
    themeReady.value = true
    applyThemeToDocument(nextTheme)
  }

  function syncThemeFromSystemPreference() {
    if (!import.meta.client) {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const resolvedTheme = resolveUiTheme(themeCookie.value, media.matches)
    theme.value = resolvedTheme
    themeReady.value = true
    applyThemeToDocument(resolvedTheme)

    if (hasRegisteredSystemThemeListener) {
      return
    }

    media.addEventListener('change', (event) => {
      if (normalizeUiTheme(themeCookie.value)) {
        return
      }

      theme.value = event.matches ? 'dark' : 'light'
      themeReady.value = true
      applyThemeToDocument(theme.value)
    })

    hasRegisteredSystemThemeListener = true
  }

  function initializeClientUi() {
    locale.value = normalizeUiLocale(localeCookie.value)
    applyLocaleToDocument(locale.value)
    syncThemeFromSystemPreference()
  }

  function t(key: UiTextKey, params?: UiTextParams) {
    return resolveUiText(locale.value, key, params)
  }

  function formatDateTime(value: string | number | Date, options?: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat(locale.value, options).format(new Date(value))
  }

  function translateError(message?: string | null, fallbackKey?: UiTextKey) {
    return translateKnownErrorMessage(locale.value, message, fallbackKey)
  }

  return {
    locale,
    theme,
    themeReady,
    formatLocale: computed(() => locale.value),
    initializeClientUi,
    setLocale,
    setTheme,
    t,
    formatDateTime,
    translateError
  }
}

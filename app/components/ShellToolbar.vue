<script setup lang="ts">
import { USER_HINT_COOKIE_NAME } from '#shared/constants/polargpt'
import type { SessionResponse } from '#shared/types/chat'
import type { UiLocale } from '../utils/ui'

const route = useRoute()
const userHintCookie = useCookie<string | null>(USER_HINT_COOKIE_NAME)
const { locale, setLocale, setTheme, t, theme } = useUiPreferences()
const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const localeOptions = computed<Array<{
  value: UiLocale
  label: string
}>>(() => [
  {
    value: 'zh-CN',
    label: t('toolbarLocaleZh')
  },
  {
    value: 'en-US',
    label: t('toolbarLocaleEn')
  }
])

const previewMode = computed(() =>
  import.meta.dev
  && route.path.startsWith('/chat')
  && route.query.preview === '1')

const { data: session } = useFetch<SessionResponse>('/api/auth/session', {
  key: 'polargpt-auth-session',
  default: () => ({
    user: null
  })
})

const displayUser = computed(() => {
  if (session.value?.user) {
    return session.value.user
  }

  if (previewMode.value) {
    return {
      id: 'preview-user',
      email: 'preview@local'
    }
  }

  return null
})

const showAccount = computed(() =>
  route.path !== '/login' && displayUser.value !== null)

const userInitial = computed(() => {
  const email = displayUser.value?.email ?? ''
  return email.slice(0, 1).toUpperCase() || 'P'
})

const currentTheme = computed(() => theme.value)
const themeToggleLabel = computed(() =>
  currentTheme.value === 'dark' ? t('toolbarThemeLight') : t('toolbarThemeDark'))

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function handleLocaleChange(event: Event) {
  const nextLocale = (event.target as HTMLSelectElement).value as UiLocale
  setLocale(nextLocale)
}

function toggleTheme() {
  setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
}

async function logout() {
  closeMenu()

  if (previewMode.value) {
    userHintCookie.value = null
    session.value = { user: null }
    await navigateTo('/login?preview=1')
    return
  }

  await $fetch('/api/auth/logout', {
    method: 'POST'
  })

  userHintCookie.value = null
  session.value = { user: null }
  await navigateTo('/login')
}

function handleDocumentClick(event: MouseEvent) {
  if (!menuRef.value) {
    return
  }

  const target = event.target
  if (target instanceof Node && !menuRef.value.contains(target)) {
    closeMenu()
  }
}

watch(() => route.fullPath, () => {
  closeMenu()
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div class="toolbar panel" role="toolbar" :aria-label="`${t('toolbarLanguage')} / ${t('toolbarTheme')}`">
    <div v-if="showAccount && displayUser" class="toolbar__leading">
      <div
        ref="menuRef"
        class="toolbar__account"
        @keydown.esc.stop.prevent="closeMenu"
      >
        <button
          class="toolbar__account-button"
          type="button"
          :aria-expanded="menuOpen"
          aria-haspopup="menu"
          :aria-label="displayUser.email"
          @click="toggleMenu"
        >
          <span class="toolbar__avatar">{{ userInitial }}</span>
        </button>

        <div v-if="menuOpen" class="toolbar__menu" role="menu">
          <div class="toolbar__menu-account">
            <p class="toolbar__menu-label">{{ t('toolbarCurrentAccount') }}</p>
            <p class="toolbar__menu-email">{{ displayUser.email }}</p>
          </div>

          <button class="toolbar__menu-item" type="button" role="menuitem" @click="logout">
            {{ t('headerLogout') }}
          </button>
        </div>
      </div>
    </div>

    <span v-if="showAccount" class="toolbar__divider" aria-hidden="true" />

    <div class="toolbar__preferences">
      <label class="toolbar__select-wrap">
        <span class="sr-only">{{ t('toolbarLanguage') }}</span>
        <select
          class="toolbar__select"
          :value="locale"
          :aria-label="t('toolbarLanguage')"
          @change="handleLocaleChange"
        >
          <option
            v-for="option in localeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <span class="toolbar__select-caret" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 10l5 5l5-5" />
          </svg>
        </span>
      </label>

      <button
        class="toolbar__theme"
        type="button"
        :aria-label="themeToggleLabel"
        :aria-pressed="currentTheme === 'dark'"
        @click="toggleTheme"
      >
        <svg v-if="currentTheme === 'dark'" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4.75V3M12 21v-1.75M6.17 6.17L4.93 4.93M19.07 19.07l-1.24-1.24M4.75 12H3M21 12h-1.75M6.17 17.83l-1.24 1.24M19.07 4.93l-1.24 1.24M15.25 12a3.25 3.25 0 1 1-6.5 0a3.25 3.25 0 0 1 6.5 0Z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.25 14.23A7.75 7.75 0 0 1 9.77 3.75a8.5 8.5 0 1 0 10.48 10.48Z" />
        </svg>
        <span class="sr-only">{{ themeToggleLabel }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  width: auto;
  max-width: 100%;
  padding: 5px;
  overflow: visible;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 46%),
    color-mix(in srgb, var(--color-panel) 84%, transparent);
}

html[data-theme='dark'] .toolbar {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 40%),
    color-mix(in srgb, var(--color-panel) 90%, transparent);
}

.toolbar__leading,
.toolbar__preferences {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.toolbar__divider {
  width: 1px;
  align-self: stretch;
  border-radius: 999px;
  background:
    linear-gradient(180deg, transparent, color-mix(in srgb, var(--color-border) 92%, transparent) 20%, color-mix(in srgb, var(--color-border) 92%, transparent) 80%, transparent);
}

.toolbar__account {
  position: relative;
  z-index: 2;
}

.toolbar__account-button {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-toolbar-track);
  color: var(--color-ink);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease,
    color 180ms ease;
}

.toolbar__avatar {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-signal) 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
}

.toolbar__menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 3;
  display: grid;
  gap: 4px;
  min-width: 15rem;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 46%),
    var(--color-panel-strong);
  box-shadow: var(--shadow-floating);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
}

html[data-theme='dark'] .toolbar__menu {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 42%),
    color-mix(in srgb, var(--color-panel-solid) 92%, transparent);
  backdrop-filter: blur(22px) saturate(112%);
  -webkit-backdrop-filter: blur(22px) saturate(112%);
}

.toolbar__menu-account {
  display: grid;
  gap: 4px;
  padding: 8px 10px 10px;
}

.toolbar__menu-label {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.toolbar__menu-email {
  margin: 0;
  color: var(--color-ink);
  font-size: 0.88rem;
  line-height: 1.45;
  word-break: break-all;
}

.toolbar__menu-item {
  min-height: 36px;
  border: 0;
  border-radius: 12px;
  padding: 0 10px;
  background: transparent;
  color: var(--color-ink);
  text-align: left;
  font: inherit;
  transition: background 180ms ease, transform 180ms ease;
}

.toolbar__menu-item:hover {
  background: var(--color-toolbar-track);
  transform: translateY(-1px);
}

.toolbar__select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 6.2rem;
}

.toolbar__select {
  width: 100%;
  min-height: 34px;
  padding: 0 34px 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-toolbar-track);
  color: var(--color-ink);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
  appearance: none;
  -webkit-appearance: none;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.toolbar__account-button:hover,
.toolbar__select:hover,
.toolbar__theme:hover {
  transform: translateY(-1px);
}

.toolbar__account-button:focus-visible,
.toolbar__select:focus-visible,
.toolbar__theme:focus-visible {
  box-shadow:
    inset 0 0 0 1px var(--color-toolbar-active-border),
    0 0 0 4px rgba(75, 129, 230, 0.08);
}

html[data-theme='dark'] .toolbar__account-button,
html[data-theme='dark'] .toolbar__select,
html[data-theme='dark'] .toolbar__theme {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

html[data-theme='dark'] .toolbar__account-button:focus-visible,
html[data-theme='dark'] .toolbar__select:focus-visible,
html[data-theme='dark'] .toolbar__theme:focus-visible {
  box-shadow:
    inset 0 0 0 1px var(--color-toolbar-active-border),
    0 0 0 4px rgba(140, 167, 232, 0.1);
}

.toolbar__select-caret {
  position: absolute;
  right: 11px;
  display: inline-grid;
  place-items: center;
  pointer-events: none;
  color: var(--color-muted);
}

.toolbar__select-caret svg,
.toolbar__theme svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.toolbar__theme {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-toolbar-track);
  color: var(--color-ink);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease,
    color 180ms ease;
}

@media (max-width: 760px) {
  .toolbar {
    display: flex;
    width: 100%;
    gap: 8px;
    border-radius: 16px;
  }

  .toolbar__preferences {
    flex: 1 1 auto;
    min-width: 0;
    justify-content: flex-end;
  }

  .toolbar__select-wrap {
    flex: 1 1 auto;
    min-width: 0;
  }

  .toolbar__menu {
    left: auto;
    right: 0;
    min-width: 13rem;
  }
}
</style>

<script setup lang="ts">
import type { UiLocale, UiTheme } from '../utils/ui'

const { locale, setLocale, setTheme, t, theme, themeReady } = useUiPreferences()

const localeOptions = computed<Array<{ value: UiLocale, label: string }>>(() => [
  {
    value: 'zh-CN',
    label: t('toolbarLocaleZh')
  },
  {
    value: 'en-US',
    label: t('toolbarLocaleEn')
  }
])

const themeOptions = computed<Array<{ value: UiTheme, label: string }>>(() => [
  {
    value: 'light',
    label: t('toolbarThemeLight')
  },
  {
    value: 'dark',
    label: t('toolbarThemeDark')
  }
])
</script>

<template>
  <div class="toolbar panel">
    <section class="toolbar__group" :aria-label="t('toolbarLanguage')">
      <p class="surface-label">{{ t('toolbarLanguage') }}</p>
      <div class="toolbar__segmented" role="group" :aria-label="t('toolbarLanguage')">
        <button
          v-for="option in localeOptions"
          :key="option.value"
          class="toolbar__option"
          :class="{ 'toolbar__option--active': locale === option.value }"
          type="button"
          :aria-pressed="locale === option.value"
          @click="setLocale(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section class="toolbar__group" :aria-label="t('toolbarTheme')">
      <p class="surface-label">{{ t('toolbarTheme') }}</p>
      <div class="toolbar__segmented" role="group" :aria-label="t('toolbarTheme')">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          class="toolbar__option"
          :class="{ 'toolbar__option--active': themeReady && theme === option.value }"
          type="button"
          :aria-pressed="themeReady && theme === option.value"
          @click="setTheme(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 14px;
  padding: 14px;
}

.toolbar__group {
  display: grid;
  gap: 8px;
}

.toolbar__segmented {
  display: inline-flex;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-toolbar-track);
}

.toolbar__option {
  min-width: 5.25rem;
  min-height: 40px;
  border: 0;
  border-radius: 999px;
  padding: 0 16px;
  background: transparent;
  color: var(--color-muted);
  font-weight: 600;
  transition: background 180ms ease, color 180ms ease, transform 180ms ease;
}

.toolbar__option--active {
  color: var(--color-ink);
  background: var(--color-toolbar-active);
  box-shadow: inset 0 0 0 1px var(--color-toolbar-active-border);
}

.toolbar__option:hover {
  transform: translateY(-1px);
}

@media (max-width: 760px) {
  .toolbar {
    justify-content: stretch;
  }

  .toolbar__group {
    flex: 1 1 100%;
  }

  .toolbar__segmented {
    width: 100%;
  }

  .toolbar__option {
    flex: 1 1 0;
    min-width: 0;
  }
}
</style>

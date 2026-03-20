<script setup lang="ts">
import { buildThemeInitScript } from './utils/ui'

const { initializeClientUi, locale, t } = useUiPreferences()

useHead({
  script: [
    {
      id: 'polargpt-theme-init',
      tagPosition: 'head',
      innerHTML: buildThemeInitScript()
    }
  ]
})

useHead(() => ({
  title: t('metaTitle'),
  meta: [
    {
      name: 'description',
      content: t('metaDescription')
    }
  ],
  htmlAttrs: {
    lang: locale.value
  }
}))

onMounted(() => {
  initializeClientUi()
})
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="var(--color-signal)" />
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
</template>

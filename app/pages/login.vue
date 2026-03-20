<script setup lang="ts">
import { ADMIN_HINT_COOKIE_NAME } from '#shared/constants/polargpt'
import type { LoginResponse } from '#shared/types/chat'
import { getRequestErrorMessage } from '../utils/request-errors'

definePageMeta({
  middleware: ['guest-only']
})

const password = ref('')
const pending = ref(false)
const errorMessage = ref<string | null>(null)
const adminHintCookie = useCookie<string | null>(ADMIN_HINT_COOKIE_NAME)
const { locale, t } = useUiPreferences()

async function submit() {
  if (!password.value.trim()) {
    errorMessage.value = t('loginPasswordRequired')
    return
  }

  pending.value = true
  errorMessage.value = null

  try {
    await $fetch<LoginResponse>('/api/admin/session/login', {
      method: 'POST',
      body: {
        password: password.value
      }
    })

    adminHintCookie.value = '1'
    await navigateTo('/chat')
  }
  catch (error) {
    errorMessage.value = getRequestErrorMessage(error, {
      locale: locale.value,
      fallbackKey: 'errorLoginFailed'
    })
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="login">
    <div class="login__intro">
      <p class="surface-label">{{ t('loginModeLabel') }}</p>
      <h1>{{ t('loginTitle') }}</h1>
      <p>
        {{ t('loginDescription') }}
      </p>
    </div>

    <form class="login__card panel" @submit.prevent="submit">
      <div>
        <p class="surface-label">{{ t('loginAccessLabel') }}</p>
        <h2>{{ t('loginSignInTitle') }}</h2>
      </div>

      <label class="login__field">
        <span>{{ t('loginPasswordLabel') }}</span>
        <input
          v-model="password"
          class="text-input"
          type="password"
          :placeholder="t('loginPasswordPlaceholder')"
          autocomplete="current-password"
        >
      </label>

      <p v-if="errorMessage" class="status-banner">
        {{ errorMessage }}
      </p>

      <button class="button login__submit" type="submit" :disabled="pending">
        {{ pending ? t('loginSubmitBusy') : t('loginSubmitIdle') }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.login {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(22rem, 30rem);
  gap: 24px;
  align-items: stretch;
  min-height: 100%;
}

.login__intro,
.login__card {
  padding: clamp(24px, 4vw, 42px);
}

.login__intro {
  display: grid;
  align-content: center;
  gap: 16px;
}

.login__intro h1 {
  margin: 0;
  font-size: clamp(2.8rem, 9vw, 6rem);
  line-height: 0.9;
  max-width: 10ch;
}

.login__intro p:last-child {
  margin: 0;
  max-width: 38rem;
  color: var(--color-muted);
  line-height: 1.8;
  font-size: 1.05rem;
}

.login__card {
  display: grid;
  align-content: center;
  gap: 18px;
  background: var(--color-panel-strong);
}

.login__card h2 {
  margin: 10px 0 0;
  font-size: 1.8rem;
}

.login__field {
  display: grid;
  gap: 10px;
}

.login__field span {
  color: var(--color-muted);
}

.login__submit {
  width: 100%;
}

@media (max-width: 960px) {
  .login {
    grid-template-columns: 1fr;
    min-height: auto;
  }
}
</style>

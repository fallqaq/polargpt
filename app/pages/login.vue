<script setup lang="ts">
import { USER_HINT_COOKIE_NAME } from '#shared/constants/polargpt'
import type { AuthResponse } from '#shared/types/chat'
import { getRequestErrorMessage } from '../utils/request-errors'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  decay: number
  hue: number
}

type AuthMode = 'login' | 'register'

definePageMeta({
  middleware: ['guest-only']
})

const mode = ref<AuthMode>('login')
const email = ref('')
const password = ref('')
const pendingMode = ref<AuthMode | null>(null)
const errorMessage = ref<string | null>(null)
const userHintCookie = useCookie<string | null>(USER_HINT_COOKIE_NAME)
const { locale, t } = useUiPreferences()
const scene = ref<HTMLElement | null>(null)
const particles = ref<Particle[]>([])
const pointerX = ref(0.52)
const pointerY = ref(0.38)
const prefersReducedMotion = ref(false)
const isRegisterMode = computed(() => mode.value === 'register')
const pending = computed(() => pendingMode.value !== null)
const cardTitle = computed(() => isRegisterMode.value ? t('loginRegisterTitle') : t('loginSignInTitle'))
const submitLabel = computed(() => {
  if (pending.value) {
    return t('loginSubmitBusy')
  }

  return isRegisterMode.value ? t('loginSubmitRegisterIdle') : t('loginSubmitLoginIdle')
})

let animationFrameId = 0
let particleId = 0

function switchMode(nextMode: AuthMode) {
  mode.value = nextMode
  errorMessage.value = null
}

async function submit() {
  if (!email.value.trim()) {
    errorMessage.value = t('errorEmailRequired')
    return
  }

  if (!password.value.trim()) {
    errorMessage.value = t('errorPasswordRequired')
    return
  }

  const action = mode.value
  pendingMode.value = action
  errorMessage.value = null

  try {
    await $fetch<AuthResponse>(action === 'register' ? '/api/auth/register' : '/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    userHintCookie.value = '1'
    await navigateTo('/chat')
  }
  catch (error) {
    errorMessage.value = getRequestErrorMessage(error, {
      locale: locale.value,
      fallbackKey: action === 'register' ? 'errorRegisterFailed' : 'errorLoginFailed'
    })
  }
  finally {
    pendingMode.value = null
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function ensureAnimation() {
  if (animationFrameId || prefersReducedMotion.value) {
    return
  }

  animationFrameId = window.requestAnimationFrame(stepParticles)
}

function stepParticles() {
  particles.value = particles.value
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      life: particle.life - particle.decay,
      vy: particle.vy - 0.01
    }))
    .filter((particle) => particle.life > 0)

  if (particles.value.length === 0) {
    animationFrameId = 0
    return
  }

  animationFrameId = window.requestAnimationFrame(stepParticles)
}

function emitParticles(clientX: number, clientY: number) {
  if (prefersReducedMotion.value || !scene.value) {
    return
  }

  const rect = scene.value.getBoundingClientRect()
  const localX = clientX - rect.left
  const localY = clientY - rect.top

  particles.value = [
    ...particles.value.slice(-14),
    {
      id: particleId++,
      x: localX + (Math.random() - 0.5) * 12,
      y: localY + (Math.random() - 0.5) * 12,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -0.4 - Math.random() * 0.5,
      size: 18 + Math.random() * 26,
      life: 1,
      decay: 0.03 + Math.random() * 0.02,
      hue: Math.random() > 0.5 ? 214 : 190
    }
  ]

  ensureAnimation()
}

function handlePointerMove(event: PointerEvent) {
  if (!scene.value) {
    return
  }

  const rect = scene.value.getBoundingClientRect()
  pointerX.value = clamp((event.clientX - rect.left) / rect.width, 0, 1)
  pointerY.value = clamp((event.clientY - rect.top) / rect.height, 0, 1)
  emitParticles(event.clientX, event.clientY)
}

function handlePointerLeave() {
  pointerX.value = 0.52
  pointerY.value = 0.38
}

function particleStyle(particle: Particle) {
  return {
    left: `${particle.x}px`,
    top: `${particle.y}px`,
    width: `${particle.size}px`,
    height: `${particle.size}px`,
    opacity: String(particle.life * 0.78),
    transform: `translate(-50%, -50%) scale(${0.72 + particle.life * 0.55})`,
    background: `radial-gradient(circle, hsla(${particle.hue}, 100%, 86%, 0.85) 0%, hsla(${particle.hue}, 92%, 74%, 0.28) 48%, transparent 76%)`
  }
}

const cardStyle = computed(() => {
  if (prefersReducedMotion.value) {
    return {
      transform: 'none'
    }
  }

  const rotateX = (0.5 - pointerY.value) * 5
  const rotateY = (pointerX.value - 0.5) * 6

  return {
    transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }
})

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

onBeforeUnmount(() => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <section
    ref="scene"
    class="login"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <div class="login__backdrop" aria-hidden="true">
      <span
        v-for="particle in particles"
        :key="particle.id"
        class="login__particle"
        :style="particleStyle(particle)"
      />
    </div>

    <div class="login__hero">
      <h1>{{ t('loginTitle') }}</h1>
      <p class="login__tagline">{{ t('loginDescription') }}</p>
    </div>

    <form class="login__card panel" :style="cardStyle" @submit.prevent="submit">
      <div class="login__card-head">
        <h2>{{ cardTitle }}</h2>
      </div>

      <div class="login__mode-switch" role="tablist" :aria-label="t('loginAccessLabel')">
        <button
          class="login__mode-button"
          :class="{ 'is-active': !isRegisterMode }"
          type="button"
          @click="switchMode('login')"
        >
          {{ t('authModeSignIn') }}
        </button>

        <button
          class="login__mode-button"
          :class="{ 'is-active': isRegisterMode }"
          type="button"
          @click="switchMode('register')"
        >
          {{ t('authModeRegister') }}
        </button>
      </div>

      <label class="login__field">
        <span>{{ t('loginEmailLabel') }}</span>
        <input
          v-model="email"
          class="text-input"
          type="email"
          :placeholder="t('loginEmailPlaceholder')"
          autocomplete="email"
          inputmode="email"
        >
      </label>

      <label class="login__field">
        <span>{{ t('loginPasswordLabel') }}</span>
        <input
          v-model="password"
          class="text-input"
          type="password"
          :placeholder="t('loginPasswordPlaceholder')"
          :autocomplete="isRegisterMode ? 'new-password' : 'current-password'"
        >
      </label>

      <p v-if="errorMessage" class="status-banner">
        {{ errorMessage }}
      </p>

      <button class="button login__submit" type="submit" :disabled="pending">
        {{ submitLabel }}
      </button>

      <p class="login__switch-copy">
        {{ isRegisterMode ? t('loginTogglePromptSignIn') : t('loginTogglePromptRegister') }}
        <button
          class="login__inline-link"
          type="button"
          @click="switchMode(isRegisterMode ? 'login' : 'register')"
        >
          {{ isRegisterMode ? t('loginToggleActionSignIn') : t('loginToggleActionRegister') }}
        </button>
      </p>
    </form>
  </section>
</template>

<style scoped>
.login {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(20rem, 28rem);
  gap: clamp(24px, 4vw, 56px);
  align-items: center;
  width: min(100%, 1180px);
  min-height: 100%;
  margin: 0 auto;
  padding: clamp(18px, 4vw, 36px);
  overflow: hidden;
}

.login__backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.login__particle {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  mix-blend-mode: screen;
}

.login__hero,
.login__card {
  position: relative;
  z-index: 1;
}

.login__hero {
  display: grid;
  gap: 12px;
  align-content: center;
  min-height: 34rem;
  max-width: 34rem;
}

.login__hero h1 {
  margin: 0;
  max-width: 8ch;
  font-size: clamp(3.2rem, 8vw, 5.2rem);
  line-height: 0.92;
  letter-spacing: -0.07em;
}

.login__tagline {
  margin: 0;
  max-width: 28rem;
  color: var(--color-muted);
  line-height: 1.8;
  font-size: 1.04rem;
  letter-spacing: 0.01em;
}

.login__card {
  display: grid;
  gap: 16px;
  padding: clamp(22px, 3vw, 32px);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 28%),
    var(--color-panel-strong);
  box-shadow: var(--shadow-floating);
  transform-style: preserve-3d;
  transform-origin: center;
  will-change: transform;
}

html[data-theme='dark'] .login__particle {
  opacity: 0.56;
}

html[data-theme='dark'] .login__card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 24%),
    color-mix(in srgb, var(--color-panel-solid) 88%, transparent);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.34);
}

.login__card-head {
  display: grid;
  gap: 6px;
}

.login__mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.login__mode-button {
  min-height: 42px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: transparent;
  color: var(--color-muted);
  font: inherit;
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
}

html[data-theme='dark'] .login__mode-button {
  background: rgba(255, 255, 255, 0.02);
}

.login__mode-button.is-active {
  border-color: color-mix(in srgb, var(--color-signal) 42%, var(--color-border));
  background: color-mix(in srgb, var(--color-signal) 14%, transparent);
  color: var(--color-ink);
}

html[data-theme='dark'] .login__mode-button.is-active {
  border-color: color-mix(in srgb, var(--color-signal) 26%, var(--color-border));
  background: color-mix(in srgb, var(--color-signal) 10%, transparent);
}

.login__card h2 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: -0.03em;
}

.login__field {
  display: grid;
  gap: 10px;
}

.login__field span {
  color: var(--color-muted);
  font-size: 0.92rem;
}

.login__submit {
  width: 100%;
}

.login__switch-copy {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.92rem;
}

.login__inline-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-signal);
  font: inherit;
  cursor: pointer;
}

html[data-theme='dark'] .login__inline-link {
  color: color-mix(in srgb, var(--color-signal) 86%, white 14%);
}

@media (max-width: 960px) {
  .login {
    grid-template-columns: 1fr;
    gap: 20px;
    min-height: auto;
  }

  .login__hero {
    min-height: auto;
    padding-top: 12px;
  }

  .login__hero h1 {
    max-width: none;
  }

  .login__card {
    max-width: 100%;
  }
}
</style>

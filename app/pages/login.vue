<script setup lang="ts">
import { ADMIN_HINT_COOKIE_NAME } from '#shared/constants/polargpt'
import type { LoginResponse } from '#shared/types/chat'
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

definePageMeta({
  middleware: ['guest-only']
})

const password = ref('')
const pending = ref(false)
const errorMessage = ref<string | null>(null)
const adminHintCookie = useCookie<string | null>(ADMIN_HINT_COOKIE_NAME)
const { locale, t, tEn } = useUiPreferences()
const scene = ref<HTMLElement | null>(null)
const particles = ref<Particle[]>([])
const pointerX = ref(0.52)
const pointerY = ref(0.38)
const pointerActive = ref(false)
const prefersReducedMotion = ref(false)

let animationFrameId = 0
let particleId = 0

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
    ...particles.value.slice(-18),
    {
      id: particleId++,
      x: localX + (Math.random() - 0.5) * 12,
      y: localY + (Math.random() - 0.5) * 12,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -0.4 - Math.random() * 0.5,
      size: 18 + Math.random() * 26,
      life: 1,
      decay: 0.03 + Math.random() * 0.02,
      hue: Math.random() > 0.5 ? 224 : 334
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
  pointerActive.value = true
  emitParticles(event.clientX, event.clientY)
}

function handlePointerLeave() {
  pointerActive.value = false
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

const sceneStyle = computed(() => ({
  '--pointer-x': `${pointerX.value * 100}%`,
  '--pointer-y': `${pointerY.value * 100}%`,
  '--pointer-shift-x': `${(pointerX.value - 0.5) * 44}px`,
  '--pointer-shift-y': `${(pointerY.value - 0.5) * 34}px`,
  '--pointer-shift-x-reverse': `${(0.5 - pointerX.value) * 28}px`,
  '--pointer-shift-y-reverse': `${(0.5 - pointerY.value) * 22}px`,
  '--pointer-opacity': pointerActive.value ? '1' : '0.74'
}))

const cardStyle = computed(() => {
  if (prefersReducedMotion.value) {
    return {
      transform: 'none'
    }
  }

  const rotateX = (0.5 - pointerY.value) * 7
  const rotateY = (pointerX.value - 0.5) * 9

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
    :style="sceneStyle"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <div class="login__backdrop" aria-hidden="true">
      <div class="login__halo login__halo--primary" />
      <div class="login__halo login__halo--secondary" />
      <div class="login__halo login__halo--ambient" />

      <span
        v-for="particle in particles"
        :key="particle.id"
        class="login__particle"
        :style="particleStyle(particle)"
      />
    </div>

    <div class="login__hero">
      <p class="surface-label">{{ t('loginModeLabel') }}</p>
      <span class="login__ghost-copy" aria-hidden="true">{{ tEn('loginTitle') }}</span>
      <h1>{{ tEn('loginTitle') }}</h1>
      <p>
        {{ t('loginDescription') }}
      </p>
    </div>

    <form class="login__card panel" :style="cardStyle" @submit.prevent="submit">
      <div class="login__card-head">
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

.login__halo {
  position: absolute;
  border-radius: 999px;
  filter: blur(26px);
  opacity: var(--pointer-opacity);
  transition: transform 180ms ease, opacity 180ms ease;
}

.login__halo--primary {
  top: 8%;
  left: calc(var(--pointer-x) - 11rem);
  width: 22rem;
  height: 22rem;
  background: radial-gradient(circle, rgba(133, 152, 255, 0.42), transparent 66%);
  transform: translate3d(var(--pointer-shift-x), var(--pointer-shift-y), 0);
}

.login__halo--secondary {
  right: 12%;
  bottom: 6%;
  width: 24rem;
  height: 24rem;
  background: radial-gradient(circle, rgba(255, 176, 209, 0.24), transparent 68%);
  transform: translate3d(var(--pointer-shift-x-reverse), var(--pointer-shift-y-reverse), 0);
}

.login__halo--ambient {
  top: calc(var(--pointer-y) - 4rem);
  left: calc(var(--pointer-x) - 4rem);
  width: 8rem;
  height: 8rem;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.48), transparent 72%);
  transform: translate3d(var(--pointer-shift-x), var(--pointer-shift-y), 0);
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
  gap: 16px;
  align-content: center;
  min-height: 34rem;
}

.login__ghost-copy {
  position: absolute;
  top: 2.6rem;
  left: 0;
  max-width: 8ch;
  font-size: clamp(4rem, 10vw, 7.2rem);
  line-height: 0.9;
  letter-spacing: -0.08em;
  color: rgba(137, 149, 188, 0.12);
  pointer-events: none;
}

html[data-theme='dark'] .login__ghost-copy {
  color: rgba(191, 202, 241, 0.08);
}

.login__hero h1 {
  position: relative;
  margin: 8px 0 0;
  max-width: 8ch;
  font-size: clamp(3.2rem, 8vw, 5.8rem);
  line-height: 0.88;
  letter-spacing: -0.06em;
}

.login__hero p:last-child {
  margin: 0;
  max-width: 40rem;
  color: var(--color-muted);
  line-height: 1.8;
  font-size: 1rem;
}

.login__card {
  display: grid;
  gap: 18px;
  padding: clamp(22px, 3vw, 32px);
  border-radius: 32px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.24), transparent 28%),
    var(--color-panel-strong);
  box-shadow: var(--shadow-floating);
  transform-style: preserve-3d;
  transform-origin: center;
  will-change: transform;
}

.login__card-head {
  display: grid;
  gap: 8px;
}

.login__card h2 {
  margin: 0;
  font-size: 1.65rem;
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

  .login__card {
    max-width: 100%;
  }
}
</style>

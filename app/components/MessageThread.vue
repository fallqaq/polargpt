<script setup lang="ts">
import type { AttachmentRecord, ChatMessage } from '#shared/types/chat'
import { formatBytes } from '#shared/utils/files'

interface DisplayAttachment extends AttachmentRecord {
  downloadUrl: string | null
  urlPending: boolean
}

interface DisplayMessage extends Omit<ChatMessage, 'attachments'> {
  attachments: DisplayAttachment[]
}

const props = defineProps<{
  messages: DisplayMessage[]
  pending: boolean
  loading: boolean
  hasOlderMessages: boolean
  loadingOlder: boolean
}>()

defineEmits<{
  loadOlder: []
  openAttachment: [attachmentId: string]
}>()

const { formatDateTime, t } = useUiPreferences()
const scroller = ref<HTMLElement | null>(null)

function resolveMessageContent(message: DisplayMessage) {
  if (message.role === 'assistant' && message.id.startsWith('temp-') && !message.content.trim()) {
    return t('threadGenerating')
  }

  return message.content || t('threadNoTextContent')
}

watch(() => props.messages.length, async (nextLength, previousLength = 0) => {
  if (nextLength <= previousLength) {
    return
  }

  await nextTick()

  if (scroller.value) {
    scroller.value.scrollTop = scroller.value.scrollHeight
  }
})
</script>

<template>
  <section ref="scroller" class="thread">
    <button
      v-if="props.hasOlderMessages"
      class="button button--ghost thread__older"
      type="button"
      :disabled="props.loadingOlder"
      @click="$emit('loadOlder')"
    >
      {{ props.loadingOlder ? t('threadLoadOlderBusy') : t('threadLoadOlder') }}
    </button>

    <div v-if="props.loading && props.messages.length === 0" class="thread__stage thread__stage--loading">
      <div class="thread__stage-shell">
        <h3>{{ t('threadLoadingConversation') }}</h3>

        <div class="thread__skeleton-list" aria-hidden="true">
          <span v-for="index in 3" :key="index" class="thread__skeleton" />
        </div>
      </div>
    </div>

    <div v-else-if="props.messages.length === 0" class="thread__stage thread__stage--empty">
      <div class="thread__stage-shell thread__stage-shell--empty">
        <span class="thread__stage-mark" aria-hidden="true" />
        <h3>{{ t('threadEmptyTitle') }}</h3>
        <p class="empty-copy">
          {{ t('threadEmptyDescription') }}
        </p>
      </div>
    </div>

    <article
      v-for="message in props.messages"
      :key="message.id"
      :class="['thread__message', `thread__message--${message.role}`]"
    >
      <div class="thread__avatar" aria-hidden="true">
        <span>{{ message.role === 'assistant' ? 'AI' : t('threadRoleUser').slice(0, 1) }}</span>
      </div>

      <div class="thread__bubble">
        <div class="thread__message-head">
          <span class="thread__role">{{ message.role === 'assistant' ? t('threadRoleAssistant') : t('threadRoleUser') }}</span>
          <span class="thread__timestamp">{{ formatDateTime(message.createdAt) }}</span>
        </div>

        <pre class="thread__content">{{ resolveMessageContent(message) }}</pre>

        <div v-if="message.attachments.length > 0" class="thread__attachments">
          <component
            :is="attachment.downloadUrl ? 'a' : 'button'"
            v-for="attachment in message.attachments"
            :key="attachment.id"
            :class="['thread__attachment', attachment.kind === 'image' && 'thread__attachment--image']"
            :href="attachment.downloadUrl ?? undefined"
            :target="attachment.downloadUrl ? '_blank' : undefined"
            :type="attachment.downloadUrl ? undefined : 'button'"
            rel="noreferrer"
            @click="attachment.downloadUrl ? undefined : $emit('openAttachment', attachment.id)"
          >
            <img
              v-if="attachment.kind === 'image' && attachment.downloadUrl"
              class="thread__preview"
              :src="attachment.downloadUrl"
              :alt="attachment.originalName"
              loading="lazy"
            >

            <div class="thread__attachment-meta">
              <strong>{{ attachment.originalName }}</strong>
              <span>{{ attachment.mimeType }} · {{ formatBytes(attachment.sizeBytes) }}</span>
              <span v-if="!attachment.downloadUrl">
                {{ attachment.urlPending ? t('threadResolveAttachment') : t('threadOpenAttachment') }}
              </span>
            </div>
          </component>
        </div>
      </div>
    </article>

    <div v-if="props.pending" class="thread__pending" role="status" aria-live="polite">
      <span class="thread__pending-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>{{ t('threadGenerating') }}</span>
    </div>
  </section>
</template>

<style scoped>
.thread {
  display: grid;
  gap: 18px;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  width: 100%;
  padding: 4px 2px 2px;
}

.thread__older {
  justify-self: center;
  min-height: 34px;
  padding-inline: 14px;
  font-size: 0.78rem;
}

.thread__stage {
  display: grid;
  place-items: center;
  min-height: 100%;
  padding: clamp(18px, 3.2vw, 38px) clamp(8px, 1vw, 14px);
}

.thread__stage-shell {
  display: grid;
  gap: 12px;
  width: min(100%, 44rem);
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.thread__stage-shell--empty {
  justify-items: start;
}

.thread__stage-mark {
  width: 32px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-signal) 100%);
  box-shadow: none;
}

.thread__stage h3 {
  margin: 0;
  font-size: clamp(1.48rem, 2.9vw, 2.4rem);
  line-height: 1.04;
  letter-spacing: -0.05em;
}

.thread__skeleton-list {
  display: grid;
  gap: 12px;
}

.thread__skeleton {
  height: 12px;
  border-radius: 999px;
  border: 0;
  background:
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent),
    color-mix(in srgb, var(--color-surface-soft) 88%, transparent);
  background-size: 200% 100%;
  animation: thread-shimmer 1.8s linear infinite;
}

.thread__skeleton:nth-child(1) {
  width: min(100%, 15rem);
}

.thread__skeleton:nth-child(2) {
  width: min(100%, 30rem);
}

.thread__skeleton:nth-child(3) {
  width: min(100%, 22rem);
}

.thread__message {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.thread__message--user {
  grid-template-columns: minmax(0, 1fr) auto;
}

.thread__message--user .thread__avatar {
  order: 2;
}

.thread__message--user .thread__bubble {
  justify-self: end;
}

.thread__avatar {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface-soft) 72%, transparent);
  color: var(--color-muted);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  box-shadow: none;
  backdrop-filter: blur(12px);
}

html[data-theme='dark'] .thread__avatar {
  background: color-mix(in srgb, var(--color-surface-strong) 72%, transparent);
  border-color: color-mix(in srgb, var(--color-border-strong) 74%, transparent);
}

.thread__message--assistant .thread__avatar {
  color: var(--color-signal);
}

.thread__message--user .thread__avatar {
  color: var(--color-ink);
}

.thread__bubble {
  display: grid;
  gap: 10px;
  width: min(100%, 64rem);
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.thread__message--user .thread__bubble {
  width: min(100%, 34rem);
  padding: 13px 15px;
  border: 1px solid color-mix(in srgb, var(--color-border) 96%, transparent);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 44%),
    color-mix(in srgb, var(--color-user) 90%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 6px 16px rgba(92, 112, 153, 0.06);
  backdrop-filter: blur(14px);
}

html[data-theme='dark'] .thread__message--user .thread__bubble {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 42%),
    color-mix(in srgb, var(--color-user) 94%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 12px 28px rgba(0, 0, 0, 0.18);
}

.thread__message-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.thread__role {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.thread__timestamp {
  color: var(--color-muted);
  font-size: 0.72rem;
  opacity: 0.9;
}

.thread__content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.78;
  font-family: var(--font-display);
  font-size: 0.97rem;
}

.thread__message--assistant .thread__content {
  font-size: 1rem;
}

.thread__attachments {
  display: grid;
  gap: 8px;
}

.thread__attachment {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  width: min(100%, 24rem);
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--color-surface-soft) 88%, transparent);
  text-align: left;
  color: inherit;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
  transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
}

html[data-theme='dark'] .thread__attachment {
  background: color-mix(in srgb, var(--color-surface-strong) 84%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 20px rgba(0, 0, 0, 0.12);
}

.thread__attachment:hover {
  transform: translateY(-1px);
  border-color: var(--color-border-strong);
  background: color-mix(in srgb, var(--color-surface-strong) 72%, transparent);
}

html[data-theme='dark'] .thread__attachment:hover {
  background: color-mix(in srgb, var(--color-surface-strong) 96%, transparent);
}

.thread__attachment--image {
  width: min(100%, 26rem);
}

.thread__preview {
  width: 46px;
  height: 46px;
  object-fit: cover;
  border-radius: 10px;
}

.thread__attachment-meta {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.thread__attachment-meta:only-child {
  grid-column: 1 / -1;
}

.thread__attachment-meta strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.84rem;
}

.thread__attachment-meta span {
  color: var(--color-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}

.thread__pending {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: var(--color-muted);
  border: 0;
}

.thread__pending-dots {
  display: inline-flex;
  gap: 4px;
}

.thread__pending-dots span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--color-signal);
  animation: thread-bounce 1.2s infinite ease-in-out;
}

.thread__pending-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.thread__pending-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes thread-shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@keyframes thread-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }

  40% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .thread__message,
  .thread__message--user {
    grid-template-columns: 1fr;
  }

  .thread__message--user .thread__avatar {
    order: 0;
  }

  .thread__avatar {
    display: none;
  }

  .thread__bubble,
  .thread__message--user .thread__bubble {
    width: 100%;
  }

  .thread__message--user .thread__bubble {
    padding: 12px 14px;
  }
}
</style>

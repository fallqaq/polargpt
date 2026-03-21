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

const { formatDateTime, t, tEn } = useUiPreferences()
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

    <div v-if="props.loading && props.messages.length === 0" class="thread__stage">
      <p class="surface-label">{{ t('threadReadyLabel') }}</p>
      <h3>{{ t('threadLoadingConversation') }}</h3>
    </div>

    <div v-else-if="props.messages.length === 0" class="thread__stage thread__stage--empty">
      <div class="thread__stage-ghost" aria-hidden="true">
        <span>{{ tEn('threadEmptyTitle') }}</span>
      </div>

      <div class="thread__stage-card">
        <p class="surface-label">{{ t('threadReadyLabel') }}</p>
        <h3>{{ tEn('threadEmptyTitle') }}</h3>
        <p class="empty-copy">
          {{ tEn('threadEmptyDescription') }}
        </p>
      </div>
    </div>

    <article
      v-for="message in props.messages"
      :key="message.id"
      :class="['thread__message', `thread__message--${message.role}`]"
    >
      <div class="thread__bubble">
        <div class="thread__message-head">
          <span class="surface-label">{{ message.role === 'assistant' ? t('threadRoleAssistant') : t('threadRoleUser') }}</span>
          <span class="thread__timestamp">{{ formatDateTime(message.createdAt) }}</span>
        </div>

        <pre class="thread__content">{{ resolveMessageContent(message) }}</pre>

        <div v-if="message.attachments.length > 0" class="thread__attachments">
          <component
            :is="attachment.downloadUrl ? 'a' : 'button'"
            v-for="attachment in message.attachments"
            :key="attachment.id"
            class="thread__attachment"
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

    <div v-if="props.pending" class="thread__pending">
      {{ t('threadGenerating') }}
    </div>
  </section>
</template>

<style scoped>
.thread {
  display: grid;
  gap: 18px;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  width: min(100%, 980px);
  margin: 0 auto;
  padding: 4px 8px 14px;
}

.thread__older {
  justify-self: center;
  min-height: 36px;
  padding-inline: 14px;
  font-size: 0.82rem;
}

.thread__stage {
  display: grid;
  gap: 14px;
  place-content: center;
  min-height: clamp(22rem, 44vh, 30rem);
  text-align: left;
}

.thread__stage h3 {
  margin: 0;
  font-size: clamp(1.45rem, 2.8vw, 2.4rem);
  line-height: 1.04;
  letter-spacing: -0.03em;
}

.thread__stage--empty {
  position: relative;
  place-content: center start;
}

.thread__stage-card {
  position: relative;
  z-index: 1;
  width: min(38rem, 100%);
  display: grid;
  gap: 14px;
}

.thread__stage-ghost {
  position: absolute;
  inset: 50% auto auto 0;
  transform: translateY(-50%);
  max-width: 18ch;
  font-size: clamp(3.6rem, 11vw, 7rem);
  line-height: 0.9;
  letter-spacing: -0.06em;
  color: rgba(136, 149, 190, 0.12);
  pointer-events: none;
}

html[data-theme='dark'] .thread__stage-ghost {
  color: rgba(169, 184, 235, 0.08);
}

.thread__message {
  display: flex;
}

.thread__message--assistant {
  justify-content: flex-start;
}

.thread__message--user {
  justify-content: flex-end;
}

.thread__bubble {
  display: grid;
  gap: 14px;
  width: min(100%, 52rem);
  padding: 18px 20px;
  border: 1px solid var(--color-border);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 26%),
    var(--color-assistant);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(20px);
}

.thread__message--user .thread__bubble {
  width: min(100%, 22rem);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent 28%),
    var(--color-user);
}

.thread__message-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.thread__timestamp {
  color: var(--color-muted);
  font-size: 0.74rem;
  font-family: var(--font-mono);
}

.thread__content {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.75;
  font-family: var(--font-display);
  font-size: 0.98rem;
}

.thread__attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.thread__attachment {
  display: grid;
  gap: 10px;
  width: min(18rem, 100%);
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface-strong);
  text-align: left;
  color: inherit;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.thread__preview {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 14px;
}

.thread__attachment-meta {
  display: grid;
  gap: 6px;
}

.thread__attachment-meta strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread__attachment-meta span {
  color: var(--color-muted);
  font-size: 0.8rem;
}

.thread__pending {
  justify-self: start;
  padding: 12px 16px;
  border-radius: 999px;
  background: var(--color-surface-soft);
  color: var(--color-muted);
  border: 1px solid var(--color-border);
}

@media (max-width: 900px) {
  .thread {
    width: 100%;
    padding-inline: 0;
  }

  .thread__stage-ghost {
    font-size: clamp(2.6rem, 14vw, 4.4rem);
  }

  .thread__bubble,
  .thread__message--user .thread__bubble {
    width: 100%;
  }
}
</style>

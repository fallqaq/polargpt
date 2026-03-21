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
  <section ref="scroller" class="thread panel">
    <button
      v-if="props.hasOlderMessages"
      class="button button--ghost thread__older"
      type="button"
      :disabled="props.loadingOlder"
      @click="$emit('loadOlder')"
    >
      {{ props.loadingOlder ? t('threadLoadOlderBusy') : t('threadLoadOlder') }}
    </button>

    <div v-if="props.loading && props.messages.length === 0" class="thread__empty">
      <p class="surface-label">{{ t('threadReadyLabel') }}</p>
      <h3>{{ t('threadLoadingConversation') }}</h3>
    </div>

    <div v-else-if="props.messages.length === 0" class="thread__empty">
      <p class="surface-label">{{ t('threadReadyLabel') }}</p>
      <h3>{{ t('threadEmptyTitle') }}</h3>
      <p class="empty-copy">
        {{ t('threadEmptyDescription') }}
      </p>
    </div>

    <article
      v-for="message in props.messages"
      :key="message.id"
      :class="['thread__message', `thread__message--${message.role}`]"
    >
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
  min-height: 28rem;
  max-height: 100%;
  overflow-y: auto;
  padding: 22px;
}

.thread__older {
  justify-self: center;
}

.thread__empty {
  display: grid;
  gap: 14px;
  place-content: center;
  min-height: 20rem;
}

.thread__empty h3 {
  margin: 0;
  font-size: clamp(1.4rem, 2.4vw, 2rem);
}

.thread__message {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 24px;
}

.thread__message--assistant {
  background: var(--color-assistant);
}

.thread__message--user {
  background: var(--color-user);
}

.thread__message-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.thread__timestamp {
  color: var(--color-muted);
  font-size: 0.82rem;
  font-family: var(--font-mono);
}

.thread__content {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.75;
  font-family: var(--font-display);
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
  border-radius: 18px;
  background: var(--color-surface-strong);
  text-align: left;
  color: inherit;
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
  font-size: 0.82rem;
}

.thread__pending {
  justify-self: start;
  padding: 12px 16px;
  border-radius: 999px;
  background: var(--color-surface-soft);
  color: var(--color-muted);
}
</style>

<script setup lang="ts">
import type { ChatMessage } from '#shared/types/chat'
import { formatBytes } from '#shared/utils/files'

const props = defineProps<{
  messages: ChatMessage[]
  pending: boolean
}>()

const { formatDateTime, t } = useUiPreferences()
const scroller = ref<HTMLElement | null>(null)

watch(() => props.messages.length, async () => {
  await nextTick()

  if (scroller.value) {
    scroller.value.scrollTop = scroller.value.scrollHeight
  }
})
</script>

<template>
  <section ref="scroller" class="thread panel">
    <div v-if="props.messages.length === 0" class="thread__empty">
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

      <pre class="thread__content">{{ message.content || t('threadNoTextContent') }}</pre>

      <div v-if="message.attachments.length > 0" class="thread__attachments">
        <a
          v-for="attachment in message.attachments"
          :key="attachment.id"
          class="thread__attachment"
          :href="attachment.downloadUrl ?? undefined"
          :target="attachment.downloadUrl ? '_blank' : undefined"
          rel="noreferrer"
        >
          <img
            v-if="attachment.kind === 'image' && attachment.downloadUrl"
            class="thread__preview"
            :src="attachment.downloadUrl"
            :alt="attachment.originalName"
          >
          <div class="thread__attachment-meta">
            <strong>{{ attachment.originalName }}</strong>
            <span>{{ attachment.mimeType }} · {{ formatBytes(attachment.sizeBytes) }}</span>
          </div>
        </a>
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

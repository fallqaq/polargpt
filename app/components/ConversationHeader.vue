<script setup lang="ts">
import type { ConversationSummary } from '#shared/types/chat'

const props = defineProps<{
  conversation: ConversationSummary | null
  pending: boolean
}>()

const emit = defineEmits<{
  rename: [title: string]
  delete: []
}>()

const { formatDateTime, t } = useUiPreferences()
const editing = ref(false)
const draftTitle = ref('')

const activityTimestamp = computed(() => {
  if (!props.conversation) {
    return null
  }

  return formatDateTime(props.conversation.lastMessageAt ?? props.conversation.updatedAt, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short'
  })
})

watch(() => props.conversation?.title, (value) => {
  draftTitle.value = value ?? ''
}, { immediate: true })

function startEditing() {
  if (!props.conversation) {
    return
  }

  draftTitle.value = props.conversation.title
  editing.value = true
}

function cancelEditing() {
  draftTitle.value = props.conversation?.title ?? ''
  editing.value = false
}

function submitRename() {
  const title = draftTitle.value.trim()

  if (!title || title === props.conversation?.title) {
    editing.value = false
    return
  }

  emit('rename', title)
  editing.value = false
}
</script>

<template>
  <header class="conversation-header">
    <div class="conversation-header__meta">
      <template v-if="props.conversation">
        <div v-if="editing" class="conversation-header__edit">
          <input
            v-model="draftTitle"
            class="text-input"
            type="text"
            maxlength="120"
            @keydown.enter.prevent="submitRename"
            @keydown.esc.prevent="cancelEditing"
          >
          <div class="conversation-header__edit-actions">
            <button class="button button--ghost" type="button" @click="cancelEditing">{{ t('headerCancel') }}</button>
            <button class="button" type="button" @click="submitRename">
              {{ t('headerSave') }}
            </button>
          </div>
        </div>

        <div v-else class="conversation-header__summary">
          <h2>{{ props.conversation.title }}</h2>
          <p>{{ props.conversation.summary || t('headerNoSummaryYet') }}</p>
        </div>
      </template>

      <div v-else class="conversation-header__summary">
        <h2>{{ t('headerFreshTitle') }}</h2>
        <p>{{ t('headerFreshDescription') }}</p>
      </div>

      <div v-if="props.pending || activityTimestamp" class="conversation-header__subline">
        <span v-if="props.pending" class="conversation-header__pending">{{ t('threadGenerating') }}</span>
        <p v-if="activityTimestamp" class="conversation-header__timestamp">
          {{ activityTimestamp }}
        </p>
      </div>
    </div>

    <div class="conversation-header__actions">
      <button
        v-if="props.conversation && !editing"
        class="conversation-header__action"
        type="button"
        :disabled="props.pending"
        @click="startEditing"
      >
        {{ t('headerRename') }}
      </button>
      <button
        v-if="props.conversation"
        class="conversation-header__action conversation-header__action--danger"
        type="button"
        :disabled="props.pending"
        @click="$emit('delete')"
      >
        {{ t('headerDelete') }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.conversation-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  width: 100%;
}

.conversation-header__meta {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.conversation-header__summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.conversation-header__summary h2 {
  margin: 0;
  max-width: 30ch;
  font-size: clamp(1.5rem, 2.3vw, 2.35rem);
  line-height: 0.96;
  letter-spacing: -0.055em;
}

.conversation-header__summary p {
  margin: 0;
  max-width: 72rem;
  color: var(--color-muted);
  line-height: 1.62;
  font-size: 0.9rem;
}

.conversation-header__subline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.conversation-header__pending {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-signal);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.conversation-header__pending::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0 6px color-mix(in srgb, currentColor 12%, transparent);
}

.conversation-header__timestamp {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.76rem;
  letter-spacing: 0.01em;
}

.conversation-header__actions,
.conversation-header__edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.conversation-header__action {
  min-height: 32px;
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: var(--color-muted);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: color 180ms ease, opacity 180ms ease;
}

.conversation-header__action:hover {
  color: var(--color-ink);
}

.conversation-header__action:focus-visible {
  border-radius: 10px;
  box-shadow: 0 0 0 4px rgba(75, 129, 230, 0.08);
}

.conversation-header__action:disabled {
  opacity: 0.44;
  cursor: not-allowed;
}

.conversation-header__action--danger:hover {
  color: var(--color-danger-text);
}

.conversation-header__edit {
  display: grid;
  gap: 10px;
  width: min(100%, 34rem);
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent 42%),
    color-mix(in srgb, var(--color-surface-soft) 88%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.conversation-header__edit-actions {
  justify-content: flex-start;
}

.conversation-header__edit-actions .button {
  min-height: 34px;
  padding-inline: 12px;
  font-size: 0.78rem;
}

.conversation-header__edit .text-input {
  min-height: 40px;
  box-shadow: none;
}

@media (max-width: 960px) {
  .conversation-header {
    grid-template-columns: 1fr;
  }

  .conversation-header__actions {
    justify-content: flex-start;
  }
}
</style>

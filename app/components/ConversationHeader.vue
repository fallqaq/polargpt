<script setup lang="ts">
import type { ConversationSummary } from '#shared/types/chat'

const props = defineProps<{
  conversation: ConversationSummary | null
  pending: boolean
}>()

const emit = defineEmits<{
  rename: [title: string]
  delete: []
  logout: []
}>()

const { t } = useUiPreferences()
const editing = ref(false)
const draftTitle = ref('')

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
      <p class="surface-label">{{ t('headerWorkspaceLabel') }}</p>

      <template v-if="props.conversation">
        <div v-if="editing" class="conversation-header__edit panel">
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
    </div>

    <div class="conversation-header__actions">
      <button
        v-if="props.conversation && !editing"
        class="button button--ghost conversation-header__action"
        type="button"
        :disabled="props.pending"
        @click="startEditing"
      >
        {{ t('headerRename') }}
      </button>
      <button
        v-if="props.conversation"
        class="button button--ghost conversation-header__action"
        type="button"
        :disabled="props.pending"
        @click="$emit('delete')"
      >
        {{ t('headerDelete') }}
      </button>
      <button class="button button--ghost conversation-header__action" type="button" @click="$emit('logout')">
        {{ t('headerLogout') }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.conversation-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: end;
  width: min(100%, 980px);
  margin: 0 auto;
}

.conversation-header__summary {
  display: grid;
  gap: 8px;
}

.conversation-header__summary h2 {
  margin: 0;
  font-size: clamp(1.2rem, 2vw, 1.55rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.conversation-header__summary p {
  margin: 0;
  max-width: 48rem;
  color: var(--color-muted);
  line-height: 1.6;
  font-size: 0.92rem;
}

.conversation-header__actions,
.conversation-header__edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.conversation-header__action {
  min-height: 36px;
  padding: 0 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.conversation-header__edit {
  display: grid;
  gap: 12px;
  padding: 12px;
  width: min(100%, 34rem);
  border-radius: 24px;
}

.conversation-header__edit .text-input {
  min-height: 44px;
}

@media (max-width: 960px) {
  .conversation-header {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .conversation-header__actions,
  .conversation-header__edit-actions {
    justify-content: flex-start;
  }
}
</style>

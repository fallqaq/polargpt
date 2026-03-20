<script setup lang="ts">
import type { ConversationDetail } from '#shared/types/chat'

const props = defineProps<{
  conversation: ConversationDetail | null
  pending: boolean
}>()

const emit = defineEmits<{
  rename: [title: string]
  delete: []
  logout: []
}>()

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

async function submitRename() {
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
      <p class="surface-label">Workspace</p>

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
          <button class="button button--ghost" type="button" @click="cancelEditing">
            Cancel
          </button>
          <button class="button" type="button" @click="submitRename">
            Save
          </button>
        </div>

        <div v-else class="conversation-header__summary">
          <h2>{{ props.conversation.title }}</h2>
          <p>{{ props.conversation.summary || 'This conversation has not produced a summary yet.' }}</p>
        </div>
      </template>

      <div v-else class="conversation-header__summary">
        <h2>Fresh workspace</h2>
        <p>Create a conversation and start asking questions, or drop in a PDF/image to begin with context.</p>
      </div>
    </div>

    <div class="conversation-header__actions">
      <button
        v-if="props.conversation && !editing"
        class="button button--ghost"
        type="button"
        :disabled="props.pending"
        @click="startEditing"
      >
        Rename
      </button>
      <button
        v-if="props.conversation"
        class="button button--danger"
        type="button"
        :disabled="props.pending"
        @click="$emit('delete')"
      >
        Delete
      </button>
      <button class="button button--ghost" type="button" @click="$emit('logout')">
        Logout
      </button>
    </div>
  </header>
</template>

<style scoped>
.conversation-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: flex-start;
}

.conversation-header__summary h2 {
  margin: 10px 0 10px;
  font-size: clamp(1.4rem, 2.4vw, 2rem);
}

.conversation-header__summary p {
  margin: 0;
  max-width: 46rem;
  color: var(--color-muted);
  line-height: 1.7;
}

.conversation-header__actions,
.conversation-header__edit {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.conversation-header__edit {
  align-items: center;
}

.conversation-header__edit .text-input {
  min-width: min(26rem, 60vw);
}

@media (max-width: 960px) {
  .conversation-header {
    grid-template-columns: 1fr;
  }
}
</style>

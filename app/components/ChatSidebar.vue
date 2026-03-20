<script setup lang="ts">
import type { ConversationSummary } from '#shared/types/chat'

const props = defineProps<{
  conversations: ConversationSummary[]
  activeConversationId: string | null
  loading: boolean
}>()

const searchQuery = defineModel<string>('searchQuery', { default: '' })

defineEmits<{
  select: [conversationId: string]
  create: []
  delete: [conversationId: string]
}>()

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'No messages yet'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))
}
</script>

<template>
  <aside class="sidebar panel">
    <div class="sidebar__head">
      <div>
        <p class="surface-label">History</p>
        <h1 class="sidebar__title">polarGPT</h1>
      </div>
      <button class="button" type="button" @click="$emit('create')">
        New Chat
      </button>
    </div>

    <label class="sidebar__search">
      <span class="sr-only">Search history</span>
      <input
        v-model="searchQuery"
        class="text-input"
        type="search"
        placeholder="Search titles and summaries"
      >
    </label>

    <div class="sidebar__body">
      <p v-if="loading" class="sidebar__state">
        Loading conversations...
      </p>

      <p v-else-if="props.conversations.length === 0" class="sidebar__state">
        No conversations yet. Start a new one from the button above.
      </p>

      <article
        v-for="conversation in props.conversations"
        :key="conversation.id"
        :class="[
          'sidebar__conversation',
          conversation.id === props.activeConversationId && 'sidebar__conversation--active'
        ]"
      >
        <button
          class="sidebar__conversation-main"
          type="button"
          @click="$emit('select', conversation.id)"
        >
          <div class="sidebar__conversation-header">
            <strong>{{ conversation.title }}</strong>
            <time>{{ formatTimestamp(conversation.lastMessageAt ?? conversation.updatedAt) }}</time>
          </div>
          <p>{{ conversation.summary || 'No summary yet.' }}</p>
        </button>

        <button
          class="sidebar__delete"
          type="button"
          aria-label="Delete conversation"
          @click="$emit('delete', conversation.id)"
        >
          Delete
        </button>
      </article>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  padding: 22px;
}

.sidebar__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.sidebar__title {
  margin: 10px 0 0;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  line-height: 0.95;
}

.sidebar__search {
  display: block;
}

.sidebar__body {
  display: grid;
  gap: 14px;
  overflow-y: auto;
  padding-right: 4px;
}

.sidebar__state {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.7;
}

.sidebar__conversation {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
}

.sidebar__conversation--active {
  border-color: rgba(249, 115, 22, 0.42);
  background: rgba(249, 115, 22, 0.12);
}

.sidebar__conversation-main,
.sidebar__delete {
  border: 0;
  background: transparent;
  color: inherit;
}

.sidebar__conversation-main {
  display: grid;
  gap: 10px;
  text-align: left;
}

.sidebar__conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sidebar__conversation-header strong {
  font-size: 0.98rem;
}

.sidebar__conversation-header time {
  color: var(--color-muted);
  font-size: 0.75rem;
  font-family: var(--font-mono);
}

.sidebar__conversation-main p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.55;
  font-size: 0.92rem;
}

.sidebar__delete {
  align-self: flex-start;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  color: #ffb8c6;
}

@media (max-width: 1080px) {
  .sidebar {
    padding: 18px;
  }
}
</style>

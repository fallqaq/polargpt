<script setup lang="ts">
import type { ConversationSummary } from '#shared/types/chat'

interface ConversationGroup {
  key: string
  label: string
  conversations: ConversationSummary[]
}

const props = defineProps<{
  conversations: ConversationSummary[]
  activeConversationId: string | null
  loading: boolean
}>()

const { formatDateTime, t } = useUiPreferences()
const searchQuery = defineModel<string>('searchQuery', { default: '' })

defineEmits<{
  select: [conversationId: string]
  create: []
  delete: [conversationId: string]
}>()

function formatTimestamp(value: string | null) {
  if (!value) {
    return t('sidebarNoMessagesYet')
  }

  return formatDateTime(value, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short'
  })
}

function resolveGroupKey(value: string) {
  const date = new Date(value)
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000)

  if (diffDays <= 0) {
    return {
      key: 'today',
      label: t('sidebarGroupToday')
    }
  }

  if (diffDays < 30) {
    return {
      key: 'last-30-days',
      label: t('sidebarGroupLast30Days')
    }
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return {
    key: `${year}-${month}`,
    label: `${year}-${month}`
  }
}

const groupedConversations = computed<ConversationGroup[]>(() => {
  const groups = new Map<string, ConversationGroup>()

  for (const conversation of props.conversations) {
    const reference = conversation.lastMessageAt ?? conversation.updatedAt
    const group = resolveGroupKey(reference)
    const existingGroup = groups.get(group.key)

    if (existingGroup) {
      existingGroup.conversations.push(conversation)
      continue
    }

    groups.set(group.key, {
      key: group.key,
      label: group.label,
      conversations: [conversation]
    })
  }

  return Array.from(groups.values())
})
</script>

<template>
  <aside class="sidebar panel">
    <div class="sidebar__head">
      <div class="sidebar__brand">
        <span class="sidebar__brand-mark" aria-hidden="true" />
        <div>
          <p class="surface-label">{{ t('sidebarHistoryLabel') }}</p>
          <h1 class="sidebar__title">polarGPT</h1>
        </div>
      </div>

      <button class="button sidebar__new" type="button" @click="$emit('create')">
        <span class="sidebar__plus" aria-hidden="true">+</span>
        <span>{{ t('sidebarNewChat') }}</span>
      </button>
    </div>

    <label class="sidebar__search">
      <span class="sr-only">{{ t('sidebarSearchAria') }}</span>
      <input
        v-model="searchQuery"
        class="text-input"
        type="search"
        :placeholder="t('sidebarSearchPlaceholder')"
      >
    </label>

    <div class="sidebar__body">
      <p v-if="loading && props.conversations.length === 0" class="sidebar__state">
        {{ t('sidebarLoading') }}
      </p>

      <p v-else-if="props.conversations.length === 0" class="sidebar__state">
        {{ t('sidebarEmpty') }}
      </p>

      <template v-else>
        <p v-if="loading" class="sidebar__state">
          {{ t('sidebarLoading') }}
        </p>

        <section
          v-for="group in groupedConversations"
          :key="group.key"
          class="sidebar__group"
        >
          <p class="sidebar__group-label">
            {{ group.label }}
          </p>

          <article
            v-for="conversation in group.conversations"
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
              <p>{{ conversation.summary || t('sidebarNoSummaryYet') }}</p>
            </button>

            <button
              class="sidebar__delete"
              type="button"
              :aria-label="t('sidebarDeleteConversationAria')"
              @click="$emit('delete', conversation.id)"
            >
              {{ t('sidebarDelete') }}
            </button>
          </article>
        </section>
      </template>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  padding: 18px;
  border-radius: 32px;
}

.sidebar__head {
  display: grid;
  gap: 14px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar__brand-mark {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.92), transparent 26%),
    linear-gradient(135deg, #7f95ff 0%, #4a67ff 100%);
  box-shadow: 0 10px 22px rgba(84, 105, 205, 0.22);
}

.sidebar__title {
  margin: 6px 0 0;
  font-size: 1.35rem;
  line-height: 1;
}

.sidebar__new {
  width: 100%;
  justify-content: center;
  min-height: 48px;
  color: var(--color-ink);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.76), transparent 64%),
    rgba(255, 255, 255, 0.54);
}

.sidebar__plus {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--color-signal-soft);
  color: var(--color-signal);
  font-size: 1rem;
  line-height: 1;
}

.sidebar__search {
  display: block;
}

.sidebar__search .text-input {
  min-height: 42px;
  font-size: 0.9rem;
}

.sidebar__body {
  display: grid;
  gap: 18px;
  overflow-y: auto;
  padding-right: 4px;
}

.sidebar__group {
  display: grid;
  gap: 8px;
}

.sidebar__group-label {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.sidebar__state {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.7;
}

.sidebar__conversation {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 20px;
  background: transparent;
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.sidebar__conversation:hover {
  background: rgba(255, 255, 255, 0.28);
}

.sidebar__conversation--active {
  border-color: rgba(140, 158, 214, 0.18);
  background: rgba(212, 224, 255, 0.56);
  box-shadow: 0 12px 24px rgba(132, 146, 187, 0.12);
}

html[data-theme='dark'] .sidebar__conversation--active {
  background: rgba(53, 71, 118, 0.46);
}

.sidebar__conversation-main,
.sidebar__delete {
  border: 0;
  background: transparent;
  color: inherit;
}

.sidebar__conversation-main {
  display: grid;
  gap: 8px;
  text-align: left;
  min-width: 0;
  padding: 8px 10px;
}

.sidebar__conversation-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sidebar__conversation-header strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.94rem;
}

.sidebar__conversation-header time {
  color: var(--color-muted);
  font-size: 0.7rem;
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.sidebar__conversation-main p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-muted);
  line-height: 1.45;
  font-size: 0.82rem;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.sidebar__delete {
  min-height: 34px;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--color-danger-soft);
  font-size: 0.76rem;
}

@media (max-width: 1080px) {
  .sidebar {
    border-radius: 28px;
  }
}
</style>

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
        <div class="sidebar__brand-copy">
          <h1 class="sidebar__title">PolarGPT</h1>
          <p class="sidebar__subtitle">{{ t('sidebarHistoryLabel') }}</p>
        </div>
      </div>

      <button class="button button--ghost sidebar__new" type="button" @click="$emit('create')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>{{ t('sidebarNewChat') }}</span>
      </button>

      <label class="sidebar__search">
        <span class="sidebar__search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15a7.5 7.5 0 0 1 0 15Z" />
          </svg>
        </span>
        <span class="sr-only">{{ t('sidebarSearchAria') }}</span>
        <input
          v-model="searchQuery"
          class="text-input"
          type="search"
          :placeholder="t('sidebarSearchPlaceholder')"
        >
      </label>
    </div>

    <div class="sidebar__body">
      <div v-if="loading && props.conversations.length === 0" class="sidebar__skeletons" aria-hidden="true">
        <span v-for="index in 3" :key="index" class="sidebar__skeleton" />
      </div>

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
              <span class="sidebar__conversation-beam" aria-hidden="true" />

              <div class="sidebar__conversation-copy">
                <div class="sidebar__conversation-header">
                  <strong>{{ conversation.title }}</strong>
                  <time>{{ formatTimestamp(conversation.lastMessageAt ?? conversation.updatedAt) }}</time>
                </div>
                <p>{{ conversation.summary || t('sidebarNoSummaryYet') }}</p>
              </div>
            </button>

            <button
              class="sidebar__delete"
              type="button"
              :aria-label="t('sidebarDeleteConversationAria')"
              @click="$emit('delete', conversation.id)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 9l6 6M15 9l-6 6" />
              </svg>
              <span class="sr-only">{{ t('sidebarDelete') }}</span>
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
  gap: 12px;
  min-height: 0;
  padding: 14px;
  position: sticky;
  top: 4.4rem;
}

.sidebar__head {
  display: grid;
  gap: 10px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 2px 2px 0;
}

.sidebar__brand-copy {
  min-width: 0;
}

.sidebar__brand-mark {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.86), transparent 28%),
    linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 90%, white 10%) 0%, var(--color-signal) 72%, color-mix(in srgb, var(--color-signal-strong) 88%, white 12%) 100%);
  box-shadow: 0 0 0 4px rgba(75, 129, 230, 0.05);
}

html[data-theme='dark'] .sidebar__brand-mark {
  box-shadow: 0 0 0 4px rgba(140, 167, 232, 0.03);
}

.sidebar__title {
  margin: 0;
  font-size: 1.22rem;
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.sidebar__subtitle {
  margin: 3px 0 0;
  color: var(--color-muted);
  font-size: 0.76rem;
  letter-spacing: 0.02em;
}

.sidebar__new {
  width: 100%;
  justify-content: center;
  min-height: 38px;
  box-shadow: none;
}

.sidebar__new:hover,
.sidebar__new:focus-visible {
  box-shadow: none;
}

.sidebar__new svg,
.sidebar__search-icon svg,
.sidebar__delete svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.sidebar__search {
  position: relative;
  display: block;
}

.sidebar__search .text-input {
  min-height: 40px;
  padding-left: 40px;
  font-size: 0.84rem;
  box-shadow: none;
}

.sidebar__search-icon {
  position: absolute;
  top: 50%;
  left: 15px;
  z-index: 1;
  color: var(--color-muted);
  transform: translateY(-50%);
}

.sidebar__body {
  display: grid;
  gap: 14px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.sidebar__skeletons {
  display: grid;
  gap: 8px;
}

.sidebar__skeleton {
  height: 46px;
  border-radius: 14px;
  border: 0;
  background:
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.14), transparent),
    color-mix(in srgb, var(--color-surface-soft) 76%, transparent);
  background-size: 200% 100%;
  animation: sidebar-shimmer 1.8s linear infinite;
}

.sidebar__group {
  display: grid;
  gap: 4px;
}

.sidebar__group-label {
  margin: 0;
  padding-inline: 4px;
  color: var(--color-muted);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar__state {
  margin: 0;
  padding: 8px 4px;
  color: var(--color-muted);
  line-height: 1.6;
  font-size: 0.9rem;
}

.sidebar__conversation {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px;
  align-items: center;
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: transparent;
  transition:
    background 180ms ease,
    transform 180ms ease;
}

.sidebar__conversation:hover {
  background: color-mix(in srgb, var(--color-surface-soft) 72%, transparent);
}

html[data-theme='dark'] .sidebar__conversation:hover {
  background: color-mix(in srgb, var(--color-surface-strong) 60%, transparent);
}

.sidebar__conversation--active {
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--color-signal-soft) 58%, transparent), transparent 64%),
    color-mix(in srgb, var(--color-surface-soft) 82%, transparent);
}

html[data-theme='dark'] .sidebar__conversation--active {
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--color-signal-soft) 38%, transparent), transparent 66%),
    color-mix(in srgb, var(--color-surface-strong) 82%, transparent);
}

.sidebar__conversation-main,
.sidebar__delete {
  border: 0;
  background: transparent;
  color: inherit;
}

.sidebar__conversation-main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  min-width: 0;
  padding: 10px 8px 10px 10px;
  text-align: left;
}

.sidebar__conversation-beam {
  width: 1.5px;
  min-height: 44px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--color-accent) 0%, var(--color-signal) 100%);
  opacity: 0;
  transition: opacity 180ms ease, transform 180ms ease;
  transform: scaleY(0.72);
}

.sidebar__conversation--active .sidebar__conversation-beam {
  opacity: 0.72;
  transform: scaleY(1);
}

.sidebar__conversation-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.sidebar__conversation-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.sidebar__conversation-header strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.88rem;
  letter-spacing: -0.01em;
}

.sidebar__conversation-header time {
  color: var(--color-muted);
  font-size: 0.72rem;
  flex-shrink: 0;
}

.sidebar__conversation-main p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-muted);
  line-height: 1.5;
  font-size: 0.77rem;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.sidebar__delete {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-right: 6px;
  border-radius: 9px;
  color: var(--color-danger-text);
  background: transparent;
  border: 1px solid transparent;
  opacity: 0;
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
}

.sidebar__conversation:hover .sidebar__delete,
.sidebar__conversation--active .sidebar__delete,
.sidebar__conversation:focus-within .sidebar__delete,
.sidebar__delete:focus-visible {
  opacity: 1;
}

.sidebar__delete:hover {
  transform: translateY(-1px);
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

@keyframes sidebar-shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@media (max-width: 1080px) {
  .sidebar {
    position: relative;
    top: 0;
  }
}

@media (max-width: 760px) {
  .sidebar {
    padding: 13px;
  }

  .sidebar__delete {
    opacity: 1;
  }

  .sidebar__conversation-main {
    padding-inline: 8px;
  }
}
</style>

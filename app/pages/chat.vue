<script setup lang="ts">
definePageMeta({
  middleware: ['require-admin']
})

const route = useRoute()
const chat = usePolarGptChat()
const draftText = ref('')
const draftFiles = ref<File[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

await callOnce('polargpt-chat-initial-data', () => chat.initialize())

watch(chat.searchQuery, (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(async () => {
    await chat.refreshConversations(value)
    await navigateTo({
      query: {
        ...route.query,
        q: value || undefined
      }
    }, { replace: true })
  }, 220)
})

watch(() => route.query.conversation, async (value) => {
  if (typeof value !== 'string') {
    return
  }

  if (value !== chat.currentConversationId.value) {
    await chat.openConversation(value, { updateRoute: false })
  }
})

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
})

async function handleSubmit() {
  if (!draftText.value.trim() && draftFiles.value.length === 0) {
    return
  }

  try {
    await chat.sendMessage({
      text: draftText.value,
      files: draftFiles.value
    })
    draftText.value = ''
    draftFiles.value = []
  }
  catch {
    // The composable already exposes the user-facing error message.
  }
}

async function handleDelete(conversationId?: string | null) {
  if (!conversationId || !import.meta.client) {
    return
  }

  if (!window.confirm('Delete this conversation permanently?')) {
    return
  }

  await chat.deleteConversation(conversationId)
}

async function handleRename(title: string) {
  if (!chat.currentConversationId.value) {
    return
  }

  await chat.renameConversation(chat.currentConversationId.value, title)
}
</script>

<template>
  <section class="workspace">
    <ChatSidebar
      v-model:search-query="chat.searchQuery.value"
      :conversations="chat.conversations.value"
      :active-conversation-id="chat.currentConversationId.value"
      :loading="chat.listPending.value"
      @create="chat.createConversation()"
      @select="chat.openConversation"
      @delete="handleDelete"
    />

    <section class="workspace__main">
      <ConversationHeader
        :conversation="chat.activeConversation.value"
        :pending="chat.conversationPending.value || chat.sendPending.value"
        @rename="handleRename"
        @delete="handleDelete(chat.currentConversationId.value)"
        @logout="chat.logout"
      />

      <p v-if="chat.errorMessage.value" class="status-banner">
        {{ chat.errorMessage.value }}
      </p>

      <MessageThread
        :messages="chat.activeConversation.value?.messages ?? []"
        :pending="chat.sendPending.value"
      />

      <ChatComposer
        v-model:text="draftText"
        v-model:files="draftFiles"
        :busy="chat.sendPending.value"
        @submit="handleSubmit"
      />
    </section>
  </section>
</template>

<style scoped>
.workspace {
  display: grid;
  grid-template-columns: minmax(18rem, 24rem) minmax(0, 1fr);
  gap: 20px;
  min-height: calc(100vh - 48px);
}

.workspace__main {
  display: grid;
  grid-template-rows: auto auto minmax(18rem, 1fr) auto;
  gap: 18px;
  min-width: 0;
}

@media (max-width: 1080px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .workspace__main {
    grid-template-rows: auto auto minmax(24rem, 1fr) auto;
  }
}
</style>

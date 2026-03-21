<script setup lang="ts">
definePageMeta({
  middleware: ['require-admin']
})

const route = useRoute()
const router = useRouter()
const chat = usePolarGptChat()
const { t } = useUiPreferences()
const draftText = ref('')
const draftFiles = ref<File[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (typeof performance !== 'undefined') {
    performance.mark('polargpt-route-enter')
  }

  void chat.initialize()
})

watch(chat.searchQuery, (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(async () => {
    await chat.refreshConversations(value)
    await router.replace({
      query: {
        ...route.query,
        q: value || undefined
      }
    })
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

  if (!window.confirm(t('chatConfirmDelete'))) {
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

async function handleOpenAttachment(attachmentId: string) {
  const pendingWindow = import.meta.client
    ? window.open('', '_blank', 'noopener,noreferrer')
    : null
  const url = await chat.openAttachment(attachmentId)

  if (url && pendingWindow) {
    pendingWindow.location.href = url
    return
  }

  if (pendingWindow && !url) {
    pendingWindow.close()
  }
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
      <div class="workspace__stage">
        <ConversationHeader
          :conversation="chat.activeConversation.value"
          :pending="chat.conversationPending.value || chat.sendPending.value"
          @rename="handleRename"
          @delete="handleDelete(chat.currentConversationId.value)"
          @logout="chat.logout"
        />

        <p v-if="chat.errorMessage.value" class="status-banner workspace__status">
          {{ chat.errorMessage.value }}
        </p>

        <MessageThread
          :messages="chat.activeMessages.value"
          :pending="chat.sendPending.value"
          :loading="chat.conversationPending.value"
          :has-older-messages="chat.hasOlderMessages.value"
          :loading-older="chat.loadingOlderMessages.value"
          @load-older="chat.loadOlderMessages"
          @open-attachment="handleOpenAttachment"
        />
      </div>

      <div class="workspace__dock">
        <ChatComposer
          v-model:text="draftText"
          v-model:files="draftFiles"
          :busy="chat.sendPending.value"
          @submit="handleSubmit"
        />
      </div>
    </section>
  </section>
</template>

<style scoped>
.workspace {
  display: grid;
  grid-template-columns: minmax(16.5rem, 20rem) minmax(0, 1fr);
  gap: clamp(16px, 2vw, 28px);
  min-height: 100%;
}

.workspace__main {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 16px;
  min-width: 0;
  min-height: 0;
}

.workspace__stage {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
}

.workspace__status {
  width: min(100%, 980px);
  margin: 0 auto;
}

.workspace__dock {
  position: relative;
  padding-bottom: 4px;
}

@media (max-width: 1080px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .workspace__main {
    grid-template-rows: minmax(0, 1fr) auto;
  }
}
</style>

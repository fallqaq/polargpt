<script setup lang="ts">
definePageMeta({
  middleware: ['require-auth']
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
      <div class="workspace__header-shell">
        <ConversationHeader
          :conversation="chat.activeConversation.value"
          :pending="chat.conversationPending.value || chat.sendPending.value"
          @rename="handleRename"
          @delete="handleDelete(chat.currentConversationId.value)"
        />
      </div>

      <div class="workspace__stage">
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
  grid-template-columns: minmax(14.75rem, 16.75rem) minmax(0, 1fr);
  gap: clamp(10px, 1.4vw, 16px);
  width: calc(100% + clamp(10px, 1.5vw, 18px));
  margin-left: calc(clamp(10px, 1.5vw, 18px) * -1);
  min-height: min(100%, calc(100dvh - 5.4rem));
}

.workspace__main {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 0;
  min-width: 0;
  min-height: 0;
  padding: clamp(10px, 1.1vw, 14px) clamp(6px, 0.8vw, 10px) 0;
}

.workspace__header-shell {
  padding: 2px 0 16px;
}

.workspace__stage {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
  padding: 0;
}

.workspace__status {
  margin: 0;
  box-shadow: none;
}

.workspace__dock {
  position: sticky;
  bottom: 0;
  display: block;
  padding: 18px 0 clamp(6px, 1vw, 10px);
  background:
    linear-gradient(180deg, transparent 0%, rgba(var(--color-shell-rgb), 0.18) 28%, rgba(var(--color-shell-rgb), 0.44) 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.workspace__dock :deep(.composer) {
  width: 100%;
}

@media (max-width: 1080px) {
  .workspace {
    grid-template-columns: 1fr;
    width: 100%;
    margin-left: 0;
    min-height: auto;
  }

  .workspace__main {
    grid-template-rows: auto minmax(22rem, 1fr) auto;
  }
}

@media (max-width: 760px) {
  .workspace__main {
    padding: 6px 0 0;
  }

  .workspace__header-shell {
    padding-bottom: 12px;
  }

  .workspace__stage {
    padding: 0;
  }

  .workspace__dock {
    padding: 14px 0 4px;
  }

  .workspace__dock :deep(.composer) {
    width: 100%;
  }
}
</style>

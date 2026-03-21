import type {
  AttachmentRecord,
  AttachmentUrlResponse,
  ChatMessage,
  ConversationDetailPageResponse,
  ConversationMessagesPage,
  ConversationMessagesPageResponse,
  ConversationListResponse,
  ConversationSummary,
  ConversationSummaryResponse,
  SendMessageDeltaResponse
} from '#shared/types/chat'
import { DEFAULT_MESSAGES_PAGE_LIMIT, ADMIN_HINT_COOKIE_NAME } from '#shared/constants/polargpt'
import { FetchError } from 'ofetch'
import { getRequestErrorMessage } from '../utils/request-errors'

interface StoredConversationMessages {
  messageIds: string[]
  messagesById: Record<string, ChatMessage>
  nextCursor: string | null
  limit: number
  ready: boolean
}

interface ResolvedAttachmentRecord extends AttachmentRecord {
  downloadUrl: string | null
  urlPending: boolean
}

interface DisplayChatMessage extends Omit<ChatMessage, 'attachments'> {
  attachments: ResolvedAttachmentRecord[]
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

function createEmptyMessageState(): StoredConversationMessages {
  return {
    messageIds: [],
    messagesById: {},
    nextCursor: null,
    limit: DEFAULT_MESSAGES_PAGE_LIMIT,
    ready: false
  }
}

function markPerformance(name: string) {
  if (!import.meta.client || typeof performance === 'undefined') {
    return
  }

  performance.mark(name)
}

export function usePolarGptChat() {
  const route = useRoute()
  const router = useRouter()
  const { locale } = useUiPreferences()
  const adminHintCookie = useCookie<string | null>(ADMIN_HINT_COOKIE_NAME)
  const conversationsById = useState<Record<string, ConversationSummary>>('polargpt-conversations-by-id', () => ({}))
  const conversationOrder = useState<string[]>('polargpt-conversation-order', () => [])
  const messagesByConversationId = useState<Record<string, StoredConversationMessages>>('polargpt-messages-by-conversation-id', () => ({}))
  const currentConversationId = useState<string | null>('polargpt-current-conversation-id', () => null)
  const searchQuery = useState('polargpt-search-query', () =>
    typeof route.query.q === 'string' ? route.query.q : '')
  const listPending = useState('polargpt-list-pending', () => false)
  const conversationPending = useState('polargpt-conversation-pending', () => false)
  const loadingOlderMessages = useState('polargpt-loading-older-messages', () => false)
  const sendPending = useState('polargpt-send-pending', () => false)
  const initialized = useState('polargpt-initialized', () => false)
  const errorMessage = useState<string | null>('polargpt-error-message', () => null)
  const attachmentUrls = useState<Record<string, string | null>>('polargpt-attachment-urls', () => ({}))
  const attachmentUrlPending = useState<Record<string, boolean>>('polargpt-attachment-url-pending', () => ({}))

  let listAbortController: AbortController | null = null
  let conversationAbortController: AbortController | null = null
  let listRequestVersion = 0
  let conversationRequestVersion = 0

  async function request<T>(url: string, options?: Parameters<typeof $fetch<T>>[1]) {
    try {
      return await $fetch<T>(url, options)
    }
    catch (error) {
      if (error instanceof FetchError && error.status === 401) {
        adminHintCookie.value = null
        await navigateTo('/login')
      }

      throw error
    }
  }

  function getMessageState(conversationId: string) {
    return messagesByConversationId.value[conversationId]
      ?? (messagesByConversationId.value[conversationId] = createEmptyMessageState())
  }

  function clearError() {
    errorMessage.value = null
  }

  function matchesCurrentSearch(conversation: ConversationSummary) {
    const query = searchQuery.value.trim().toLowerCase()

    if (!query) {
      return true
    }

    return conversation.title.toLowerCase().includes(query)
      || conversation.summary.toLowerCase().includes(query)
  }

  function upsertConversationSummary(conversation: ConversationSummary) {
    conversationsById.value[conversation.id] = conversation

    const shouldBeVisible = matchesCurrentSearch(conversation) || currentConversationId.value === conversation.id

    if (!shouldBeVisible) {
      conversationOrder.value = conversationOrder.value.filter((id) => id !== conversation.id)
      return
    }

    if (!conversationOrder.value.includes(conversation.id)) {
      conversationOrder.value.unshift(conversation.id)
    }

    conversationOrder.value.sort((leftId, rightId) => {
      const left = conversationsById.value[leftId]
      const right = conversationsById.value[rightId]

      if (!left || !right) {
        return 0
      }

      const leftValue = left.lastMessageAt ?? left.updatedAt
      const rightValue = right.lastMessageAt ?? right.updatedAt
      return rightValue.localeCompare(leftValue)
    })
  }

  function applyConversationList(conversations: ConversationSummary[]) {
    for (const conversation of conversations) {
      conversationsById.value[conversation.id] = conversation
    }

    conversationOrder.value = conversations.map((conversation) => conversation.id)
  }

  function removeConversationState(conversationId: string) {
    delete conversationsById.value[conversationId]
    delete messagesByConversationId.value[conversationId]
    conversationOrder.value = conversationOrder.value.filter((id) => id !== conversationId)
  }

  function removeMessages(conversationId: string, messageIds: string[]) {
    const state = getMessageState(conversationId)

    for (const messageId of messageIds) {
      delete state.messagesById[messageId]
    }

    state.messageIds = state.messageIds.filter((messageId) => !messageIds.includes(messageId))
  }

  function applyMessagesPage(conversationId: string, page: ConversationMessagesPage, mode: 'replace' | 'prepend') {
    const state = getMessageState(conversationId)
    const nextMessagesById = mode === 'replace' ? {} as Record<string, ChatMessage> : { ...state.messagesById }

    for (const message of page.messages) {
      nextMessagesById[message.id] = message
    }

    const pageIds = page.messages.map((message) => message.id)
    const combinedIds = mode === 'prepend'
      ? [...pageIds, ...state.messageIds]
      : pageIds

    state.messagesById = nextMessagesById
    state.messageIds = [...new Set(combinedIds)]
    state.nextCursor = page.nextCursor
    state.limit = page.limit
    state.ready = true
  }

  function appendMessages(conversationId: string, messages: ChatMessage[]) {
    const state = getMessageState(conversationId)
    const nextIds = [...state.messageIds]

    for (const message of messages) {
      state.messagesById[message.id] = message

      if (!nextIds.includes(message.id)) {
        nextIds.push(message.id)
      }
    }

    state.messageIds = nextIds
    state.ready = true
  }

  function createOptimisticMessage(input: {
    conversationId: string
    role: ChatMessage['role']
    content: string
    attachments: AttachmentRecord[]
    status?: ChatMessage['status']
  }) {
    return {
      id: `temp-${Math.random().toString(36).slice(2, 10)}`,
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      model: null,
      status: input.status ?? 'completed',
      createdAt: new Date().toISOString(),
      attachments: input.attachments
    } satisfies ChatMessage
  }

  async function resolveAttachmentUrlsForIds(attachmentIds: string[]) {
    const pendingAttachmentIds = [...new Set(attachmentIds.filter((attachmentId) =>
      !attachmentUrlPending.value[attachmentId] && !(attachmentId in attachmentUrls.value)))]

    if (pendingAttachmentIds.length === 0) {
      return
    }

    for (const attachmentId of pendingAttachmentIds) {
      attachmentUrlPending.value[attachmentId] = true
    }

    try {
      const response = await request<AttachmentUrlResponse>('/api/admin/attachments/urls', {
        method: 'POST',
        body: {
          attachmentIds: pendingAttachmentIds
        }
      })

      for (const attachment of response.attachments) {
        attachmentUrls.value[attachment.attachmentId] = attachment.downloadUrl
      }
    }
    finally {
      for (const attachmentId of pendingAttachmentIds) {
        attachmentUrlPending.value[attachmentId] = false
      }
    }
  }

  async function resolveImageAttachmentUrls(messages: ChatMessage[]) {
    const imageAttachmentIds = messages.flatMap((message) =>
      message.attachments
        .filter((attachment) => attachment.kind === 'image')
        .map((attachment) => attachment.id))

    if (imageAttachmentIds.length === 0) {
      return
    }

    await resolveAttachmentUrlsForIds(imageAttachmentIds)
  }

  async function refreshConversations(query = searchQuery.value) {
    listPending.value = true
    clearError()
    const requestVersion = ++listRequestVersion

    if (import.meta.client) {
      listAbortController?.abort()
      listAbortController = new AbortController()
    }

    try {
      const response = await request<ConversationListResponse>('/api/admin/conversations', {
        query: {
          q: query || undefined
        },
        signal: listAbortController?.signal
      })

      if (requestVersion !== listRequestVersion) {
        return
      }

      applyConversationList(response.conversations)
      markPerformance('polargpt-sidebar-loaded')
    }
    catch (error) {
      if (isAbortError(error)) {
        return
      }

      errorMessage.value = getRequestErrorMessage(error, {
        locale: locale.value,
        fallbackKey: 'errorLoadConversationHistory'
      })
    }
    finally {
      if (requestVersion === listRequestVersion) {
        listPending.value = false
      }
    }
  }

  async function openConversation(conversationId: string, options: { updateRoute?: boolean, force?: boolean } = {}) {
    currentConversationId.value = conversationId

    if (options.updateRoute !== false) {
      await router.replace({
        query: {
          ...route.query,
          conversation: conversationId
        }
      })
    }

    const state = getMessageState(conversationId)

    if (state.ready && !options.force) {
      return
    }

    conversationPending.value = true
    clearError()
    const requestVersion = ++conversationRequestVersion

    if (import.meta.client) {
      conversationAbortController?.abort()
      conversationAbortController = new AbortController()
    }

    try {
      const response = await request<ConversationDetailPageResponse>(`/api/admin/conversations/${conversationId}`, {
        signal: conversationAbortController?.signal
      })

      if (requestVersion !== conversationRequestVersion || currentConversationId.value !== conversationId) {
        return
      }

      upsertConversationSummary(response.conversation)
      applyMessagesPage(conversationId, response.page, 'replace')
      markPerformance('polargpt-conversation-loaded')
      void resolveImageAttachmentUrls(response.page.messages)
    }
    catch (error) {
      if (isAbortError(error)) {
        return
      }

      errorMessage.value = getRequestErrorMessage(error, {
        locale: locale.value,
        fallbackKey: 'errorOpenConversation'
      })
    }
    finally {
      if (requestVersion === conversationRequestVersion) {
        conversationPending.value = false
      }
    }
  }

  async function loadOlderMessages() {
    const conversationId = currentConversationId.value

    if (!conversationId) {
      return
    }

    const state = getMessageState(conversationId)

    if (!state.nextCursor || loadingOlderMessages.value) {
      return
    }

    loadingOlderMessages.value = true
    clearError()

    try {
      const response = await request<ConversationMessagesPageResponse>(
        `/api/admin/conversations/${conversationId}/messages`,
        {
          query: {
            before: state.nextCursor,
            limit: state.limit
          }
        }
      )

      applyMessagesPage(conversationId, response.page, 'prepend')
      void resolveImageAttachmentUrls(response.page.messages)
    }
    catch (error) {
      errorMessage.value = getRequestErrorMessage(error, {
        locale: locale.value,
        fallbackKey: 'errorOpenConversation'
      })
    }
    finally {
      loadingOlderMessages.value = false
    }
  }

  async function createConversation(options: { open?: boolean } = {}) {
    clearError()

    try {
      const response = await request<ConversationSummaryResponse>('/api/admin/conversations', {
        method: 'POST'
      })

      upsertConversationSummary(response.conversation)
      getMessageState(response.conversation.id).ready = true

      if (options.open !== false) {
        currentConversationId.value = response.conversation.id
        await router.replace({
          query: {
            ...route.query,
            conversation: response.conversation.id
          }
        })
      }

      return response.conversation
    }
    catch (error) {
      errorMessage.value = getRequestErrorMessage(error, {
        locale: locale.value,
        fallbackKey: 'errorCreateConversation'
      })
      throw error
    }
  }

  async function ensureConversationId() {
    if (currentConversationId.value) {
      return currentConversationId.value
    }

    const conversation = await createConversation()
    return conversation.id
  }

  async function renameConversation(conversationId: string, title: string) {
    clearError()

    try {
      const response = await request<ConversationSummaryResponse>(`/api/admin/conversations/${conversationId}`, {
        method: 'PATCH',
        body: { title }
      })

      upsertConversationSummary(response.conversation)
    }
    catch (error) {
      errorMessage.value = getRequestErrorMessage(error, {
        locale: locale.value,
        fallbackKey: 'errorRenameConversation'
      })
      throw error
    }
  }

  async function deleteConversation(conversationId: string) {
    clearError()

    try {
      await request(`/api/admin/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      removeConversationState(conversationId)

      if (currentConversationId.value === conversationId) {
        const nextConversationId = conversationOrder.value[0] ?? null
        currentConversationId.value = nextConversationId

        if (nextConversationId) {
          await openConversation(nextConversationId)
        }
        else {
          await router.replace({
            query: {
              ...route.query,
              conversation: undefined
            }
          })
        }
      }
    }
    catch (error) {
      errorMessage.value = getRequestErrorMessage(error, {
        locale: locale.value,
        fallbackKey: 'errorDeleteConversation'
      })
      throw error
    }
  }

  async function sendMessage(input: { text: string, files: File[] }) {
    sendPending.value = true
    clearError()
    markPerformance('polargpt-send-click')

    const optimisticMessageIds: string[] = []

    try {
      const conversationId = await ensureConversationId()
      currentConversationId.value = conversationId

      const optimisticAttachments = input.files.map((file, index) => ({
        id: `temp-attachment-${Date.now()}-${index}`,
        messageId: '',
        kind: file.type.startsWith('image/') ? 'image' : 'document',
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        createdAt: new Date().toISOString()
      } satisfies AttachmentRecord))

      const optimisticUserMessage = createOptimisticMessage({
        conversationId,
        role: 'user',
        content: input.text.trim(),
        attachments: optimisticAttachments
      })
      const optimisticAssistantMessage = createOptimisticMessage({
        conversationId,
        role: 'assistant',
        content: '',
        attachments: [],
        status: 'completed'
      })

      optimisticMessageIds.push(optimisticUserMessage.id, optimisticAssistantMessage.id)
      appendMessages(conversationId, [optimisticUserMessage, optimisticAssistantMessage])
      markPerformance('polargpt-pending-visible')

      const formData = new FormData()
      formData.append('text', input.text)

      for (const file of input.files) {
        formData.append('files[]', file)
      }

      const response = await request<SendMessageDeltaResponse>(`/api/admin/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: formData
      })

      removeMessages(conversationId, optimisticMessageIds)
      appendMessages(response.conversation.id, response.appendedMessages)
      upsertConversationSummary(response.conversation)
      currentConversationId.value = response.conversation.id
      await router.replace({
        query: {
          ...route.query,
          conversation: response.conversation.id
        }
      })
      void resolveImageAttachmentUrls(response.appendedMessages)
      markPerformance('polargpt-send-complete')
    }
    catch (error) {
      const conversationId = currentConversationId.value

      if (conversationId) {
        removeMessages(conversationId, optimisticMessageIds)
      }

      errorMessage.value = getRequestErrorMessage(error, {
        locale: locale.value,
        fallbackKey: 'errorSendMessage'
      })
      throw error
    }
    finally {
      sendPending.value = false
    }
  }

  async function openAttachment(attachmentId: string) {
    if (attachmentUrls.value[attachmentId]) {
      return attachmentUrls.value[attachmentId]
    }

    await resolveAttachmentUrlsForIds([attachmentId])
    return attachmentUrls.value[attachmentId] ?? null
  }

  async function logout() {
    await $fetch('/api/admin/session/logout', {
      method: 'POST'
    })
    adminHintCookie.value = null
    await navigateTo('/login')
  }

  async function initialize() {
    if (initialized.value) {
      return
    }

    initialized.value = true
    const requestedConversationId = typeof route.query.conversation === 'string'
      ? route.query.conversation
      : null

    if (requestedConversationId) {
      await Promise.all([
        refreshConversations(),
        openConversation(requestedConversationId, { updateRoute: false })
      ])
      return
    }

    await refreshConversations()
    const fallbackConversationId = conversationOrder.value[0] ?? null

    if (fallbackConversationId) {
      await openConversation(fallbackConversationId)
    }
  }

  const conversations = computed(() =>
    conversationOrder.value
      .map((conversationId) => conversationsById.value[conversationId])
      .filter((conversation): conversation is ConversationSummary => Boolean(conversation)))

  const activeConversation = computed(() =>
    currentConversationId.value ? conversationsById.value[currentConversationId.value] ?? null : null)

  const activeMessages = computed<DisplayChatMessage[]>(() => {
    if (!currentConversationId.value) {
      return []
    }

    const state = getMessageState(currentConversationId.value)

    return state.messageIds
      .map((messageId) => state.messagesById[messageId])
      .filter((message): message is ChatMessage => Boolean(message))
      .map((message) => ({
        ...message,
        attachments: message.attachments.map((attachment) => ({
          ...attachment,
          downloadUrl: attachmentUrls.value[attachment.id] ?? null,
          urlPending: attachmentUrlPending.value[attachment.id] ?? false
        }))
      }))
  })

  const hasOlderMessages = computed(() => {
    if (!currentConversationId.value) {
      return false
    }

    return Boolean(getMessageState(currentConversationId.value).nextCursor)
  })

  return {
    conversations,
    activeConversation,
    activeMessages,
    currentConversationId,
    searchQuery,
    listPending,
    conversationPending,
    loadingOlderMessages,
    sendPending,
    errorMessage,
    hasOlderMessages,
    clearError,
    refreshConversations,
    openConversation,
    loadOlderMessages,
    createConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
    resolveAttachmentUrls: resolveAttachmentUrlsForIds,
    openAttachment,
    logout,
    initialize
  }
}

import type {
  ConversationDetail,
  ConversationDetailResponse,
  ConversationListResponse,
  ConversationSummary,
  ConversationSummaryResponse
} from '#shared/types/chat'
import { ADMIN_HINT_COOKIE_NAME } from '#shared/constants/polargpt'
import { FetchError } from 'ofetch'
import { getRequestErrorMessage } from '../utils/request-errors'

/**
 * The chat composable centralizes all client-side orchestration so page and UI
 * components stay focused on rendering and short user interactions.
 */
export function usePolarGptChat() {
  const route = useRoute()
  const router = useRouter()
  const { locale } = useUiPreferences()
  const adminHintCookie = useCookie<string | null>(ADMIN_HINT_COOKIE_NAME)
  const conversations = useState<ConversationSummary[]>('polargpt-conversations', () => [])
  const activeConversation = useState<ConversationDetail | null>('polargpt-active-conversation', () => null)
  const currentConversationId = useState<string | null>('polargpt-current-conversation-id', () => null)
  const searchQuery = useState('polargpt-search-query', () =>
    typeof route.query.q === 'string' ? route.query.q : '')
  const listPending = useState('polargpt-list-pending', () => false)
  const conversationPending = useState('polargpt-conversation-pending', () => false)
  const sendPending = useState('polargpt-send-pending', () => false)
  const errorMessage = useState<string | null>('polargpt-error-message', () => null)

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

  function clearError() {
    errorMessage.value = null
  }

  function applyConversationSummary(conversation: ConversationSummary) {
    const index = conversations.value.findIndex((item) => item.id === conversation.id)

    if (index >= 0) {
      conversations.value.splice(index, 1, conversation)
    }
    else {
      conversations.value.unshift(conversation)
    }

    conversations.value.sort((left, right) => {
      const leftValue = left.lastMessageAt ?? left.updatedAt
      const rightValue = right.lastMessageAt ?? right.updatedAt
      return rightValue.localeCompare(leftValue)
    })
  }

  async function refreshConversations(query = searchQuery.value) {
    listPending.value = true
    clearError()

    try {
      const response = await request<ConversationListResponse>('/api/admin/conversations', {
        query: {
          q: query || undefined
        }
      })
      conversations.value = response.conversations
    }
    catch (error) {
      errorMessage.value = getRequestErrorMessage(error, {
        locale: locale.value,
        fallbackKey: 'errorLoadConversationHistory'
      })
    }
    finally {
      listPending.value = false
    }
  }

  async function openConversation(conversationId: string, options: { updateRoute?: boolean } = {}) {
    conversationPending.value = true
    clearError()

    try {
      const response = await request<ConversationDetailResponse>(`/api/admin/conversations/${conversationId}`)
      activeConversation.value = response.conversation
      currentConversationId.value = conversationId
      applyConversationSummary(response.conversation)

      if (options.updateRoute !== false) {
        await router.replace({
          query: {
            ...route.query,
            conversation: conversationId
          }
        })
      }
    }
    catch (error) {
      errorMessage.value = getRequestErrorMessage(error, {
        locale: locale.value,
        fallbackKey: 'errorOpenConversation'
      })
    }
    finally {
      conversationPending.value = false
    }
  }

  async function createConversation(options: { open?: boolean } = {}) {
    clearError()

    try {
      const response = await request<ConversationSummaryResponse>('/api/admin/conversations', {
        method: 'POST'
      })
      applyConversationSummary(response.conversation)

      if (options.open !== false) {
        await openConversation(response.conversation.id)
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

      applyConversationSummary(response.conversation)

      if (activeConversation.value?.id === conversationId) {
        activeConversation.value = {
          ...activeConversation.value,
          title: response.conversation.title,
          summary: response.conversation.summary,
          updatedAt: response.conversation.updatedAt
        }
      }
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

      conversations.value = conversations.value.filter((conversation) => conversation.id !== conversationId)

      if (currentConversationId.value === conversationId) {
        const nextConversation = conversations.value[0] ?? null
        activeConversation.value = null
        currentConversationId.value = null

        if (nextConversation) {
          await openConversation(nextConversation.id)
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

    try {
      const conversationId = await ensureConversationId()
      const formData = new FormData()
      formData.append('text', input.text)

      for (const file of input.files) {
        formData.append('files[]', file)
      }

      const response = await request<ConversationDetailResponse>(`/api/admin/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: formData
      })

      activeConversation.value = response.conversation
      currentConversationId.value = response.conversation.id
      applyConversationSummary(response.conversation)
      await refreshConversations(searchQuery.value)
      await router.replace({
        query: {
          ...route.query,
          conversation: response.conversation.id
        }
      })
    }
    catch (error) {
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

  async function logout() {
    await $fetch('/api/admin/session/logout', {
      method: 'POST'
    })
    adminHintCookie.value = null
    await navigateTo('/login')
  }

  async function initialize() {
    await refreshConversations()
    const requestedConversationId = typeof route.query.conversation === 'string'
      ? route.query.conversation
      : null
    const fallbackConversationId = requestedConversationId ?? conversations.value[0]?.id ?? null

    if (fallbackConversationId) {
      await openConversation(fallbackConversationId, {
        updateRoute: requestedConversationId === null
      })
    }
  }

  return {
    conversations,
    activeConversation,
    currentConversationId,
    searchQuery,
    listPending,
    conversationPending,
    sendPending,
    errorMessage,
    clearError,
    refreshConversations,
    openConversation,
    createConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
    logout,
    initialize
  }
}

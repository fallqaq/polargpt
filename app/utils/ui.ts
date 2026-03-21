export type UiLocale = 'zh-CN' | 'en-US'
export type UiTheme = 'light' | 'dark'

export const UI_LOCALE_COOKIE_NAME = 'polargpt_ui_locale'
export const UI_THEME_COOKIE_NAME = 'polargpt_ui_theme'
export const UI_PREFERENCE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
export const DEFAULT_UI_LOCALE: UiLocale = 'zh-CN'
export const SSR_FALLBACK_UI_THEME: UiTheme = 'dark'

const zhMessages = {
  metaTitle: 'polarGPT | 单管理员 AI 工作台',
  metaDescription: '一个面向单管理员的轻量 AI 聊天控制台，支持历史记录、文件上传和 Gemini 驱动的对话。',
  toolbarLanguage: '语言',
  toolbarTheme: '主题',
  toolbarLocaleZh: '中文',
  toolbarLocaleEn: 'EN',
  toolbarThemeLight: '亮色',
  toolbarThemeDark: '暗色',
  loginModeLabel: '单管理员模式',
  loginTitle: 'polarGPT 控制台',
  loginDescription: '一个为单管理员打造的精简 AI 工作台。使用环境变量管理的密码登录后，可访问 Gemini 驱动的聊天、文件上传和历史搜索。',
  loginAccessLabel: '访问',
  loginSignInTitle: '管理员登录',
  loginPasswordLabel: '密码',
  loginPasswordPlaceholder: '输入管理员密码',
  loginSubmitIdle: '进入 polarGPT',
  loginSubmitBusy: '登录中...',
  loginPasswordRequired: '请输入管理员密码。',
  chatConfirmDelete: '确定要永久删除这个会话吗？',
  sidebarHistoryLabel: '历史记录',
  sidebarNewChat: '新对话',
  sidebarSearchAria: '搜索历史记录',
  sidebarSearchPlaceholder: '搜索标题和摘要',
  sidebarLoading: '正在加载会话...',
  sidebarEmpty: '还没有会话。点击上方按钮开始一个新对话。',
  sidebarNoMessagesYet: '暂无消息',
  sidebarNoSummaryYet: '暂未生成摘要。',
  sidebarDeleteConversationAria: '删除会话',
  sidebarDelete: '删除',
  headerWorkspaceLabel: '工作区',
  headerCancel: '取消',
  headerSave: '保存',
  headerNoSummaryYet: '这个会话还没有生成摘要。',
  headerFreshTitle: '全新工作区',
  headerFreshDescription: '创建一个会话并开始提问，或者先上传 PDF/图片，再基于上下文继续。',
  headerRename: '重命名',
  headerDelete: '删除',
  headerLogout: '退出登录',
  threadReadyLabel: '就绪',
  threadEmptyTitle: '直接输入问题，或先上传上下文。',
  threadEmptyDescription: 'v1 支持 PNG、JPEG、WebP、PDF、TXT 和 Markdown。助手会在左侧保留完整会话历史。',
  threadLoadingConversation: '正在加载当前会话...',
  threadLoadOlder: '加载更早消息',
  threadLoadOlderBusy: '加载中...',
  threadOpenAttachment: '打开附件',
  threadResolveAttachment: '准备下载...',
  threadRoleAssistant: '助手',
  threadRoleUser: '你',
  threadNoTextContent: '没有文本内容。',
  threadGenerating: '正在生成下一条回复...',
  composerPromptLabel: '提示',
  composerTitle: '先附加上下文，再直接提问。',
  composerAttachFiles: '添加文件',
  composerPlaceholder: '输入问题、补充说明，或描述要如何处理这些文件...',
  composerUnknownType: '未知类型',
  composerRemove: '移除',
  composerHint: '使用 Cmd/Ctrl + Enter 发送。每条消息最多 {count} 个附件。',
  composerSubmitIdle: '发送消息',
  composerSubmitBusy: '发送中...',
  errorGeneric: '发生了一些问题。',
  errorLoginFailed: '登录失败。',
  errorLoadConversationHistory: '加载会话历史失败。',
  errorOpenConversation: '打开会话失败。',
  errorCreateConversation: '创建新会话失败。',
  errorLoadConversation: '加载会话失败。',
  errorLoadConversationMessages: '加载会话消息失败。',
  errorLoadMessageAttachments: '加载消息附件失败。',
  errorSaveMessage: '保存消息失败。',
  errorRollbackMessage: '回滚消息失败。',
  errorSaveAttachmentMetadata: '保存附件元数据失败。',
  errorUpdateConversation: '更新会话失败。',
  errorRenameConversation: '重命名会话失败。',
  errorDeleteConversation: '删除会话失败。',
  errorSendMessage: '发送消息失败。',
  errorConversationNotFound: '未找到该会话。',
  errorFailedGemini: 'Gemini 生成回复失败。',
  errorGeminiEmpty: 'Gemini 返回了空内容。',
  errorRemoveAttachmentsStorage: '从存储中删除附件失败。',
  errorAdminSessionRequired: '需要管理员会话。',
  errorFileNameRequired: '每个上传的附件都必须包含文件名。',
  errorAttachmentValidationFailed: '附件校验失败。',
  errorMimeTypeUnknown: '无法确定 {fileName} 的 MIME 类型。',
  errorFileUploadFailed: '上传 {fileName} 到 Supabase Storage 失败。',
  errorUnsupportedFileType: '不支持的文件类型。允许的格式为 PNG、JPEG、WebP、PDF、TXT 和 Markdown。',
  errorFileTooLarge: '{fileName} 超过大小限制 {size}。',
  errorTooManyAttachments: '每条消息最多可上传 {count} 个附件。'
} as const

const enMessages: Record<keyof typeof zhMessages, string> = {
  metaTitle: 'polarGPT | Single-admin AI workspace',
  metaDescription: 'A focused single-admin AI chat console with history, file uploads, and Gemini-powered conversations.',
  toolbarLanguage: 'Language',
  toolbarTheme: 'Theme',
  toolbarLocaleZh: '中文',
  toolbarLocaleEn: 'EN',
  toolbarThemeLight: 'Light',
  toolbarThemeDark: 'Dark',
  loginModeLabel: 'Single Admin Mode',
  loginTitle: 'polarGPT control room',
  loginDescription: 'A trimmed AI workspace for one administrator. Sign in with the environment-managed password to access Gemini-powered chat, file uploads, and history search.',
  loginAccessLabel: 'Access',
  loginSignInTitle: 'Administrator Sign In',
  loginPasswordLabel: 'Password',
  loginPasswordPlaceholder: 'Enter admin password',
  loginSubmitIdle: 'Enter polarGPT',
  loginSubmitBusy: 'Signing In...',
  loginPasswordRequired: 'Please enter the administrator password.',
  chatConfirmDelete: 'Delete this conversation permanently?',
  sidebarHistoryLabel: 'History',
  sidebarNewChat: 'New Chat',
  sidebarSearchAria: 'Search history',
  sidebarSearchPlaceholder: 'Search titles and summaries',
  sidebarLoading: 'Loading conversations...',
  sidebarEmpty: 'No conversations yet. Start a new one from the button above.',
  sidebarNoMessagesYet: 'No messages yet',
  sidebarNoSummaryYet: 'No summary yet.',
  sidebarDeleteConversationAria: 'Delete conversation',
  sidebarDelete: 'Delete',
  headerWorkspaceLabel: 'Workspace',
  headerCancel: 'Cancel',
  headerSave: 'Save',
  headerNoSummaryYet: 'This conversation has not produced a summary yet.',
  headerFreshTitle: 'Fresh workspace',
  headerFreshDescription: 'Create a conversation and start asking questions, or drop in a PDF/image to begin with context.',
  headerRename: 'Rename',
  headerDelete: 'Delete',
  headerLogout: 'Logout',
  threadReadyLabel: 'Ready',
  threadEmptyTitle: 'Start with a direct prompt or upload context first.',
  threadEmptyDescription: 'Supported inputs in v1 are PNG, JPEG, WebP, PDF, TXT, and Markdown. The assistant will keep the conversation history in the left rail.',
  threadLoadingConversation: 'Loading the current conversation...',
  threadLoadOlder: 'Load older messages',
  threadLoadOlderBusy: 'Loading...',
  threadOpenAttachment: 'Open attachment',
  threadResolveAttachment: 'Preparing download...',
  threadRoleAssistant: 'Assistant',
  threadRoleUser: 'You',
  threadNoTextContent: 'No text content.',
  threadGenerating: 'Generating the next answer...',
  composerPromptLabel: 'Prompt',
  composerTitle: 'Attach context, then ask directly.',
  composerAttachFiles: 'Attach Files',
  composerPlaceholder: 'Ask a question, add instructions, or describe what to do with the files...',
  composerUnknownType: 'Unknown type',
  composerRemove: 'Remove',
  composerHint: 'Cmd/Ctrl + Enter to send. Up to {count} attachments per message.',
  composerSubmitIdle: 'Send Message',
  composerSubmitBusy: 'Sending...',
  errorGeneric: 'Something went wrong.',
  errorLoginFailed: 'Login failed.',
  errorLoadConversationHistory: 'Failed to load conversation history.',
  errorOpenConversation: 'Failed to open the conversation.',
  errorCreateConversation: 'Failed to create a new conversation.',
  errorLoadConversation: 'Failed to load the conversation.',
  errorLoadConversationMessages: 'Failed to load conversation messages.',
  errorLoadMessageAttachments: 'Failed to load message attachments.',
  errorSaveMessage: 'Failed to save the message.',
  errorRollbackMessage: 'Failed to roll back the message.',
  errorSaveAttachmentMetadata: 'Failed to save attachment metadata.',
  errorUpdateConversation: 'Failed to update the conversation.',
  errorRenameConversation: 'Failed to rename the conversation.',
  errorDeleteConversation: 'Failed to delete the conversation.',
  errorSendMessage: 'Failed to send the message.',
  errorConversationNotFound: 'Conversation not found.',
  errorFailedGemini: 'Failed to generate a response from Gemini.',
  errorGeminiEmpty: 'Gemini returned an empty response.',
  errorRemoveAttachmentsStorage: 'Failed to remove attachments from storage.',
  errorAdminSessionRequired: 'Administrator session is required.',
  errorFileNameRequired: 'Every uploaded attachment must include a file name.',
  errorAttachmentValidationFailed: 'Attachment validation failed.',
  errorMimeTypeUnknown: 'Could not determine a MIME type for {fileName}.',
  errorFileUploadFailed: 'Failed to upload {fileName} to Supabase Storage.',
  errorUnsupportedFileType: 'Unsupported file type. Allowed formats are PNG, JPEG, WebP, PDF, TXT, and Markdown.',
  errorFileTooLarge: '{fileName} exceeds the size limit of {size}.',
  errorTooManyAttachments: 'You can upload up to {count} attachments per message.'
}

const uiMessages = {
  'zh-CN': zhMessages,
  'en-US': enMessages
} as const

export type UiTextKey = keyof typeof zhMessages
export type UiTextParams = Record<string, number | string>

const EXACT_ERROR_MESSAGE_KEYS: Record<string, UiTextKey> = {
  'Something went wrong.': 'errorGeneric',
  'Login failed.': 'errorLoginFailed',
  'Failed to load conversation history.': 'errorLoadConversationHistory',
  'Failed to open the conversation.': 'errorOpenConversation',
  'Failed to create a new conversation.': 'errorCreateConversation',
  'Failed to create a conversation.': 'errorCreateConversation',
  'Failed to load the conversation.': 'errorLoadConversation',
  'Failed to load conversation messages.': 'errorLoadConversationMessages',
  'Failed to load message attachments.': 'errorLoadMessageAttachments',
  'Failed to save the message.': 'errorSaveMessage',
  'Failed to roll back the message.': 'errorRollbackMessage',
  'Failed to save attachment metadata.': 'errorSaveAttachmentMetadata',
  'Failed to update the conversation.': 'errorUpdateConversation',
  'Failed to rename the conversation.': 'errorRenameConversation',
  'Failed to delete the conversation.': 'errorDeleteConversation',
  'Failed to send the message.': 'errorSendMessage',
  'Conversation not found.': 'errorConversationNotFound',
  'Failed to generate a response from Gemini.': 'errorFailedGemini',
  'Gemini returned an empty response.': 'errorGeminiEmpty',
  'Failed to remove attachments from storage.': 'errorRemoveAttachmentsStorage',
  'Administrator session is required.': 'errorAdminSessionRequired',
  'Every uploaded attachment must include a file name.': 'errorFileNameRequired',
  'Attachment validation failed.': 'errorAttachmentValidationFailed',
  'Unsupported file type. Allowed formats are PNG, JPEG, WebP, PDF, TXT, and Markdown.': 'errorUnsupportedFileType'
}

const ERROR_MESSAGE_PATTERNS: Array<{
  pattern: RegExp
  resolve: (match: RegExpMatchArray) => { key: UiTextKey, params: UiTextParams }
}> = [
  {
    pattern: /^Failed to upload (.+) to Supabase Storage\.$/,
    resolve: (match) => ({
      key: 'errorFileUploadFailed',
      params: {
        fileName: match[1] ?? ''
      }
    })
  },
  {
    pattern: /^Could not determine a MIME type for (.+)\.$/,
    resolve: (match) => ({
      key: 'errorMimeTypeUnknown',
      params: {
        fileName: match[1] ?? ''
      }
    })
  },
  {
    pattern: /^(.+) exceeds the size limit of (.+)\.$/,
    resolve: (match) => ({
      key: 'errorFileTooLarge',
      params: {
        fileName: match[1] ?? '',
        size: match[2] ?? ''
      }
    })
  },
  {
    pattern: /^You can upload up to (\d+) (?:attachments|files) per message\.$/,
    resolve: (match) => ({
      key: 'errorTooManyAttachments',
      params: {
        count: match[1] ?? ''
      }
    })
  }
]

export function normalizeUiLocale(value?: string | null): UiLocale {
  return value === 'en-US' ? 'en-US' : DEFAULT_UI_LOCALE
}

export function normalizeUiTheme(value?: string | null): UiTheme | null {
  return value === 'light' || value === 'dark' ? value : null
}

export function resolveUiTheme(value: string | null | undefined, systemPrefersDark: boolean): UiTheme {
  return normalizeUiTheme(value) ?? (systemPrefersDark ? 'dark' : 'light')
}

export function resolveUiText(locale: UiLocale, key: UiTextKey, params: UiTextParams = {}) {
  const template = uiMessages[locale][key]

  return template.replace(/\{(\w+)\}/g, (_, paramKey: string) => {
    return String(params[paramKey] ?? `{${paramKey}}`)
  })
}

export function translateKnownErrorMessage(
  locale: UiLocale,
  message?: string | null,
  fallbackKey: UiTextKey = 'errorGeneric'
) {
  const normalizedMessage = message?.trim()

  if (!normalizedMessage) {
    return resolveUiText(locale, fallbackKey)
  }

  const exactKey = EXACT_ERROR_MESSAGE_KEYS[normalizedMessage]

  if (exactKey) {
    return resolveUiText(locale, exactKey)
  }

  for (const entry of ERROR_MESSAGE_PATTERNS) {
    const match = normalizedMessage.match(entry.pattern)

    if (match) {
      const { key, params } = entry.resolve(match)
      return resolveUiText(locale, key, params)
    }
  }

  return normalizedMessage
}

export function buildThemeInitScript() {
  return `(() => {
  const readCookie = (name) => {
    const prefix = name + '=';
    const entry = document.cookie.split('; ').find((item) => item.startsWith(prefix));
    return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
  };
  const media = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  const storedTheme = readCookie('${UI_THEME_COOKIE_NAME}');
  const theme = storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : media && media.matches
      ? 'dark'
      : 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();`
}

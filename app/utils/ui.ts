export type UiLocale = 'zh-CN' | 'en-US'
export type UiTheme = 'light' | 'dark'

export const UI_LOCALE_COOKIE_NAME = 'polargpt_ui_locale'
export const UI_THEME_COOKIE_NAME = 'polargpt_ui_theme'
export const UI_PREFERENCE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
export const DEFAULT_UI_LOCALE: UiLocale = 'zh-CN'
export const SSR_FALLBACK_UI_THEME: UiTheme = 'dark'

const zhMessages = {
  metaTitle: 'PolarGPT | AI 对话工作台',
  metaDescription: '让想法更快成形的 AI 对话工作台。',
  toolbarLanguage: '语言',
  toolbarTheme: '主题',
  toolbarLocaleZh: '中文',
  toolbarLocaleEn: 'EN',
  toolbarThemeLight: '亮色',
  toolbarThemeDark: '暗色',
  loginModeLabel: '进入',
  loginTitle: 'PolarGPT',
  loginDescription: '让未完成的念头，在这里慢慢显影。',
  loginAccessLabel: '账户',
  authModeSignIn: '登录',
  authModeRegister: '注册',
  loginSignInTitle: '欢迎回来',
  loginRegisterTitle: '创建账号',
  loginEmailLabel: '邮箱',
  loginEmailPlaceholder: 'name@example.com',
  loginPasswordLabel: '密码',
  loginPasswordPlaceholder: '输入登录密码',
  loginSubmitLoginIdle: '进入 PolarGPT',
  loginSubmitRegisterIdle: '加入 PolarGPT',
  loginSubmitBusy: '处理中...',
  loginTogglePromptRegister: '还没有账号？',
  loginToggleActionRegister: '立即注册',
  loginTogglePromptSignIn: '已经有账号？',
  loginToggleActionSignIn: '返回登录',
  loginChipMultiUser: '多用户',
  chatConfirmDelete: '确定要永久删除这个会话吗？',
  sidebarHistoryLabel: '对话',
  sidebarNewChat: '开始新对话',
  sidebarSearchAria: '搜索对话',
  sidebarSearchPlaceholder: '搜索对话',
  sidebarLoading: '正在整理对话...',
  sidebarEmpty: '还没有对话。从上方开始新对话。',
  sidebarGroupToday: '今天',
  sidebarGroupLast30Days: '30 天内',
  sidebarNoMessagesYet: '暂无消息',
  sidebarNoSummaryYet: '继续输入，摘要会逐渐清晰。',
  sidebarDeleteConversationAria: '删除会话',
  sidebarDelete: '删除',
  headerWorkspaceLabel: '当前对话',
  headerCancel: '取消',
  headerSave: '保存',
  headerNoSummaryYet: '继续补充细节，摘要会在对话推进后生成。',
  headerFreshTitle: '从一个清晰的问题开始',
  headerFreshDescription: '你可以描述目标、贴入材料，或直接输入一句想法。',
  headerRename: '重命名',
  headerDelete: '删除',
  headerLogout: '退出登录',
  toolbarCurrentAccount: '当前账号',
  threadReadyLabel: '已准备好',
  threadEmptyTitle: '从一个清晰的问题开始',
  threadEmptyDescription: '你可以描述目标、贴入材料，或直接输入一句想法。',
  threadLoadingConversation: '正在载入对话...',
  threadLoadOlder: '加载更早消息',
  threadLoadOlderBusy: '加载中...',
  threadOpenAttachment: '打开附件',
  threadResolveAttachment: '准备下载...',
  threadRoleAssistant: '助手',
  threadRoleUser: '你',
  threadNoTextContent: '没有文本内容。',
  threadGenerating: '正在思考',
  composerPromptLabel: '输入',
  composerTitle: '输入你的问题、任务或想法',
  composerAttachFiles: '添加文件',
  composerPlaceholder: '输入你的问题、任务或想法',
  composerUnknownType: '未知类型',
  composerRemove: '移除',
  composerHint: 'Enter 换行，Cmd/Ctrl + Enter 发送。最多 {count} 个附件。',
  composerProviderHintGemini: '当前 provider: Gemini。支持图片与文档附件。',
  composerProviderHintDeepSeek: '当前 provider: DeepSeek。仅支持 PDF、TXT 和 Markdown；长文档会截断后送入模型。',
  composerSubmitIdle: '发送',
  composerSubmitBusy: '发送中',
  errorGeneric: '发生了一些问题。',
  errorLoginFailed: '登录失败。',
  errorRegisterFailed: '注册失败。',
  errorAuthRequired: '需要先登录。',
  errorEmailRequired: '请输入邮箱地址。',
  errorEmailInvalid: '邮箱格式不正确。',
  errorPasswordRequired: '请输入密码。',
  errorPasswordTooShort: '密码至少需要 6 个字符。',
  errorAccountExists: '该邮箱已注册。',
  errorInvalidCredentials: '邮箱或密码错误。',
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
  errorFailedDeepSeek: 'DeepSeek 生成回复失败。',
  errorDeepSeekEmpty: 'DeepSeek 返回了空内容。',
  errorRemoveAttachmentsStorage: '从存储中删除附件失败。',
  errorFileNameRequired: '每个上传的附件都必须包含文件名。',
  errorAttachmentValidationFailed: '附件校验失败。',
  errorMimeTypeUnknown: '无法确定 {fileName} 的 MIME 类型。',
  errorFileUploadFailed: '上传 {fileName} 到 Supabase Storage 失败。',
  errorUnsupportedFileType: '不支持的文件类型。允许的格式为 PNG、JPEG、WebP、PDF、TXT 和 Markdown。',
  errorUnsupportedFileTypeDocumentsOnly: '不支持的文件类型。允许的格式为 PDF、TXT 和 Markdown。',
  errorImagesUnsupportedCurrentProvider: '当前 AI provider 不支持图片。请改用 PDF、TXT 或 Markdown 文件。',
  errorExtractReadableText: '无法从 {fileName} 提取可读文本。',
  errorLoadAttachmentFromStorage: '无法从存储中读取 {fileName}。',
  errorFileTooLarge: '{fileName} 超过大小限制 {size}。',
  errorTooManyAttachments: '每条消息最多可上传 {count} 个附件。'
} as const

const enMessages: Record<keyof typeof zhMessages, string> = {
  metaTitle: 'PolarGPT | AI workspace',
  metaDescription: 'An AI chat workspace that helps ideas take shape faster.',
  toolbarLanguage: 'Language',
  toolbarTheme: 'Theme',
  toolbarLocaleZh: '中文',
  toolbarLocaleEn: 'EN',
  toolbarThemeLight: 'Light',
  toolbarThemeDark: 'Dark',
  loginModeLabel: 'Enter',
  loginTitle: 'PolarGPT',
  loginDescription: 'Let unfinished thoughts come quietly into focus.',
  loginAccessLabel: 'Account',
  authModeSignIn: 'Sign In',
  authModeRegister: 'Register',
  loginSignInTitle: 'Welcome back',
  loginRegisterTitle: 'Create your account',
  loginEmailLabel: 'Email',
  loginEmailPlaceholder: 'name@example.com',
  loginPasswordLabel: 'Password',
  loginPasswordPlaceholder: 'Enter your password',
  loginSubmitLoginIdle: 'Enter PolarGPT',
  loginSubmitRegisterIdle: 'Join PolarGPT',
  loginSubmitBusy: 'Working...',
  loginTogglePromptRegister: 'Need an account?',
  loginToggleActionRegister: 'Register now',
  loginTogglePromptSignIn: 'Already have an account?',
  loginToggleActionSignIn: 'Back to sign in',
  loginChipMultiUser: 'Multi-user',
  chatConfirmDelete: 'Delete this conversation permanently?',
  sidebarHistoryLabel: 'Chats',
  sidebarNewChat: 'New chat',
  sidebarSearchAria: 'Search chats',
  sidebarSearchPlaceholder: 'Search chats',
  sidebarLoading: 'Refreshing chats...',
  sidebarEmpty: 'No chats yet. Start a new one above.',
  sidebarGroupToday: 'Today',
  sidebarGroupLast30Days: 'Last 30 Days',
  sidebarNoMessagesYet: 'No messages yet',
  sidebarNoSummaryYet: 'Keep going and the summary will sharpen.',
  sidebarDeleteConversationAria: 'Delete conversation',
  sidebarDelete: 'Delete',
  headerWorkspaceLabel: 'Current chat',
  headerCancel: 'Cancel',
  headerSave: 'Save',
  headerNoSummaryYet: 'Keep adding context and the summary will catch up.',
  headerFreshTitle: 'Start with a clear question',
  headerFreshDescription: 'Describe a goal, drop in material, or begin with a single thought.',
  headerRename: 'Rename',
  headerDelete: 'Delete',
  headerLogout: 'Logout',
  toolbarCurrentAccount: 'Signed in as',
  threadReadyLabel: 'Ready',
  threadEmptyTitle: 'Start with a clear question',
  threadEmptyDescription: 'Describe a goal, drop in material, or begin with a single thought.',
  threadLoadingConversation: 'Loading chat...',
  threadLoadOlder: 'Load older messages',
  threadLoadOlderBusy: 'Loading...',
  threadOpenAttachment: 'Open attachment',
  threadResolveAttachment: 'Preparing download...',
  threadRoleAssistant: 'Assistant',
  threadRoleUser: 'You',
  threadNoTextContent: 'No text content.',
  threadGenerating: 'Thinking',
  composerPromptLabel: 'Prompt',
  composerTitle: 'Ask a question, assign a task, or start with an idea',
  composerAttachFiles: 'Attach Files',
  composerPlaceholder: 'Ask a question, assign a task, or start with an idea',
  composerUnknownType: 'Unknown type',
  composerRemove: 'Remove',
  composerHint: 'Enter for a new line. Cmd/Ctrl + Enter sends. Up to {count} attachments.',
  composerProviderHintGemini: 'Current provider: Gemini. Images and document attachments are supported.',
  composerProviderHintDeepSeek: 'Current provider: DeepSeek. Only PDF, TXT, and Markdown are supported; long documents are truncated before they reach the model.',
  composerSubmitIdle: 'Send',
  composerSubmitBusy: 'Sending...',
  errorGeneric: 'Something went wrong.',
  errorLoginFailed: 'Login failed.',
  errorRegisterFailed: 'Registration failed.',
  errorAuthRequired: 'You need to sign in first.',
  errorEmailRequired: 'Please enter an email address.',
  errorEmailInvalid: 'Email address is invalid.',
  errorPasswordRequired: 'Please enter a password.',
  errorPasswordTooShort: 'Password must be at least 6 characters.',
  errorAccountExists: 'An account with this email already exists.',
  errorInvalidCredentials: 'Invalid email or password.',
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
  errorFailedDeepSeek: 'Failed to generate a response from DeepSeek.',
  errorDeepSeekEmpty: 'DeepSeek returned an empty response.',
  errorRemoveAttachmentsStorage: 'Failed to remove attachments from storage.',
  errorFileNameRequired: 'Every uploaded attachment must include a file name.',
  errorAttachmentValidationFailed: 'Attachment validation failed.',
  errorMimeTypeUnknown: 'Could not determine a MIME type for {fileName}.',
  errorFileUploadFailed: 'Failed to upload {fileName} to Supabase Storage.',
  errorUnsupportedFileType: 'Unsupported file type. Allowed formats are PNG, JPEG, WebP, PDF, TXT, and Markdown.',
  errorUnsupportedFileTypeDocumentsOnly: 'Unsupported file type. Allowed formats are PDF, TXT, and Markdown.',
  errorImagesUnsupportedCurrentProvider: 'Images are not supported with the current AI provider. Use PDF, TXT, or Markdown files instead.',
  errorExtractReadableText: 'Failed to extract readable text from {fileName}.',
  errorLoadAttachmentFromStorage: 'Failed to load {fileName} from storage.',
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
  'Registration failed.': 'errorRegisterFailed',
  'Authentication is required.': 'errorAuthRequired',
  'Email is required.': 'errorEmailRequired',
  'Email address is invalid.': 'errorEmailInvalid',
  'Password is required.': 'errorPasswordRequired',
  'An account with this email already exists.': 'errorAccountExists',
  'Invalid email or password.': 'errorInvalidCredentials',
  'Failed to claim existing conversation history.': 'errorRegisterFailed',
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
  'Failed to generate a response from DeepSeek.': 'errorFailedDeepSeek',
  'DeepSeek returned an empty response.': 'errorDeepSeekEmpty',
  'Failed to remove attachments from storage.': 'errorRemoveAttachmentsStorage',
  'Every uploaded attachment must include a file name.': 'errorFileNameRequired',
  'Attachment validation failed.': 'errorAttachmentValidationFailed',
  'Unsupported file type. Allowed formats are PNG, JPEG, WebP, PDF, TXT, and Markdown.': 'errorUnsupportedFileType',
  'Unsupported file type. Allowed formats are PDF, TXT, and Markdown.': 'errorUnsupportedFileTypeDocumentsOnly',
  'Images are not supported with the current AI provider. Use PDF, TXT, or Markdown files instead.': 'errorImagesUnsupportedCurrentProvider',
  'DeepSeek only supports PDF, TXT, and Markdown attachments.': 'errorUnsupportedFileTypeDocumentsOnly'
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
    pattern: /^Failed to extract readable text from (.+)\.$/,
    resolve: (match) => ({
      key: 'errorExtractReadableText',
      params: {
        fileName: match[1] ?? ''
      }
    })
  },
  {
    pattern: /^Failed to load (.+) from storage\.$/,
    resolve: (match) => ({
      key: 'errorLoadAttachmentFromStorage',
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
    pattern: /^Password must be at least (\d+) characters\.$/,
    resolve: () => ({
      key: 'errorPasswordTooShort',
      params: {}
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

export function resolveUiTextForLocale(locale: UiLocale, key: UiTextKey, params: UiTextParams = {}) {
  const template = uiMessages[locale][key] ?? enMessages[key] ?? key

  return template.replace(/\{(\w+)\}/g, (_, paramKey: string) => {
    return String(params[paramKey] ?? `{${paramKey}}`)
  })
}

export function resolveUiText(locale: UiLocale, key: UiTextKey, params: UiTextParams = {}) {
  return resolveUiTextForLocale(locale, key, params)
}

export function resolveEnglishUiText(key: UiTextKey, params: UiTextParams = {}) {
  return resolveUiTextForLocale('en-US', key, params)
}

export function translateKnownErrorMessage(
  locale: UiLocale,
  message?: string | null,
  fallbackKey: UiTextKey = 'errorGeneric'
) {
  const normalizedMessage = message?.trim()

  if (!normalizedMessage) {
    return resolveUiTextForLocale(locale, fallbackKey)
  }

  const exactKey = EXACT_ERROR_MESSAGE_KEYS[normalizedMessage]

  if (exactKey) {
    return resolveUiTextForLocale(locale, exactKey)
  }

  for (const entry of ERROR_MESSAGE_PATTERNS) {
    const match = normalizedMessage.match(entry.pattern)

    if (match) {
      const { key, params } = entry.resolve(match)
      return resolveUiTextForLocale(locale, key, params)
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

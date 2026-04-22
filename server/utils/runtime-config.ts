import { createError } from 'h3'
import { normalizeModelProvider, type ModelProvider } from '#shared/constants/polargpt'

export interface PolarServerRuntimeConfig {
  sessionSecret: string
  supabaseUrl: string
  supabaseServiceRoleKey: string
  supabaseAnonKey: string
  aiProvider: ModelProvider
  geminiApiKey: string
  geminiModel: string
  deepseekApiKey: string
  deepseekModel: string
  appBaseUrl: string
}

function getProcessEnvValue(runtimeValue: string | undefined, plainKey: string, fallback = '') {
  return runtimeValue || process.env[plainKey] || fallback
}

export function getServerRuntimeConfig(): PolarServerRuntimeConfig {
  const runtimeConfig = useRuntimeConfig()

  return {
    sessionSecret: getProcessEnvValue(runtimeConfig.sessionSecret, 'SESSION_SECRET'),
    supabaseUrl: getProcessEnvValue(runtimeConfig.supabaseUrl, 'SUPABASE_URL'),
    supabaseServiceRoleKey: getProcessEnvValue(runtimeConfig.supabaseServiceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY'),
    supabaseAnonKey: getProcessEnvValue(runtimeConfig.supabaseAnonKey, 'SUPABASE_ANON_KEY'),
    aiProvider: normalizeModelProvider(getProcessEnvValue(runtimeConfig.aiProvider, 'AI_PROVIDER')),
    geminiApiKey: getProcessEnvValue(runtimeConfig.geminiApiKey, 'GEMINI_API_KEY'),
    geminiModel: getProcessEnvValue(runtimeConfig.geminiModel, 'GEMINI_MODEL'),
    deepseekApiKey: getProcessEnvValue(runtimeConfig.deepseekApiKey, 'DEEPSEEK_API_KEY'),
    deepseekModel: getProcessEnvValue(runtimeConfig.deepseekModel, 'DEEPSEEK_MODEL'),
    appBaseUrl: getProcessEnvValue(runtimeConfig.appBaseUrl, 'APP_BASE_URL', 'http://localhost:3000')
  }
}

/**
 * Runtime checks are centralized here so individual handlers can stay focused
 * on business logic and fail with a consistent 500 response shape.
 */
export function requireServerConfigValue<K extends keyof PolarServerRuntimeConfig>(key: K) {
  const config = getServerRuntimeConfig()
  const value = config[key]

  if (!value) {
    throw createError({
      statusCode: 500,
      statusMessage: `Missing required server configuration: ${key}`
    })
  }

  return value
}

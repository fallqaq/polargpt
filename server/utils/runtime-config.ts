import { createError } from 'h3'

export interface PolarServerRuntimeConfig {
  adminPasswordHash: string
  sessionSecret: string
  supabaseUrl: string
  supabaseServiceRoleKey: string
  supabaseAnonKey: string
  geminiApiKey: string
  geminiModel: string
  appBaseUrl: string
}

export function getServerRuntimeConfig(): PolarServerRuntimeConfig {
  const runtimeConfig = useRuntimeConfig()

  return {
    adminPasswordHash: runtimeConfig.adminPasswordHash,
    sessionSecret: runtimeConfig.sessionSecret,
    supabaseUrl: runtimeConfig.supabaseUrl,
    supabaseServiceRoleKey: runtimeConfig.supabaseServiceRoleKey,
    supabaseAnonKey: runtimeConfig.supabaseAnonKey,
    geminiApiKey: runtimeConfig.geminiApiKey,
    geminiModel: runtimeConfig.geminiModel,
    appBaseUrl: runtimeConfig.appBaseUrl
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

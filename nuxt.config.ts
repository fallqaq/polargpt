import {
  DEFAULT_AI_PROVIDER,
  DEFAULT_DEEPSEEK_MODEL,
  DEFAULT_GEMINI_MODEL
} from './shared/constants/polargpt'

/**
 * Accept both Nuxt-style `NUXT_*` variables and the plain project-level names
 * documented in this repo so local `.env`, Vercel, and future environments can
 * share the same variable keys without extra remapping.
 */
function getEnvValue(nuxtKey: string, plainKey: string, fallback = '') {
  return process.env[nuxtKey] || process.env[plainKey] || fallback
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  runtimeConfig: {
    sessionSecret: getEnvValue('NUXT_SESSION_SECRET', 'SESSION_SECRET'),
    supabaseUrl: getEnvValue('NUXT_SUPABASE_URL', 'SUPABASE_URL'),
    supabaseServiceRoleKey: getEnvValue('NUXT_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'),
    supabaseAnonKey: getEnvValue('NUXT_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'),
    aiProvider: getEnvValue('NUXT_AI_PROVIDER', 'AI_PROVIDER', DEFAULT_AI_PROVIDER),
    geminiApiKey: getEnvValue('NUXT_GEMINI_API_KEY', 'GEMINI_API_KEY'),
    geminiModel: getEnvValue('NUXT_GEMINI_MODEL', 'GEMINI_MODEL', DEFAULT_GEMINI_MODEL),
    deepseekApiKey: getEnvValue('NUXT_DEEPSEEK_API_KEY', 'DEEPSEEK_API_KEY'),
    deepseekModel: getEnvValue('NUXT_DEEPSEEK_MODEL', 'DEEPSEEK_MODEL', DEFAULT_DEEPSEEK_MODEL),
    appBaseUrl: getEnvValue('NUXT_APP_BASE_URL', 'APP_BASE_URL', 'http://localhost:3000'),
    public: {
      appName: 'PolarGPT',
      aiProvider: getEnvValue('NUXT_AI_PROVIDER', 'AI_PROVIDER', DEFAULT_AI_PROVIDER)
    }
  },
  app: {
    head: {
      title: 'PolarGPT',
      meta: [
        {
          name: 'description',
          content: 'A focused multi-user AI chat console powered by Nuxt, Supabase, and configurable model providers.'
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        }
      ]
    }
  },
  nitro: {
    timing: true,
    compressPublicAssets: true,
    routeRules: {
      '/_nuxt/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      },
      '/api/**': {
        headers: {
          'cache-control': 'no-store'
        }
      }
    }
  },
  typescript: {
    strict: true
  }
})

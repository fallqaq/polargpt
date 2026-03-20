import { DEFAULT_GEMINI_MODEL } from './shared/constants/polargpt'

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
  devtools: { enabled: true },
  runtimeConfig: {
    adminPasswordHash: getEnvValue('NUXT_ADMIN_PASSWORD_HASH', 'ADMIN_PASSWORD_HASH'),
    sessionSecret: getEnvValue('NUXT_SESSION_SECRET', 'SESSION_SECRET'),
    supabaseUrl: getEnvValue('NUXT_SUPABASE_URL', 'SUPABASE_URL'),
    supabaseServiceRoleKey: getEnvValue('NUXT_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'),
    supabaseAnonKey: getEnvValue('NUXT_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'),
    geminiApiKey: getEnvValue('NUXT_GEMINI_API_KEY', 'GEMINI_API_KEY'),
    geminiModel: getEnvValue('NUXT_GEMINI_MODEL', 'GEMINI_MODEL', DEFAULT_GEMINI_MODEL),
    appBaseUrl: getEnvValue('NUXT_APP_BASE_URL', 'APP_BASE_URL', 'http://localhost:3000'),
    public: {
      appName: 'polarGPT'
    }
  },
  app: {
    head: {
      title: 'polarGPT',
      meta: [
        {
          name: 'description',
          content: 'A focused single-admin AI chat console powered by Nuxt, Supabase, and Gemini.'
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        }
      ]
    }
  },
  typescript: {
    strict: true
  }
})

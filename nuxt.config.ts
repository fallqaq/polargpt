import { DEFAULT_GEMINI_MODEL } from './shared/constants/polargpt'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  runtimeConfig: {
    adminPasswordHash: '',
    sessionSecret: '',
    supabaseUrl: '',
    supabaseServiceRoleKey: '',
    supabaseAnonKey: '',
    geminiApiKey: '',
    geminiModel: DEFAULT_GEMINI_MODEL,
    appBaseUrl: 'http://localhost:3000',
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

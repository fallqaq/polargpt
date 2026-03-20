import type { AdminSessionPayload } from '../utils/admin-session'

declare module 'h3' {
  interface H3EventContext {
    adminSession?: AdminSessionPayload
  }
}

export {}

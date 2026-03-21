import type { AdminSessionPayload } from '../utils/admin-session'
import type { RequestMetrics } from '../utils/request-metrics'

declare module 'h3' {
  interface H3EventContext {
    adminSession?: AdminSessionPayload
    requestMetrics?: RequestMetrics
  }
}

export {}

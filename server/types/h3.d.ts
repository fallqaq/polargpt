import type { UserSessionPayload } from '../utils/user-session'
import type { RequestMetrics } from '../utils/request-metrics'

declare module 'h3' {
  interface H3EventContext {
    userSession?: UserSessionPayload
    requestMetrics?: RequestMetrics
  }
}

export {}

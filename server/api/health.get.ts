import { APP_NAME } from '#shared/constants/polargpt'

/**
 * Public health endpoint for deployment smoke tests and uptime checks. It
 * avoids exposing secrets while still providing a stable readiness signal.
 */
export default defineEventHandler(() => {
  return {
    ok: true,
    app: APP_NAME,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    timestamp: new Date().toISOString()
  }
})

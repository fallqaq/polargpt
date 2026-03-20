import { ADMIN_HINT_COOKIE_NAME } from '#shared/constants/polargpt'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) {
    return
  }

  const hasAdminHint = useCookie<string | null>(ADMIN_HINT_COOKIE_NAME)

  if (!hasAdminHint.value) {
    return navigateTo('/login')
  }
})

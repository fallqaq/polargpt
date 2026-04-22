import { USER_HINT_COOKIE_NAME } from '#shared/constants/polargpt'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.dev && to.query.preview === '1') {
    return
  }

  if (import.meta.server) {
    return
  }

  const hasUserHint = useCookie<string | null>(USER_HINT_COOKIE_NAME)

  if (!hasUserHint.value) {
    return navigateTo('/login')
  }
})

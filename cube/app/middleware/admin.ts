/**
 * Exige rol lead o admin.
 *
 * Igual que `auth`: evita que alguien llegue a una pantalla vacía, pero la
 * autorización real la aplica `requireRole()` en cada endpoint.
 */
export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchUser, isLead } = useAuth()

  if (!user.value) await fetchUser()

  if (!user.value) return navigateTo('/login')
  if (!isLead.value) return navigateTo('/dashboard')
})

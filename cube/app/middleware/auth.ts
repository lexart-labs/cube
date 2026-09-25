/**
 * Exige sesión para entrar en una página.
 *
 * Es comodidad de navegación, no seguridad: cualquiera puede saltarse el
 * middleware del cliente. Lo que protege los datos es el middleware del
 * servidor, que deniega toda petición a `/api` sin sesión.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()

  if (!user.value) await fetchUser()

  if (!user.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})

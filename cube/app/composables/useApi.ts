/**
 * Acceso a la API con manejo de errores homogéneo.
 *
 * El servidor devuelve siempre `{ statusCode, message, requestId }`
 * (ver server/utils/errors.ts), así que aquí solo hay que extraer el mensaje
 * —que ya viene escrito para personas— y actuar sobre el 401.
 */
export function apiErrorMessage(error: unknown): string {
  const data = (error as { data?: { message?: string; data?: { message?: string } } })?.data
  return (
    data?.data?.message ??
    data?.message ??
    (error as { statusMessage?: string })?.statusMessage ??
    'No se pudo completar la operación'
  )
}

export function useApi() {
  const { user, loaded } = useAuth()

  /**
   * En SSR hay que reenviar las cabeceras de la petición entrante, o la cookie
   * de sesión no viaja y toda llamada responde 401 — que aquí, además, borra el
   * usuario del estado en pleno render. Ver `useAuth`.
   */
  const fetcher = useRequestFetch()

  /**
   * Envoltorio de la petición que ante un 401 limpia la sesión local y lleva al
   * login. Sin esto, una sesión caducada deja la interfaz pintada con datos
   * que ya no se pueden refrescar.
   */
  async function request<T>(url: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    try {
      return (await fetcher(url, options)) as T
    } catch (error) {
      if ((error as { statusCode?: number })?.statusCode === 401) {
        user.value = null
        loaded.value = true
        if (import.meta.client && !url.includes('/api/auth/')) {
          await navigateTo('/login')
        }
      }
      throw error
    }
  }

  return { request }
}

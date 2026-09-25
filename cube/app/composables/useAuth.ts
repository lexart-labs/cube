/**
 * Estado de sesión en el cliente.
 *
 * El token NO vive aquí ni en `localStorage` (MED-01): está en una cookie
 * `httpOnly` que el JavaScript no puede leer. Esto solo guarda el perfil para
 * pintar la interfaz; la autorización real la decide siempre el servidor.
 */
export interface SessionUser {
  id: number
  name: string
  email: string
  role: 'developer' | 'lead' | 'admin'
  position?: string | null
  level?: string | null
}

export function useAuth() {
  const user = useState<SessionUser | null>('auth:user', () => null)
  const loaded = useState<boolean>('auth:loaded', () => false)

  /**
   * `$fetch` NO arrastra la cookie de sesión cuando se renderiza en el
   * servidor: la petición sale sin cabeceras y `/api/auth/me` responde 401
   * aunque la persona esté dentro. El efecto era que recargar cualquier página
   * protegida devolvía al login y la barra de navegación se pintaba vacía.
   *
   * `useRequestFetch()` reenvía las cabeceras de la petición entrante, así que
   * el servidor renderiza como el usuario que de verdad está pidiendo la
   * página. En el cliente devuelve el `$fetch` de siempre.
   */
  const request = useRequestFetch()

  /** Carga el perfil desde el servidor. Idempotente. */
  async function fetchUser(force = false): Promise<SessionUser | null> {
    if (loaded.value && !force) return user.value
    try {
      const { user: profile } = await request<{ user: SessionUser | null }>('/api/auth/me')
      user.value = profile
    } catch {
      // 401 es un resultado esperado, no un error que mostrar.
      user.value = null
    } finally {
      loaded.value = true
    }
    return user.value
  }

  async function login(email: string, password: string): Promise<SessionUser> {
    const { user: profile } = await request<{ user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    user.value = profile
    loaded.value = true
    return profile
  }

  async function logout(): Promise<void> {
    await request('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    user.value = null
    loaded.value = true
    await navigateTo('/login')
  }

  /**
   * Estos ayudantes solo controlan qué se PINTA. Cada endpoint vuelve a
   * comprobar el rol en el servidor: ocultar un botón no es una medida de
   * seguridad.
   */
  const isLead = computed(() => user.value?.role === 'lead' || user.value?.role === 'admin')
  const isAdmin = computed(() => user.value?.role === 'admin')

  return { user, loaded, fetchUser, login, logout, isLead, isAdmin }
}

/**
 * Autenticación global.
 *
 * Cierra HIGH-02 de Security.md. En v1 la autenticación se declaraba ruta por
 * ruta, y cuatro se quedaron sin ella (`routes/users.js:152,167,176,185`),
 * permitiendo leer y MODIFICAR datos sin sesión. Olvidar un middleware exponía
 * el endpoint.
 *
 * Aquí es al revés: se aplica a todo `/api` salvo lo que figure explícitamente
 * en la allow-list. Olvidar declarar algo deniega, no expone.
 *
 * También cierra CRIT-07: este middleware es el ÚNICO sitio donde se establece
 * la identidad, y lo hace desde la cookie de sesión. Los handlers leen
 * `event.context.user`; ninguno vuelve a mirar las cabeceras `user-id`,
 * `token` o `company_slug` que v1 aceptaba del cliente.
 *
 * Un único dominio de identidad: `event.context.user`, poblado desde la cookie
 * `cube_session`. La extranet de onboarding tenía el suyo (`context.candidate`,
 * cookie `cube_onboarding`); se retiró con el módulo (AD-06).
 */
import { defineEventHandler } from 'h3'
import { resolveSession } from '../utils/session'
import { unauthorized } from '../utils/errors'
import { EXTERNAL_API_PREFIX } from '../utils/apikey'

/**
 * Rutas accesibles sin sesión de Cube. Se comparan de forma exacta o por
 * prefijo declarado, nunca con `startsWith` a secas: `/api/auth/login-bypass`
 * no debe colarse por empezar igual que `/api/auth/login`.
 */
const PUBLIC_ROUTES: ReadonlyArray<{ method?: string; path: string; prefix?: boolean }> = [
  { method: 'POST', path: '/api/auth/login' },
  { method: 'GET', path: '/api/health' },
]

function isPublic(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route.method && route.method !== method) return false
    if (route.prefix) return path.startsWith(route.path)
    return path === route.path
  })
}

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''

  // Fuera de /api no hay nada que autenticar: las páginas se protegen en el
  // cliente y sus datos siempre vienen de /api, que sí pasa por aquí.
  if (!path.startsWith('/api/')) return

  /**
   * La API externa no se autentica con sesión sino con clave, y de eso se
   * ocupa `02.external.ts`. Se sale ANTES de resolver la cookie, no después:
   * si aquí se poblara `event.context.user` porque quien llama resulta tener
   * además una sesión de Cube en el navegador, los dos dominios de identidad
   * quedarían solapados en la misma petición y bastaría una comprobación
   * olvidada en un handler externo para actuar como esa persona.
   *
   * Que la ruta salga de aquí no la deja abierta: `02.external.ts` deniega
   * por defecto todo lo que hay bajo el prefijo.
   */
  if (path.startsWith(EXTERNAL_API_PREFIX)) return

  const user = await resolveSession(event)
  if (user) event.context.user = user

  if (isPublic(event.method, path)) return

  if (!user) throw unauthorized()
})

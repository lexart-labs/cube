/**
 * Abre el embebido en iframe a los orígenes declarados (NUXT_EMBED_ORIGINS).
 *
 * Por defecto nadie puede enmarcar a Cube: `nuxt.config.ts` declara
 * `frame-ancestors 'none'` y `X-Frame-Options: DENY`. Que la plataforma de
 * Lexart (`platform.lexart.tech`, `*.lexart.tech`) pueda cargarla en un iframe
 * es una decisión de despliegue, así que se declara por entorno, se valida en
 * el arranque (server/utils/config.ts) y sin valor el cierre de hoy se queda
 * exactamente igual.
 *
 * Las cabeceras no se tocan aquí a mano: las genera nuxt-security en
 * `render:response` a partir de las reglas que guarda en memoria, así que
 * reescribirlas competiría con él por ver quién escribe último. Se actualizan
 * esas reglas por los dos hooks que el módulo ofrece, y los DOS, porque el
 * orden de inicialización no se puede dar por seguro (hoy este plugin arranca
 * ANTES que el `00-routeRules` de nuxt-security, pero es un detalle del
 * escaneo de Nitro, no un contrato):
 *
 * · `nuxt-security:routeRules`, que nuxt-security dispara al terminar de
 *   montar sus reglas — nos vale si este plugin arrancó antes que él.
 *
 * · `nuxt-security:headers`, que actualiza las reglas ya montadas — nos vale
 *   si este plugin arrancó después.
 *
 * Si el orden cambia, uno de los dos se vuelve inofensivo; nunca los dos.
 * Ambos actualizan lo mismo y son idempotentes.
 *
 * Solo `frame-ancestors` y nada más a propósito:
 *
 * · El CORS no hace falta abrirlo: el iframe carga a Cube directamente y sus
 *   peticiones son same-origin respecto a Cube, no cross-origin desde la
 *   página que la enmarca.
 *
 * · La cookie de sesión tampoco se toca. Cube se despliega en un subdominio de
 *   lexart.tech, que es el MISMO sitio que la plataforma, así que la cookie
 *   `SameSite=Lax` viaja dentro del iframe tal cual (HIGH-09 sigue cerrada).
 *   En otro dominio habría que usar `SameSite=None`, y los navegadores están
 *   cerrando precisamente esa puerta: sería Storage Access API, no esto.
 */
import { embedOriginList } from '../utils/config'
import { logger } from '../utils/logger'

/** `frame-ancestors` para los orígenes declarados, con 'self' además. */
function frameAncestors(origins: readonly string[]) {
  // 'self': enmarcarse a sí mismo no deja de poder hacerse por abrir la
  // puerta a la plataforma.
  return ["'self'", ...origins]
}

/** Un cambio de X-Frame-Options coherente con abrir el marco. */
const FRAME_XFO = 'SAMEORIGIN'

export default defineNitroPlugin((nitroApp) => {
  const origins = embedOriginList(useRuntimeConfig().embedOrigins ?? '')
  if (origins.length === 0) return

  logger.info({ origins }, 'embebido en iframe habilitado para los orígenes declarados')

  // Vía 1: nuxt-security todavía no montó sus reglas; este handler se dispara
  // cuando las monte, con el objeto de reglas ya construido. Se fusiona
  // directiva a directiva: machacar el CSP entero dejaría la respuesta sin
  // `script-src`, sin `default-src`, sin nada.
  nitroApp.hooks.hook('nuxt-security:routeRules', (rules) => {
    // `headers` puede ser `false` (desactivadas para esa ruta): entonces no
    // hay nada que fusionar.
    const headers = rules['/**']?.headers
    if (!headers || typeof headers.contentSecurityPolicy === 'boolean') return

    const csp = (headers.contentSecurityPolicy ?? {}) as Record<string, unknown>
    csp['frame-ancestors'] = frameAncestors(origins)
    headers.contentSecurityPolicy = csp as typeof headers.contentSecurityPolicy
    headers.xFrameOptions = FRAME_XFO
  })

  // Vía 2: las reglas ya están montadas; el hook del módulo las fusiona con
  // defu, así que basta con pasar las directivas que cambian.
  void nitroApp.hooks.callHook('nuxt-security:headers', {
    route: '/**',
    headers: {
      contentSecurityPolicy: { 'frame-ancestors': frameAncestors(origins) },
      // X-Frame-Options no admite una lista de orígenes. Los navegadores
      // modernos lo ignoran cuando hay `frame-ancestors`, y para los que solo
      // entienden XFO queda al menos el propio origen: nada de DENY, que
      // contradiría la lista, ni de quitar la cabecera, que abriría el marco
      // a cualquiera en esos navegadores.
      xFrameOptions: FRAME_XFO,
    },
  })
})

/**
 * Puerta de la API externa (`/api/external/`).
 *
 * `01.auth.ts` no toca estas rutas: aquí no hay cookie ni sesión, y quien
 * llama es un sistema, no una persona. Este middleware es su equivalente y
 * funciona igual de estricto — **deniega por defecto**: cualquier ruta bajo el
 * prefijo exige una clave válida, activa, sin caducar y usada desde una IP o un
 * dominio declarados. Añadir un fichero a `server/api/external/` no expone
 * nada por sí solo.
 *
 * El resultado va a `event.context.apiClient`, que es un contexto distinto de
 * `event.context.user` y no se mezcla nunca con él: un cliente externo no
 * puede convertirse en usuario ni alcanzar la API interna. `requireApiKey()`
 * es la única forma de leerlo, y los invariantes lo comprueban.
 *
 * CORS se resuelve aquí y no en nuxt-security, que fija un único origen (el de
 * la propia aplicación) y no sabe nada de las listas por clave. `nuxt.config.ts`
 * desactiva su `corsHandler` para este prefijo justamente por eso.
 */
import {
  appendResponseHeader,
  defineEventHandler,
  getRequestHeader,
  setResponseHeader,
  setResponseStatus,
} from 'h3'
import type { H3Event } from 'h3'
import { query } from '../db'
import { authenticateApiKey, EXTERNAL_API_PREFIX } from '../utils/apikey'
import { domainMatchesAny, hostFromOrigin } from '../utils/netmatch'
import { scopedLogger } from '../utils/logger'

const log = scopedLogger('external')

/** Cabeceras que un cliente puede mandar. Sin cookies: la API no las usa. */
const ALLOWED_HEADERS = 'Content-Type, X-API-Key, Authorization'
const ALLOWED_METHODS = 'GET, POST, OPTIONS'
const PREFLIGHT_MAX_AGE = 600

/**
 * ¿Hay alguna clave viva que admita este origen?
 *
 * El preflight no lleva cabeceras propias —el navegador no manda `X-API-Key`
 * en el OPTIONS—, así que no se puede saber *qué* clave se va a usar. Se
 * responde si el origen está en la lista de alguna clave activa, y la llamada
 * de verdad, que sí lleva el token, vuelve a comprobarlo todo contra la suya.
 *
 * Esto no adelanta ningún permiso: el preflight no transporta datos y su
 * respuesta solo le dice al navegador que puede intentarlo.
 */
async function originAllowedByAnyKey(originHost: string): Promise<boolean> {
  const rows = await query<{ pattern: string }>(
    `SELECT a.pattern
     FROM api_key_allowlist a
     INNER JOIN api_keys k ON k.id = a.api_key_id
     WHERE a.kind = 'domain'
       AND k.active = 1
       AND (k.expires_at IS NULL OR k.expires_at > NOW())`,
  )
  return domainMatchesAny(
    rows.map((row) => row.pattern),
    originHost,
  )
}

/**
 * Cabeceras CORS de una respuesta permitida.
 *
 * Nunca `Access-Control-Allow-Credentials`: la API externa se autentica con un
 * token en una cabecera, no con cookies, y permitir credenciales abriría la
 * puerta a que el navegador de alguien con sesión de Cube adjuntara la suya.
 */
function allowOrigin(event: H3Event, origin: string): void {
  setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
  setResponseHeader(event, 'Access-Control-Allow-Methods', ALLOWED_METHODS)
  setResponseHeader(event, 'Access-Control-Allow-Headers', ALLOWED_HEADERS)
  setResponseHeader(event, 'Access-Control-Max-Age', PREFLIGHT_MAX_AGE)
}

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!path.startsWith(EXTERNAL_API_PREFIX)) return

  const origin = getRequestHeader(event, 'origin') ?? null
  const originHost = hostFromOrigin(origin)

  // La respuesta depende del origen: sin esto, una caché intermedia podría
  // servirle a un origen la respuesta que se calculó para otro. Se AÑADE en vez
  // de fijarse, para no pisar el `Vary: accept-encoding` que pone la compresión.
  appendResponseHeader(event, 'Vary', 'Origin')

  /**
   * Las cabeceras CORS se ponen antes de autenticar, y también cuando la
   * llamada va a fallar. Si no, el navegador oculta el cuerpo del error y el
   * integrador ve un fallo de CORS opaco en lugar de «esa IP no está
   * autorizada» — que es justo lo que necesita leer para arreglarlo.
   */
  const corsAllowed = originHost !== null && (await originAllowedByAnyKey(originHost))
  if (corsAllowed && origin) allowOrigin(event, origin)

  if (event.method === 'OPTIONS') {
    if (!corsAllowed) {
      log.warn({ originHost }, 'preflight de un origen no autorizado')
      // Sin cabeceras CORS: el navegador bloqueará la llamada real. 204 y no
      // 403 porque un preflight no es una petición del usuario y su cuerpo no
      // se lee nunca.
      setResponseStatus(event, 204)
      return null
    }
    setResponseStatus(event, 204)
    return null
  }

  event.context.apiClient = await authenticateApiKey(event)
})

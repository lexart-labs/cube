/**
 * Claves de la API externa.
 *
 * Este es el segundo modo de acceso a Cube y el único que no es una persona.
 * Existe porque la plataforma de Lexart tiene que poder dar de alta usuarios
 * sin que nadie entre a `/admin/users` (AD-06 movió allí el onboarding).
 *
 * Reglas que lo mantienen separado de la sesión, y que son el motivo de que
 * esto sea un módulo aparte y no una rama dentro de `session.ts`:
 *
 * · **Una clave NUNCA es un usuario.** No pone `event.context.user`, no pasa
 *   por `requireUser` y no alcanza ningún endpoint de la API interna. Vive
 *   bajo `/api/external/` y solo ahí. Es la misma lección de la extranet de
 *   onboarding (AD-06): un segundo dominio de identidad que pudiera colarse en
 *   el primero convierte cualquier comprobación olvidada en una escalada.
 *
 * · **El token solo existe una vez.** En la base va su SHA-256, como en
 *   `sessions`. Si se pierde, se crea otra y se desactiva la anterior; no hay
 *   forma de recuperarlo y así debe ser.
 *
 * · **Tener el token no basta.** Hay que venir además de una IP o un dominio
 *   declarados, y de fábrica no hay ninguno: una clave recién creada no
 *   funciona desde ningún sitio (ver `evaluateAccess` en `netmatch.ts`).
 *
 * · **Los permisos son explícitos.** Sin `scopes` la clave se autentica y no
 *   puede hacer nada.
 */
import { randomBytes, createHash } from 'node:crypto'
import { getRequestHeader, type H3Event } from 'h3'
import { query, queryOne, execute } from '../db'
import { unauthorized, forbidden } from './errors'
import { enforceRateLimit } from './ratelimit'
import { scopedLogger } from './logger'
import {
  evaluateAccess,
  hostFromOrigin,
  pickClientIp,
  type Allowlist,
  type DenyReason,
} from './netmatch'

const log = scopedLogger('apikey')

/** Prefijo de todos los tokens. Sirve para reconocerlos en un grep o en un leak. */
export const TOKEN_PREFIX = 'cube'

/**
 * Longitud de la parte pública del token, la que se muestra y se registra.
 * Va en hexadecimal, así que son la mitad de bytes; `CHAR(12)` en el esquema.
 */
const PUBLIC_PREFIX_LENGTH = 12

/** Ruta bajo la que vive la API externa. Todo lo demás exige sesión. */
export const EXTERNAL_API_PREFIX = '/api/external/'

/**
 * Permisos que se pueden conceder a una clave.
 *
 * Deliberadamente corta: cada entrada es una capacidad que un sistema externo
 * obtiene sobre Cube. Añadir una es una decisión, no un detalle.
 */
export const API_SCOPES = ['users:create'] as const
export type ApiScope = (typeof API_SCOPES)[number]

export function isApiScope(value: string): value is ApiScope {
  return (API_SCOPES as readonly string[]).includes(value)
}

/**
 * Quien llama, una vez autenticado. No es un `SessionUser` ni se le parece: no
 * tiene id de usuario, ni rol, ni sesión.
 */
export interface ApiClient {
  id: number
  name: string
  prefix: string
  scopes: ApiScope[]
  /** IP con la que superó la lista, para poder auditarla y devolverla. */
  ip: string | null
  /** Host de la cabecera Origin, si venía de un navegador. */
  originHost: string | null
}

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

export function hashApiKey(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

/**
 * Genera una clave nueva.
 *
 * Formato: `cube_<prefijo>_<secreto>`. El prefijo es público y se guarda en
 * claro para poder identificar la clave en la lista, en los logs y en la
 * auditoría; el secreto son 32 bytes de `randomBytes` y de él solo se guarda
 * el hash.
 *
 * El formato con separadores no es decorativo: permite que un escáner de
 * secretos reconozca un token de Cube filtrado en un repositorio, que es
 * exactamente lo que le pasó a v1 (Security.md §8).
 *
 * El prefijo va en hexadecimal y el secreto en base64url a propósito: el
 * alfabeto de base64url incluye el guión bajo, así que un prefijo en base64url
 * podría llevar el propio separador dentro y partir el token por donde no es.
 */
export function generateApiKey(): { token: string; prefix: string; tokenHash: string } {
  const prefix = randomBytes(PUBLIC_PREFIX_LENGTH / 2).toString('hex')
  const secret = randomBytes(32).toString('base64url')
  const token = `${TOKEN_PREFIX}_${prefix}_${secret}`
  return { token, prefix, tokenHash: hashApiKey(token) }
}

/**
 * Extrae el token de la petición.
 *
 * Se aceptan las dos formas que usa todo el mundo, `X-API-Key` y
 * `Authorization: Bearer`, para no obligar a nadie a reescribir su cliente.
 * Ambas están en la lista de redacción del logger.
 */
export function extractToken(event: H3Event): string | null {
  const header = getRequestHeader(event, 'x-api-key')
  if (header && header.trim().length > 0) return header.trim()

  const authorization = getRequestHeader(event, 'authorization')
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)
  if (bearer) return bearer[1]!.trim()

  return null
}

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------

interface ApiKeyRow {
  id: number
  name: string
  prefix: string
  scopes: string
  active: number
  expired: number
}

/** Convierte la columna `scopes` en una lista, descartando lo que no reconoce. */
export function parseScopes(raw: string): ApiScope[] {
  return raw
    .split(',')
    .map((scope) => scope.trim())
    .filter(isApiScope)
}

/** Lista de acceso de una clave, separada por canal. */
async function loadAllowlist(apiKeyId: number): Promise<Allowlist> {
  const rows = await query<{ kind: 'ip' | 'domain'; pattern: string }>(
    'SELECT kind, pattern FROM api_key_allowlist WHERE api_key_id = ?',
    [apiKeyId],
  )
  return {
    ips: rows.filter((row) => row.kind === 'ip').map((row) => row.pattern),
    domains: rows.filter((row) => row.kind === 'domain').map((row) => row.pattern),
  }
}

/** Proxies de confianza declarados en `NUXT_TRUSTED_PROXIES`. */
function trustedProxies(): string[] {
  const configured = useRuntimeConfig().trustedProxies as string | string[] | undefined
  if (Array.isArray(configured)) return configured
  return (configured ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

/**
 * IP real de quien llama.
 *
 * No se usa `getRequestIP(event, { xForwardedFor: true })`: coge el primer
 * valor de una cabecera que escribe el cliente, así que con ella la lista de
 * IPs se saltaría mandando `X-Forwarded-For: 10.0.0.5`. Ver `pickClientIp`.
 */
export function clientIp(event: H3Event): string | null {
  const socket = event.node?.req?.socket?.remoteAddress ?? null
  return pickClientIp(socket, getRequestHeader(event, 'x-forwarded-for') ?? null, trustedProxies())
}

/** Host de la cabecera Origin. `Referer` NO se usa: es trivial de omitir. */
export function requestOriginHost(event: H3Event): string | null {
  return hostFromOrigin(getRequestHeader(event, 'origin'))
}

/** Mensaje para el integrador, según por qué se le ha bloqueado. */
function denyMessage(reason: DenyReason, ip: string | null, originHost: string | null): string {
  switch (reason) {
    case 'sin_listas':
      return 'Esta clave no tiene ninguna IP ni dominio autorizados, así que está bloqueada. Añádelos en Cube, en Administración → API externa.'
    case 'sin_origen':
      return 'Esta clave solo admite llamadas desde un navegador (tiene dominios autorizados, pero ninguna IP). Añade la IP del servidor que llama.'
    case 'origen_no_permitido':
      return `El origen ${originHost ?? 'desconocido'} no está autorizado para esta clave.`
    case 'ip_desconocida':
      return 'No se ha podido determinar la IP de origen, y esta clave exige una IP autorizada.'
    case 'ip_no_permitida':
      return `La IP ${ip ?? 'desconocida'} no está autorizada para esta clave.`
  }
}

/**
 * Autentica la petición y comprueba la lista de acceso.
 *
 * Lanza 401 si el token falta o no vale, y 403 si el token vale pero la
 * petición no viene de un sitio autorizado.
 *
 * La diferencia entre los dos mensajes es intencionada: con un token inválido
 * no se dice nada —no se confirma siquiera que el prefijo exista—, mientras
 * que a quien ya demostró tener una clave válida se le dice exactamente qué
 * IP u origen se ha visto. Sin eso, configurar una lista de acceso a ciegas es
 * un via crucis, y el via crucis acaba siempre en `0.0.0.0/0`.
 */
export async function authenticateApiKey(event: H3Event): Promise<ApiClient> {
  const ip = clientIp(event)
  const originHost = requestOriginHost(event)
  const bucket = ip ?? 'desconocida'

  // Techo general por IP. El global de nuxt-security es por proceso; este
  // impide que un solo llamante se lo coma entero.
  enforceRateLimit(`apikey:ip:${bucket}`, { max: 120, windowMs: 60_000 })

  const token = extractToken(event)
  if (!token) {
    throw unauthorized('Falta la cabecera X-API-Key.')
  }

  const row = await queryOne<ApiKeyRow>(
    `SELECT id, name, prefix, scopes, active,
            (expires_at IS NOT NULL AND expires_at <= NOW()) AS expired
     FROM api_keys
     WHERE token_hash = ?`,
    [hashApiKey(token)],
  )

  if (!row || row.active !== 1 || Number(row.expired) === 1) {
    // Se cuenta el fallo antes de responder: es la defensa contra alguien que
    // pruebe tokens en bucle. Con retroceso exponencial, el segundo intento
    // masivo ya no es viable.
    enforceRateLimit(`apikey:invalida:${bucket}`, {
      max: 10,
      windowMs: 15 * 60_000,
      backoff: true,
    })
    log.warn({ ip, originHost, conocida: Boolean(row) }, 'clave de API rechazada')
    throw unauthorized('La clave de API no es válida.')
  }

  const allowlist = await loadAllowlist(row.id)
  const decision = evaluateAccess(allowlist, { ip, originHost })

  if (!decision.allowed) {
    log.warn(
      { apiKeyId: row.id, prefix: row.prefix, ip, originHost, reason: decision.reason },
      'clave de API bloqueada por la lista de acceso',
    )
    throw forbidden(denyMessage(decision.reason, ip, originHost))
  }

  // Marca de uso, para poder ver qué claves siguen vivas y cuáles sobran. Se
  // escribe como mucho una vez por minuto: la condición va dentro del propio
  // UPDATE para no gastar una lectura extra en cada petición.
  await execute(
    `UPDATE api_keys
     SET last_used_at = NOW(), last_used_ip = ?
     WHERE id = ? AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL 1 MINUTE)`,
    [ip ? Buffer.from(ip.slice(0, 16), 'utf8') : null, row.id],
  ).catch((error: unknown) => {
    // Que no se pueda anotar el uso no es motivo para rechazar la llamada.
    log.error({ err: error, apiKeyId: row.id }, 'no se pudo anotar el uso de la clave')
  })

  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    scopes: parseScopes(row.scopes),
    ip,
    originHost,
  }
}

// ---------------------------------------------------------------------------
// Uso desde los handlers
// ---------------------------------------------------------------------------

/**
 * Cliente externo de la petición, con el permiso exigido.
 *
 * Es a `/api/external/` lo que `requireRole` a la API interna: **la
 * declaración de la política de acceso del handler**, y un invariante
 * comprueba que ningún handler de ahí se quede sin ella
 * (`tests/unit/invariants.test.ts`).
 *
 * No vuelve a autenticar: el middleware ya lo hizo y denegó por defecto. Si
 * aquí no hay cliente es que el handler está fuera de `/api/external/`, y
 * entonces lo correcto es no responder, no improvisar una autenticación.
 */
export function requireApiKey(event: H3Event, scope?: ApiScope): ApiClient {
  const client = event.context.apiClient as ApiClient | undefined
  if (!client) throw unauthorized('La clave de API no es válida.')

  if (scope && !client.scopes.includes(scope)) {
    throw forbidden(`Esta clave no tiene el permiso «${scope}».`)
  }

  return client
}

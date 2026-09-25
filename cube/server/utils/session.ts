/**
 * Sesiones opacas respaldadas en base de datos.
 *
 * Cierra HIGH-03 de Security.md. v1 emitía JWT de 365 días con el usuario
 * completo en el payload y sin lista de revocación: cambiar la contraseña,
 * desactivar la cuenta o dar de baja a alguien NO invalidaba los tokens ya
 * emitidos.
 *
 * Decisión: token opaco en vez de JWT corto + refresh rotativo, que es lo que
 * planteaba el Roadmap. Con un JWT de 15 minutos el logout no es inmediato —
 * queda una ventana en la que el token sigue siendo válido—, y el reproche
 * central a v1 era precisamente la imposibilidad de revocar. Un token opaco da
 * revocación instantánea, elimina la dependencia de JWT (y con ella el riesgo
 * de confusión de algoritmo) y a esta escala una lectura indexada por petición
 * es irrelevante.
 *
 * El token en claro solo existe en la cookie del cliente; en la base se guarda
 * su SHA-256, así que un volcado de `sessions` no permite suplantar a nadie.
 */
import { randomBytes, createHash, randomUUID } from 'node:crypto'
import {
  getCookie,
  setCookie,
  deleteCookie,
  getRequestIP,
  getRequestHeader,
  type H3Event,
} from 'h3'
import { query, queryOne, execute } from '../db'
import { scopedLogger } from './logger'

const log = scopedLogger('session')

/** Nombre de la cookie. El prefijo `__Host-` exige HTTPS, ruta `/` y sin Domain. */
export const SESSION_COOKIE = 'cube_session'

/** Caducidad absoluta: la sesión muere a las 8 horas pase lo que pase. */
const ABSOLUTE_TTL_MS = 8 * 60 * 60 * 1000

/** Caducidad por inactividad. */
const IDLE_TTL_MS = 2 * 60 * 60 * 1000

/** Cada cuánto se refresca `last_seen_at`, para no escribir en cada petición. */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000

export interface SessionUser {
  id: number
  name: string
  email: string
  role: 'developer' | 'lead' | 'admin'
  sessionId: string
}

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

/** Serializa una IP para `VARBINARY(16)`; null si no se puede determinar. */
function packIp(event: H3Event): Buffer | null {
  const raw = getRequestIP(event, { xForwardedFor: true })
  if (!raw) return null
  // Se guarda el texto recortado: suficiente para auditoría y evita depender
  // de la familia de direcciones.
  return Buffer.from(raw.slice(0, 16), 'utf8')
}

/**
 * Crea una sesión y devuelve el token en claro, que solo se escribe en la
 * cookie. No se registra en ningún log.
 */
export async function createSession(event: H3Event, userId: number): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  const sessionId = randomUUID()
  const expiresAt = new Date(Date.now() + ABSOLUTE_TTL_MS)

  await execute(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      userId,
      hashToken(token),
      expiresAt,
      (getRequestHeader(event, 'user-agent') ?? '').slice(0, 255) || null,
      packIp(event),
    ],
  )

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true, // inaccesible desde JavaScript: un XSS no puede robarla (MED-01)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // neutraliza CSRF entre sitios por diseño (HIGH-09)
    path: '/',
    expires: expiresAt,
  })

  log.info({ userId, sessionId }, 'sesión creada')
  return token
}

/**
 * Resuelve la sesión de la petición.
 * Devuelve `null` si no hay cookie, si la sesión no existe, está revocada,
 * caducada o inactiva demasiado tiempo.
 */
export async function resolveSession(event: H3Event): Promise<SessionUser | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null

  const row = await queryOne<{
    session_id: string
    last_seen_at: string
    id: number
    name: string
    email: string
    role: 'developer' | 'lead' | 'admin'
  }>(
    `SELECT s.id AS session_id, s.last_seen_at,
            u.id, u.name, u.email, u.role
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?
       AND s.revoked_at IS NULL
       AND s.expires_at > NOW()
       AND u.active = 1`,
    [hashToken(token)],
  )

  if (!row) return null

  const lastSeen = new Date(row.last_seen_at).getTime()
  if (Date.now() - lastSeen > IDLE_TTL_MS) {
    await revokeSession(row.session_id)
    return null
  }

  // Se escribe solo de vez en cuando: una escritura por petición sería
  // innecesaria y convertiría cada GET en una operación de escritura.
  if (Date.now() - lastSeen > TOUCH_INTERVAL_MS) {
    await execute('UPDATE sessions SET last_seen_at = NOW() WHERE id = ?', [row.session_id])
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    sessionId: row.session_id,
  }
}

export async function revokeSession(sessionId: string): Promise<void> {
  await execute('UPDATE sessions SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL', [
    sessionId,
  ])
}

/** Cierra todas las sesiones de un usuario. Se usa al cambiar la contraseña. */
export async function revokeAllSessions(userId: number): Promise<number> {
  const result = await execute(
    'UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
    [userId],
  )
  return result.affectedRows
}

export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

/** Purga sesiones caducadas. Pensado para una tarea periódica. */
export async function purgeExpiredSessions(): Promise<number> {
  const result = await execute(
    'DELETE FROM sessions WHERE expires_at < NOW() OR revoked_at < DATE_SUB(NOW(), INTERVAL 7 DAY)',
  )
  return result.affectedRows
}

/** Sesiones activas de un usuario, para poder mostrarlas y cerrarlas. */
export async function listActiveSessions(userId: number) {
  return query(
    `SELECT id, user_agent, created_at, last_seen_at, expires_at
     FROM sessions
     WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY last_seen_at DESC`,
    [userId],
  )
}

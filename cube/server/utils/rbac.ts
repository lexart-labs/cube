/**
 * Autorización por rol.
 *
 * Cierra HIGH-01 de Security.md: en v1 ningún endpoint comprobaba
 * `req.user.type`. El middleware distinguía "autenticado" de "anónimo", pero no
 * "desarrollador" de "administrador", así que cualquier usuario con sesión
 * válida entraba en la administración completa.
 *
 * Y cierra CRIT-07: la identidad sale SIEMPRE de `event.context.user`, que
 * puebla el middleware a partir de la cookie firmada. Ningún handler vuelve a
 * leer `user-id` de las cabeceras, que es como v1 dejaba que cualquiera actuara
 * en nombre de otro cambiando un número.
 */
import type { H3Event } from 'h3'
import type { SessionUser } from './session'
import { unauthorized, forbidden, notFound } from './errors'

export type Role = 'developer' | 'lead' | 'admin'

/** Jerarquía: un admin cumple cualquier requisito de lead o developer. */
const RANK: Record<Role, number> = { developer: 0, lead: 1, admin: 2 }

/**
 * Usuario autenticado de la petición.
 * Lanza 401 si no lo hay: es la forma de exigir sesión en un handler.
 */
export function requireUser(event: H3Event): SessionUser {
  const user = event.context.user as SessionUser | undefined
  if (!user) throw unauthorized()
  return user
}

/**
 * Exige un rol mínimo. Se declara explícitamente en cada handler de
 * administración; omitirlo deja el endpoint solo autenticado, nunca abierto,
 * porque el middleware global ya exige sesión salvo en la allow-list.
 */
export function requireRole(event: H3Event, minimum: Role): SessionUser {
  const user = requireUser(event)
  if (RANK[user.role] < RANK[minimum]) {
    throw forbidden()
  }
  return user
}

/** `true` si el usuario puede ver o tocar recursos de otras personas. */
export function canActOnOthers(user: SessionUser): boolean {
  return RANK[user.role] >= RANK.lead
}

/**
 * Comprueba acceso a un recurso de un usuario concreto.
 * Un developer solo accede a lo suyo; lead y admin, a lo de cualquiera.
 */
export function assertCanAccessUser(actor: SessionUser, targetUserId: number): void {
  if (actor.id === targetUserId) return
  if (canActOnOthers(actor)) return
  // 404 y no 403: un 403 confirmaría que ese usuario existe, que es la mitad
  // de un IDOR. Quien no tiene acceso no debe poder distinguir "no puedes"
  // de "no existe".
  throw notFound()
}

/**
 * Registro de auditoría.
 *
 * Cierra LOW-06 de Security.md: v1 no dejaba rastro de las acciones
 * administrativas. No había forma de saber quién aprobó a un candidato, quién
 * cambió un rol ni quién borró a un usuario — y `DELETE /onboarding/users/:id`
 * ni siquiera exigía autenticación real (CRIT-01).
 *
 * Solo se añade: nunca se actualiza ni se borra desde la aplicación.
 */
import { getRequestIP, type H3Event } from 'h3'
import { execute } from '../db'
import { scopedLogger } from './logger'
import type { SessionUser } from './session'

const log = scopedLogger('audit')

export type AuditAction =
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'auth.password_rehashed'
  | 'evaluation.create'
  | 'evaluation.generate'
  | 'evaluation.update'
  // "Eliminar" es desactivar (regla 9): la fila sigue ahí y se puede
  // restaurar, así que las dos acciones son simétricas y se registran aparte.
  | 'evaluation.delete'
  | 'evaluation.restore'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  // Catálogos. Antes reutilizaban 'user.update', y entonces la auditoría no
  // distinguía "cambió de rol a alguien" de "renombró un nivel".
  | 'catalog.create'
  | 'catalog.update'
  // API externa. `external.user_create` no lleva actor —no hay persona
  // detrás—, así que la clave que lo hizo va en `metadata`: sin eso, un alta
  // por API sería la única acción de Cube sin responsable identificable.
  | 'apikey.create'
  | 'apikey.update'
  | 'external.user_create'

/**
 * Escribe una entrada de auditoría.
 *
 * Nunca lanza: que falle la auditoría no debe tumbar la operación que se está
 * auditando. El fallo sí se registra, para que no pase inadvertido.
 */
export async function audit(
  event: H3Event,
  params: {
    action: AuditAction
    resource: string
    resourceId?: string | number | null
    actor?: SessionUser | null
    metadata?: Record<string, unknown>
  },
): Promise<void> {
  const actor = params.actor ?? (event.context.user as SessionUser | undefined) ?? null

  try {
    const ip = getRequestIP(event, { xForwardedFor: true })
    await execute(
      `INSERT INTO audit_log (actor_id, action, resource, resource_id, metadata, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        actor?.id ?? null,
        params.action,
        params.resource,
        params.resourceId != null ? String(params.resourceId) : null,
        params.metadata ? JSON.stringify(params.metadata) : null,
        ip ? Buffer.from(ip.slice(0, 16), 'utf8') : null,
      ],
    )
  } catch (error) {
    log.error({ err: error, action: params.action }, 'no se pudo escribir la auditoría')
  }
}

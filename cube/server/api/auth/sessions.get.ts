/**
 * Sesiones activas del usuario.
 *
 * Existe porque la revocación real solo sirve si la persona puede ver dónde
 * tiene la sesión abierta. v1 no podía ofrecer ni una cosa ni la otra.
 */
import { defineEventHandler } from 'h3'
import { requireUser } from '../../utils/rbac'
import { listActiveSessions } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const sessions = await listActiveSessions(user.id)

  return {
    sessions: (sessions as Record<string, unknown>[]).map((session) => ({
      ...session,
      // Para que el cliente pueda marcar "esta es la actual" sin exponer ids
      // de otras sesiones como algo accionable.
      current: session.id === user.sessionId,
    })),
  }
})

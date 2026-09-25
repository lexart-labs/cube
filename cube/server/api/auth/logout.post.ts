/**
 * Cierre de sesión.
 *
 * Con la sesión opaca esto es una revocación real e inmediata: la fila queda
 * marcada y la siguiente petición con esa cookie ya no resuelve. v1 no podía
 * ofrecer esto — sus JWT seguían siendo válidos un año (HIGH-03).
 */
import { defineEventHandler } from 'h3'
import { revokeSession, clearSessionCookie } from '../../utils/session'
import { requireUser } from '../../utils/rbac'
import { audit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)

  await revokeSession(user.sessionId)
  clearSessionCookie(event)
  await audit(event, { action: 'auth.logout', resource: 'user', resourceId: user.id, actor: user })

  return { ok: true }
})

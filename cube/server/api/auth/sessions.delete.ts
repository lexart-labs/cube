/**
 * Cerrar todas las sesiones del usuario menos la actual.
 *
 * Es el "cerrar sesión en el resto de dispositivos" que la tabla `sessions`
 * hace posible y que con los JWT de 365 días de v1 era sencillamente
 * inexpresable (HIGH-03).
 */
import { defineEventHandler } from 'h3'
import { execute } from '../../db'
import { requireUser } from '../../utils/rbac'
import { audit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)

  const result = await execute(
    `UPDATE sessions SET revoked_at = NOW()
     WHERE user_id = ? AND id <> ? AND revoked_at IS NULL`,
    [user.id, user.sessionId],
  )

  await audit(event, {
    action: 'auth.logout',
    resource: 'session',
    metadata: { operation: 'cerrar_otras', revoked: result.affectedRows },
  })

  return { revoked: result.affectedRows }
})

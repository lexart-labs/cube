/**
 * Actualizar un usuario. Solo admin.
 *
 * Cambiar la contraseña o desactivar la cuenta revoca todas las sesiones
 * abiertas. Es exactamente lo que v1 no podía hacer: sus JWT de 365 días
 * seguían siendo válidos aunque la persona ya no trabajara ahí (HIGH-03).
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { execute, queryOne } from '../../db'
import { validatedBody, validatedParams, idParam, passwordSchema } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { notFound, badRequest } from '../../utils/errors'
import { hashPassword } from '../../utils/password'
import { revokeAllSessions } from '../../utils/session'
import { audit } from '../../utils/audit'

const bodySchema = z
  .object({
    name: z.string().trim().min(1).max(191).optional(),
    role: z.enum(['developer', 'lead', 'admin']).optional(),
    positionId: z.coerce.number().int().positive().nullable().optional(),
    levelId: z.coerce.number().int().positive().nullable().optional(),
    leadId: z.coerce.number().int().positive().nullable().optional(),
    active: z.boolean().optional(),
    password: passwordSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'No hay nada que actualizar' })

export default defineEventHandler(async (event) => {
  const actor = requireRole(event, 'admin')
  const { id } = validatedParams(event, idParam)
  const body = await validatedBody(event, bodySchema)

  const target = await queryOne<{ id: number; role: string; active: number }>(
    'SELECT id, role, active FROM users WHERE id = ?',
    [id],
  )
  if (!target) throw notFound('Usuario no encontrado')

  // Un admin no puede quitarse a sí mismo el rol ni desactivarse: dejaría el
  // sistema sin administrador si es el último.
  if (actor.id === id) {
    if (body.role && body.role !== 'admin') {
      throw badRequest('No puedes cambiar tu propio rol de administrador')
    }
    if (body.active === false) throw badRequest('No puedes desactivar tu propia cuenta')
  }

  if (body.leadId) {
    if (body.leadId === id) throw badRequest('Un usuario no puede ser su propio lead')
    const lead = await queryOne<{ id: number }>(
      "SELECT id FROM users WHERE id = ? AND role IN ('lead','admin') AND active = 1",
      [body.leadId],
    )
    if (!lead) throw badRequest('El lead indicado no existe o no tiene ese rol')
  }

  const updates: string[] = []
  const values: (string | number | null)[] = []
  const push = (column: string, value: string | number | null) => {
    updates.push(`${column} = ?`)
    values.push(value)
  }

  if (body.name !== undefined) push('name', body.name)
  if (body.role !== undefined) push('role', body.role)
  if (body.positionId !== undefined) push('position_id', body.positionId)
  if (body.levelId !== undefined) push('level_id', body.levelId)
  if (body.leadId !== undefined) push('lead_id', body.leadId)
  if (body.active !== undefined) push('active', body.active ? 1 : 0)

  if (body.password !== undefined) {
    push('password_hash', await hashPassword(body.password))
    updates.push("password_algo = 'bcrypt'")
  }

  if (updates.length === 0) return { id, updated: false }

  values.push(id)
  await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values)

  // Cambiar la contraseña o desactivar debe expulsar de inmediato.
  let revoked = 0
  if (body.password !== undefined || body.active === false) {
    revoked = await revokeAllSessions(id)
  }

  await audit(event, {
    action: 'user.update',
    resource: 'user',
    resourceId: id,
    metadata: { fields: Object.keys(body), sessionsRevoked: revoked },
  })

  return { id, updated: true, sessionsRevoked: revoked }
})

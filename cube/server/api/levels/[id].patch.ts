/** Actualizar o desactivar un nivel. Solo admin. Se desactiva, no se borra. */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { execute, queryOne } from '../../db'
import { validatedBody, validatedParams, idParam } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { notFound } from '../../utils/errors'
import { audit } from '../../utils/audit'

const bodySchema = z
  .object({
    name: z.string().trim().min(1).max(191).optional(),
    active: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'No hay nada que actualizar' })

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')
  const { id } = validatedParams(event, idParam)
  const body = await validatedBody(event, bodySchema)

  const existing = await queryOne<{ id: number }>('SELECT id FROM levels WHERE id = ?', [id])
  if (!existing) throw notFound('Nivel no encontrado')

  const updates: string[] = []
  const values: (string | number)[] = []
  if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name) }
  if (body.active !== undefined) { updates.push('active = ?'); values.push(body.active ? 1 : 0) }

  values.push(id)
  await execute(`UPDATE levels SET ${updates.join(', ')} WHERE id = ?`, values)

  await audit(event, { action: 'user.update', resource: 'level', resourceId: id })
  return { id, updated: true }
})

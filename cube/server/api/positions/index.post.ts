/** Crear una posición. Solo admin. */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { execute, queryOne } from '../../db'
import { validatedBody } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { conflict } from '../../utils/errors'
import { audit } from '../../utils/audit'

const bodySchema = z.object({
  name: z.string().trim().min(1).max(191),
  minimumTimeMonths: z.coerce.number().int().min(0).max(600).default(0),
})

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')
  const body = await validatedBody(event, bodySchema)

  const existing = await queryOne<{ id: number }>('SELECT id FROM positions WHERE name = ?', [
    body.name,
  ])
  if (existing) throw conflict('Ya existe una posición con ese nombre')

  const result = await execute(
    'INSERT INTO positions (name, minimum_time_months, active) VALUES (?, ?, 1)',
    [body.name, body.minimumTimeMonths],
  )

  await audit(event, { action: 'user.update', resource: 'position', resourceId: result.insertId })
  return { id: result.insertId }
})

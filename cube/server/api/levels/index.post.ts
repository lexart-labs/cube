/** Crear un nivel. Solo admin. */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { execute, queryOne } from '../../db'
import { validatedBody } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { conflict } from '../../utils/errors'
import { audit } from '../../utils/audit'

const bodySchema = z.object({ name: z.string().trim().min(1).max(191) })

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')
  const body = await validatedBody(event, bodySchema)

  const existing = await queryOne<{ id: number }>('SELECT id FROM levels WHERE name = ?', [
    body.name,
  ])
  if (existing) throw conflict('Ya existe un nivel con ese nombre')

  const result = await execute('INSERT INTO levels (name, active) VALUES (?, 1)', [body.name])
  await audit(event, { action: 'catalog.create', resource: 'level', resourceId: result.insertId })
  return { id: result.insertId }
})

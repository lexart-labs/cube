/**
 * Alta de usuario. Solo admin.
 *
 * No se envía la contraseña por correo, a diferencia de v1
 * (`ext/onboarding/server/api/users/create.post.js:62,125`, CRIT-06): quien
 * crea la cuenta fija una contraseña inicial y el usuario la cambia al entrar.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { execute, queryOne } from '../../db'
import { validatedBody, emailSchema, passwordSchema } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { conflict, badRequest } from '../../utils/errors'
import { hashPassword } from '../../utils/password'
import { audit } from '../../utils/audit'

const bodySchema = z.object({
  name: z.string().trim().min(1).max(191),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['developer', 'lead', 'admin']).default('developer'),
  positionId: z.coerce.number().int().positive().optional(),
  levelId: z.coerce.number().int().positive().optional(),
  leadId: z.coerce.number().int().positive().optional(),
})

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')
  const body = await validatedBody(event, bodySchema)

  const existing = await queryOne<{ id: number }>('SELECT id FROM users WHERE email = ?', [
    body.email,
  ])
  if (existing) throw conflict('Ya existe un usuario con ese email')

  if (body.leadId) {
    const lead = await queryOne<{ id: number }>(
      "SELECT id FROM users WHERE id = ? AND role IN ('lead','admin') AND active = 1",
      [body.leadId],
    )
    if (!lead) throw badRequest('El lead indicado no existe o no tiene ese rol')
  }

  const result = await execute(
    `INSERT INTO users
       (name, email, role, password_hash, password_algo, position_id, level_id, lead_id, active)
     VALUES (?, ?, ?, ?, 'bcrypt', ?, ?, ?, 1)`,
    [
      body.name,
      body.email,
      body.role,
      await hashPassword(body.password),
      body.positionId ?? null,
      body.levelId ?? null,
      body.leadId ?? null,
    ],
  )

  await audit(event, {
    action: 'user.create',
    resource: 'user',
    resourceId: result.insertId,
    metadata: { role: body.role },
  })

  return { id: result.insertId }
})

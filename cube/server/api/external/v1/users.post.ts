/**
 * Alta de usuario desde un sistema externo.
 *
 * `POST /api/external/v1/users`, con la cabecera `X-API-Key`. Es el motivo por
 * el que existe toda la API externa: desde AD-06 el onboarding vive en la
 * plataforma de Lexart, y cuando allí se contrata a alguien hay que crearlo
 * aquí sin que nadie entre a `/admin/users` a copiarlo a mano.
 *
 * Tres límites que este endpoint NO negocia:
 *
 * · **No crea administradores.** El rol se limita a `developer` y `lead`. Una
 *   clave filtrada no puede darse a sí misma una cuenta con la administración
 *   entera; para eso hace falta una persona y `/admin/users`.
 *
 * · **La contraseña la trae quien llama y no se envía a ninguna parte.** v1
 *   mandaba la contraseña generada por correo
 *   (`ext/onboarding/server/api/users/create.post.js:62,125`, CRIT-06); aquí
 *   viaja en la respuesta a quien ya la conocía porque la ha mandado él, y
 *   nada más.
 *
 * · **Es idempotente hacia el error, no hacia el éxito.** Un email repetido
 *   devuelve 409 con el id existente. Así reintentar es seguro sin que un
 *   segundo alta pise los datos del primero.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { execute, queryOne } from '../../../db'
import { validatedBody, emailSchema, passwordSchema } from '../../../utils/validation'
import { requireApiKey } from '../../../utils/apikey'
import { conflict, badRequest } from '../../../utils/errors'
import { hashPassword } from '../../../utils/password'
import { audit } from '../../../utils/audit'

const bodySchema = z.object({
  name: z.string().trim().min(1).max(191),
  email: emailSchema,
  password: passwordSchema,
  /** `admin` no está y no es un olvido: ver la cabecera del fichero. */
  role: z.enum(['developer', 'lead']).default('developer'),
  /** Id en Lextracking, para poder correlacionar después sin adivinar. */
  lextrackingId: z.coerce.number().int().positive().optional(),
  positionId: z.coerce.number().int().positive().optional(),
  levelId: z.coerce.number().int().positive().optional(),
  leadId: z.coerce.number().int().positive().optional(),
})

export default defineEventHandler(async (event) => {
  const client = requireApiKey(event, 'users:create')
  const body = await validatedBody(event, bodySchema)

  const existing = await queryOne<{ id: number }>('SELECT id FROM users WHERE email = ?', [
    body.email,
  ])
  if (existing) {
    throw conflict(`Ya existe un usuario con el email ${body.email} (id ${existing.id}).`)
  }

  if (body.lextrackingId) {
    const duplicate = await queryOne<{ id: number }>(
      'SELECT id FROM users WHERE lextracking_id = ?',
      [body.lextrackingId],
    )
    if (duplicate) {
      throw conflict(`Ya existe un usuario con ese lextrackingId (id ${duplicate.id}).`)
    }
  }

  // Los catálogos se comprueban aquí y no se dejan a la clave foránea: un
  // error de integridad devolvería un 500 genérico, y quien integra necesita
  // saber cuál de los tres ids está mal.
  for (const [field, table, id] of [
    ['positionId', 'positions', body.positionId],
    ['levelId', 'levels', body.levelId],
  ] as const) {
    if (id === undefined) continue
    // El nombre de la tabla sale de esta lista literal, nunca de la petición.
    const row = await queryOne<{ id: number }>(
      `SELECT id FROM ${table} WHERE id = ? AND active = 1`,
      [id],
    )
    if (!row) throw badRequest(`El ${field} indicado no existe o está desactivado.`)
  }

  if (body.leadId) {
    const lead = await queryOne<{ id: number }>(
      "SELECT id FROM users WHERE id = ? AND role IN ('lead','admin') AND active = 1",
      [body.leadId],
    )
    if (!lead) throw badRequest('El leadId indicado no existe o no tiene ese rol.')
  }

  const result = await execute(
    `INSERT INTO users
       (name, email, role, password_hash, password_algo, lextracking_id,
        position_id, level_id, lead_id, active)
     VALUES (?, ?, ?, ?, 'bcrypt', ?, ?, ?, ?, 1)`,
    [
      body.name,
      body.email,
      body.role,
      await hashPassword(body.password),
      body.lextrackingId ?? null,
      body.positionId ?? null,
      body.levelId ?? null,
      body.leadId ?? null,
    ],
  )

  // Sin actor: no hay persona detrás. Queda la clave, que es lo que permite
  // responder a «¿quién creó esta cuenta?» seis meses después.
  await audit(event, {
    action: 'external.user_create',
    resource: 'user',
    resourceId: result.insertId,
    metadata: {
      apiKeyId: client.id,
      apiKeyPrefix: client.prefix,
      role: body.role,
      ip: client.ip,
    },
  })

  return {
    id: result.insertId,
    email: body.email,
    role: body.role,
  }
})

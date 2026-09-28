/**
 * Crear una clave de API. Solo admin.
 *
 * **El token se devuelve una única vez, aquí.** Después solo queda su
 * SHA-256, igual que con las sesiones y que con las contraseñas: si se
 * pierde, se crea otra y se desactiva esta. No hay endpoint para volver a
 * verla y no debe haberlo — una credencial recuperable es una credencial que
 * está en algún sitio recuperable.
 *
 * La clave nace **bloqueada** si no se le da ninguna entrada de lista de
 * acceso: se autentica pero no se admite desde ningún sitio. Es deliberado.
 * El error caro es la clave que funciona desde cualquier parte, no la que
 * todavía no funciona desde ninguna.
 */
import { defineEventHandler, setResponseStatus } from 'h3'
import { z } from 'zod'
import { transaction } from '../../db'
import { validatedBody } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { generateApiKey } from '../../utils/apikey'
import { audit } from '../../utils/audit'
import { allowlistSchema, scopesSchema, expiresAtSchema, endOfDay } from './_schema'

const bodySchema = z.object({
  name: z.string().trim().min(1).max(191),
  scopes: scopesSchema.default([]),
  allowlist: allowlistSchema.default([]),
  expiresAt: expiresAtSchema.optional(),
})

export default defineEventHandler(async (event) => {
  const actor = requireRole(event, 'admin')
  const body = await validatedBody(event, bodySchema)

  const { token, prefix, tokenHash } = generateApiKey()

  // La clave y su lista de acceso entran juntas o no entra ninguna: una clave
  // creada sin su lista queda bloqueada, que es seguro pero desconcertante, y
  // una lista sin clave no tiene dónde colgar.
  const id = await transaction(async (connection) => {
    const [result] = await connection.execute(
      `INSERT INTO api_keys (name, prefix, token_hash, scopes, created_by, expires_at, active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        body.name,
        prefix,
        tokenHash,
        body.scopes.join(','),
        actor.id,
        body.expiresAt ? endOfDay(body.expiresAt) : null,
      ],
    )

    const insertId = (result as { insertId: number }).insertId

    for (const entry of body.allowlist) {
      await connection.execute(
        `INSERT INTO api_key_allowlist (api_key_id, kind, pattern, note)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE note = VALUES(note)`,
        [insertId, entry.kind, entry.pattern, entry.note ?? null],
      )
    }

    return insertId
  })

  await audit(event, {
    action: 'apikey.create',
    resource: 'api_key',
    resourceId: id,
    metadata: {
      prefix,
      scopes: body.scopes,
      allowlist: body.allowlist.map((entry) => `${entry.kind}:${entry.pattern}`),
    },
  })

  setResponseStatus(event, 201)

  return {
    id,
    prefix,
    /** Única vez que este valor existe fuera de quien lo va a usar. */
    token,
    blocked: body.allowlist.length === 0,
  }
})

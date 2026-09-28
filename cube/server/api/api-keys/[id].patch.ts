/**
 * Modificar una clave de API. Solo admin.
 *
 * Desactivar aquí **corta el acceso en la siguiente petición**: la clave se
 * comprueba contra la base en cada llamada, no hay token de larga vida que
 * siga valiendo por su cuenta. Es la misma razón por la que las sesiones son
 * opacas y no JWT (HIGH-03).
 *
 * La lista de acceso se sustituye entera. Aquí sí se borran filas, y no
 * contradice la regla de "desactivar en vez de borrar": quitar una IP de una
 * lista blanca **es** el acto de revocar, y una entrada "desactivada pero
 * visible" solo serviría para que alguien dudara de si sigue permitiendo algo.
 * El rastro de lo que había queda en `audit_log`.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { query, queryOne, transaction } from '../../db'
import { validatedBody, validatedParams, idParam } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { notFound } from '../../utils/errors'
import { audit } from '../../utils/audit'
import { allowlistSchema, scopesSchema, expiresAtSchema, endOfDay } from './_schema'

const bodySchema = z
  .object({
    name: z.string().trim().min(1).max(191).optional(),
    scopes: scopesSchema.optional(),
    /** `null` quita la caducidad; omitirlo la deja como esté. */
    expiresAt: expiresAtSchema.nullable().optional(),
    active: z.boolean().optional(),
    allowlist: allowlistSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'No hay nada que actualizar' })

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')
  const { id } = validatedParams(event, idParam)
  const body = await validatedBody(event, bodySchema)

  const target = await queryOne<{ id: number; prefix: string }>(
    'SELECT id, prefix FROM api_keys WHERE id = ?',
    [id],
  )
  if (!target) throw notFound('La clave no existe')

  // Lo que había antes, para que la auditoría registre el cambio y no solo
  // el resultado: "quién quitó esa IP" es la pregunta que se acaba haciendo.
  const before = await query<{ kind: string; pattern: string }>(
    'SELECT kind, pattern FROM api_key_allowlist WHERE api_key_id = ? ORDER BY kind, pattern',
    [id],
  )

  await transaction(async (connection) => {
    const updates: string[] = []
    const values: (string | number | null)[] = []
    const push = (column: string, value: string | number | null) => {
      updates.push(`${column} = ?`)
      values.push(value)
    }

    if (body.name !== undefined) push('name', body.name)
    if (body.scopes !== undefined) push('scopes', body.scopes.join(','))
    if (body.active !== undefined) push('active', body.active ? 1 : 0)
    if (body.expiresAt !== undefined) {
      push('expires_at', body.expiresAt === null ? null : endOfDay(body.expiresAt))
    }

    if (updates.length > 0) {
      values.push(id)
      await connection.execute(`UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`, values)
    }

    if (body.allowlist !== undefined) {
      await connection.execute('DELETE FROM api_key_allowlist WHERE api_key_id = ?', [id])
      for (const entry of body.allowlist) {
        await connection.execute(
          `INSERT INTO api_key_allowlist (api_key_id, kind, pattern, note)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE note = VALUES(note)`,
          [id, entry.kind, entry.pattern, entry.note ?? null],
        )
      }
    }
  })

  await audit(event, {
    action: 'apikey.update',
    resource: 'api_key',
    resourceId: id,
    metadata: {
      prefix: target.prefix,
      fields: Object.keys(body),
      ...(body.allowlist !== undefined
        ? {
            allowlistBefore: before.map((entry) => `${entry.kind}:${entry.pattern}`),
            allowlistAfter: body.allowlist.map((entry) => `${entry.kind}:${entry.pattern}`),
          }
        : {}),
    },
  })

  return { id, updated: true }
})

/**
 * Listado de claves de la API externa. Solo admin.
 *
 * Nunca devuelve el token ni su hash: `token_hash` simplemente no se
 * selecciona, igual que `password_hash` en `/api/users`. Lo que se muestra es
 * el prefijo, que identifica la clave sin permitir usarla.
 *
 * Las desactivadas salen por defecto y marcadas (regla 9): una clave que
 * desaparece de la lista al desactivarla es una clave que ya no se puede
 * revisar ni reactivar, y las credenciales olvidadas son precisamente las que
 * acaban en un incidente.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { query } from '../../db'
import { validatedQuery } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { parseScopes } from '../../utils/apikey'
import type { AllowlistRow } from './_schema'

const querySchema = z.object({
  /**
   * Sin el parámetro salen todas. No se usa `z.coerce.boolean()`: convierte
   * cualquier cadena no vacía en true, así que `?active=false` devolvería lo
   * contrario de lo pedido.
   */
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
})

interface KeyRow {
  id: number
  name: string
  prefix: string
  scopes: string
  active: number
  expires_at: string | null
  last_used_at: string | null
  last_used_ip: Buffer | null
  created_at: string
  created_by_name: string | null
}

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')
  const params = validatedQuery(event, querySchema)

  const where = params.active === undefined ? '1 = 1' : 'k.active = ?'
  const values = params.active === undefined ? [] : [params.active ? 1 : 0]

  const rows = await query<KeyRow>(
    `SELECT k.id, k.name, k.prefix, k.scopes, k.active,
            k.expires_at, k.last_used_at, k.last_used_ip, k.created_at,
            creator.name AS created_by_name
     FROM api_keys k
     LEFT JOIN users creator ON creator.id = k.created_by
     WHERE ${where}
     ORDER BY k.created_at DESC
     LIMIT 200`,
    values,
  )

  // Las listas de acceso, en una sola consulta en vez de una por clave. Los
  // interrogantes salen del número de filas ya leídas, nunca de la petición.
  const ids = rows.map((row) => row.id)
  let allowlist: AllowlistRow[] = []
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',')
    allowlist = await query<AllowlistRow>(
      `SELECT id, api_key_id, kind, pattern, note
       FROM api_key_allowlist
       WHERE api_key_id IN (${placeholders})
       ORDER BY kind, pattern`,
      ids,
    )
  }

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      scopes: parseScopes(row.scopes),
      active: row.active,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
      // Se guarda como VARBINARY para no depender de la familia de direcciones.
      lastUsedIp: row.last_used_ip ? row.last_used_ip.toString('utf8') : null,
      createdAt: row.created_at,
      createdBy: row.created_by_name,
      allowlist: allowlist
        .filter((entry) => entry.api_key_id === row.id)
        .map((entry) => ({
          id: entry.id,
          kind: entry.kind,
          pattern: entry.pattern,
          note: entry.note,
        })),
    })),
  }
})

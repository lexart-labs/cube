/**
 * Listado de usuarios. Solo lead y admin.
 *
 * v1 exponía esto a cualquier usuario autenticado y además devolvía el hash de
 * la contraseña en varias respuestas, quitándolo a mano en algunos sitios y en
 * otros no. Aquí la consulta simplemente no selecciona esa columna: no se puede
 * filtrar mal lo que nunca se lee.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { query, queryOne } from '../../db'
import { validatedQuery, pagination, searchQuery, safeOrderBy } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'

const SORTABLE = { name: 'u.name', email: 'u.email', role: 'u.role' } as const

const ROLES = ['developer', 'lead', 'admin'] as const

const querySchema = pagination.extend({
  search: searchQuery,
  /**
   * Uno o varios roles separados por comas (`?role=lead,admin`).
   *
   * Admite la lista porque el formulario de `/admin/users` necesita a la vez
   * los leads y los admins para el desplegable de "lead" —son exactamente los
   * que el servidor acepta como tal— y pedir dos veces el mismo endpoint para
   * eso sería peor. Un valor suelto sigue funcionando igual que antes.
   */
  role: z
    .string()
    .optional()
    .transform((value) =>
      value === undefined
        ? undefined
        : value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
    )
    .pipe(z.array(z.enum(ROLES)).min(1).max(ROLES.length).optional()),
  /**
   * Sin el parámetro se listan todos, activos e inactivos. No se usa
   * `z.coerce.boolean()`: convierte cualquier cadena no vacía en true, así que
   * `?active=false` devolvería justo lo contrario de lo pedido.
   */
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  sort: z.enum(['name', 'email', 'role']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
})

export default defineEventHandler(async (event) => {
  requireRole(event, 'lead')
  const params = validatedQuery(event, querySchema)

  const where: string[] = ['1 = 1']
  const values: (string | number)[] = []

  if (params.role) {
    // Los interrogantes salen del número de roles ya validados contra el enum,
    // nunca del texto de la petición.
    const placeholders = params.role.map(() => '?').join(',')
    where.push(`u.role IN (${placeholders})`)
    values.push(...params.role)
  }
  if (params.active !== undefined) {
    where.push('u.active = ?')
    values.push(params.active ? 1 : 0)
  }
  if (params.search) {
    where.push('(u.name LIKE ? OR u.email LIKE ?)')
    values.push(`%${params.search}%`, `%${params.search}%`)
  }

  const whereClause = where.join(' AND ')
  const total = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM users u WHERE ${whereClause}`,
    values,
  )

  // El alias del jefe es "boss" y no "lead": LEAD es palabra reservada en MySQL 8
  // —la función de ventana— y usarla sin comillas rompe la consulta con un error de
  // sintaxis. No se ve hasta ejecutarla contra una base real.
  // Se devuelven los ids además de los nombres: el formulario de edición
  // necesita saber qué opción viene seleccionada, y con solo el nombre habría
  // que adivinarla buscando por texto en el catálogo.
  const items = await query(
    `SELECT u.id, u.name, u.email, u.role, u.active,
            u.position_id, u.level_id, u.lead_id,
            p.name AS position, l.name AS level,
            boss.name AS lead_name
     FROM users u
     LEFT JOIN positions p ON p.id = u.position_id
     LEFT JOIN levels l    ON l.id = u.level_id
     LEFT JOIN users boss  ON boss.id = u.lead_id
     WHERE ${whereClause}
     ORDER BY ${safeOrderBy(SORTABLE, params.sort, 'name', params.direction)}
     LIMIT ? OFFSET ?`,
    [...values, params.limit, params.page * params.limit],
  )

  return { items, total: total?.total ?? 0, page: params.page, limit: params.limit }
})

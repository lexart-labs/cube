/**
 * Actualizar un usuario. Solo admin.
 *
 * Cambiar la contraseña o desactivar la cuenta revoca todas las sesiones
 * abiertas. Es exactamente lo que v1 no podía hacer: sus JWT de 365 días
 * seguían siendo válidos aunque la persona ya no trabajara ahí (HIGH-03).
 *
 * El email SÍ se puede cambiar, y NO revoca las sesiones: la sesión está atada
 * al id del usuario, no a su email, que aquí solo es el identificador con el
 * que se entra. Echar a alguien de su sesión por corregirle una errata sería
 * gratuito. Queda en la auditoría, que es donde tiene que quedar.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { execute, query, queryOne } from '../../db'
import {
  validatedBody,
  validatedParams,
  idParam,
  passwordSchema,
  emailSchema,
} from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { notFound, badRequest, conflict } from '../../utils/errors'
import { hashPassword } from '../../utils/password'
import { revokeAllSessions } from '../../utils/session'
import { wouldCreateLeadCycle } from '../../utils/orgchart'
import { audit } from '../../utils/audit'

const bodySchema = z
  .object({
    name: z.string().trim().min(1).max(191).optional(),
    email: emailSchema.optional(),
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

  /**
   * Quién le reporta hoy. Se consulta una sola vez porque la necesitan dos
   * comprobaciones distintas, y son pocas filas: los reportes directos de una
   * persona se cuentan con los dedos.
   */
  const reports =
    body.role !== undefined || body.active === false
      ? await query<{ id: number; name: string }>(
          'SELECT id, name FROM users WHERE lead_id = ? AND active = 1 ORDER BY name',
          [id],
        )
      : []

  /**
   * Degradar a developer a alguien que tiene gente a cargo dejaría a esa gente
   * apuntando a un lead que ya no lo es — un estado que la propia validación
   * de `leadId` considera inválido y que nadie podría volver a crear a mano.
   * Se bloquea diciendo a quién hay que reasignar primero.
   */
  if (body.role === 'developer' && target.role !== 'developer' && reports.length > 0) {
    const names = reports
      .slice(0, 3)
      .map((row) => row.name)
      .join(', ')
    const rest = reports.length > 3 ? ` y ${reports.length - 3} más` : ''
    throw badRequest(
      `No se puede quitar el rol: ${reports.length} persona(s) le reportan (${names}${rest}). ` +
        'Asígnales otro lead primero.',
    )
  }

  // El email es la credencial con la que se entra: dos cuentas con el mismo
  // dejarían el login sin saber a quién autenticar. La columna es UNIQUE, pero
  // sin esta comprobación el choque saldría como un 500 genérico en vez de
  // decir qué pasa.
  if (body.email !== undefined) {
    const duplicate = await queryOne<{ id: number }>(
      'SELECT id FROM users WHERE email = ? AND id <> ?',
      [body.email, id],
    )
    if (duplicate) throw conflict('Ya existe otro usuario con ese email')
  }

  if (body.leadId) {
    const lead = await queryOne<{ id: number }>(
      "SELECT id FROM users WHERE id = ? AND role IN ('lead','admin') AND active = 1",
      [body.leadId],
    )
    if (!lead) throw badRequest('El lead indicado no existe o no tiene ese rol')

    // Cubre el caso de ser su propio lead y también el ciclo largo (A→B→A),
    // que antes no se podía provocar porque el lead no se editaba.
    const cycle = await wouldCreateLeadCycle(
      async (userId) => {
        const row = await queryOne<{ lead_id: number | null }>(
          'SELECT lead_id FROM users WHERE id = ?',
          [userId],
        )
        return row?.lead_id ?? null
      },
      id,
      body.leadId,
    )
    if (cycle) {
      throw badRequest('Ese lead depende de esta persona: la cadena de mando quedaría en bucle')
    }
  }

  const updates: string[] = []
  const values: (string | number | null)[] = []
  const push = (column: string, value: string | number | null) => {
    updates.push(`${column} = ?`)
    values.push(value)
  }

  if (body.name !== undefined) push('name', body.name)
  if (body.email !== undefined) push('email', body.email)
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

  /**
   * Desactivar a un lead SÍ se permite —la persona se ha ido y hay que cerrarle
   * el acceso hoy, no cuando alguien reorganice el equipo— pero se dice cuánta
   * gente se queda apuntando a alguien inactivo. Avisar, no bloquear.
   */
  const orphanedReports = body.active === false ? reports.length : 0

  return { id, updated: true, sessionsRevoked: revoked, orphanedReports }
})

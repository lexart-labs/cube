/**
 * Usuario de la sesión actual.
 *
 * Devuelve exclusivamente lo que el cliente necesita para pintar la interfaz.
 * En particular NO devuelve el hash de la contraseña — v1 lo arrastraba en
 * varias respuestas y tenía que ir quitándolo a mano
 * (`users.service.js:49,367,416`), lo que falla en cuanto alguien olvida hacerlo.
 */
import { defineEventHandler } from 'h3'
import { requireUser } from '../../utils/rbac'
import { queryOne } from '../../db'

export default defineEventHandler(async (event) => {
  const session = requireUser(event)

  const profile = await queryOne<{
    id: number
    name: string
    email: string
    role: string
    position: string | null
    level: string | null
  }>(
    `SELECT u.id, u.name, u.email, u.role,
            p.name AS position, l.name AS level
     FROM users u
     LEFT JOIN positions p ON p.id = u.position_id
     LEFT JOIN levels l    ON l.id = u.level_id
     WHERE u.id = ?`,
    [session.id],
  )

  return { user: profile }
})

/**
 * Puerta de disponibilidad.
 *
 * Si una tabla no tiene la forma que Cube espera, los endpoints que dependen
 * de ella responden **503 de una vez** en lugar de dejar que cada uno
 * descubra por su cuenta que le falta una columna y devuelva un 500 distinto.
 *
 * Existe por un incidente del 2026-09-27. Al renombrar `ideal_evaluations` a
 * `evaluations`, ese nombre ya estaba ocupado en la base por la tabla del
 * modelo de 27 indicadores; `CREATE TABLE IF NOT EXISTS` mira el nombre y no
 * las columnas, así que no creó nada ni se quejó. El arranque pasó por bueno y
 * las pantallas empezaron a devolver `Unknown column 'e.role_key'`.
 *
 * Dos correcciones sobre los dos primeros intentos, que conviene no deshacer:
 *
 * · **El estado tiene que mirarlo alguien.** La primera versión marcaba la
 *   base como no lista y solo `/api/health` lo consultaba, así que el resto de
 *   la API seguía sirviendo 500 exactamente igual.
 *
 * · **Se corta lo justo.** La segunda cortaba la API entera, y con una tabla
 *   de evaluaciones rota dejaba a la gente sin poder iniciar sesión: una
 *   pantalla rota convertida en una aplicación inservible. Ahora solo caen las
 *   rutas que dependen de esa tabla (`routesAffectedBy`).
 *
 * Al cliente no se le dice QUÉ falta: los nombres de tablas y columnas son
 * reconocimiento gratuito (HIGH-07). El detalle está en el log del arranque.
 */
import { defineEventHandler } from 'h3'
import { getSchemaProblem, routesAffectedBy } from '../utils/health'
import { serviceUnavailable } from '../utils/errors'

export default defineEventHandler((event) => {
  const problem = getSchemaProblem()
  if (!problem) return

  const path = event.path.split('?')[0] ?? ''
  if (!path.startsWith('/api/')) return

  // La sonda de salud sigue respondiendo siempre: es donde se mira qué pasa.
  if (path === '/api/health') return

  const affected = routesAffectedBy(problem.tables)
  if (!affected.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return

  throw serviceUnavailable(
    'Esta parte de Cube no está disponible: la base de datos no tiene el esquema que ' +
      'esta versión espera. Revisa el log de arranque del servidor.',
  )
})

/**
 * Sonda de readiness. Pública a propósito, y deliberadamente escueta:
 * no revela versiones, rutas ni detalles de la base (HIGH-07).
 */
import { ping } from '../db'
import { getSchemaProblem, isDatabaseReady, setDatabaseReady } from '../utils/health'

export default defineEventHandler(async (event) => {
  try {
    await ping()
    setDatabaseReady(true)
  } catch {
    setDatabaseReady(false)
  }

  // Un esquema con la forma equivocada no se arregla esperando, así que pesa
  // más que el ping: responder 'ok' aquí devolvería la aplicación a servir 500.
  const ready = isDatabaseReady() && getSchemaProblem() === null
  setResponseStatus(event, ready ? 200 : 503)

  return { status: ready ? 'ok' : 'degraded' }
})

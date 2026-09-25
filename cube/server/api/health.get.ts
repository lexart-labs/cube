/**
 * Sonda de readiness. Pública a propósito, y deliberadamente escueta:
 * no revela versiones, rutas ni detalles de la base (HIGH-07).
 */
import { ping } from '../db'
import { isDatabaseReady, setDatabaseReady } from '../utils/health'

export default defineEventHandler(async (event) => {
  try {
    await ping()
    setDatabaseReady(true)
  } catch {
    setDatabaseReady(false)
  }

  const ready = isDatabaseReady()
  setResponseStatus(event, ready ? 200 : 503)

  return { status: ready ? 'ok' : 'degraded' }
})

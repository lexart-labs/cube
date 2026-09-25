/**
 * Manejador global de errores.
 *
 * Garantiza que ningún fallo interno se filtre al cliente, aunque un handler
 * olvide capturarlo. Es la red que hace que HIGH-07 no dependa de la disciplina
 * de quien escribe cada endpoint.
 */
import { toErrorResponse } from '../utils/errors'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error, { event }) => {
    // Solo se registra aquí; la respuesta la construye `render:response`.
    if (event && event.path?.startsWith('/api/')) {
      toErrorResponse(error, event)
    }
  })

  nitro.hooks.hook('render:response', (response, { event }) => {
    if (!event.path?.startsWith('/api/')) return
    const status = response.statusCode ?? 200
    if (status < 500) return

    // Se reemplaza el cuerpo de cualquier 5xx por el contrato genérico.
    const safe = toErrorResponse(new Error('respuesta 5xx'), event)
    response.body = JSON.stringify(safe)
  })
})

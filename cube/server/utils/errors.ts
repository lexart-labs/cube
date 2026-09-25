/**
 * Contrato de error único.
 *
 * Cierra HIGH-07 de Security.md: v1 devolvía al cliente `sqlMessage` con
 * nombres de tablas y columnas (`utils.service.js:49,53`) y trazas completas
 * con rutas del sistema de ficheros (`courses.service.js:97,116`). Eso es
 * reconocimiento gratuito para quien ataca.
 *
 * Los constructores devuelven errores de h3 (`createError`) y no una clase
 * propia: h3 solo reconoce como error HTTP lo que lleva su marca interna, así
 * que un `Error` normal con `statusCode` acabaría convertido en un 500.
 */
import { createError, type H3Event } from 'h3'
import { randomUUID } from 'node:crypto'
import { logger } from './logger'

export interface ErrorBody {
  statusCode: number
  message: string
  requestId: string
}

/**
 * Construye un error HTTP seguro de mostrar al usuario.
 * `statusMessage` es lo que h3 envía como cuerpo; nunca contiene detalles
 * internos porque solo se llama con mensajes escritos a mano.
 */
function httpError(statusCode: number, message: string) {
  return createError({ statusCode, statusMessage: message, data: { statusCode, message } })
}

export const badRequest = (message = 'La petición no es válida') => httpError(400, message)

/**
 * 401 con mensaje deliberadamente vago: no se distingue "no existe el usuario"
 * de "la contraseña es incorrecta", para no permitir enumerar cuentas.
 */
export const unauthorized = (message = 'No autenticado') => httpError(401, message)

export const forbidden = (message = 'No tienes permiso para esta acción') =>
  httpError(403, message)

/**
 * 404 también para lo que existe pero no te pertenece. Un 403 confirmaría que
 * el recurso existe, que es la mitad de un IDOR.
 */
export const notFound = (message = 'No encontrado') => httpError(404, message)

export const conflict = (message = 'El recurso ya existe') => httpError(409, message)

export const tooManyRequests = (message = 'Demasiados intentos, prueba más tarde') =>
  httpError(429, message)

/** Dependencia externa no disponible o sin configurar (por ejemplo, la IA). */
export const serviceUnavailable = (message = 'El servicio no está disponible') =>
  httpError(503, message)

/**
 * Normaliza cualquier error en una respuesta segura y lo registra.
 *
 * Los errores por debajo de 500 se consideran de negocio y su mensaje se
 * conserva. Cualquier otra cosa —incluidos los errores de la capa de datos— se
 * convierte en un 500 genérico con un identificador para poder cruzarlo con el
 * log del servidor.
 */
export function toErrorResponse(error: unknown, event?: H3Event): ErrorBody {
  const requestId = randomUUID()
  const statusCode = (error as { statusCode?: number })?.statusCode

  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
    const message =
      (error as { statusMessage?: string }).statusMessage ?? 'La petición no es válida'
    logger.warn({ requestId, statusCode, path: event?.path }, `error de negocio: ${message}`)
    return { statusCode, message, requestId }
  }

  // Cualquier otra cosa es un fallo interno: el detalle NO sale del servidor.
  logger.error({ requestId, err: error, path: event?.path }, 'error no controlado')

  return {
    statusCode: 500,
    message: 'Ha ocurrido un error interno. Si persiste, comparte este identificador con soporte.',
    requestId,
  }
}

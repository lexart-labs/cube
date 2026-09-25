/**
 * Logger estructurado con redacción de secretos.
 *
 * Cierra HIGH-08 de Security.md: v1 escribía la API key de integración en claro
 * en cada petición (`ext/onboarding/server/utils/apiAuth.js:11`) y los emails de
 * los usuarios en cada verificación de token (`middleware.service.js:26`).
 * Cualquiera con acceso de lectura a los logs obtenía la credencial.
 *
 * Aquí la redacción es del logger, no de quien llama: no depende de que cada
 * punto de log recuerde omitir el campo.
 */
import pino from 'pino'

/**
 * Rutas redactadas. Se cubre el campo suelto y anidado un nivel (`*.campo`),
 * que es como llegan casi siempre: dentro de `body`, `headers` o `user`.
 */
const REDACTED_PATHS = [
  // Credenciales y tokens
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'authorization',
  'cookie',
  'sessionSecret',
  'geminiApiKey',
].flatMap((field) => [field, `*.${field}`, `*.*.${field}`])

/** Cabeceras HTTP que nunca deben aparecer en un log. */
const REDACTED_HEADERS = ['authorization', 'cookie', 'x-api-key', 'token'].flatMap((header) => [
  `req.headers["${header}"]`,
  `headers["${header}"]`,
  `*.headers["${header}"]`,
])

const isProduction = process.env.NODE_ENV === 'production'

export const logger = pino({
  level: process.env.NUXT_LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  redact: {
    paths: [...REDACTED_PATHS, ...REDACTED_HEADERS],
    censor: '[redactado]',
  },
  // En desarrollo, salida legible. En producción, JSON de una línea para el agregador.
  transport: isProduction ? undefined : { target: 'pino-pretty', options: { colorize: true } },
})

/**
 * Logger hijo etiquetado con un ámbito, para poder filtrar por subsistema.
 * Uso: `const log = scopedLogger('db')`
 */
export function scopedLogger(scope: string) {
  return logger.child({ scope })
}

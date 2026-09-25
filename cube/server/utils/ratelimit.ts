/**
 * Límite de intentos.
 *
 * Cierra MED-04 de Security.md: v1 no limitaba nada. El login tenía reCAPTCHA,
 * pero eso no frena el credential stuffing distribuido ni protege al resto de
 * la API. Combinado con MD5 (CRIT-05), el coste de una fuerza bruta era ínfimo.
 *
 * Ventana deslizante en memoria. Es suficiente para un despliegue de un solo
 * proceso; con varias réplicas hay que moverlo a un almacén compartido, porque
 * cada proceso llevaría su propia cuenta y el límite efectivo se multiplicaría.
 */
import { scopedLogger } from './logger'
import { tooManyRequests } from './errors'

const log = scopedLogger('ratelimit')

interface Bucket {
  hits: number[]
  blockedUntil: number
  strikes: number
}

const buckets = new Map<string, Bucket>()

/** Limpieza periódica para que el mapa no crezca sin fin. */
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number): void {
  if (Date.now() - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = Date.now()
  const cutoff = Date.now() - windowMs
  for (const [key, bucket] of buckets) {
    if (bucket.blockedUntil < Date.now() && bucket.hits.every((t) => t < cutoff)) {
      buckets.delete(key)
    }
  }
}

export interface RateLimitOptions {
  /** Intentos permitidos dentro de la ventana. */
  max: number
  /** Tamaño de la ventana en milisegundos. */
  windowMs: number
  /**
   * Si se activa, cada bloqueo consecutivo dura el doble que el anterior.
   * Convierte un ataque sostenido en algo inviable sin castigar al usuario que
   * simplemente se equivocó una vez.
   */
  backoff?: boolean
}

/**
 * Registra un intento y lanza 429 si se supera el límite.
 *
 * `key` debe combinar la acción y el sujeto. En el login se llama dos veces,
 * por IP y por cuenta: solo por IP, una botnet distribuida pasa; solo por
 * cuenta, se puede bloquear a alguien a propósito.
 */
export function enforceRateLimit(key: string, options: RateLimitOptions): void {
  const { max, windowMs, backoff = false } = options
  const now = Date.now()

  cleanup(windowMs)

  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { hits: [], blockedUntil: 0, strikes: 0 }
    buckets.set(key, bucket)
  }

  if (bucket.blockedUntil > now) {
    const seconds = Math.ceil((bucket.blockedUntil - now) / 1000)
    throw tooManyRequests(`Demasiados intentos. Prueba de nuevo en ${seconds} segundos.`)
  }

  bucket.hits = bucket.hits.filter((timestamp) => now - timestamp < windowMs)

  if (bucket.hits.length >= max) {
    bucket.strikes++
    const penalty = backoff ? windowMs * 2 ** (bucket.strikes - 1) : windowMs
    bucket.blockedUntil = now + penalty
    bucket.hits = []

    log.warn({ key, strikes: bucket.strikes, penaltyMs: penalty }, 'límite de intentos superado')

    const seconds = Math.ceil(penalty / 1000)
    throw tooManyRequests(`Demasiados intentos. Prueba de nuevo en ${seconds} segundos.`)
  }

  bucket.hits.push(now)
}

/**
 * Borra el contador de una clave. Se llama tras un login correcto para que un
 * usuario que acertó no arrastre sus intentos fallidos previos.
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key)
}

/** Solo para tests. */
export function clearAllRateLimits(): void {
  buckets.clear()
}

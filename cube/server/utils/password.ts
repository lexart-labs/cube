/**
 * Hash y verificación de contraseñas.
 *
 * Cierra CRIT-05 de Security.md: v1 comparaba `u.password = MD5(?)` dentro de
 * la propia consulta (`users.service.js:403`). MD5 sin salt se revierte en la
 * práctica con tablas rainbow, y calcularlo en SQL deja la contraseña en claro
 * en el log de consultas lentas y en el `general_log`.
 *
 * La transición está descrita en el Roadmap §6: las filas migradas entran como
 * 'md5-legacy' y se rehashean a bcrypt en el primer login correcto, dentro de la
 * misma petición, aprovechando que la contraseña está en memoria. MD5 no es
 * reversible: no hay forma de convertirlas sin que el usuario entre.
 */
import bcrypt from 'bcryptjs'
import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Coste de bcrypt. 12 son ~250 ms en hardware actual: suficiente para que la
 * fuerza bruta sea cara sin que el login resulte lento.
 */
export const BCRYPT_COST = 12

export type PasswordAlgorithm = 'bcrypt' | 'md5-legacy'

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_COST)
}

/** Comparación de hashes MD5 en tiempo constante. */
function verifyLegacyMd5(plaintext: string, storedHash: string): boolean {
  const computed = createHash('md5').update(plaintext, 'utf8').digest('hex')
  const a = Buffer.from(computed, 'utf8')
  // v1 guardaba el hexadecimal que devuelve MySQL, en minúsculas.
  const b = Buffer.from(storedHash.trim().toLowerCase(), 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Verifica una contraseña contra el hash guardado, según su algoritmo.
 * `needsRehash` indica que la fila debe actualizarse a bcrypt tras un login
 * correcto.
 */
export async function verifyPassword(
  plaintext: string,
  storedHash: string,
  algorithm: PasswordAlgorithm,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!plaintext || !storedHash) return { valid: false, needsRehash: false }

  if (algorithm === 'md5-legacy') {
    const valid = verifyLegacyMd5(plaintext, storedHash)
    return { valid, needsRehash: valid }
  }

  const valid = await bcrypt.compare(plaintext, storedHash)
  return { valid, needsRehash: false }
}

/**
 * Hash señuelo, generado una sola vez con el mismo coste que los reales.
 *
 * Un literal escrito a mano no sirve: si bcrypt no lo reconoce como hash
 * válido, `compare` devuelve false de inmediato sin hacer trabajo, y entonces
 * la defensa contra el ataque por tiempo no existe. Generarlo garantiza que el
 * coste es exactamente el de una verificación real.
 */
let decoyHash: Promise<string> | null = null

/**
 * Consume tiempo comparable al de una verificación real.
 *
 * Se llama cuando el email no existe. Sin esto, un 401 inmediato frente a un
 * 401 tras 250 ms permite enumerar qué cuentas existen midiendo la respuesta.
 */
export async function fakeVerify(): Promise<void> {
  decoyHash ??= bcrypt.hash('contraseña-señuelo-que-nadie-usa', BCRYPT_COST)
  await bcrypt.compare('contraseña-que-no-existe', await decoyHash)
}

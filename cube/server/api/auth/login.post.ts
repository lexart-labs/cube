/**
 * Inicio de sesión.
 *
 * Cierra varios hallazgos a la vez:
 *   · CRIT-05 — bcrypt en la aplicación, nunca `MD5(?)` dentro del SQL.
 *   · HIGH-03 — sesión revocable en lugar de un JWT de 365 días.
 *   · MED-04 — límite de intentos por IP y por cuenta, con retroceso exponencial.
 *   · Roadmap §6 — rehash transparente de las contraseñas heredadas.
 */
import { defineEventHandler, getRequestIP } from 'h3'
import { z } from 'zod'
import { queryOne, execute } from '../../db'
import { validatedBody, emailSchema } from '../../utils/validation'
import { verifyPassword, hashPassword, fakeVerify } from '../../utils/password'
import { createSession } from '../../utils/session'
import { enforceRateLimit, resetRateLimit } from '../../utils/ratelimit'
import { unauthorized } from '../../utils/errors'
import { audit } from '../../utils/audit'
import { scopedLogger } from '../../utils/logger'

const log = scopedLogger('auth')

const bodySchema = z.object({
  email: emailSchema,
  // No se aplica `passwordSchema` al iniciar sesión: las contraseñas antiguas
  // pueden ser más cortas que el mínimo actual y deben poder entrar una última
  // vez para que el rehash ocurra.
  password: z.string().min(1, 'La contraseña es obligatoria').max(200),
})

interface UserRow {
  id: number
  name: string
  email: string
  role: 'developer' | 'lead' | 'admin'
  password_hash: string
  password_algo: 'bcrypt' | 'md5-legacy'
}

export default defineEventHandler(async (event) => {
  const { email, password } = await validatedBody(event, bodySchema)

  // Dos límites distintos y ambos necesarios: solo por IP, una botnet
  // distribuida pasa; solo por cuenta, cualquiera puede bloquear a otro.
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'desconocida'
  enforceRateLimit(`login:ip:${ip}`, { max: 20, windowMs: 15 * 60 * 1000, backoff: true })
  enforceRateLimit(`login:cuenta:${email}`, { max: 10, windowMs: 15 * 60 * 1000, backoff: true })

  const user = await queryOne<UserRow>(
    `SELECT id, name, email, role, password_hash, password_algo
     FROM users
     WHERE email = ? AND active = 1`,
    [email],
  )

  if (!user) {
    // Se consume el mismo tiempo que una verificación real: sin esto, la
    // diferencia de latencia revela qué cuentas existen.
    await fakeVerify()
    await audit(event, { action: 'auth.login_failed', resource: 'user', metadata: { reason: 'no_existe' } })
    throw unauthorized('Email o contraseña incorrectos')
  }

  const { valid, needsRehash } = await verifyPassword(
    password,
    user.password_hash,
    user.password_algo,
  )

  if (!valid) {
    await audit(event, {
      action: 'auth.login_failed',
      resource: 'user',
      resourceId: user.id,
      metadata: { reason: 'clave_incorrecta' },
    })
    throw unauthorized('Email o contraseña incorrectos')
  }

  /**
   * Rehash transparente (Roadmap §6). Es el único momento en que la contraseña
   * en claro y el hash antiguo coexisten, así que es la única oportunidad de
   * convertir MD5 a bcrypt sin pedirle nada al usuario.
   */
  if (needsRehash) {
    try {
      await execute(
        "UPDATE users SET password_hash = ?, password_algo = 'bcrypt' WHERE id = ?",
        [await hashPassword(password), user.id],
      )
      await audit(event, { action: 'auth.password_rehashed', resource: 'user', resourceId: user.id })
      log.info({ userId: user.id }, 'contraseña migrada de MD5 a bcrypt')
    } catch (error) {
      // Que falle el rehash no debe impedir el login: se reintentará la
      // próxima vez que entre.
      log.error({ err: error, userId: user.id }, 'no se pudo rehashear la contraseña')
    }
  }

  resetRateLimit(`login:cuenta:${email}`)
  await createSession(event, user.id)
  await audit(event, { action: 'auth.login', resource: 'user', resourceId: user.id })

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }
})

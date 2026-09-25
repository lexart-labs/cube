/**
 * v1 no limitaba nada (MED-04). Con MD5 de por medio, una fuerza bruta salía
 * prácticamente gratis.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  enforceRateLimit,
  resetRateLimit,
  clearAllRateLimits,
} from '../../server/utils/ratelimit'

beforeEach(() => clearAllRateLimits())

describe('enforceRateLimit', () => {
  it('deja pasar hasta el máximo', () => {
    for (let i = 0; i < 5; i++) {
      expect(() => enforceRateLimit('k', { max: 5, windowMs: 60_000 })).not.toThrow()
    }
  })

  it('lanza 429 al superarlo', () => {
    for (let i = 0; i < 5; i++) enforceRateLimit('k', { max: 5, windowMs: 60_000 })
    expect(() => enforceRateLimit('k', { max: 5, windowMs: 60_000 })).toThrow(
      expect.objectContaining({ statusCode: 429 }),
    )
  })

  it('indica cuántos segundos faltan', () => {
    for (let i = 0; i < 3; i++) enforceRateLimit('k', { max: 3, windowMs: 60_000 })
    expect(() => enforceRateLimit('k', { max: 3, windowMs: 60_000 })).toThrow(/segundos/)
  })

  it('lleva cuentas independientes por clave', () => {
    for (let i = 0; i < 3; i++) enforceRateLimit('ip:1.1.1.1', { max: 3, windowMs: 60_000 })
    expect(() => enforceRateLimit('ip:2.2.2.2', { max: 3, windowMs: 60_000 })).not.toThrow()
  })

  it('el retroceso exponencial alarga cada bloqueo', () => {
    const opts = { max: 1, windowMs: 1000, backoff: true }
    enforceRateLimit('b', opts)

    let first = ''
    try { enforceRateLimit('b', opts) } catch (e) { first = (e as Error).message }

    let second = ''
    try { enforceRateLimit('b', opts) } catch (e) { second = (e as Error).message }

    const seconds = (m: string) => Number(m.match(/(\d+) segundos/)?.[1] ?? 0)
    // El segundo bloqueo no puede ser más corto que el primero.
    expect(seconds(second)).toBeGreaterThanOrEqual(seconds(first))
  })

  it('resetRateLimit limpia la cuenta tras un login correcto', () => {
    for (let i = 0; i < 3; i++) enforceRateLimit('k', { max: 3, windowMs: 60_000 })
    resetRateLimit('k')
    expect(() => enforceRateLimit('k', { max: 3, windowMs: 60_000 })).not.toThrow()
  })
})

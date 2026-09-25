/**
 * El RBAC es lo que separa "cualquiera con sesión" de "quien tiene permiso".
 * En v1 no existía: cualquier usuario autenticado entraba en la administración.
 */
import { describe, it, expect } from 'vitest'
import { requireUser, requireRole, canActOnOthers, assertCanAccessUser } from '../../server/utils/rbac'
import type { SessionUser } from '../../server/utils/session'

const dev: SessionUser = { id: 1, name: 'Dev', email: 'd@x.com', role: 'developer', sessionId: 's1' }
const lead: SessionUser = { id: 2, name: 'Lead', email: 'l@x.com', role: 'lead', sessionId: 's2' }
const admin: SessionUser = { id: 3, name: 'Admin', email: 'a@x.com', role: 'admin', sessionId: 's3' }

// h3 no hace falta: los helpers solo leen event.context.
const eventFor = (user?: SessionUser) => ({ context: user ? { user } : {} }) as never

describe('requireUser', () => {
  it('devuelve el usuario de la sesión', () => {
    expect(requireUser(eventFor(dev)).id).toBe(1)
  })

  it('lanza 401 sin sesión', () => {
    expect(() => requireUser(eventFor())).toThrow(expect.objectContaining({ statusCode: 401 }))
  })
})

describe('requireRole', () => {
  it('un admin cumple cualquier requisito', () => {
    expect(requireRole(eventFor(admin), 'developer').id).toBe(3)
    expect(requireRole(eventFor(admin), 'lead').id).toBe(3)
    expect(requireRole(eventFor(admin), 'admin').id).toBe(3)
  })

  it('un lead cumple lead y developer, pero no admin', () => {
    expect(requireRole(eventFor(lead), 'lead').id).toBe(2)
    expect(() => requireRole(eventFor(lead), 'admin')).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
  })

  it('un developer no cumple lead ni admin', () => {
    expect(() => requireRole(eventFor(dev), 'lead')).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
    expect(() => requireRole(eventFor(dev), 'admin')).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
  })

  it('sin sesión da 401, no 403', () => {
    expect(() => requireRole(eventFor(), 'admin')).toThrow(
      expect.objectContaining({ statusCode: 401 }),
    )
  })
})

describe('canActOnOthers', () => {
  it('solo lead y admin', () => {
    expect(canActOnOthers(dev)).toBe(false)
    expect(canActOnOthers(lead)).toBe(true)
    expect(canActOnOthers(admin)).toBe(true)
  })
})

describe('assertCanAccessUser', () => {
  it('un developer accede a lo suyo', () => {
    expect(() => assertCanAccessUser(dev, 1)).not.toThrow()
  })

  it('un developer NO accede a lo de otro — este es el IDOR de v1', () => {
    expect(() => assertCanAccessUser(dev, 999)).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    )
  })

  it('devuelve 404 y no 403, para no confirmar que el usuario existe', () => {
    expect(() => assertCanAccessUser(dev, 2)).toThrow(expect.objectContaining({ statusCode: 404 }))
  })

  it('lead y admin acceden a cualquiera', () => {
    expect(() => assertCanAccessUser(lead, 999)).not.toThrow()
    expect(() => assertCanAccessUser(admin, 999)).not.toThrow()
  })
})

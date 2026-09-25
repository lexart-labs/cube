/**
 * La verificación de contraseñas es el punto donde se cruza la deuda de v1
 * (MD5 sin salt) con el diseño de v2 (bcrypt). Si el camino heredado se rompe,
 * nadie puede entrar tras migrar; si no marca `needsRehash`, las contraseñas
 * se quedan en MD5 para siempre.
 */
import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { hashPassword, verifyPassword, fakeVerify } from '../../server/utils/password'

const md5 = (value: string) => createHash('md5').update(value, 'utf8').digest('hex')

describe('bcrypt', () => {
  it('acepta la contraseña correcta', async () => {
    const hash = await hashPassword('una-contraseña-larga-y-buena')
    const result = await verifyPassword('una-contraseña-larga-y-buena', hash, 'bcrypt')
    expect(result.valid).toBe(true)
    expect(result.needsRehash).toBe(false)
  })

  it('rechaza la incorrecta', async () => {
    const hash = await hashPassword('una-contraseña-larga-y-buena')
    expect((await verifyPassword('otra-cosa', hash, 'bcrypt')).valid).toBe(false)
  })

  it('produce hashes distintos para la misma contraseña (salt)', async () => {
    expect(await hashPassword('misma')).not.toBe(await hashPassword('misma'))
  })
})

describe('MD5 heredado', () => {
  it('valida contra el hash que dejó v1 y pide rehash', async () => {
    // v1 guardaba lo que devuelve MySQL: MD5(?) en hexadecimal minúsculo.
    const result = await verifyPassword('alex123', md5('alex123'), 'md5-legacy')
    expect(result.valid).toBe(true)
    expect(result.needsRehash).toBe(true)
  })

  it('rechaza la contraseña incorrecta sin pedir rehash', async () => {
    const result = await verifyPassword('incorrecta', md5('alex123'), 'md5-legacy')
    expect(result.valid).toBe(false)
    expect(result.needsRehash).toBe(false)
  })

  it('tolera el hash en mayúsculas', async () => {
    const result = await verifyPassword('alex123', md5('alex123').toUpperCase(), 'md5-legacy')
    expect(result.valid).toBe(true)
  })

  it('acepta acentos y caracteres no ASCII', async () => {
    const result = await verifyPassword('contraseña-ñ', md5('contraseña-ñ'), 'md5-legacy')
    expect(result.valid).toBe(true)
  })
})

describe('casos límite', () => {
  it('rechaza entradas vacías sin lanzar', async () => {
    expect((await verifyPassword('', 'x', 'bcrypt')).valid).toBe(false)
    expect((await verifyPassword('x', '', 'bcrypt')).valid).toBe(false)
  })

  it('fakeVerify consume tiempo comparable a una verificación real', async () => {
    const hash = await hashPassword('referencia')

    const startReal = performance.now()
    await verifyPassword('incorrecta', hash, 'bcrypt')
    const real = performance.now() - startReal

    const startFake = performance.now()
    await fakeVerify()
    const fake = performance.now() - startFake

    // Mismo orden de magnitud: lo que importa es que no sea instantánea,
    // porque esa diferencia permitiría enumerar cuentas.
    expect(fake).toBeGreaterThan(real * 0.3)
  })
})

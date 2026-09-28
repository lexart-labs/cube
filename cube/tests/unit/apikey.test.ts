/**
 * Claves de la API externa: formato del token y puerta de los handlers.
 *
 * Lo que toca base de datos (`authenticateApiKey`) no se prueba aquí —sería
 * probar mysql2— sino en los E2E, que corren contra MySQL de verdad. Lo que sí
 * se prueba es todo lo que decide sin base: cómo se genera el token, qué se
 * guarda de él y qué deja pasar `requireApiKey`.
 */
import { describe, it, expect } from 'vitest'
import type { H3Event } from 'h3'
import { createHash } from 'node:crypto'
import {
  API_SCOPES,
  EXTERNAL_API_PREFIX,
  TOKEN_PREFIX,
  extractToken,
  generateApiKey,
  hashApiKey,
  isApiScope,
  parseScopes,
  requireApiKey,
  type ApiClient,
} from '../../server/utils/apikey'

/** Evento mínimo: solo lo que leen las funciones bajo prueba. */
function fakeEvent(headers: Record<string, string> = {}, context: Record<string, unknown> = {}) {
  return { node: { req: { headers } }, context } as unknown as H3Event
}

const client: ApiClient = {
  id: 1,
  name: 'Plataforma Lexart',
  prefix: 'abc123def456',
  scopes: ['users:create'],
  ip: '203.0.113.7',
  originHost: null,
}

describe('generateApiKey', () => {
  it('produce `cube_<prefijo>_<secreto>`', () => {
    const { token, prefix } = generateApiKey()
    expect(token.startsWith(`${TOKEN_PREFIX}_${prefix}_`)).toBe(true)
    // El prefijo es hexadecimal justamente para que no pueda contener el
    // separador: en base64url el guión bajo es un carácter más del alfabeto, y
    // un prefijo con uno dentro partiría el token por donde no es.
    expect(prefix).toMatch(/^[0-9a-f]{12}$/)
  })

  it('el secreto es largo y no se repite', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateApiKey().token))
    expect(tokens.size).toBe(200)

    const { token, prefix } = generateApiKey()
    const secret = token.slice(`${TOKEN_PREFIX}_${prefix}_`.length)
    // 32 bytes en base64url son 43 caracteres.
    expect(secret.length).toBeGreaterThanOrEqual(43)
  })

  it('devuelve el hash que se guarda, y no el token', () => {
    const { token, tokenHash } = generateApiKey()
    expect(tokenHash).toBe(createHash('sha256').update(token, 'utf8').digest('hex'))
    expect(tokenHash).toHaveLength(64)
    expect(tokenHash).not.toContain(token)
  })

  it('el prefijo va en claro y no permite deducir el token', () => {
    // El prefijo identifica la clave en la lista y en los logs; el secreto son
    // otros 32 bytes independientes.
    const { token, prefix, tokenHash } = generateApiKey()
    expect(hashApiKey(`${TOKEN_PREFIX}_${prefix}_`)).not.toBe(tokenHash)
    expect(hashApiKey(token)).toBe(tokenHash)
  })
})

describe('extractToken', () => {
  it('lee X-API-Key', () => {
    expect(extractToken(fakeEvent({ 'x-api-key': 'cube_a_b' }))).toBe('cube_a_b')
  })

  it('lee Authorization: Bearer, en cualquier caja', () => {
    expect(extractToken(fakeEvent({ authorization: 'Bearer cube_a_b' }))).toBe('cube_a_b')
    expect(extractToken(fakeEvent({ authorization: 'bearer cube_a_b' }))).toBe('cube_a_b')
  })

  it('X-API-Key gana si vienen las dos', () => {
    expect(extractToken(fakeEvent({ 'x-api-key': 'cube_x', authorization: 'Bearer cube_y' }))).toBe(
      'cube_x',
    )
  })

  it('devuelve null cuando no hay nada que leer', () => {
    expect(extractToken(fakeEvent())).toBeNull()
    expect(extractToken(fakeEvent({ 'x-api-key': '   ' }))).toBeNull()
    expect(extractToken(fakeEvent({ authorization: 'Basic dXNlcjpwYXNz' }))).toBeNull()
  })
})

describe('parseScopes', () => {
  it('parte por comas y tolera espacios', () => {
    expect(parseScopes('users:create')).toEqual(['users:create'])
    expect(parseScopes(' users:create ,users:create')).toEqual(['users:create', 'users:create'])
  })

  it('descarta lo que no reconoce', () => {
    // Un permiso retirado del código no puede seguir concediendo nada por
    // estar escrito en una fila vieja.
    expect(parseScopes('users:create,admin:todo,')).toEqual(['users:create'])
    expect(parseScopes('')).toEqual([])
  })

  it('isApiScope solo acepta los declarados', () => {
    for (const scope of API_SCOPES) expect(isApiScope(scope)).toBe(true)
    expect(isApiScope('users:delete')).toBe(false)
  })
})

describe('requireApiKey', () => {
  it('devuelve el cliente que puso el middleware', () => {
    expect(requireApiKey(fakeEvent({}, { apiClient: client }))).toBe(client)
  })

  it('sin cliente en el contexto, 401 y no una autenticación improvisada', () => {
    // Pasa si un handler acaba fuera de /api/external/: lo correcto es no
    // responder, no intentar autenticar por su cuenta.
    expect(() => requireApiKey(fakeEvent())).toThrowError(
      expect.objectContaining({ statusCode: 401 }),
    )
  })

  it('exige el permiso pedido', () => {
    const sinPermisos: ApiClient = { ...client, scopes: [] }
    expect(() =>
      requireApiKey(fakeEvent({}, { apiClient: sinPermisos }), 'users:create'),
    ).toThrowError(expect.objectContaining({ statusCode: 403 }))

    expect(requireApiKey(fakeEvent({}, { apiClient: client }), 'users:create')).toBe(client)
  })

  it('sin permiso pedido basta con la clave', () => {
    const sinPermisos: ApiClient = { ...client, scopes: [] }
    expect(requireApiKey(fakeEvent({}, { apiClient: sinPermisos }))).toBe(sinPermisos)
  })
})

describe('prefijo de la API externa', () => {
  it('acaba en barra, para que no se cuele un hermano', () => {
    // Sin la barra final, `/api/externalidades` entraría por empezar igual —
    // el mismo fallo que la allow-list del middleware de sesión evita con
    // `route.prefix`.
    expect(EXTERNAL_API_PREFIX).toBe('/api/external/')
    expect('/api/externalidades'.startsWith(EXTERNAL_API_PREFIX)).toBe(false)
    expect('/api/external/v1/users'.startsWith(EXTERNAL_API_PREFIX)).toBe(true)
  })
})

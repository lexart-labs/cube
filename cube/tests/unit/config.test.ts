/**
 * Prueba que la validación de configuración cierra HIGH-05: un secreto ausente,
 * corto o de plantilla debe impedir el arranque, no degradarse silenciosamente.
 */
import { describe, it, expect } from 'vitest'
import { validateServerConfig, embedOriginList } from '../../server/utils/config'

const strongSecret = 'k7Qz-91xR2mB4vL8pT6wY3nJ5cH0sD2f'

const baseConfig = {
  sessionSecret: strongSecret,
  db: {
    host: '127.0.0.1',
    port: '3306',
    user: 'cube',
    password: 'wG4-mZ8qT2nL7xB5vR9cJ3hY6sK1dP0f',
    name: 'lexart_cube',
    ssl: 'false',
  },
}

describe('validateServerConfig', () => {
  it('acepta una configuración completa y fuerte', () => {
    const config = validateServerConfig(baseConfig)
    expect(config.db.port).toBe(3306)
    expect(config.sessionSecret).toBe(strongSecret)
  })

  it('rechaza un secreto de sesión ausente', () => {
    const config = { ...baseConfig, sessionSecret: '' }
    expect(() => validateServerConfig(config)).toThrow(/NUXT_SESSION_SECRET/)
  })

  it('rechaza un secreto más corto que el mínimo', () => {
    const config = { ...baseConfig, sessionSecret: 'corto' }
    expect(() => validateServerConfig(config)).toThrow(/mínimo son 32/)
  })

  it.each([
    'your-secret-key-aaaaaaaaaaaaaaaaaaaaaaaa',
    'your-super-secret-jwt-key-bbbbbbbbbbbbbb',
    'y0ur.k3y-cccccccccccccccccccccccccccccccc',
  ])('rechaza el valor de plantilla %s', (placeholder) => {
    const config = { ...baseConfig, sessionSecret: placeholder }
    expect(() => validateServerConfig(config)).toThrow(/plantilla conocido/)
  })

  it('rechaza un secreto largo pero sin entropía', () => {
    const config = { ...baseConfig, sessionSecret: 'a'.repeat(64) }
    expect(() => validateServerConfig(config)).toThrow(/entropía/)
  })

  /**
   * Regresión. Con `z.coerce.boolean()` la cadena "false" valía true, y
   * `nuxt.config.ts` declara exactamente esa cadena por defecto: la semilla
   * quedaba activada sin que nadie la pidiera, lista para crear una cuenta de
   * administrador con contraseña conocida en el primer arranque con la base
   * vacía.
   */
  it('la cadena "false" desactiva las banderas, no las activa', () => {
    const config = validateServerConfig({
      ...baseConfig,
      seedOnStartup: 'false',
      db: { ...baseConfig.db, ssl: 'false' },
    })
    expect(config.seedOnStartup).toBe(false)
    expect(config.db.ssl).toBe(false)
  })

  it('solo un valor explícito activa las banderas', () => {
    for (const value of ['true', 'TRUE', '1', 'yes']) {
      expect(validateServerConfig({ ...baseConfig, seedOnStartup: value }).seedOnStartup).toBe(true)
    }
    for (const value of ['', 'no', '0', 'off']) {
      expect(validateServerConfig({ ...baseConfig, seedOnStartup: value }).seedOnStartup).toBe(false)
    }
  })

  it('sin la bandera, no se siembra', () => {
    expect(validateServerConfig(baseConfig).seedOnStartup).toBe(false)
  })

  it('rechaza una contraseña de base de datos de ejemplo', () => {
    const config = { ...baseConfig, db: { ...baseConfig.db, password: 'password' } }
    expect(() => validateServerConfig(config)).toThrow(/NUXT_DB_PASSWORD/)
  })

  it('enumera todos los problemas de una vez, no solo el primero', () => {
    const config = {
      ...baseConfig,
      sessionSecret: '',
      db: { ...baseConfig.db, password: '' },
    }
    try {
      validateServerConfig(config)
      expect.unreachable('debería haber lanzado')
    } catch (error) {
      const message = (error as Error).message
      expect(message).toContain('NUXT_SESSION_SECRET')
      expect(message).toContain('NUXT_DB_PASSWORD')
    }
  })
})

describe('embedOrigins — embebido en iframe (NUXT_EMBED_ORIGINS)', () => {
  it('por defecto la lista es vacía y nadie puede embeber', () => {
    // Sin la variable, el cierre de hoy se queda igual: frame-ancestors 'none'.
    expect(validateServerConfig(baseConfig).embedOrigins).toBe('')
    expect(embedOriginList('')).toEqual([])
  })

  it('acepta los orígenes de la plataforma de Lexart', () => {
    const config = validateServerConfig({
      ...baseConfig,
      embedOrigins: 'platform.lexart.tech, *.lexart.tech',
    })
    expect(config.embedOrigins).toBe('platform.lexart.tech, *.lexart.tech')

    // Normalizadas a fuentes CSP, en el orden declarado.
    expect(embedOriginList(config.embedOrigins)).toEqual([
      'https://platform.lexart.tech',
      'https://*.lexart.tech',
    ])
  })

  it('una entrada mal escrita aborta el arranque, no se ignora en silencio', () => {
    // Igual que trustedProxies: si se ignorara, el embebido seguiría cerrado
    // y la plataforma seguiría sin poder cargar a Cube sin que nada lo dijera.
    const config = { ...baseConfig, embedOrigins: 'https://*.lexart.tech/ruta' }
    expect(() => validateServerConfig(config)).toThrow(/NUXT_EMBED_ORIGINS/)
  })

  it('el comodín suelto no se acepta: abriría el marco a cualquiera', () => {
    const config = { ...baseConfig, embedOrigins: '*' }
    expect(() => validateServerConfig(config)).toThrow(/NUXT_EMBED_ORIGINS/)
  })
})

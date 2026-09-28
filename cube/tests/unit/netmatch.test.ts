/**
 * Listas de acceso de la API externa.
 *
 * Es el fichero de tests que más importa de los nuevos: una lista blanca que
 * deja pasar de más no falla, *funciona* — simplemente para quien no debería.
 * Por eso aquí se prueba sobre todo lo que tiene que quedar FUERA: el octal
 * encubierto, la IP mapeada, el comodín que se come el dominio de al lado y la
 * cabecera `X-Forwarded-For` puesta a mano.
 */
import { describe, it, expect } from 'vitest'
import {
  parseIp,
  ipMatches,
  ipMatchesAny,
  isValidIpPattern,
  hostFromOrigin,
  domainMatches,
  isValidDomainPattern,
  pickClientIp,
  evaluateAccess,
} from '../../server/utils/netmatch'

describe('parseIp', () => {
  it('acepta IPv4 e IPv6 normales', () => {
    expect(parseIp('127.0.0.1')).toEqual(new Uint8Array([127, 0, 0, 1]))
    expect(parseIp('::1')).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]))
  })

  it('normaliza la IPv4 mapeada en IPv6 a la IPv4 de siempre', () => {
    // Node entrega esto para una conexión IPv4 sobre un socket dual-stack. Sin
    // normalizar, quien escribe 127.0.0.1 en la lista se queda fuera.
    expect(parseIp('::ffff:127.0.0.1')).toEqual(new Uint8Array([127, 0, 0, 1]))
    expect(parseIp('[::ffff:10.0.0.7]')).toEqual(new Uint8Array([10, 0, 0, 7]))
  })

  it('ignora el identificador de zona', () => {
    expect(parseIp('fe80::1%eth0')).not.toBeNull()
  })

  it('rechaza los ceros a la izquierda', () => {
    // `010.0.0.1` es 8.0.0.1 en octal para unas librerías y 10.0.0.1 para
    // otras. Lo que no se puede es adivinar cuál.
    expect(parseIp('010.0.0.1')).toBeNull()
    expect(parseIp('127.00.0.1')).toBeNull()
  })

  it('rechaza la basura habitual', () => {
    for (const value of [
      '',
      '  ',
      '1.2.3',
      '1.2.3.4.5',
      '256.0.0.1',
      '1.2.3.-4',
      'no-soy-una-ip',
      '1.2.3.4/8', // el CIDR va por otro camino
      ':::1',
      '12345::1',
      '0x7f.0.0.1',
    ]) {
      expect(parseIp(value), value).toBeNull()
    }
  })
})

describe('ipMatches', () => {
  it('coincidencia exacta sin máscara', () => {
    expect(ipMatches('203.0.113.10', '203.0.113.10')).toBe(true)
    expect(ipMatches('203.0.113.10', '203.0.113.11')).toBe(false)
  })

  it('CIDR IPv4 en bordes de byte y fuera de ellos', () => {
    expect(ipMatches('10.0.0.0/8', '10.255.255.255')).toBe(true)
    expect(ipMatches('10.0.0.0/8', '11.0.0.1')).toBe(false)
    expect(ipMatches('192.168.1.0/24', '192.168.1.200')).toBe(true)
    expect(ipMatches('192.168.1.0/24', '192.168.2.1')).toBe(false)

    // /28 parte un byte por la mitad: es donde falla un comparador escrito a ojo.
    expect(ipMatches('192.168.1.16/28', '192.168.1.31')).toBe(true)
    expect(ipMatches('192.168.1.16/28', '192.168.1.32')).toBe(false)
  })

  it('CIDR IPv6', () => {
    expect(ipMatches('2001:db8::/32', '2001:db8:1234::1')).toBe(true)
    expect(ipMatches('2001:db8::/32', '2001:db9::1')).toBe(false)
  })

  it('el localhost mapeado entra por su entrada IPv4', () => {
    expect(ipMatches('127.0.0.1', '::ffff:127.0.0.1')).toBe(true)
    expect(ipMatches('127.0.0.0/8', '::ffff:127.0.0.9')).toBe(true)
  })

  it('no mezcla familias', () => {
    // `::/0` no puede convertirse en "todo el mundo, IPv4 incluida".
    expect(ipMatches('::/0', '203.0.113.10')).toBe(false)
    expect(ipMatches('0.0.0.0/0', '::1')).toBe(false)
    expect(ipMatches('0.0.0.0/0', '203.0.113.10')).toBe(true)
  })

  it('un patrón inválido no coincide con nada', () => {
    expect(ipMatches('10.0.0.0/64', '10.0.0.1')).toBe(false)
    expect(ipMatches('banana', '10.0.0.1')).toBe(false)
    expect(ipMatches('10.0.0.0/abc', '10.0.0.1')).toBe(false)
  })

  it('una lista vacía no deja pasar a nadie', () => {
    expect(ipMatchesAny([], '127.0.0.1')).toBe(false)
    expect(ipMatchesAny(['127.0.0.1'], null)).toBe(false)
  })
})

describe('isValidIpPattern', () => {
  it('acepta lo que se puede guardar', () => {
    for (const value of ['127.0.0.1', '::1', '10.0.0.0/8', '2001:db8::/32', '0.0.0.0/0']) {
      expect(isValidIpPattern(value), value).toBe(true)
    }
  })

  it('rechaza lo que no', () => {
    for (const value of [
      '',
      '10.0.0.0/33',
      '2001:db8::/129',
      '10.0.0.0/8/8',
      'localhost',
      '010.1.1.1',
    ]) {
      expect(isValidIpPattern(value), value).toBe(false)
    }
  })
})

describe('dominios', () => {
  it('saca el host de la cabecera Origin, sin esquema ni puerto', () => {
    expect(hostFromOrigin('http://localhost:3000')).toBe('localhost')
    expect(hostFromOrigin('https://App.Lexart.Tech')).toBe('app.lexart.tech')
    expect(hostFromOrigin('https://app.lexart.tech.')).toBe('app.lexart.tech')
  })

  it('el origen opaco no es un origen', () => {
    // Un iframe con sandbox o una página `file://` mandan literalmente "null".
    expect(hostFromOrigin('null')).toBeNull()
    expect(hostFromOrigin('')).toBeNull()
    expect(hostFromOrigin(undefined)).toBeNull()
    expect(hostFromOrigin('no es una url')).toBeNull()
  })

  it('coincidencia exacta', () => {
    expect(domainMatches('app.lexart.tech', 'app.lexart.tech')).toBe(true)
    expect(domainMatches('app.lexart.tech', 'otra.lexart.tech')).toBe(false)
    expect(domainMatches('localhost', 'localhost')).toBe(true)
  })

  it('el comodín cubre subdominios pero no el dominio desnudo', () => {
    expect(domainMatches('*.lexart.tech', 'app.lexart.tech')).toBe(true)
    expect(domainMatches('*.lexart.tech', 'a.b.lexart.tech')).toBe(true)
    expect(domainMatches('*.lexart.tech', 'lexart.tech')).toBe(false)
  })

  it('el comodín no se come el dominio de al lado', () => {
    // El fallo clásico de comparar con `endsWith` a secas: `malexart.tech`
    // termina en `lexart.tech`, y no tiene nada que ver.
    expect(domainMatches('*.lexart.tech', 'malexart.tech')).toBe(false)
    expect(domainMatches('lexart.tech', 'malexart.tech')).toBe(false)
    expect(domainMatches('*.lexart.tech', 'app.lexart.tech.evil.com')).toBe(false)
  })

  it('valida lo que se puede guardar como dominio', () => {
    for (const value of ['localhost', 'app.lexart.tech', '*.lexart.tech', 'cube-2.lexart.tech']) {
      expect(isValidDomainPattern(value), value).toBe(true)
    }
    // Un `*` suelto abriría la API a cualquier origen; y el esquema o el
    // puerto se rechazan en vez de limpiarse, para no enseñar que importan.
    for (const value of [
      '*',
      '*.',
      '',
      'https://app.lexart.tech',
      'localhost:3000',
      'a..b',
      '-mal.tech',
    ]) {
      expect(isValidDomainPattern(value), value).toBe(false)
    }
  })
})

describe('pickClientIp', () => {
  it('sin proxies declarados, la cabecera no existe', () => {
    // Este es EL test del fichero: sin él, cualquiera se salta la lista de IPs
    // mandando una cabecera.
    expect(pickClientIp('198.51.100.9', '10.0.0.5', [])).toBe('198.51.100.9')
    expect(pickClientIp('198.51.100.9', '127.0.0.1, 10.0.0.5', [])).toBe('198.51.100.9')
  })

  it('tampoco se cree la cabecera si el socket no es un proxy declarado', () => {
    expect(pickClientIp('198.51.100.9', '10.0.0.5', ['127.0.0.1'])).toBe('198.51.100.9')
  })

  it('detrás de un proxy declarado, devuelve al cliente real', () => {
    expect(pickClientIp('127.0.0.1', '203.0.113.7', ['127.0.0.1'])).toBe('203.0.113.7')
  })

  it('con varios saltos coge el último que no sea un proxy nuestro', () => {
    // La parte izquierda de la cadena la puede escribir el cliente: solo es de
    // fiar lo que añadió el proxy en el que confiamos.
    expect(
      pickClientIp('127.0.0.1', '1.2.3.4, 203.0.113.7, 10.0.0.1', ['127.0.0.1', '10.0.0.0/8']),
    ).toBe('203.0.113.7')
  })

  it('una cadena manipulada cae a la IP del socket', () => {
    expect(pickClientIp('127.0.0.1', 'no-soy-una-ip', ['127.0.0.1'])).toBe('127.0.0.1')
  })

  it('sin socket no hay IP que valga', () => {
    expect(pickClientIp(null, '203.0.113.7', ['127.0.0.1'])).toBeNull()
    expect(pickClientIp('basura', '203.0.113.7', ['127.0.0.1'])).toBeNull()
  })
})

describe('evaluateAccess', () => {
  const sinListas = { ips: [], domains: [] }

  it('una clave sin listas está bloqueada', () => {
    // El valor por defecto de una clave recién creada.
    expect(evaluateAccess(sinListas, { ip: '127.0.0.1', originHost: null })).toEqual({
      allowed: false,
      reason: 'sin_listas',
    })
    expect(evaluateAccess(sinListas, { ip: '127.0.0.1', originHost: 'localhost' })).toEqual({
      allowed: false,
      reason: 'sin_listas',
    })
  })

  it('servidor a servidor: manda la lista de IPs', () => {
    const list = { ips: ['203.0.113.0/24'], domains: [] }
    expect(evaluateAccess(list, { ip: '203.0.113.7', originHost: null })).toEqual({ allowed: true })
    expect(evaluateAccess(list, { ip: '198.51.100.1', originHost: null })).toEqual({
      allowed: false,
      reason: 'ip_no_permitida',
    })
    expect(evaluateAccess(list, { ip: null, originHost: null })).toEqual({
      allowed: false,
      reason: 'ip_desconocida',
    })
  })

  it('una clave solo de IPs no vale desde un navegador', () => {
    const list = { ips: ['203.0.113.7'], domains: [] }
    expect(evaluateAccess(list, { ip: '203.0.113.7', originHost: 'app.lexart.tech' })).toEqual({
      allowed: false,
      reason: 'origen_no_permitido',
    })
  })

  it('una clave solo de dominios no vale de servidor a servidor', () => {
    const list = { ips: [], domains: ['app.lexart.tech'] }
    expect(evaluateAccess(list, { ip: '203.0.113.7', originHost: null })).toEqual({
      allowed: false,
      reason: 'sin_origen',
    })
    expect(evaluateAccess(list, { ip: '203.0.113.7', originHost: 'app.lexart.tech' })).toEqual({
      allowed: true,
    })
  })

  it('con las dos listas hay que cumplir las dos', () => {
    const list = { ips: ['203.0.113.0/24'], domains: ['app.lexart.tech'] }
    expect(evaluateAccess(list, { ip: '203.0.113.7', originHost: 'app.lexart.tech' })).toEqual({
      allowed: true,
    })
    expect(evaluateAccess(list, { ip: '198.51.100.1', originHost: 'app.lexart.tech' })).toEqual({
      allowed: false,
      reason: 'ip_no_permitida',
    })
  })

  it('falsificar el Origin nunca da permisos, solo los quita', () => {
    // Un cliente que no es un navegador puede poner la cabecera que quiera. Si
    // la pone, se le exige además estar en la lista de dominios; nunca le
    // exime de la de IPs.
    const soloIps = { ips: ['203.0.113.7'], domains: [] }
    expect(evaluateAccess(soloIps, { ip: '203.0.113.7', originHost: 'inventado.test' })).toEqual({
      allowed: false,
      reason: 'origen_no_permitido',
    })

    const ambas = { ips: ['203.0.113.7'], domains: ['app.lexart.tech'] }
    expect(evaluateAccess(ambas, { ip: '198.51.100.1', originHost: 'app.lexart.tech' })).toEqual({
      allowed: false,
      reason: 'ip_no_permitida',
    })
  })

  it('localhost se puede autorizar, que es lo que pide el desarrollo', () => {
    const list = { ips: ['127.0.0.1', '::1'], domains: ['localhost'] }
    expect(evaluateAccess(list, { ip: '127.0.0.1', originHost: 'localhost' })).toEqual({
      allowed: true,
    })
    expect(evaluateAccess(list, { ip: '::ffff:127.0.0.1', originHost: 'localhost' })).toEqual({
      allowed: true,
    })
    expect(evaluateAccess(list, { ip: '::1', originHost: null })).toEqual({ allowed: true })
  })
})

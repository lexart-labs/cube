/**
 * Coincidencia de IPs y dominios para las listas de acceso de la API externa.
 *
 * Todo lo de aquí es **puro**: entra texto, sale un booleano. No toca h3 ni la
 * base a propósito, porque una lista de acceso que solo se puede probar
 * levantando el servidor es una lista de acceso que nadie prueba
 * (`tests/unit/netmatch.test.ts`).
 *
 * Dos decisiones que no son obvias y que explican casi todo el fichero:
 *
 *  1. **No se usa ninguna librería de CIDR.** Las populares (`ip`, `netmask`)
 *     acumulan CVE por interpretar `010.0.0.1` como octal, `1.1.1.1.1` como
 *     válida o `::ffff:127.0.0.1` como si no fuera 127.0.0.1. Un parser
 *     permisivo delante de una allow-list es un bypass, así que aquí se
 *     rechaza todo lo ambiguo en lugar de adivinar.
 *
 *  2. **Se normaliza antes de comparar.** Node entrega muchas veces
 *     `::ffff:127.0.0.1` para una conexión IPv4 (socket dual-stack). Sin
 *     normalizar, quien escribe `127.0.0.1` en la lista se queda fuera de su
 *     propio servidor y acaba poniendo `0.0.0.0/0` para salir del paso.
 */

// ---------------------------------------------------------------------------
// IPs
// ---------------------------------------------------------------------------

/**
 * Convierte una IPv4 en 4 bytes.
 *
 * Se rechazan los ceros a la izquierda: `010.0.0.1` es 8.0.0.1 en octal para
 * unas librerías y 10.0.0.1 para otras. Una lista de acceso no puede depender
 * de cuál de las dos lecturas haga el que compara.
 */
function parseIpv4(text: string): Uint8Array | null {
  const parts = text.split('.')
  if (parts.length !== 4) return null

  const bytes = new Uint8Array(4)
  for (let i = 0; i < 4; i++) {
    const part = parts[i]!
    if (!/^(0|[1-9]\d{0,2})$/.test(part)) return null
    const value = Number(part)
    if (value > 255) return null
    bytes[i] = value
  }
  return bytes
}

/** Convierte una IPv6 en 16 bytes. Admite `::` y el sufijo IPv4 embebido. */
function parseIpv6(text: string): Uint8Array | null {
  // El identificador de zona (`fe80::1%eth0`) no forma parte de la dirección.
  const address = text.split('%')[0] ?? ''
  if (address.length === 0) return null

  // Sufijo IPv4 embebido (`::ffff:192.168.0.1`): se traduce a dos grupos hex
  // para tratar todo el resto con un solo algoritmo.
  let head = address
  const lastColon = address.lastIndexOf(':')
  if (address.includes('.')) {
    const tailBytes = parseIpv4(address.slice(lastColon + 1))
    if (!tailBytes) return null
    head = address.slice(0, lastColon + 1)
    head += `${((tailBytes[0]! << 8) | tailBytes[1]!).toString(16)}:${(
      (tailBytes[2]! << 8) |
      tailBytes[3]!
    ).toString(16)}`
  }

  const halves = head.split('::')
  if (halves.length > 2) return null

  const toGroups = (chunk: string): number[] | null => {
    if (chunk === '') return []
    const groups: number[] = []
    for (const group of chunk.split(':')) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null
      groups.push(parseInt(group, 16))
    }
    return groups
  }

  const left = toGroups(halves[0] ?? '')
  const right = halves.length === 2 ? toGroups(halves[1] ?? '') : []
  if (!left || !right) return null

  // Sin `::` tienen que estar los ocho grupos; con `::` hay al menos uno
  // comprimido, así que la suma debe dejar hueco.
  if (halves.length === 1 ? left.length !== 8 : left.length + right.length > 7) return null

  const groups = [...left, ...Array(8 - left.length - right.length).fill(0), ...right]
  const bytes = new Uint8Array(16)
  groups.forEach((group, index) => {
    bytes[index * 2] = group >> 8
    bytes[index * 2 + 1] = group & 0xff
  })
  return bytes
}

/** Una IPv6 mapeada (`::ffff:a.b.c.d`) es la misma máquina que la IPv4. */
function unmapIpv4(bytes: Uint8Array): Uint8Array {
  if (bytes.length !== 16) return bytes
  for (let i = 0; i < 10; i++) if (bytes[i] !== 0) return bytes
  if (bytes[10] !== 0xff || bytes[11] !== 0xff) return bytes
  return bytes.slice(12)
}

/**
 * Normaliza una dirección a sus bytes. `null` si no es una IP válida.
 * Una IPv4 siempre sale como 4 bytes, venga escrita como venga.
 */
export function parseIp(text: string): Uint8Array | null {
  const trimmed = text.trim().replace(/^\[|\]$/g, '')
  if (trimmed.length === 0) return null

  if (trimmed.includes(':')) {
    const parsed = parseIpv6(trimmed)
    return parsed ? unmapIpv4(parsed) : null
  }
  return parseIpv4(trimmed)
}

/** `true` si el texto es una IP o un CIDR que se puede guardar en la lista. */
export function isValidIpPattern(pattern: string): boolean {
  const [address, prefix, ...rest] = pattern.trim().split('/')
  if (rest.length > 0 || address === undefined) return false

  const bytes = parseIp(address)
  if (!bytes) return false
  if (prefix === undefined) return true

  if (!/^\d{1,3}$/.test(prefix)) return false
  return Number(prefix) <= bytes.length * 8
}

/**
 * ¿Cae `ip` dentro de `pattern`?
 *
 * `pattern` es una IP suelta (coincidencia exacta) o un CIDR. Las familias no
 * se mezclan: `10.0.0.0/8` nunca admite una IPv6, aunque venga mapeada — para
 * eso se normaliza antes.
 */
export function ipMatches(pattern: string, ip: string): boolean {
  const [addressText, prefixText] = pattern.trim().split('/')
  if (addressText === undefined) return false

  const network = parseIp(addressText)
  const candidate = parseIp(ip)
  if (!network || !candidate) return false
  if (network.length !== candidate.length) return false

  const bits = prefixText === undefined ? network.length * 8 : Number(prefixText)
  if (!Number.isInteger(bits) || bits < 0 || bits > network.length * 8) return false

  const fullBytes = bits >> 3
  for (let i = 0; i < fullBytes; i++) {
    if (network[i] !== candidate[i]) return false
  }

  const remainingBits = bits & 7
  if (remainingBits === 0) return true

  // Máscara de los bits altos que todavía cuentan dentro del último byte.
  const mask = (0xff << (8 - remainingBits)) & 0xff
  return (network[fullBytes]! & mask) === (candidate[fullBytes]! & mask)
}

/** ¿Coincide la IP con alguna entrada de la lista? Lista vacía = no. */
export function ipMatchesAny(patterns: readonly string[], ip: string | null): boolean {
  if (!ip) return false
  return patterns.some((pattern) => ipMatches(pattern, ip))
}

// ---------------------------------------------------------------------------
// Dominios
// ---------------------------------------------------------------------------

/**
 * Host de una cabecera `Origin`.
 *
 * Devuelve solo el nombre: ni esquema ni puerto. El puerto se ignora a
 * propósito —`http://localhost:3000` y `http://localhost:5173` son el mismo
 * sitio para esta lista— y así nadie tiene que declarar cada puerto de
 * desarrollo. El esquema tampoco decide nada: lo que protege la API es el
 * token, y el transporte lo impone HSTS.
 *
 * `null` si el valor no es un origen con forma de URL, incluido el literal
 * `"null"` que envían los navegadores desde un `file://` o un iframe opaco.
 */
export function hostFromOrigin(origin: string | null | undefined): string | null {
  if (!origin) return null
  const trimmed = origin.trim()
  if (trimmed === '' || trimmed === 'null') return null

  try {
    const { hostname } = new URL(trimmed)
    return normalizeHost(hostname)
  } catch {
    return null
  }
}

/** Minúsculas, sin corchetes de IPv6 y sin el punto final del FQDN. */
function normalizeHost(host: string): string {
  return host
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
}

/**
 * `true` si el patrón se puede guardar como dominio.
 *
 * Se exige un host pelado. Un `https://app.lexart.tech/` escrito en la casilla
 * no se limpia en silencio: se rechaza con un mensaje, porque limpiarlo
 * enseñaría que el esquema importa cuando no importa, y un `*` suelto —que
 * abriría la API a cualquier origen— quedaría a un descuido de distancia.
 */
export function isValidDomainPattern(pattern: string): boolean {
  const host = pattern.trim().toLowerCase()
  if (host.length === 0 || host.length > 191) return false
  if (host === '*' || host === '*.') return false

  const bare = host.startsWith('*.') ? host.slice(2) : host
  if (bare.length === 0) return false

  // Etiquetas DNS: letras, dígitos y guiones, sin empezar ni acabar en guión.
  // `localhost` (una sola etiqueta, sin punto) es válido y tiene que serlo.
  return bare.split('.').every((label) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
}

/**
 * ¿Coincide el host con el patrón?
 *
 * `*.lexart.tech` cubre los subdominios (`app.lexart.tech`, `a.b.lexart.tech`)
 * pero **no** el dominio desnudo: quien quiera los dos declara los dos. Un
 * comodín que además cubriera el apex sería imposible de restringir después.
 */
export function domainMatches(pattern: string, host: string): boolean {
  const normalizedPattern = pattern.trim().toLowerCase().replace(/\.$/, '')
  const normalizedHost = normalizeHost(host)
  if (normalizedHost.length === 0) return false

  if (normalizedPattern.startsWith('*.')) {
    const suffix = normalizedPattern.slice(1) // ".lexart.tech"
    return normalizedHost.endsWith(suffix) && normalizedHost.length > suffix.length
  }
  return normalizedHost === normalizedPattern
}

/** ¿Coincide el host con alguna entrada? Lista vacía = no. */
export function domainMatchesAny(patterns: readonly string[], host: string | null): boolean {
  if (!host) return false
  return patterns.some((pattern) => domainMatches(pattern, host))
}

/**
 * Una entrada de `NUXT_EMBED_ORIGINS`, normalizada a fuente CSP (host-source).
 *
 * Se acepta `host`, `host:puerto` o `scheme://host:puerto`, con `https` como
 * esquema cuando no se declara. El comodín es el de `isValidDomainPattern`:
 * `*.lexart.tech` cubre los subdominios pero no el dominio desnudo, así que
 * quien quiera los dos declara los dos. La plataforma de Lexart embebe a Cube
 * en un iframe, y esta lista es la que abre `frame-ancestors` — que por defecto
 * está en `'none'` (ver `server/plugins/10.embed-origins.ts`).
 *
 * A diferencia de `hostFromOrigin`, aquí el esquema y el puerto IMPORTAN: la
 * comparación la hace el navegador contra la CSP, no este código contra una
 * tabla, y en una CSP `https://app.lexart.tech` no cubre `http://` ni otro
 * puerto. Nada de ruta, consulta ni fragmento: es un origen, no una URL, y
 * "limpiarlo" en silencio escondería el error de quien declaró una URL entera.
 *
 * `null` si la entrada no vale.
 */
export function parseEmbedOrigin(entry: string): string | null {
  const value = entry.trim().toLowerCase()
  if (value === '') return null

  let scheme = 'https'
  let rest = value
  const schemeMatch = /^([a-z][a-z0-9+.-]*):\/\//.exec(value)
  if (schemeMatch) {
    // Solo http y https: una lista blanca de esquemas rara sería un anuncio
    // de que hay algo más raro aceptándose.
    if (schemeMatch[1] !== 'http' && schemeMatch[1] !== 'https') return null
    scheme = schemeMatch[1]!
    rest = value.slice(schemeMatch[0].length)
  }

  // Ni ruta, ni consulta, ni fragmento, ni userinfo, ni IPv6 entre corchetes.
  if (/[/?#@[\\\]^|]/.test(rest)) return null

  const colon = rest.lastIndexOf(':')
  let host = rest
  let port = ''
  if (colon !== -1) {
    host = rest.slice(0, colon)
    port = rest.slice(colon + 1)
    if (!/^\d{1,5}$/.test(port)) return null
    if (Number(port) < 1 || Number(port) > 65535) return null
  }

  if (!isValidDomainPattern(host)) return null

  return port === '' ? `${scheme}://${host}` : `${scheme}://${host}:${port}`
}

// ---------------------------------------------------------------------------
// De quién es realmente la petición
// ---------------------------------------------------------------------------

/**
 * IP real de quien llama, a partir de la del socket y de `X-Forwarded-For`.
 *
 * Esto es lo que hace que la lista de IPs signifique algo. `X-Forwarded-For`
 * la escribe el cliente: si se creyera sin más, pasar la lista sería tan fácil
 * como mandar `X-Forwarded-For: 10.0.0.5`, y la lista pasaría de control de
 * acceso a decoración. h3 ofrece `getRequestIP(event, { xForwardedFor: true })`
 * y hace exactamente eso, coger el primer valor de la cadena; por eso aquí no
 * se usa.
 *
 * La regla: solo se mira la cadena si **el socket es un proxy declarado**
 * (`NUXT_TRUSTED_PROXIES`), y dentro de ella se coge el valor más a la derecha
 * que no sea también un proxy declarado — el último salto que el proxy de
 * confianza vio de verdad. Lo que haya a la izquierda lo puso el cliente.
 *
 * Sin proxies declarados (el valor por defecto) la cabecera se ignora entera.
 */
export function pickClientIp(
  socketIp: string | null,
  forwardedFor: string | null,
  trustedProxies: readonly string[],
): string | null {
  const socket = socketIp ? (parseIp(socketIp) ? socketIp.trim() : null) : null
  if (!socket) return null
  if (trustedProxies.length === 0 || !forwardedFor) return socket
  if (!ipMatchesAny(trustedProxies, socket)) return socket

  const chain = forwardedFor
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  for (let i = chain.length - 1; i >= 0; i--) {
    const candidate = chain[i]!
    if (!parseIp(candidate)) return socket // cadena manipulada: no se adivina
    if (!ipMatchesAny(trustedProxies, candidate)) return candidate
  }

  return socket
}

// ---------------------------------------------------------------------------
// La decisión
// ---------------------------------------------------------------------------

export interface Allowlist {
  /** IPs y CIDR admitidos. */
  ips: readonly string[]
  /** Hosts admitidos en la cabecera Origin. */
  domains: readonly string[]
}

export interface RequestOrigin {
  /** IP de quien llama, ya resuelta con `pickClientIp`. */
  ip: string | null
  /** Host de la cabecera Origin, o `null` si la petición no la traía. */
  originHost: string | null
}

export type DenyReason =
  'sin_listas' | 'sin_origen' | 'origen_no_permitido' | 'ip_desconocida' | 'ip_no_permitida'

export type AccessDecision = { allowed: true } | { allowed: false; reason: DenyReason }

/**
 * ¿Se admite esta petición para esta clave?
 *
 * **Por defecto, no.** Una clave recién creada no tiene ninguna entrada y no
 * funciona desde ningún sitio; hay que decir desde dónde. Es deliberado: el
 * error caro es una clave que funciona desde cualquier parte, no una que
 * todavía no funciona desde ninguna.
 *
 * Las dos listas cubren canales distintos y por eso se comprueban distinto:
 *
 *   · Con cabecera `Origin` la petición viene de un navegador, y solo el
 *     navegador puede fijarla con veracidad. Mandan los dominios; si la clave
 *     no declara ninguno, es que no es para usarse desde un navegador.
 *
 *   · Sin `Origin` es servidor a servidor. Mandan las IPs; si la clave no
 *     declara ninguna, no hay nada que avale la petición y se deniega.
 *
 *   · Si la clave declara IPs, se exigen **siempre**, también a las llamadas
 *     con Origin. Falsificar la cabecera solo puede quitar permisos, nunca
 *     darlos.
 */
export function evaluateAccess(list: Allowlist, request: RequestOrigin): AccessDecision {
  if (list.ips.length === 0 && list.domains.length === 0) {
    return { allowed: false, reason: 'sin_listas' }
  }

  if (request.originHost !== null) {
    if (list.domains.length === 0) return { allowed: false, reason: 'origen_no_permitido' }
    if (!domainMatchesAny(list.domains, request.originHost)) {
      return { allowed: false, reason: 'origen_no_permitido' }
    }
  } else if (list.ips.length === 0) {
    return { allowed: false, reason: 'sin_origen' }
  }

  if (list.ips.length > 0) {
    if (!request.ip) return { allowed: false, reason: 'ip_desconocida' }
    if (!ipMatchesAny(list.ips, request.ip)) return { allowed: false, reason: 'ip_no_permitida' }
  }

  return { allowed: true }
}

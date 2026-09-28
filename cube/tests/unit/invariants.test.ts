/**
 * Invariantes de arquitectura.
 *
 * No prueban comportamiento, prueban que el código sigue las tres reglas del
 * Roadmap §4. Existen porque las vulnerabilidades de v1 no fueron errores de
 * lógica sino de disciplina: alguien olvidó el middleware en cuatro rutas
 * (HIGH-02), alguien usó el header `user-id` en vez del usuario verificado
 * (CRIT-07), alguien concatenó la búsqueda dentro del SQL (CRIT-04).
 *
 * Un test que falle aquí significa que se está reintroduciendo un patrón que ya
 * causó un incidente.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SERVER_DIR = join(process.cwd(), 'server')

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, files)
    else if (path.endsWith('.ts')) files.push(path)
  }
  return files
}

const serverFiles = walk(SERVER_DIR)
const apiHandlers = serverFiles.filter(
  (f) => f.includes(`${'/'}api${'/'}`) && !f.endsWith('_schema.ts'),
)

const read = (path: string) => readFileSync(path, 'utf8')
/**
 * El fichero sin sus comentarios. Varios módulos documentan precisamente el
 * patrón que NO usan —`getRequestIP`, `event.context.apiClient`— y un
 * invariante que lea el comentario acusa al fichero que mejor se explica.
 */
const code = (path: string) =>
  read(path)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
const relative = (path: string) => path.replace(`${process.cwd()}/`, '')

describe('invariante 1 — la identidad sale solo de la sesión', () => {
  /**
   * CRIT-07: v1 leía `req.headers['user-id']` como identidad del actor aunque
   * el middleware ya hubiera resuelto el usuario verificado. Cambiando un
   * número en una cabecera se actuaba en nombre de cualquiera.
   */
  const FORBIDDEN = ["'user-id'", '"user-id"', "'user_id'", "'company_slug'", "'lextoken'"]

  it.each(FORBIDDEN)('ningún fichero del servidor lee la cabecera %s', (header) => {
    const offenders = serverFiles.filter((file) => {
      const source = read(file)
      // Se ignoran los comentarios: los módulos documentan por qué NO se usa.
      const code = source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      return code.includes(header)
    })
    expect(offenders.map(relative)).toEqual([])
  })

  it('solo el middleware de auth establece event.context.user', () => {
    const setters = serverFiles.filter((file) => /event\.context\.user\s*=/.test(read(file)))
    expect(setters.map(relative)).toEqual(['server/middleware/01.auth.ts'])
  })
})

describe('invariante 2 — cada handler declara su política de acceso', () => {
  /**
   * HIGH-01 y HIGH-02: en v1 ningún endpoint comprobaba el rol, y cuatro rutas
   * se quedaron sin middleware alguno. Aquí, todo handler de la API debe
   * declarar explícitamente qué exige.
   */
  /**
   * Únicos endpoints sin declaración, y por razones concretas: la sonda de
   * salud no expone nada, y el login es anterior a que exista sesión alguna.
   */
  const PUBLIC_BY_DESIGN = ['server/api/health.get.ts', 'server/api/auth/login.post.ts']

  it('todos los handlers declaran su política de acceso', () => {
    // `requireApiKey` cuenta como declaración: es lo que hace lo mismo en la
    // API externa, donde no hay sesión sino clave. Lo que no vale es no
    // declarar nada.
    const undeclared = apiHandlers
      .map(relative)
      .filter((file) => !PUBLIC_BY_DESIGN.includes(file))
      .filter((file) => {
        const source = read(join(process.cwd(), file))
        return !/require(User|Role|ApiKey)\s*\(/.test(source)
      })
    expect(undeclared).toEqual([])
  })

  it('no hay un segundo dominio de identidad', () => {
    /**
     * La extranet de onboarding tenía el suyo (`event.context.candidate`, cookie
     * `cube_onboarding`) y se retiró con el módulo (AD-06). Mientras exista un
     * solo dominio, `requireUser` es la única puerta; si alguien reintrodujera
     * un contexto paralelo, bastaría una comprobación olvidada para que una
     * sesión que no es de Cube alcanzara la API interna.
     */
    const offenders = serverFiles.filter((file) => /event\.context\.candidate/.test(read(file)))
    expect(offenders.map(relative)).toEqual([])
  })

  /**
   * La API externa (`/api/external/`) sí introduce una segunda identidad:
   * `event.context.apiClient`, que es un sistema y no una persona. Se admite
   * porque hay un caso real —la plataforma de Lexart dando de alta usuarios
   * desde AD-06— pero con los cuatro barrotes de abajo, que son justo los que
   * le faltaron a la extranet de onboarding:
   *
   *   · solo la pone un sitio,
   *   · solo la lee un sitio,
   *   · no sale de `/api/external/`,
   *   · y ahí dentro no convive con la identidad de sesión.
   *
   * Sin ellos, un cliente externo a un despiste de distancia de ser un usuario.
   */
  const externalHandlers = apiHandlers.filter((file) =>
    file.includes(`${'/'}api${'/'}external${'/'}`),
  )

  it('solo el middleware de la API externa establece event.context.apiClient', () => {
    const setters = serverFiles.filter((file) => /event\.context\.apiClient\s*=/.test(read(file)))
    expect(setters.map(relative)).toEqual(['server/middleware/02.external.ts'])
  })

  it('solo requireApiKey lee event.context.apiClient', () => {
    // Que nadie lo consulte a mano: `requireApiKey` es el único sitio donde se
    // comprueba el permiso, y saltárselo sería tener la clave sin el scope.
    const readers = serverFiles.filter((file) =>
      /event\.context\.apiClient(?!\s*=)/.test(code(file)),
    )
    expect(readers.map(relative)).toEqual(['server/utils/apikey.ts'])
  })

  it('requireApiKey solo se usa dentro de server/api/external/', () => {
    expect(externalHandlers.length).toBeGreaterThan(0)

    const offenders = serverFiles
      .filter((file) => !externalHandlers.includes(file))
      .filter((file) => !file.endsWith(`utils${'/'}apikey.ts`))
      .filter((file) => /requireApiKey\s*\(/.test(code(file)))
    expect(offenders.map(relative)).toEqual([])
  })

  it('los handlers externos no tocan la identidad de sesión', () => {
    // No hay cookie en esas rutas —`01.auth.ts` sale antes de resolverla—, así
    // que un `requireUser` ahí sería una comprobación que nunca se cumple o,
    // peor, una que se cumpliera por accidente si algún día vuelve la cookie.
    const offenders = externalHandlers.filter((file) =>
      /require(User|Role)\s*\(/.test(code(file)),
    )
    expect(offenders.map(relative)).toEqual([])
  })

  it('todo handler de server/api/external/ exige clave', () => {
    const undeclared = externalHandlers.filter((file) => !/requireApiKey\s*\(/.test(code(file)))
    expect(undeclared.map(relative)).toEqual([])
  })

  it('la API externa no se apoya en getRequestIP para la lista de IPs', () => {
    /**
     * `getRequestIP(event, { xForwardedFor: true })` coge el primer valor de
     * una cabecera que escribe el cliente: con ella, la lista blanca de IPs se
     * salta mandando `X-Forwarded-For: 10.0.0.5`. La IP de la API externa sale
     * de `pickClientIp`, que solo mira la cadena si el socket es un proxy
     * declarado en `NUXT_TRUSTED_PROXIES`.
     */
    const apikey = code(join(SERVER_DIR, 'utils/apikey.ts'))
    expect(apikey).toContain('pickClientIp(')
    expect(apikey).not.toMatch(/getRequestIP\s*\(/)
  })

  it('las rutas públicas están en la allow-list del middleware', () => {
    const middleware = read(join(SERVER_DIR, 'middleware/01.auth.ts'))
    expect(middleware).toContain("path: '/api/auth/login'")
    expect(middleware).toContain("path: '/api/health'")
  })

  it('la allow-list no usa startsWith suelto sobre rutas exactas', () => {
    // `/api/auth/login-bypass` no debe colarse por empezar igual que
    // `/api/auth/login`. Las entradas por prefijo se marcan explícitamente.
    const middleware = read(join(SERVER_DIR, 'middleware/01.auth.ts'))
    expect(middleware).toContain('route.prefix')
  })
})

describe('invariante 3 — sin SQL construido con entrada del usuario', () => {
  /**
   * CRIT-04: v1 interpolaba la búsqueda dentro de la sentencia
   * (`AND name LIKE '%${query}%'`) en ocho servicios distintos.
   *
   * Se permite interpolar fragmentos construidos por el propio código
   * (cláusulas WHERE armadas con placeholders, allow-lists de ORDER BY), pero
   * nunca un valor que venga de la petición.
   */
  it('ninguna consulta interpola params, body o query directamente', () => {
    const interpolation = /\$\{\s*(params|body|query|req)\b[^}]*\}/
    /**
     * Palabras clave en MAYÚSCULAS y sin la bandera `i`, a propósito: con
     * `/i` el patrón matcheaba la variable `values` de `values.push(...)`, que
     * construye el VALOR de un parámetro vinculado (`%texto%`) y es correcto.
     * Lo que debe saltar es SQL de verdad, y en este código va en mayúsculas.
     */
    const sqlKeyword = /\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|WHERE|ORDER BY|LIMIT)\b/
    const offenders = serverFiles.filter((file) =>
      read(file)
        .split('\n')
        .some((line) => sqlKeyword.test(line) && interpolation.test(line)),
    )
    expect(offenders.map(relative)).toEqual([])
  })

  it('el propio invariante detecta una interpolación peligrosa', () => {
    // Se comprueba el detector, no el código: un test que nunca puede fallar
    // da falsa tranquilidad. Esta es exactamente la línea de v1
    // `courses.service.js:10` que causó CRIT-04.
    const dangerous = "const sql = `SELECT * FROM t WHERE name LIKE '%${params.search}%'`"
    const interpolation = /\$\{\s*(params|body|query|req)\b[^}]*\}/
    const sqlKeyword = /\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|WHERE|ORDER BY|LIMIT)\b/
    expect(sqlKeyword.test(dangerous) && interpolation.test(dangerous)).toBe(true)
  })

  it('la capa de datos usa execute() y no query() del driver', () => {
    // `execute` fuerza sentencias preparadas del lado del servidor.
    const db = read(join(SERVER_DIR, 'db/index.ts'))
    expect(db).toContain('getPool().execute(')
    expect(db).not.toMatch(/getPool\(\)\.query\(/)
  })

  it('el pool desactiva las sentencias múltiples', () => {
    // Sin esto, una inyección podría encadenar un segundo comando.
    expect(read(join(SERVER_DIR, 'db/index.ts'))).toContain('multipleStatements: false')
  })
})

describe('invariante 4 — sin console en el servidor', () => {
  /**
   * HIGH-08: v1 escribía la API key en claro en cada petición
   * (`apiAuth.js:11`). El logger redacta secretos; `console` no.
   */
  it('solo el arranque usa console, y con excepción justificada', () => {
    const offenders = serverFiles.filter((file) => {
      const source = read(file)
      if (!/\bconsole\.\w+\(/.test(source)) return false
      return !source.includes('eslint-disable-next-line no-console')
    })
    expect(offenders.map(relative)).toEqual([])
  })
})

/**
 * Invariante 5 — el chrome de la aplicación se renderiza.
 *
 * Los dos fallos que motivan este bloque no eran de lógica y no los detectó
 * nada: la aplicación construía, los 150 unitarios pasaban y los endpoints
 * respondían. Pero `app.vue` pintaba `<NuxtPage/>` suelto —y Nuxt, en cuanto
 * existe `app.vue`, solo aplica los layouts si está `<NuxtLayout/>`—, así que
 * la barra de navegación y el contenedor con márgenes no se renderizaban en
 * ninguna página. Y en SSR `$fetch` no reenvía la cookie de sesión, con lo que
 * recargar una página protegida devolvía al login.
 */
describe('invariante 5 — el chrome y la sesión sobreviven al render en servidor', () => {
  const APP_DIR = join(process.cwd(), 'app')

  function walkApp(dir: string, files: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) walkApp(path, files)
      else if (path.endsWith('.ts') || path.endsWith('.vue')) files.push(path)
    }
    return files
  }

  const appFiles = walkApp(APP_DIR)

  it('app.vue envuelve la página en NuxtLayout', () => {
    const source = read(join(APP_DIR, 'app.vue'))
    expect(source).toContain('<NuxtLayout>')
    expect(source).toContain('<NuxtPage />')
  })

  it('las páginas sin chrome lo declaran, y solo ellas', () => {
    // Login y raíz son las únicas que no llevan la barra de Cube. Si aparece
    // una tercera, es una decisión que debe verse.
    const withoutLayout = appFiles
      .filter((file) => file.includes(`${'/'}pages${'/'}`))
      .filter((file) => /layout:\s*false/.test(read(file)))
      .map(relative)
      .sort()

    expect(withoutLayout).toEqual(['app/pages/index.vue', 'app/pages/login.vue'])
  })

  it('no queda un solo v-html en la aplicación', () => {
    /**
     * MED-02: `ComplianceStep.vue:162` de v1 pintaba una plantilla de contrato
     * con `v-html` sin sanear, en el paso previo a pedir los datos KYC. En v2 el
     * texto libre se guarda ya saneado y se pinta con interpolación normal, así
     * que la clase entera de XSS desaparece en vez de mitigarse con DOMPurify.
     */
    // Se ignoran los comentarios —incluidos los de plantilla, `<!-- -->`—:
    // varias vistas explican ahí precisamente que NO usan v-html.
    const offenders = appFiles.filter((file) =>
      /v-html/.test(
        read(file)
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, ''),
      ),
    )
    expect(offenders.map(relative)).toEqual([])
  })

  it('ninguna pantalla usa los diálogos del navegador', () => {
    /**
     * `confirm()` y `alert()` no se traducen —quedarían siempre en el idioma del
     * navegador, saltándose i18n— y tras varios avisos seguidos el navegador
     * ofrece silenciar los siguientes, que es justo el que importa: el que
     * pregunta antes de desactivar a alguien. Se usa `<UiConfirmDialog>`.
     */
    const offenders = appFiles.filter((file) => {
      const code = read(file)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      return /(?<![.\w])(confirm|alert)\s*\(/.test(code)
    })
    expect(offenders.map(relative)).toEqual([])
  })

  it('ninguna llamada a la API usa $fetch directamente', () => {
    // `useRequestFetch()` reenvía las cabeceras de la petición entrante; en el
    // cliente es el mismo `$fetch`. Con `$fetch` a secas, el render en servidor
    // sale sin cookie y responde 401.
    const offenders = appFiles.filter((file) => /\$fetch\s*[<(]/.test(read(file)))
    expect(offenders.map(relative)).toEqual([])
  })
})

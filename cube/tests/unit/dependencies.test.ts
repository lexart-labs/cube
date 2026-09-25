/**
 * Toda dependencia importada debe estar declarada en package.json.
 *
 * Existe por un fallo real: `bcryptjs` se importaba en `server/utils/password.ts`
 * pero no figuraba en `package.json` ni en el lockfile. En desarrollo funcionaba
 * —estaba en `node_modules` por un `npm install` cuya escritura del manifiesto
 * se perdió— y el build local también, porque Node lo resolvía subiendo el árbol
 * de directorios.
 *
 * En Docker no: `npm ci` instala solo lo declarado, Nitro no podía empaquetarlo,
 * y el contenedor moría en el arranque con ERR_MODULE_NOT_FOUND. El fallo llegó
 * al usuario porque ninguna comprobación miraba esto.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { builtinModules } from 'node:module'

const ROOT = process.cwd()
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
])

/** Módulos que Nuxt inyecta y no se declaran en package.json. */
const PROVIDED_BY_NUXT = new Set(['h3', 'nitropack', 'ofetch', 'vue-i18n', '#imports'])

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, files)
    else if (/\.(ts|vue|mjs)$/.test(path)) files.push(path)
  }
  return files
}

const sources = [join(ROOT, 'server'), join(ROOT, 'app'), join(ROOT, 'tests')].flatMap((dir) =>
  walk(dir),
)

/** Extrae el nombre del paquete de un especificador: `pino/x` → `pino`. */
function packageName(specifier: string): string {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]!
}

const imports = new Map<string, string[]>()

for (const file of sources) {
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)) {
    const specifier = match[1]!
    // Solo importaciones "bare": rutas relativas y alias son del propio proyecto.
    if (/^[./~#]/.test(specifier)) continue
    const name = packageName(specifier)
    if (builtinModules.includes(name) || name.startsWith('node:')) continue
    const list = imports.get(name) ?? []
    list.push(file.replace(`${ROOT}/`, ''))
    imports.set(name, list)
  }
}

describe('dependencias declaradas', () => {
  it('encuentra importaciones que analizar', () => {
    expect(imports.size).toBeGreaterThan(3)
  })

  it('toda dependencia importada está en package.json', () => {
    const undeclared = [...imports.entries()]
      .filter(([name]) => !declared.has(name) && !PROVIDED_BY_NUXT.has(name))
      .map(([name, files]) => `${name} (usado en ${files[0]})`)

    expect(undeclared).toEqual([])
  })

  it('bcryptjs está declarado — el fallo que rompió el contenedor', () => {
    expect(pkg.dependencies?.bcryptjs).toBeDefined()
  })

  it('package.json y el lockfile no se han desincronizado', () => {
    const lock = JSON.parse(readFileSync(join(ROOT, 'package-lock.json'), 'utf8')) as {
      packages: Record<string, { dependencies?: Record<string, string>; engines?: unknown }>
    }
    const lockRoot = lock.packages['']!

    expect(lockRoot.dependencies ?? {}).toEqual(pkg.dependencies ?? {})
    // `npm ci` aborta si estos difieren, y eso rompe la primera capa del build.
    expect(lockRoot.engines).toEqual((pkg as { engines?: unknown }).engines)
  })
})

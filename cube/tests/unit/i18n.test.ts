/**
 * Coherencia de los ficheros de idioma.
 *
 * Una clave que falta en un idioma no lanza ningún error: vue-i18n cae al
 * idioma por defecto o pinta la clave cruda. El fallo llega a producción y solo
 * lo detecta alguien que use ese idioma. Este test lo convierte en un fallo de
 * compilación.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const LOCALES_DIR = join(process.cwd(), 'i18n/locales')
const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'))

type Messages = Record<string, unknown>

const locales = Object.fromEntries(
  files.map((file) => [
    file.replace('.json', ''),
    JSON.parse(readFileSync(join(LOCALES_DIR, file), 'utf8')) as Messages,
  ]),
)

/** Aplana el objeto a rutas con punto: `common.save`, `roles.admin`… */
function flatten(object: Messages, prefix = ''): string[] {
  return Object.entries(object).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value !== null && typeof value === 'object'
      ? flatten(value as Messages, path)
      : [path]
  })
}

const keysByLocale = Object.fromEntries(
  Object.entries(locales).map(([code, messages]) => [code, flatten(messages).sort()]),
)

const REFERENCE = 'es'

describe('ficheros de idioma', () => {
  it('existen los tres idiomas declarados en nuxt.config', () => {
    expect(Object.keys(locales).sort()).toEqual(['en', 'es', 'pt'])
  })

  it('ninguno está vacío', () => {
    for (const [code, keys] of Object.entries(keysByLocale)) {
      expect(keys.length, `${code} no tiene claves`).toBeGreaterThan(50)
    }
  })

  it.each(Object.keys(locales).filter((code) => code !== REFERENCE))(
    '%s tiene exactamente las mismas claves que es',
    (code) => {
      const reference = keysByLocale[REFERENCE]!
      const target = keysByLocale[code]!

      const missing = reference.filter((key) => !target.includes(key))
      const extra = target.filter((key) => !reference.includes(key))

      expect(missing, `faltan en ${code}`).toEqual([])
      expect(extra, `sobran en ${code}`).toEqual([])
    },
  )

  it('ningún valor está vacío', () => {
    for (const [code, messages] of Object.entries(locales)) {
      const walk = (object: Messages, prefix = ''): void => {
        for (const [key, value] of Object.entries(object)) {
          const path = prefix ? `${prefix}.${key}` : key
          if (value !== null && typeof value === 'object') walk(value as Messages, path)
          else expect(String(value).trim(), `${code}:${path} está vacío`).not.toBe('')
        }
      }
      walk(messages)
    }
  })

  it('las interpolaciones coinciden entre idiomas', () => {
    /**
     * `{name}` en una traducción y `{nombre}` en otra rompe la sustitución en
     * silencio: el usuario ve la llave literal en pantalla.
     */
    const placeholders = (value: unknown) =>
      [...String(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

    const get = (messages: Messages, path: string): unknown =>
      path.split('.').reduce<unknown>((acc, key) => (acc as Messages)?.[key], messages)

    for (const key of keysByLocale[REFERENCE]!) {
      const expected = placeholders(get(locales[REFERENCE]!, key))
      for (const code of Object.keys(locales)) {
        if (code === REFERENCE) continue
        expect(placeholders(get(locales[code]!, key)), `${code}:${key}`).toEqual(expected)
      }
    }
  })

  it('los grupos de indicadores están traducidos en los tres idiomas', () => {
    // Las claves llevan tilde y camelCase porque vienen del JSON de v1; si
    // alguna faltara, el detalle de la evaluación mostraría la clave cruda.
    for (const code of Object.keys(locales)) {
      const groups = locales[code]!.groups as Record<string, string>
      expect(Object.keys(groups).sort()).toEqual(['desempeño', 'factorHumano', 'habilidades'])
    }
  })
})

/**
 * Validación de configuración en el arranque.
 *
 * Cierra HIGH-05 de Security.md: en v1, `ext/onboarding/nuxt.config.js` caía a
 * secretos conocidos (`'your-secret-key'`) cuando faltaba la variable de entorno,
 * de modo que un despliegue mal configurado arrancaba igual y con un secreto
 * publicado en el repositorio.
 *
 * Aquí no hay valores por defecto: si un secreto falta, es corto, es un
 * placeholder conocido o tiene poca variedad de caracteres, el proceso NO arranca.
 */
import { z } from 'zod'

/** Longitud mínima para un secreto de propósito general. */
const MIN_SECRET_LENGTH = 32

/** Mínimo de caracteres distintos: descarta `aaaa…` y `123123123…`. */
const MIN_DISTINCT_CHARS = 8

/**
 * Valores de plantilla que aparecen en el repositorio v1 y en documentación
 * pública. Cualquier secreto que los contenga se considera comprometido.
 */
const PLACEHOLDER_FRAGMENTS = [
  'your-secret-key',
  'your-super-secret',
  'your-site-key',
  'your-mailgun',
  'your-service-account',
  'your-admin-email',
  'your-email@example.com',
  'y0ur.k3y',
  'changeme',
  'change-me',
  'placeholder',
  'example',
  'secret-key',
  'supersecret',
]

/** Valores que por sí solos son inaceptables, comparados en su totalidad. */
const PLACEHOLDER_EXACT = new Set([
  'password',
  'secret',
  'admin',
  'test',
  'root',
  'cube',
  'lexart',
])

/**
 * Devuelve la razón por la que un secreto es débil, o `null` si es aceptable.
 * El mensaje se muestra en el arranque, así que describe el problema sin
 * revelar nunca el valor.
 */
function weaknessOf(value: string): string | null {
  const trimmed = value.trim()

  if (trimmed.length === 0) return 'está vacía'
  if (trimmed.length < MIN_SECRET_LENGTH) {
    return `tiene ${trimmed.length} caracteres y el mínimo son ${MIN_SECRET_LENGTH}`
  }

  const normalized = trimmed.toLowerCase()
  if (PLACEHOLDER_EXACT.has(normalized)) {
    return 'es un valor de ejemplo'
  }
  if (PLACEHOLDER_FRAGMENTS.some((fragment) => normalized.includes(fragment))) {
    return 'contiene un valor de plantilla conocido y debe considerarse comprometida'
  }
  if (new Set(trimmed).size < MIN_DISTINCT_CHARS) {
    return `solo usa ${new Set(trimmed).size} caracteres distintos, muy poca entropía`
  }

  return null
}

/** Secreto de propósito general: presente, largo y con entropía suficiente. */
function strongSecret(envVar: string) {
  return z.string({ error: () => `${envVar} no está definida` }).superRefine((value, ctx) => {
    const weakness = weaknessOf(value)
    if (weakness) {
      ctx.addIssue({ code: 'custom', message: `${envVar} ${weakness}` })
    }
  })
}

/**
 * Bandera booleana que llega como texto desde el entorno.
 *
 * `z.coerce.boolean()` NO vale para esto: es `Boolean(valor)`, y toda cadena no
 * vacía es verdadera — también `"false"`. Con ella, `NUXT_SEED_ON_STARTUP=false`
 * ACTIVABA la semilla, y como `nuxt.config.ts` declara la cadena `'false'` como
 * valor por defecto, quedaba activada incluso sin tocar nada: el primer arranque
 * contra una base vacía —un despliegue nuevo, por ejemplo— habría creado
 * `admin@cube.test` con la contraseña que está escrita en el repositorio.
 *
 * Aquí solo un "true"/"1"/"yes" explícito es verdadero.
 */
function envFlag(defaultValue: boolean) {
  return z
    .union([z.boolean(), z.string()])
    .default(defaultValue)
    .transform((value) =>
      typeof value === 'boolean' ? value : /^(true|1|yes)$/i.test(value.trim()),
    )
}

/**
 * Esquema del `runtimeConfig` del servidor. Solo describe lo que debe existir
 * para arrancar; el resto de la configuración se añade en fases posteriores.
 */
export const serverConfigSchema = z.object({
  sessionSecret: strongSecret('NUXT_SESSION_SECRET'),

  /**
   * Si al arrancar la base no tiene ningún usuario, crear los datos de ejemplo.
   *
   * Por defecto FALSE, y esa es la parte importante: la semilla crea cuentas con
   * contraseña conocida, así que activarla en un despliegue real regalaría una
   * cuenta de administrador. Un entorno que no la declare nunca sembrará.
   */
  seedOnStartup: envFlag(false),
  /**
   * IA generativa (redacción de las evaluaciones IDEAL).
   *
   * A diferencia del resto, NO aborta el arranque si falta: que no haya IA no
   * pone en riesgo ningún dato. Sin clave, el endpoint responde con un mensaje
   * claro y el formulario lo explica. Solo los secretos que protegen datos
   * hacen fallar el arranque (HIGH-05).
   *
   * `NUXT_GEMINI_MODEL` vacío significa "el que traiga el código por defecto"
   * (`DEFAULT_MODEL` en server/utils/gemini.ts), para no tener el id del modelo
   * escrito en dos sitios.
   */
  geminiApiKey: z.string().default(''),
  geminiModel: z.string().default(''),

  db: z.object({
    host: z.string().min(1, 'NUXT_DB_HOST no está definida'),
    port: z.coerce.number().int().min(1).max(65535),
    user: z.string().min(1, 'NUXT_DB_USER no está definida'),
    password: strongSecret('NUXT_DB_PASSWORD'),
    name: z.string().min(1, 'NUXT_DB_NAME no está definida'),
    ssl: envFlag(false),
  }),
})

export type ServerConfig = z.infer<typeof serverConfigSchema>

/**
 * Valida el `runtimeConfig` y devuelve la configuración tipada.
 * Lanza con un informe legible que enumera **todos** los problemas a la vez,
 * para no obligar a descubrirlos de uno en uno.
 */
export function validateServerConfig(raw: unknown): ServerConfig {
  const result = serverConfigSchema.safeParse(raw)

  if (!result.success) {
    const problems = result.error.issues.map((issue) => `  · ${issue.message}`).join('\n')
    throw new Error(
      'La configuración del servidor no es válida y Cube no puede arrancar.\n\n' +
        `${problems}\n\n` +
        'Copia .env.example a .env y rellena los valores.\n' +
        'Genera secretos con:  openssl rand -hex 32\n',
    )
  }

  return result.data
}

/**
 * Redacción de la evaluación con Gemini.
 *
 * Tres decisiones que conviene no deshacer sin pensarlo:
 *
 * · **El nombre de la persona NO se envía.** El prompt lleva rol, notas y
 *   observaciones; donde iría el nombre, el modelo escribe el testigo
 *   `[[NAME]]` y el servidor lo sustituye con la respuesta ya en la mano. El
 *   dato identificable no sale de Lexart.
 *
 * · **Salida estructurada**, no dos párrafos en texto corrido. Partir prosa por
 *   saltos de línea funciona hasta el día que el modelo añade un encabezado.
 *
 * · **La clave es opcional.** Que falte la IA no es una condición de seguridad:
 *   la aplicación arranca igual y el endpoint responde con un mensaje claro.
 *   Solo los secretos que protegen datos abortan el arranque (HIGH-05).
 */
import { GoogleGenAI, Type } from '@google/genai'
import { logger } from './logger'

/** Modelo por defecto. Google retira modelos cada pocos meses: es configurable. */
export const DEFAULT_MODEL = 'gemini-3.8-flash'

/** Testigo que ocupa el lugar del nombre en todo el viaje de ida y vuelta. */
export const NAME_TOKEN = '[[NAME]]'

const TIMEOUT_MS = 30_000

export const SYSTEM_PROMPT = [
  'Eres un Evaluador de Desempeño para Lexart.',
  'Genera una evaluación en un solo párrafo en español y su traducción exacta en inglés en otro párrafo.',
  `Nunca conoces el nombre de la persona evaluada: escribe siempre el testigo ${NAME_TOKEN} allí donde correspondería el nombre, tal cual, sin corchetes adicionales ni traducirlo.`,
  'Debes incluir ese testigo, el rol y el puntaje ponderado.',
  'Destaca fortalezas y oportunidades de mejora basadas en las notas bajas.',
  'Analiza el impacto de su nota de idiomas (1=Limitado, 3=Suficiente, 5=Top Tier).',
  'Responde únicamente con un objeto JSON con las claves "es" y "en", cada una con un solo párrafo de texto plano, sin markdown.',
].join(' ')

/** Un bloque ya resumido para el prompt. Sin nombres, sin ids. */
export interface NarrativeBlock {
  label: string
  weight: number
  average: number
  scores: number[]
}

/** Lo que viaja a Google. Nótese que no hay ningún campo de identidad. */
export interface NarrativePromptData {
  roleLabel: string
  average: number
  blocks: NarrativeBlock[]
  languageScore: number
  observations?: string | null
}

export interface Narrative {
  es: string
  en: string
}

/** Cliente inyectable: los tests usan uno falso y no tocan la red. */
export type NarrativeClient = (prompt: string) => Promise<Narrative>

/**
 * Construye el prompt de usuario.
 *
 * Es una función pura y exportada a propósito: así un test puede comprobar que
 * el nombre no aparece por ninguna parte, que es la garantía que sostiene toda
 * la pseudonimización.
 */
export function buildUserPrompt(data: NarrativePromptData): string {
  const blocks = data.blocks
    .map(
      (block) =>
        `${block.label} (peso ${block.weight}%, media ${block.average.toFixed(2)}): [${block.scores.join(', ')}]`,
    )
    .join('; ')

  const observations = data.observations?.trim()

  return [
    `Persona: ${NAME_TOKEN}`,
    `Rol: ${data.roleLabel}`,
    `Promedio Ponderado: ${data.average.toFixed(2)} sobre 5`,
    `Bloques: ${blocks}`,
    `Nota de idiomas: ${data.languageScore}`,
    `Observaciones: ${observations && observations !== '' ? observations : 'sin observaciones'}`,
  ].join('. ')
}

/** Escapa un literal para meterlo en una expresión regular. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Sustituye el nombre de la persona por el testigo dentro de un texto libre.
 *
 * Las observaciones las escribe el lead y ahí se cuela cualquier cosa. Se
 * reemplaza el nombre completo y cada parte de tres o más letras —"de", "la" y
 * "del" se dejan en paz para no destrozar la frase.
 */
export function scrubName(text: string, name: string): string {
  const parts = [name, ...name.split(/\s+/)]
    .map((part) => part.trim())
    .filter((part) => part.length >= 3)
    // De más largo a más corto: si no, sustituir el nombre de pila primero
    // impediría reconocer después el nombre completo.
    .sort((a, b) => b.length - a.length)

  return parts.reduce(
    (result, part) => result.replace(new RegExp(escapeRegExp(part), 'gi'), NAME_TOKEN),
    text,
  )
}

/**
 * Devuelve el texto con el nombre real en el lugar del testigo.
 *
 * Si el modelo no lo reprodujo —pasa—, el nombre se antepone en vez de
 * devolver un párrafo que habla de alguien sin decir de quién.
 */
export function applyName(text: string, name: string): string {
  const token = new RegExp(escapeRegExp(NAME_TOKEN), 'g')
  if (token.test(text)) return text.replace(token, name)
  return `${name} — ${text}`
}

/** ¿Hay clave configurada? Lo consulta el endpoint antes de prometer nada. */
export function isAiConfigured(apiKey: string | undefined | null): boolean {
  return typeof apiKey === 'string' && apiKey.trim().length > 0
}

/** Error de la generación, distinguible de un fallo de validación. */
export class NarrativeError extends Error {
  // `cause` va por el canal estándar de Error, no como propiedad propia: una
  // declaración aquí ocultaría la del tipo base.
  constructor(message: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'NarrativeError'
  }
}

/** Cliente real. Aislado para poder sustituirlo en los tests. */
export function createGeminiClient(apiKey: string, model: string): NarrativeClient {
  const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: TIMEOUT_MS } })

  return async (prompt: string) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            es: { type: Type.STRING },
            en: { type: Type.STRING },
          },
          required: ['es', 'en'],
        },
      },
    })

    return parseNarrative(response.text)
  }
}

/**
 * Interpreta la respuesta del modelo.
 *
 * Aunque se pida JSON, se comprueba la forma: una respuesta cortada por el
 * límite de tokens llega como JSON incompleto, y es mejor un error claro que
 * guardar media frase.
 */
export function parseNarrative(raw: string | undefined): Narrative {
  if (!raw || raw.trim() === '') throw new NarrativeError('El modelo no devolvió contenido')

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new NarrativeError('El modelo no devolvió un JSON válido', error)
  }

  const { es, en } = (parsed ?? {}) as { es?: unknown; en?: unknown }
  if (typeof es !== 'string' || typeof en !== 'string' || !es.trim() || !en.trim()) {
    throw new NarrativeError('El modelo no devolvió los dos párrafos')
  }

  return { es: es.trim(), en: en.trim() }
}

/**
 * Genera la redacción: pseudonimiza, llama al modelo y devuelve el texto ya con
 * el nombre puesto.
 *
 * Un reintento y no más: si falla dos veces, la evaluación se queda guardada sin
 * narrativa y quien la creó decide si reintentar.
 */
export async function generateNarrative(
  data: NarrativePromptData,
  name: string,
  client: NarrativeClient,
): Promise<Narrative> {
  const prompt = buildUserPrompt({
    ...data,
    observations: data.observations ? scrubName(data.observations, name) : data.observations,
  })

  let lastError: unknown

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const narrative = await client(prompt)
      return {
        es: applyName(narrative.es, name),
        en: applyName(narrative.en, name),
      }
    } catch (error) {
      lastError = error
      // El prompt NO se registra: lleva las observaciones del lead.
      logger.warn({ attempt, err: error }, 'fallo al generar la redacción con la IA')
    }
  }

  throw new NarrativeError('No se pudo generar la redacción', lastError)
}

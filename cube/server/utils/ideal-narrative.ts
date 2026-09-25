/**
 * Puente entre una evaluación IDEAL guardada y la redacción de la IA.
 *
 * Lo comparten la creación y el reintento, y **no lanza cuando la IA falla**:
 * la evaluación ya está en la base y el trabajo de quien la rellenó no se
 * pierde por un problema de red o por una clave sin configurar. Devuelve el
 * estado y quien llama decide qué contar en pantalla.
 */
import { execute } from '../db'
import { logger } from './logger'
import {
  DEFAULT_MODEL,
  createGeminiClient,
  generateNarrative,
  isAiConfigured,
  type Narrative,
  type NarrativeClient,
} from './gemini'
import { blockAverage, type IdealRole, type IdealScores } from '../../shared/ideal'

export type AiStatus = 'ok' | 'disabled' | 'failed'

export interface BuildNarrativeParams {
  id: number
  role: IdealRole
  scores: IdealScores
  average: number
  observations: string | null
  /** Solo para sustituir el testigo al volver. Nunca viaja en el prompt. */
  name: string
  /** Cliente alternativo, para pruebas. */
  client?: NarrativeClient
}

export interface BuildNarrativeResult {
  aiStatus: AiStatus
  aiMessage?: string
  narrative?: Narrative
  aiModel?: string
}

export async function buildNarrative(params: BuildNarrativeParams): Promise<BuildNarrativeResult> {
  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey as string
  const model = (config.geminiModel as string) || DEFAULT_MODEL

  if (!params.client && !isAiConfigured(apiKey)) {
    return {
      aiStatus: 'disabled',
      aiMessage:
        'La redacción automática no está configurada (falta NUXT_GEMINI_API_KEY). La evaluación se ha guardado igualmente.',
    }
  }

  const client = params.client ?? createGeminiClient(apiKey, model)

  const languageBlock = params.role.blocks.find((block) => block.scale === 'languages')
  const languageScore = languageBlock ? (params.scores[languageBlock.key]?.[0] ?? 0) : 0

  try {
    const narrative = await generateNarrative(
      {
        roleLabel: params.role.label,
        average: params.average,
        blocks: params.role.blocks.map((block) => ({
          label: block.label,
          weight: block.weight,
          average: blockAverage(params.scores[block.key] ?? []),
          scores: params.scores[block.key] ?? [],
        })),
        languageScore,
        observations: params.observations,
      },
      params.name,
      client,
    )

    await execute(
      `UPDATE ideal_evaluations
          SET narrative_es = ?, narrative_en = ?, ai_model = ?, generated_at = NOW()
        WHERE id = ?`,
      [narrative.es, narrative.en, model, params.id],
    )

    return { aiStatus: 'ok', narrative, aiModel: model }
  } catch (error) {
    // Ni el prompt ni la respuesta se registran: llevan las observaciones del
    // lead, que son texto libre sobre una persona.
    logger.error({ err: error, evaluationId: params.id }, 'no se pudo redactar la evaluación IDEAL')
    return {
      aiStatus: 'failed',
      aiMessage: 'No se pudo generar la redacción. La evaluación se ha guardado; puedes reintentar.',
    }
  }
}

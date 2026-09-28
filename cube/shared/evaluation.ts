/**
 * Catálogo de roles, bloques y pesos, y el cálculo del promedio ponderado.
 *
 * Se llamó IDEAL LEXART hasta el 2026-09-27; el nombre se retiró y el dominio
 * pasó a llamarse simplemente "evaluaciones". Es el mismo modelo: bloques con
 * peso por rol, notas de 1 a 5 y promedio ponderado.
 *
 * Vive en `shared/` (alias `#shared/`, Nuxt 4) porque lo necesitan las DOS
 * partes: el formulario para pintar los bloques y mostrar el promedio en vivo,
 * y el servidor para calcular el que se guarda. Es deliberado no repetirlo: el
 * modelo anterior tiene la fórmula del 135 escrita dos veces
 * (`server/utils/evaluation.ts` y `app/components/EvaluationForm.vue:53`) con
 * un comentario pidiendo que no diverjan, que es justo lo que no queremos.
 *
 * Las preguntas son un BORRADOR derivado de las responsabilidades por rol de v1
 * (`webapp/src/data/jobAssignments.js`). Están aquí, en una lista plana y
 * comentada, para que corregir el texto sea editar este fichero y nada más.
 * Cambiar preguntas no rompe las evaluaciones ya guardadas: cada una almacena
 * las notas junto al rol con el que se hizo.
 */

/** Nota mínima y máxima de un indicador. */
export const MIN_SCORE = 1
export const MAX_SCORE = 5

/**
 * El bloque de idiomas no se puntúa de 1 a 5 corrido: son tres situaciones
 * discretas. Un 2 o un 4 no significan nada en esta escala.
 */
export const LANGUAGE_SCORES = [1, 3, 5] as const
export type LanguageScore = (typeof LANGUAGE_SCORES)[number]

export type ScaleKind = 'linear' | 'languages'

export interface EvaluationBlock {
  /** Clave estable. Se guarda en la base: no renombrar a la ligera. */
  key: string
  /**
   * Nombre legible del bloque. Lo usan el prompt de la IA y, como respaldo, la
   * interfaz cuando no hay traducción en `evaluation.blocks.*`.
   */
  label: string
  /** Peso del bloque dentro del rol, en porcentaje. */
  weight: number
  scale: ScaleKind
  questions: string[]
}

export interface EvaluationRole {
  key: string
  label: string
  blocks: EvaluationBlock[]
}

/** Pregunta única del bloque de idiomas, igual en todos los roles. */
const LANGUAGE_BLOCK: EvaluationBlock = {
  key: 'idiomas',
  label: 'Idiomas',
  weight: 10,
  scale: 'languages',
  questions: ['Idiomas en los que puede trabajar con un cliente'],
}

export const EVALUATION_ROLES: Record<string, EvaluationRole> = {
  'arquitecto-l1': {
    key: 'arquitecto-l1',
    label: 'Arquitecto L1',
    blocks: [
      {
        key: 'hardSkills',
        label: 'Hard Skills',
        weight: 45,
        scale: 'linear',
        questions: [
          'Grado de conocimiento técnico en el stack del proyecto',
          'Calidad y mantenibilidad del código que entrega',
          'Planificación de la arquitectura de los módulos a su cargo',
          'Mantenimiento de ambientes de FrontEnd',
          'Capacidad de decisión técnica sobre el proyecto',
        ],
      },
      {
        key: 'leadership',
        label: 'Liderazgo',
        weight: 35,
        scale: 'linear',
        questions: [
          'Evacuar dudas de programadores',
          'Capacitar a programadores iniciantes',
          'Comunicación activa con el equipo',
          'Reportar progreso de forma continua a managers',
          'Ayudar a los managers en la definición de tareas',
        ],
      },
      {
        key: 'comercial',
        label: 'Comercial',
        weight: 10,
        scale: 'linear',
        questions: [
          'Comprensión del negocio del cliente',
          'Comunicación con el cliente en el día a día',
        ],
      },
      LANGUAGE_BLOCK,
    ],
  },

  'arquitecto-l2': {
    key: 'arquitecto-l2',
    label: 'Arquitecto L2',
    blocks: [
      {
        key: 'hardSkills',
        label: 'Hard Skills',
        weight: 40,
        scale: 'linear',
        questions: [
          'Grado de conocimiento técnico y funcional del producto',
          'Planificación de arquitectura de software de los proyectos asignados',
          'Mantenimiento de ambientes de FrontEnd, BackEnd y base de datos',
          'Calidad de las decisiones técnicas bajo restricciones reales',
          'Detección y control de la deuda técnica',
        ],
      },
      {
        key: 'leadership',
        label: 'Liderazgo',
        weight: 30,
        scale: 'linear',
        questions: [
          'Evacuar dudas de programadores experimentados',
          'Definición de tareas en los proyectos',
          'Capacitar a programadores',
          'Comunicación proactiva con managers y equipo',
          'Reportar a infraestructura las necesidades de ambientes',
        ],
      },
      {
        key: 'comercial',
        label: 'Comercial',
        weight: 20,
        scale: 'linear',
        questions: [
          'Comprensión del negocio y de las prioridades del cliente',
          'Participación en estimaciones y definición de alcance',
          'Capacidad de explicar decisiones técnicas a perfiles no técnicos',
        ],
      },
      LANGUAGE_BLOCK,
    ],
  },

  'arquitecto-l3': {
    key: 'arquitecto-l3',
    label: 'Arquitecto L3',
    blocks: [
      {
        key: 'hardSkills',
        label: 'Hard Skills',
        weight: 35,
        scale: 'linear',
        questions: [
          'Elección de tecnologías según el proyecto',
          'Construcción de ambientes BackEnd, FrontEnd y base de datos desde cero',
          'Definición del workflow técnico del proyecto',
          'Planificación de contingencia y control de riesgos',
        ],
      },
      {
        key: 'leadership',
        label: 'Liderazgo',
        weight: 35,
        scale: 'linear',
        questions: [
          'Liderazgo de equipo',
          'Mentoría a programadores y arquitectos de software',
          'Supervisión de los procesos tecnológicos en los proyectos',
          'Capacidad de decisión bajo presión y riesgo',
          'Reportería activa de los proyectos al directorio',
        ],
      },
      {
        key: 'comercial',
        label: 'Comercial',
        weight: 20,
        scale: 'linear',
        questions: [
          'Transmitir necesidades tecnológicas a áreas no técnicas (Comercial, Marketing)',
          'Participación en la definición del alcance con el cliente',
          'Impacto de sus decisiones en el margen del proyecto',
        ],
      },
      LANGUAGE_BLOCK,
    ],
  },

  'desarrollador-l3': {
    key: 'desarrollador-l3',
    label: 'Desarrollador L3',
    blocks: [
      {
        key: 'hardSkills',
        label: 'Hard Skills',
        weight: 50,
        scale: 'linear',
        questions: [
          'Grado de conocimiento técnico en el stack del proyecto',
          'Exactitud y calidad de las entregas',
          'Productividad sostenida',
          'Evolución sobre la tecnología del proyecto',
        ],
      },
      {
        key: 'sdlc',
        label: 'SDLC',
        weight: 30,
        scale: 'linear',
        questions: [
          'Cumplimiento de los procesos de trabajo acordados',
          'Entregas en fecha',
          'Calidad de las pruebas y del control de errores',
          'Uso correcto del control de versiones y de los flujos de despliegue',
          'Reportar progreso de forma continua a managers',
        ],
      },
      {
        key: 'autonomia',
        label: 'Autonomía',
        weight: 10,
        scale: 'linear',
        questions: ['Autonomía en el proyecto', 'Proactividad para consultar dudas a tiempo'],
      },
      LANGUAGE_BLOCK,
    ],
  },
}

export const ROLE_KEYS = Object.keys(EVALUATION_ROLES)

export function getRole(roleKey: string): EvaluationRole | null {
  return EVALUATION_ROLES[roleKey] ?? null
}

/** Notas por bloque, en el mismo orden que las preguntas del bloque. */
export type EvaluationScores = Record<string, number[]>

/** Formulario vacío: todo al punto medio, como hacía el modelo anterior. */
export function emptyScores(roleKey: string): EvaluationScores {
  const role = getRole(roleKey)
  if (!role) return {}
  // 3 es válido en las dos escalas: punto medio en la lineal y "dos idiomas"
  // en la de idiomas.
  return Object.fromEntries(
    role.blocks.map((block) => [block.key, block.questions.map(() => 3)]),
  )
}

/**
 * ¿Están todas las preguntas del rol contestadas con un valor válido?
 *
 * Se comprueba antes de calcular en vez de rellenar los huecos con un valor por
 * defecto: un bloque a medias daría un promedio que parece real y no lo es.
 */
export function isComplete(roleKey: string, scores: EvaluationScores): boolean {
  const role = getRole(roleKey)
  if (!role) return false

  return role.blocks.every((block) => {
    const values = scores[block.key]
    if (!Array.isArray(values) || values.length !== block.questions.length) return false
    return values.every((value) => isValidScore(value, block.scale))
  })
}

export function isValidScore(value: unknown, scale: ScaleKind): boolean {
  if (typeof value !== 'number' || !Number.isInteger(value)) return false
  if (scale === 'languages') return (LANGUAGE_SCORES as readonly number[]).includes(value)
  return value >= MIN_SCORE && value <= MAX_SCORE
}

/** Media simple de un bloque, con dos decimales. */
export function blockAverage(values: number[]): number {
  if (!values.length) return 0
  const sum = values.reduce((total, value) => total + value, 0)
  return round2(sum / values.length)
}

/**
 * Promedio ponderado del rol, en la escala 1-5.
 *
 * Media simple dentro de cada bloque y suma ponderada por el peso del bloque.
 * Devuelve 0 si falta alguna nota: quien llama debe comprobar `isComplete`
 * antes, y el servidor además valida con Zod.
 */
export function weightedAverage(roleKey: string, scores: EvaluationScores): number {
  const role = getRole(roleKey)
  if (!role || !isComplete(roleKey, scores)) return 0

  const total = role.blocks.reduce(
    (sum, block) => sum + blockAverage(scores[block.key]!) * block.weight,
    0,
  )
  return round2(total / 100)
}

/**
 * El promedio como porcentaje 0-100, que es como el resto de Cube muestra los
 * puntajes. La escala empieza en 1, así que un 1.00 es un 20 %, no un 0 %.
 */
export function scorePercent(average: number): number {
  return Math.round((average / MAX_SCORE) * 100)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

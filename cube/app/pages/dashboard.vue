<script setup lang="ts">
/**
 * Panel del desarrollador.
 *
 * Es la vista que más importa del producto: "que lo puedan ver de forma
 * sencilla" significa que alguien entra y entiende su situación sin
 * instrucciones. Por eso lidera con una sola cifra grande, no con un tablero de
 * gráficos compitiendo entre sí.
 *
 * El alcance lo decide el servidor: un developer recibe únicamente sus propias
 * evaluaciones, mande lo que mande en la petición.
 *
 * Solo existe el modelo IDEAL LEXART. El de 27 indicadores se retiró entero
 * (AD-05 + decisión del 2026-09-25), así que aquí ya no hay dos series que no
 * se podían mezclar: una sola escala, una sola línea.
 */
definePageMeta({ middleware: 'auth' })

const { user } = useAuth()
const { request } = useApi()
const { t, locale } = useI18n()

interface IdealSummary {
  id: number
  roleKey: string
  evaluatedOn: string
  weightedAverage: number
  scorePercent: number
  authorName: string | null
}

const {
  data,
  pending,
  error,
} = await useAsyncData('dashboard:ideal', () =>
  request<{ evaluations: IdealSummary[] }>('/api/ideal'),
)

/**
 * La API las devuelve de la más reciente a la más antigua; para una línea de
 * evolución hace falta el orden contrario.
 */
const all = computed(() => [...(data.value?.evaluations ?? [])].reverse())

const selectedYear = ref<number | null>(null)

/**
 * Los años salen de lo ya descargado, no de un endpoint aparte: un developer
 * tiene unas pocas evaluaciones y pedirlas dos veces para rellenar un desplegable
 * es una llamada de más.
 */
const years = computed(() => [
  ...new Set(all.value.map((item) => new Date(item.evaluatedOn).getFullYear())),
])

const items = computed(() =>
  selectedYear.value
    ? all.value.filter((item) => new Date(item.evaluatedOn).getFullYear() === selectedYear.value)
    : all.value,
)

/** Cronológicamente la última: es la que encabeza la vista. */
const latest = computed(() => items.value.at(-1) ?? null)
const previous = computed(() => items.value.at(-2) ?? null)

const trendPoints = computed(() =>
  items.value.map((item) => ({
    id: item.id,
    label: new Date(item.evaluatedOn).toLocaleDateString(locale.value, {
      month: 'short',
      year: '2-digit',
    }),
    value: item.scorePercent,
  })),
)

function openEvaluation(point: { id?: number }) {
  if (point.id) navigateTo(`/evaluations/${point.id}`)
}

useHead({ title: () => `${t('nav.dashboard')} · Cube` })
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ $t('dashboard.greeting', { name: user?.name?.split(' ')[0] ?? '' }) }}
        </h1>
        <p v-if="user?.position" class="mt-1 text-sm text-[var(--text-secondary)]">
          {{ user.position }}<span v-if="user.level"> · {{ user.level }}</span>
        </p>
      </div>

      <!-- Un solo filtro, encima de todo lo que afecta. Nunca dentro de una tarjeta. -->
      <label v-if="years.length > 1" class="text-sm">
        <span class="mr-2 text-[var(--text-secondary)]">{{ $t('common.year') }}</span>
        <select
          v-model="selectedYear"
          class="field w-auto py-1"
        >
          <option :value="null">{{ $t('common.all') }}</option>
          <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
        </select>
      </label>
    </div>

    <p v-if="error" role="alert" class="mt-8 text-sm">{{ apiErrorMessage(error) }}</p>

    <p v-else-if="pending" class="mt-8 text-sm text-[var(--text-secondary)]">
      {{ $t('common.loading') }}
    </p>

    <div v-else-if="!latest" class="card mt-8 p-8 text-center">
      <p class="text-[var(--text-secondary)]">{{ $t('dashboard.empty') }}</p>
    </div>

    <!-- Exactamente una figura hero por vista: el puntaje más reciente. -->
    <div v-else class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <section class="card p-6">
        <VizScoreHero
          :label="$t('dashboard.latestIdeal')"
          :score="latest.scorePercent"
          :previous-score="previous?.scorePercent ?? null"
          :period-label="
            new Date(latest.evaluatedOn).toLocaleDateString(locale, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          "
        />
        <p class="mt-4 text-sm text-[var(--text-secondary)]">
          {{ $t('dashboard.idealAverage', { value: latest.weightedAverage.toFixed(2) }) }}
        </p>
        <p v-if="latest.authorName" class="mt-1 text-sm text-[var(--text-muted)]">
          {{ $t('dashboard.evaluatedBy', { name: latest.authorName }) }}
        </p>
        <NuxtLink :to="`/evaluations/${latest.id}`" class="link mt-4 inline-block text-sm">
          {{ $t('dashboard.viewDetail') }}
        </NuxtLink>
      </section>

      <section v-if="trendPoints.length > 1" class="card p-6">
        <VizTrendLine
          :title="$t('dashboard.idealEvolution')"
          :points="trendPoints"
          @select="openEvaluation"
        />
      </section>
    </div>

    <section v-if="items.length" class="mt-8">
      <h2 class="text-lg font-medium">{{ $t('dashboard.history') }}</h2>
      <ul class="mt-3 flex list-none flex-col gap-2 p-0">
        <li v-for="item in [...items].reverse()" :key="item.id">
          <NuxtLink
            :to="`/evaluations/${item.id}`"
            class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-3 hover:border-[var(--baseline)]"
          >
            <span>
              <span class="font-medium">{{ $t('ideal.title') }}</span>
              <span class="ml-2 text-sm text-[var(--text-muted)]">
                {{ new Date(item.evaluatedOn).toLocaleDateString(locale) }}
              </span>
            </span>
            <span class="text-sm font-semibold [font-variant-numeric:tabular-nums]">
              {{ item.weightedAverage.toFixed(2) }} · {{ item.scorePercent }}%
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>

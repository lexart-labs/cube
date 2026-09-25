<script setup lang="ts">
/**
 * Detalle de una evaluación IDEAL.
 *
 * Exige sesión y no rol: la persona evaluada tiene que poder leer su propia
 * evaluación. El servidor devuelve 404 —no 403— si no es suya, para no
 * confirmar que existe.
 *
 * El desglose se reconstruye con el catálogo del rol guardado en la fila, no
 * con el rol actual de la persona: si el cuestionario cambia, una evaluación
 * vieja se sigue leyendo tal como se hizo.
 */
import { blockAverage, getRole } from '#shared/ideal'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t, locale } = useI18n()
const { request } = useApi()
const { isLead } = useAuth()

interface IdealDetail {
  id: number
  evaluatedName: string | null
  authorName: string | null
  roleKey: string
  roleLabel: string
  evaluatedOn: string
  scores: Record<string, number[]>
  weightedAverage: number
  scorePercent: number
  observations: string | null
  narrative: { es: string; en: string } | null
  aiModel: string | null
  generatedAt: string | null
}

const { data, error, refresh } = await useAsyncData(`ideal:${route.params.id}`, () =>
  request<{ evaluation: IdealDetail }>(`/api/ideal/${route.params.id}`),
)

const evaluation = computed(() => data.value?.evaluation ?? null)
const role = computed(() => (evaluation.value ? getRole(evaluation.value.roleKey) : null))

useHead({
  title: () => `${evaluation.value?.evaluatedName ?? t('ideal.listTitle')} · Cube`,
})

const retrying = ref(false)
const retryError = ref('')

/** Reintentar la redacción. La evaluación ya está guardada; esto solo la completa. */
async function onRetry() {
  retrying.value = true
  retryError.value = ''
  try {
    await request(`/api/ideal/${route.params.id}/narrative`, { method: 'POST' })
    await refresh()
  } catch (err) {
    retryError.value = apiErrorMessage(err)
  } finally {
    retrying.value = false
  }
}
</script>

<template>
  <div>
    <NuxtLink to="/evaluations" class="link text-sm">{{ $t('common.back') }}</NuxtLink>

    <p v-if="error" role="alert" class="mt-8 text-sm">{{ apiErrorMessage(error) }}</p>

    <template v-else-if="evaluation">
      <header class="mt-4">
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ evaluation.evaluatedName ?? '—' }}
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          {{ evaluation.roleLabel }} ·
          {{ new Date(evaluation.evaluatedOn).toLocaleDateString(locale) }}
          <span v-if="evaluation.authorName">
            · {{ $t('dashboard.evaluatedBy', { name: evaluation.authorName }) }}
          </span>
        </p>
      </header>

      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <section class="card p-6 lg:sticky lg:top-6 lg:self-start">
          <p class="text-sm text-[var(--text-secondary)]">{{ $t('ideal.weightedAverage') }}</p>
          <p class="mt-1 text-5xl font-bold tabular-nums">
            {{ evaluation.weightedAverage.toFixed(2) }}
          </p>
          <p class="text-sm text-[var(--text-secondary)]">
            {{ $t('ideal.outOfFive') }} · {{ evaluation.scorePercent }}%
          </p>

          <dl class="mt-4 space-y-1 text-sm">
            <div v-for="block in role?.blocks ?? []" :key="block.key" class="flex justify-between">
              <dt class="text-[var(--text-secondary)]">
                {{ block.label }} · {{ block.weight }}%
              </dt>
              <dd class="tabular-nums">
                {{ blockAverage(evaluation.scores[block.key] ?? []).toFixed(2) }}
              </dd>
            </div>
          </dl>
        </section>

        <div class="flex flex-col gap-6">
          <!-- Desglose: cada pregunta con su nota. El gráfico no es la única
               forma de llegar al dato. -->
          <section v-for="block in role?.blocks ?? []" :key="block.key" class="card p-6">
            <header class="flex flex-wrap items-baseline justify-between gap-2">
              <h2 class="text-lg font-semibold">{{ block.label }}</h2>
              <p class="text-sm text-[var(--text-secondary)]">
                {{ $t('ideal.weight', { weight: block.weight }) }} ·
                {{
                  $t('ideal.blockAverage', {
                    value: blockAverage(evaluation.scores[block.key] ?? []),
                  })
                }}
              </p>
            </header>
            <ul class="mt-2 list-none divide-y divide-[var(--gridline)] p-0">
              <li
                v-for="(question, index) in block.questions"
                :key="question"
                class="flex items-center justify-between gap-4 py-2 text-sm"
              >
                <span>{{ question }}</span>
                <span class="shrink-0 font-semibold tabular-nums">
                  {{ evaluation.scores[block.key]?.[index] ?? '—' }}
                  <span v-if="block.scale === 'languages'" class="text-[var(--text-muted)]">
                    · {{ $t(`ideal.languages.${evaluation.scores[block.key]?.[index] ?? 1}`) }}
                  </span>
                </span>
              </li>
            </ul>
          </section>

          <section v-if="evaluation.observations" class="card p-6">
            <h2 class="text-lg font-semibold">{{ $t('ideal.observations') }}</h2>
            <p class="plain-text mt-3 text-sm">{{ evaluation.observations }}</p>
          </section>

          <!-- Texto plano, sin v-html en ninguna parte (MED-02). -->
          <div v-if="evaluation.narrative" class="grid gap-6 lg:grid-cols-2">
            <article class="card p-6">
              <h2 class="text-lg font-semibold">{{ $t('ideal.spanish') }}</h2>
              <p class="plain-text mt-3 text-sm">{{ evaluation.narrative.es }}</p>
            </article>
            <article class="card p-6">
              <h2 class="text-lg font-semibold">{{ $t('ideal.english') }}</h2>
              <p class="plain-text mt-3 text-sm">{{ evaluation.narrative.en }}</p>
            </article>
          </div>

          <section v-else class="card p-6">
            <p class="text-sm text-[var(--text-secondary)]">{{ $t('ideal.narrativeMissingHint') }}</p>
            <p v-if="retryError" role="alert" class="mt-3 text-sm">{{ retryError }}</p>
            <button
              v-if="isLead"
              type="button"
              class="btn btn-secondary mt-4"
              :disabled="retrying"
              @click="onRetry"
            >
              {{ retrying ? $t('ideal.generating') : $t('ideal.retry') }}
            </button>
          </section>

          <p v-if="evaluation.aiModel" class="text-xs text-[var(--text-muted)]">
            {{ $t('ideal.generatedWith', { model: evaluation.aiModel }) }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

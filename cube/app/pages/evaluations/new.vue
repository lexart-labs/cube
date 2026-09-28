<script setup lang="ts">
/**
 * Alta de una evaluación.
 *
 * El lead rellena, el servidor calcula el promedio y la IA redacta. El orden
 * del resultado no es casual: primero el número —que es lo que queda
 * registrado— y después los dos párrafos, que son una ayuda de redacción y no
 * la evaluación en sí.
 */
import { emptyScores, ROLE_KEYS } from '#shared/evaluation'
import type { EvaluationFormValue } from '~/components/evaluation/EvaluationForm.vue'

definePageMeta({ middleware: 'admin' })

const { t } = useI18n()
const { request } = useApi()

useHead({ title: () => `${t('evaluation.title')} · Cube` })

const firstRole = ROLE_KEYS[0]!

const form = ref<EvaluationFormValue>({
  evaluatedUserId: null,
  roleKey: firstRole,
  evaluatedOn: new Date().toISOString().slice(0, 10),
  scores: emptyScores(firstRole),
  observations: '',
})

// `/api/users` devuelve { items, total, page, limit } — no { users }.
const { data: usersData } = await useAsyncData('evaluations:users', () =>
  request<{ items: { id: number; name: string; role: string }[] }>('/api/users', {
    query: { limit: 100, active: true },
  }),
)

const developers = computed(() => usersData.value?.items ?? [])

interface EvaluationResult {
  id: number
  weightedAverage: number
  scorePercent: number
  aiStatus: 'ok' | 'disabled' | 'failed'
  aiMessage?: string
  narrative?: { es: string; en: string }
}

const result = ref<EvaluationResult | null>(null)
const submitting = ref(false)
const retrying = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  submitting.value = true
  try {
    result.value = await request<EvaluationResult>('/api/evaluations', {
      method: 'POST',
      body: {
        evaluatedUserId: form.value.evaluatedUserId,
        roleKey: form.value.roleKey,
        evaluatedOn: form.value.evaluatedOn,
        scores: form.value.scores,
        observations: form.value.observations || undefined,
      },
    })
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    submitting.value = false
  }
}

/** Reintentar solo la redacción: la evaluación ya está guardada. */
async function onRetry() {
  if (!result.value) return
  retrying.value = true
  try {
    const retried = await request<{
      aiStatus: EvaluationResult['aiStatus']
      aiMessage?: string
      narrative?: { es: string; en: string }
    }>(`/api/evaluations/${result.value.id}/narrative`, { method: 'POST' })
    result.value = { ...result.value, ...retried }
  } catch (err) {
    result.value = { ...result.value, aiStatus: 'failed', aiMessage: apiErrorMessage(err) }
  } finally {
    retrying.value = false
  }
}

function startAnother() {
  result.value = null
  form.value = {
    ...form.value,
    evaluatedUserId: null,
    scores: emptyScores(form.value.roleKey),
    observations: '',
  }
}
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">{{ $t('evaluation.title') }}</h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ $t('evaluation.subtitle') }}</p>
      </div>
      <NuxtLink to="/evaluations" class="link text-sm">{{ $t('evaluation.backToList') }}</NuxtLink>
    </header>

    <!-- Resultado. Sustituye al formulario para que no queden dos versiones de
         la misma evaluación en pantalla. -->
    <section v-if="result" class="mt-6 flex flex-col gap-6">
      <div class="card p-6">
        <p class="text-sm text-[var(--text-secondary)]">{{ $t('evaluation.weightedAverage') }}</p>
        <p class="mt-1 text-5xl font-bold tabular-nums">
          {{ result.weightedAverage.toFixed(2) }}
        </p>
        <p class="text-sm text-[var(--text-secondary)]">
          {{ $t('evaluation.outOfFive') }} · {{ result.scorePercent }}%
        </p>
      </div>

      <div v-if="result.aiStatus !== 'ok'" class="card p-6">
        <p class="text-sm">{{ result.aiMessage }}</p>
        <button
          type="button"
          class="btn btn-secondary mt-4"
          :disabled="retrying"
          @click="onRetry"
        >
          {{ retrying ? $t('evaluation.generating') : $t('evaluation.retry') }}
        </button>
      </div>

      <!-- Texto plano con saltos respetados por CSS. Sin v-html en ninguna
           parte de la aplicación (MED-02). -->
      <div v-if="result.narrative" class="grid gap-6 lg:grid-cols-2">
        <article class="card p-6">
          <h2 class="text-lg font-semibold">{{ $t('evaluation.spanish') }}</h2>
          <p class="plain-text mt-3 text-sm">{{ result.narrative.es }}</p>
        </article>
        <article class="card p-6">
          <h2 class="text-lg font-semibold">{{ $t('evaluation.english') }}</h2>
          <p class="plain-text mt-3 text-sm">{{ result.narrative.en }}</p>
        </article>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button type="button" class="btn btn-primary" @click="startAnother">
          {{ $t('evaluation.another') }}
        </button>
        <NuxtLink :to="`/evaluations/${result.id}`" class="link text-sm">
          {{ $t('evaluation.viewSaved') }}
        </NuxtLink>
      </div>
    </section>

    <EvaluationForm
      v-else
      v-model="form"
      class="mt-6"
      :developers="developers"
      :submitting="submitting"
      :error="error"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Detalle de una evaluación, y sitio donde se edita y se elimina.
 *
 * Exige sesión y no rol: la persona evaluada tiene que poder leer su propia
 * evaluación. El servidor devuelve 404 —no 403— si no es suya, para no
 * confirmar que existe.
 *
 * El desglose se reconstruye con el catálogo del rol guardado en la fila, no
 * con el rol actual de la persona: si el cuestionario cambia, una evaluación
 * vieja se sigue leyendo tal como se hizo.
 *
 * La edición ocurre aquí, sobre el mismo formulario que el alta. No hay una
 * ruta `/editar` porque entonces `[id].vue` pasaría a ser el contenedor de sus
 * rutas hijas y tendría que pintar un `<NuxtPage>`: mucha fontanería para una
 * pantalla que cabe entera aquí.
 */
import { blockAverage, getRole, type EvaluationScores } from '#shared/evaluation'
import type { EvaluationFormValue } from '~/components/evaluation/EvaluationForm.vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t, locale } = useI18n()
const { request } = useApi()
const { isLead, isAdmin, user } = useAuth()

interface EvaluationDetail {
  id: number
  evaluatedUserId: number
  authorUserId: number | null
  active: number
  evaluatedName: string | null
  authorName: string | null
  roleKey: string
  roleLabel: string
  evaluatedOn: string
  scores: EvaluationScores
  weightedAverage: number
  scorePercent: number
  observations: string | null
  narrative: { es: string; en: string } | null
  aiModel: string | null
  generatedAt: string | null
}

const { data, error, refresh } = await useAsyncData(`evaluation:${route.params.id}`, () =>
  request<{ evaluation: EvaluationDetail }>(`/api/evaluations/${route.params.id}`),
)

const evaluation = computed(() => data.value?.evaluation ?? null)
const role = computed(() => (evaluation.value ? getRole(evaluation.value.roleKey) : null))

useHead({
  title: () => `${evaluation.value?.evaluatedName ?? t('evaluation.listTitle')} · Cube`,
})

/**
 * Editar y eliminar son de quien la hizo, o de un administrador. El servidor
 * lo vuelve a comprobar; esto solo evita enseñar botones que van a fallar.
 */
const canEdit = computed(
  () =>
    evaluation.value !== null &&
    (isAdmin.value || evaluation.value.authorUserId === user.value?.id),
)

const message = ref('')
const actionError = ref('')

/* ---------------------------------------------------------------- edición -- */

const editing = ref(false)
const saving = ref(false)
const editError = ref('')

/** Copia de trabajo. Se rellena al abrir para no tocar lo que se está viendo. */
const form = ref<EvaluationFormValue>({
  evaluatedUserId: null,
  roleKey: '',
  evaluatedOn: '',
  scores: {},
  observations: '',
})

function startEdit() {
  const current = evaluation.value
  if (!current) return

  message.value = ''
  editError.value = ''
  form.value = {
    evaluatedUserId: current.evaluatedUserId,
    roleKey: current.roleKey,
    evaluatedOn: current.evaluatedOn.slice(0, 10),
    // Copia profunda: sin ella, tocar una nota cambiaría también lo que hay
    // detrás del formulario, y cancelar no cancelaría nada.
    scores: Object.fromEntries(
      Object.entries(current.scores).map(([key, values]) => [key, [...values]]),
    ),
    observations: current.observations ?? '',
  }
  editing.value = true
}

async function saveEdit() {
  saving.value = true
  editError.value = ''
  try {
    await request(`/api/evaluations/${route.params.id}`, {
      method: 'PATCH',
      body: {
        roleKey: form.value.roleKey,
        evaluatedOn: form.value.evaluatedOn,
        scores: form.value.scores,
        observations: form.value.observations || undefined,
      },
    })
    editing.value = false
    // El servidor borra la redacción al cambiar las notas: el párrafo anterior
    // describía otra evaluación. Se dice, en vez de dejar el hueco sin motivo.
    message.value = t('evaluation.savedChanges')
    await refresh()
  } catch (err) {
    editError.value = apiErrorMessage(err)
  } finally {
    saving.value = false
  }
}

/* --------------------------------------------------- eliminar y restaurar -- */

/** Eliminar pregunta; restaurar no: la confirmación es para lo que quita. */
const confirming = ref(false)

async function setActive(active: boolean) {
  confirming.value = false
  message.value = ''
  actionError.value = ''
  try {
    await request(`/api/evaluations/${route.params.id}`, {
      method: 'PATCH',
      body: { active },
    })
    message.value = active ? t('evaluation.restoredNotice') : t('evaluation.deletedNotice')
    await refresh()
  } catch (err) {
    actionError.value = apiErrorMessage(err)
  }
}

/* --------------------------------------------------------------- redacción -- */

const retrying = ref(false)
const retryError = ref('')

/** Reintentar la redacción. La evaluación ya está guardada; esto la completa. */
async function onRetry() {
  retrying.value = true
  retryError.value = ''
  try {
    await request(`/api/evaluations/${route.params.id}/narrative`, { method: 'POST' })
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
      <header class="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ evaluation.evaluatedName ?? '—' }}
          </h1>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">
            {{ evaluation.roleLabel }} ·
            {{ new Date(evaluation.evaluatedOn).toLocaleDateString(locale) }}
            <span v-if="evaluation.authorName">
              · {{ $t('dashboard.evaluatedBy', { name: evaluation.authorName }) }}
            </span>
            <!-- Texto, no solo color: el estado nunca se codifica solo con color. -->
            <span v-if="!evaluation.active"> · {{ $t('evaluation.deletedBadge') }}</span>
          </p>
        </div>

        <div v-if="canEdit && !editing" class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-secondary" @click="startEdit">
            {{ $t('evaluation.edit') }}
          </button>
          <button
            v-if="evaluation.active"
            type="button"
            class="btn btn-danger"
            @click="confirming = true"
          >
            {{ $t('evaluation.delete') }}
          </button>
          <button v-else type="button" class="btn btn-secondary" @click="setActive(true)">
            {{ $t('evaluation.restore') }}
          </button>
        </div>
      </header>

      <p
        v-if="!evaluation.active"
        role="status"
        class="mt-4 rounded-md border border-[var(--hairline)] p-3 text-sm"
      >
        {{ $t('evaluation.deletedWarning') }}
      </p>

      <p v-if="message" role="status" class="mt-4 text-sm text-[var(--text-secondary)]">
        {{ message }}
      </p>
      <p v-if="actionError" role="alert" class="mt-4 text-sm">{{ actionError }}</p>

      <!-- --------------------------------------------------------- edición -- -->
      <section v-if="editing" class="mt-6">
        <h2 class="text-lg font-medium">
          {{ $t('evaluation.editing', { name: evaluation.evaluatedName ?? '' }) }}
        </h2>

        <div class="mt-4">
          <EvaluationForm
            v-model="form"
            lock-person
            :person-name="evaluation.evaluatedName ?? ''"
            :submitting="saving"
            :error="editError"
            :submit-label="$t('evaluation.saveChanges')"
            @submit="saveEdit"
          >
            <template #actions>
              <button type="button" class="btn btn-secondary mt-2 w-full" @click="editing = false">
                {{ $t('common.cancel') }}
              </button>
            </template>
          </EvaluationForm>
        </div>
      </section>

      <div v-else class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <section class="card p-6 lg:sticky lg:top-6 lg:self-start">
          <p class="text-sm text-[var(--text-secondary)]">{{ $t('evaluation.weightedAverage') }}</p>
          <p class="mt-1 text-5xl font-bold tabular-nums">
            {{ evaluation.weightedAverage.toFixed(2) }}
          </p>
          <p class="text-sm text-[var(--text-secondary)]">
            {{ $t('evaluation.outOfFive') }} · {{ evaluation.scorePercent }}%
          </p>

          <dl class="mt-4 space-y-1 text-sm">
            <div v-for="block in role?.blocks ?? []" :key="block.key" class="flex justify-between">
              <dt class="text-[var(--text-secondary)]">{{ block.label }} · {{ block.weight }}%</dt>
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
                {{ $t('evaluation.weight', { weight: block.weight }) }} ·
                {{
                  $t('evaluation.blockAverage', {
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
                    · {{ $t(`evaluation.languages.${evaluation.scores[block.key]?.[index] ?? 1}`) }}
                  </span>
                </span>
              </li>
            </ul>
          </section>

          <section v-if="evaluation.observations" class="card p-6">
            <h2 class="text-lg font-semibold">{{ $t('evaluation.observations') }}</h2>
            <p class="plain-text mt-3 text-sm">{{ evaluation.observations }}</p>
          </section>

          <!-- Texto plano, sin v-html en ninguna parte (MED-02). -->
          <div v-if="evaluation.narrative" class="grid gap-6 lg:grid-cols-2">
            <article class="card p-6">
              <h2 class="text-lg font-semibold">{{ $t('evaluation.spanish') }}</h2>
              <p class="plain-text mt-3 text-sm">{{ evaluation.narrative.es }}</p>
            </article>
            <article class="card p-6">
              <h2 class="text-lg font-semibold">{{ $t('evaluation.english') }}</h2>
              <p class="plain-text mt-3 text-sm">{{ evaluation.narrative.en }}</p>
            </article>
          </div>

          <section v-else class="card p-6">
            <p class="text-sm text-[var(--text-secondary)]">
              {{ $t('evaluation.narrativeMissingHint') }}
            </p>
            <p v-if="retryError" role="alert" class="mt-3 text-sm">{{ retryError }}</p>
            <button
              v-if="isLead"
              type="button"
              class="btn btn-secondary mt-4"
              :disabled="retrying"
              @click="onRetry"
            >
              {{ retrying ? $t('evaluation.generating') : $t('evaluation.retry') }}
            </button>
          </section>

          <p v-if="evaluation.aiModel" class="text-xs text-[var(--text-muted)]">
            {{ $t('evaluation.generatedWith', { model: evaluation.aiModel }) }}
          </p>
        </div>
      </div>

      <UiConfirmDialog
        :open="confirming"
        :title="$t('evaluation.confirmDeleteTitle', { name: evaluation.evaluatedName ?? '' })"
        :message="$t('evaluation.confirmDeleteBody')"
        :confirm-label="$t('evaluation.confirmDeleteAction')"
        danger
        @confirm="setActive(false)"
        @cancel="confirming = false"
      />
    </template>
  </div>
</template>

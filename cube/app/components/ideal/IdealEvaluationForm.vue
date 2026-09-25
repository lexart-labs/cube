<script setup lang="ts">
/**
 * Formulario IDEAL LEXART.
 *
 * Los bloques y sus pesos salen del rol elegido, así que cambiar de rol repinta
 * el cuestionario entero y reinicia las notas: las preguntas de un Arquitecto L3
 * no son las de un Desarrollador L3 y arrastrar valores entre unas y otras daría
 * un promedio sin sentido.
 *
 * El promedio se calcula con la MISMA función que usa el servidor
 * (`#shared/ideal`), no con una copia. Lo que se ve mientras se rellena es
 * exactamente lo que quedará registrado.
 */
import {
  IDEAL_ROLES,
  blockAverage,
  emptyScores,
  getRole,
  isComplete,
  scorePercent,
  weightedAverage,
  type IdealScores,
} from '#shared/ideal'

export interface IdealFormValue {
  evaluatedUserId: number | null
  roleKey: string
  evaluatedOn: string
  scores: IdealScores
  observations: string
}

const props = defineProps<{
  modelValue: IdealFormValue
  developers?: { id: number; name: string }[]
  submitting?: boolean
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: IdealFormValue]
  submit: []
}>()

const { t, te } = useI18n()

const form = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const roles = computed(() => Object.values(IDEAL_ROLES))
const role = computed(() => getRole(form.value.roleKey))

/** Etiqueta traducida del bloque, con el nombre del catálogo como respaldo. */
function blockLabel(key: string, fallback: string): string {
  return te(`ideal.blocks.${key}`) ? t(`ideal.blocks.${key}`) : fallback
}

function onRoleChange(event: Event) {
  const roleKey = (event.target as HTMLSelectElement).value
  form.value = { ...form.value, roleKey, scores: emptyScores(roleKey) }
}

function setScore(blockKey: string, index: number, value: number) {
  const current = form.value.scores[blockKey] ?? []
  const updated = [...current]
  updated[index] = value
  form.value = { ...form.value, scores: { ...form.value.scores, [blockKey]: updated } }
}

const average = computed(() => weightedAverage(form.value.roleKey, form.value.scores))
const percent = computed(() => scorePercent(average.value))
const complete = computed(() => isComplete(form.value.roleKey, form.value.scores))

const canSubmit = computed(
  () => !props.submitting && complete.value && form.value.evaluatedUserId !== null,
)
</script>

<template>
  <form novalidate @submit.prevent="emit('submit')">
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
      <div class="flex flex-col gap-6">
        <section class="card p-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium">{{ $t('ideal.collaborator') }}</span>
              <select v-model.number="form.evaluatedUserId" class="field mt-1" required>
                <option :value="null" disabled>{{ $t('ideal.choosePerson') }}</option>
                <option v-for="dev in developers ?? []" :key="dev.id" :value="dev.id">
                  {{ dev.name }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="text-sm font-medium">{{ $t('ideal.role') }}</span>
              <select :value="form.roleKey" class="field mt-1" @change="onRoleChange">
                <option v-for="item in roles" :key="item.key" :value="item.key">
                  {{ item.label }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="text-sm font-medium">{{ $t('ideal.date') }}</span>
              <input v-model="form.evaluatedOn" type="date" class="field mt-1" required >
            </label>
          </div>
        </section>

        <!-- Un bloque por sección, con su peso a la vista: el lead debe saber
             cuánto pesa lo que está puntuando. -->
        <section v-for="block in role?.blocks ?? []" :key="block.key" class="card p-6">
          <header class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-lg font-semibold">{{ blockLabel(block.key, block.label) }}</h2>
            <p class="text-sm text-[var(--text-secondary)]">
              {{ $t('ideal.weight', { weight: block.weight }) }} ·
              {{ $t('ideal.blockAverage', { value: blockAverage(form.scores[block.key] ?? []) }) }}
            </p>
          </header>

          <p v-if="block.scale === 'languages'" class="mt-1 text-sm text-[var(--text-secondary)]">
            {{ $t('ideal.languagesHint') }}
          </p>

          <div class="mt-2 divide-y divide-[var(--gridline)]">
            <IdealScoreScale
              v-for="(question, index) in block.questions"
              :key="question"
              :model-value="form.scores[block.key]?.[index] ?? 3"
              :label="question"
              :name="`${block.key}-${index}`"
              :scale="block.scale"
              @update:model-value="setScore(block.key, index, $event)"
            />
          </div>
        </section>

        <section class="card p-6">
          <label class="block">
            <span class="text-sm font-medium">{{ $t('ideal.observations') }}</span>
            <span class="mt-1 block text-sm text-[var(--text-secondary)]">
              {{ $t('ideal.observationsHint') }}
            </span>
            <textarea v-model="form.observations" class="field mt-2" rows="5" maxlength="5000" />
          </label>
        </section>
      </div>

      <!-- Panel lateral: el número que resume todo, siempre a la vista. -->
      <aside class="lg:sticky lg:top-6 lg:self-start">
        <div class="card p-6">
          <p class="text-sm text-[var(--text-secondary)]">{{ $t('ideal.weightedAverage') }}</p>
          <p class="mt-1 text-4xl font-bold tabular-nums">{{ average.toFixed(2) }}</p>
          <p class="text-sm text-[var(--text-secondary)]">
            {{ $t('ideal.outOfFive') }} · {{ percent }}%
          </p>

          <dl class="mt-4 space-y-1 text-sm">
            <div v-for="block in role?.blocks ?? []" :key="block.key" class="flex justify-between">
              <dt class="text-[var(--text-secondary)]">
                {{ blockLabel(block.key, block.label) }} · {{ block.weight }}%
              </dt>
              <dd class="tabular-nums">{{ blockAverage(form.scores[block.key] ?? []).toFixed(2) }}</dd>
            </div>
          </dl>

          <p v-if="error" role="alert" class="mt-4 text-sm text-[var(--series-1-strong)]">
            {{ error }}
          </p>

          <button type="submit" class="btn btn-primary mt-4 w-full" :disabled="!canSubmit">
            {{ submitting ? $t('ideal.generating') : $t('ideal.generate') }}
          </button>

          <!-- Un botón deshabilitado sin explicación se lee como una avería.
               Aquí se dice qué falta. -->
          <p
            v-if="!canSubmit && !submitting"
            class="mt-2 text-xs text-[var(--text-secondary)]"
          >
            {{ form.evaluatedUserId === null ? $t('ideal.needsPerson') : $t('ideal.needsScores') }}
          </p>

          <p class="mt-3 text-xs text-[var(--text-secondary)]">{{ $t('ideal.privacyNote') }}</p>
        </div>
      </aside>
    </div>
  </form>
</template>

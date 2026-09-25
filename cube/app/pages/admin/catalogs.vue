<script setup lang="ts">
/**
 * Catálogos de posiciones y niveles. Solo admin.
 *
 * Se desactivan, nunca se borran: hay usuarios y evaluaciones que los
 * referencian, y borrarlos dejaría ese historial sin contexto.
 */
definePageMeta({ middleware: 'admin' })

const { request } = useApi()
const { t } = useI18n()

interface Position {
  id: number
  name: string
  minimum_time_months: number
  active: number
}
interface Level {
  id: number
  name: string
  active: number
}

/**
 * Los desactivados no desaparecen: se piden explícitamente y se listan marcados.
 * Sin esto, desactivar algo equivalía a perderlo — no había ninguna pantalla
 * desde la que volver a activarlo.
 */
const showInactive = ref(false)

const catalogQuery = computed(() =>
  showInactive.value ? { includeInactive: 'true' } : undefined,
)

const {
  data: positionsData,
  error: positionsError,
  refresh: refreshPositions,
} = await useAsyncData(
  'admin:positions',
  () => request<{ items: Position[] }>('/api/positions', { query: catalogQuery.value }),
  { watch: [showInactive] },
)

const {
  data: levelsData,
  error: levelsError,
  refresh: refreshLevels,
} = await useAsyncData(
  'admin:levels',
  () => request<{ items: Level[] }>('/api/levels', { query: catalogQuery.value }),
  { watch: [showInactive] },
)

const positions = computed(() => positionsData.value?.items ?? [])
const levels = computed(() => levelsData.value?.items ?? [])

const newPosition = reactive({ name: '', minimumTimeMonths: 0 })
const newLevel = reactive({ name: '' })
const message = ref('')

async function addPosition() {
  message.value = ''
  try {
    await request('/api/positions', { method: 'POST', body: { ...newPosition } })
    newPosition.name = ''
    newPosition.minimumTimeMonths = 0
    await refreshPositions()
  } catch (err) {
    message.value = apiErrorMessage(err)
  }
}

async function addLevel() {
  message.value = ''
  try {
    await request('/api/levels', { method: 'POST', body: { ...newLevel } })
    newLevel.name = ''
    await refreshLevels()
  } catch (err) {
    message.value = apiErrorMessage(err)
  }
}

/* ---- activar / desactivar ---- */

/**
 * Desactivar pregunta; activar no. La confirmación es para lo que quita algo de
 * en medio, no para lo que lo devuelve.
 */
const pending = ref<{ name: string; run: () => Promise<void> } | null>(null)

function toggle(kind: 'positions' | 'levels', item: Position | Level) {
  const activating = item.active !== 1
  const run = async () => {
    try {
      await request(`/api/${kind}/${item.id}`, { method: 'PATCH', body: { active: activating } })
      await (kind === 'positions' ? refreshPositions() : refreshLevels())
    } catch (err) {
      message.value = apiErrorMessage(err)
    }
  }

  if (activating) return void run()
  pending.value = { name: item.name, run }
}

async function confirmPending() {
  const action = pending.value
  pending.value = null
  if (action) await action.run()
}

useHead({ title: () => `${t('catalogs.title')} · Cube` })
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">{{ $t('catalogs.title') }}</h1>
    <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ $t('catalogs.deactivateHint') }}</p>

    <label class="mt-4 flex items-center gap-2 text-sm">
      <input v-model="showInactive" type="checkbox" class="size-4">
      <span>{{ $t('common.showInactive') }}</span>
      <span class="text-[var(--text-muted)]">· {{ $t('catalogs.showInactiveHint') }}</span>
    </label>

    <p v-if="message" role="alert" class="mt-4 text-sm">{{ message }}</p>
    <p v-if="positionsError || levelsError" role="alert" class="mt-4 text-sm">
      {{ apiErrorMessage(positionsError ?? levelsError) }}
    </p>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <section class="card p-6">
        <h2 class="text-lg font-medium">{{ $t('catalogs.positions') }}</h2>

        <form class="mt-4 flex flex-wrap gap-2" novalidate @submit.prevent="addPosition">
          <label class="min-w-[160px] flex-1">
            <span class="sr-only">{{ $t('catalogs.positionName') }}</span>
            <input
              v-model="newPosition.name"
              type="text"
              required
              :placeholder="$t('catalogs.positionName')"
              class="w-full rounded-md border border-[var(--hairline)] bg-transparent px-3 py-2 text-sm"
            >
          </label>
          <label class="w-32">
            <span class="sr-only">{{ $t('catalogs.minimumMonths') }}</span>
            <input
              v-model.number="newPosition.minimumTimeMonths"
              type="number"
              min="0"
              max="600"
              :placeholder="$t('catalogs.minimumMonths')"
              class="w-full rounded-md border border-[var(--hairline)] bg-transparent px-3 py-2 text-sm"
            >
          </label>
          <button
            type="submit"
            class="btn btn-primary"
          >
            {{ $t('common.create') }}
          </button>
        </form>

        <ul class="mt-4 flex list-none flex-col p-0">
          <li
            v-for="item in positions"
            :key="item.id"
            class="flex items-center justify-between gap-3 border-b border-[var(--hairline)] py-2 last:border-0"
          >
            <span :class="item.active ? '' : 'text-[var(--text-muted)]'">
              {{ item.name }}
              <span v-if="item.minimum_time_months" class="text-sm text-[var(--text-muted)]">
                · {{ item.minimum_time_months }} {{ $t('catalogs.minimumMonths').toLowerCase() }}
              </span>
              <!-- Texto, no solo color: el estado nunca se codifica solo con color. -->
              <span v-if="!item.active" class="text-sm text-[var(--text-secondary)]">
                · {{ $t('users.inactive') }}
              </span>
            </span>
            <button
              type="button"
              class="text-sm text-[var(--text-secondary)] underline underline-offset-2 whitespace-nowrap"
              @click="toggle('positions', item)"
            >
              {{ item.active ? $t('users.deactivate') : $t('users.activate') }}
            </button>
          </li>
        </ul>
      </section>

      <section class="card p-6">
        <h2 class="text-lg font-medium">{{ $t('catalogs.levels') }}</h2>

        <form class="mt-4 flex flex-wrap gap-2" novalidate @submit.prevent="addLevel">
          <label class="min-w-[160px] flex-1">
            <span class="sr-only">{{ $t('catalogs.levelName') }}</span>
            <input
              v-model="newLevel.name"
              type="text"
              required
              :placeholder="$t('catalogs.levelName')"
              class="w-full rounded-md border border-[var(--hairline)] bg-transparent px-3 py-2 text-sm"
            >
          </label>
          <button
            type="submit"
            class="btn btn-primary"
          >
            {{ $t('common.create') }}
          </button>
        </form>

        <ul class="mt-4 flex list-none flex-col p-0">
          <li
            v-for="item in levels"
            :key="item.id"
            class="flex items-center justify-between gap-3 border-b border-[var(--hairline)] py-2 last:border-0"
          >
            <span :class="item.active ? '' : 'text-[var(--text-muted)]'">
              {{ item.name }}
              <span v-if="!item.active" class="text-sm text-[var(--text-secondary)]">
                · {{ $t('users.inactive') }}
              </span>
            </span>
            <button
              type="button"
              class="text-sm text-[var(--text-secondary)] underline underline-offset-2 whitespace-nowrap"
              @click="toggle('levels', item)"
            >
              {{ item.active ? $t('users.deactivate') : $t('users.activate') }}
            </button>
          </li>
        </ul>
      </section>
    </div>

    <UiConfirmDialog
      :open="pending !== null"
      :title="$t('catalogs.confirmDeactivateTitle', { name: pending?.name ?? '' })"
      :message="$t('catalogs.confirmDeactivateBody')"
      :confirm-label="$t('users.deactivate')"
      danger
      @confirm="confirmPending"
      @cancel="pending = null"
    />
  </div>
</template>

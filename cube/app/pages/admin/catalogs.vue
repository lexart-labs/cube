<script setup lang="ts">
/**
 * Catálogos de posiciones y niveles. Solo admin.
 *
 * Se desactivan, nunca se borran: hay usuarios y evaluaciones que los
 * referencian, y borrarlos dejaría ese historial sin contexto.
 *
 * Se editan en la propia fila. Antes solo se podían crear y desactivar: una
 * errata en el nombre de una posición era definitiva —solo quedaba crear otra
 * y desactivar la mala, dejando a la gente repartida entre las dos— y los
 * meses mínimos no se podían corregir después de crearla.
 */
definePageMeta({ middleware: 'admin' })

const { request } = useApi()
const { t } = useI18n()

type Catalog = 'positions' | 'levels'

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

const catalogQuery = computed(() => (showInactive.value ? { includeInactive: 'true' } : undefined))

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

const refreshOf = (kind: Catalog) => (kind === 'positions' ? refreshPositions() : refreshLevels())

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

/* ---- edición en la fila ---- */

/**
 * Qué se está editando, y con qué valores. Los valores van en un objeto que
 * siempre existe para que la plantilla pueda enlazarlos sin tener que afirmar
 * que hay algo en edición.
 */
const editing = ref<{ kind: Catalog; id: number } | null>(null)
const editDraft = reactive({ name: '', minimumTimeMonths: 0 })
const saving = ref(false)

const isEditing = (kind: Catalog, id: number) =>
  editing.value?.kind === kind && editing.value.id === id

function startEdit(kind: Catalog, item: Position | Level) {
  message.value = ''
  editing.value = { kind, id: item.id }
  editDraft.name = item.name
  editDraft.minimumTimeMonths = 'minimum_time_months' in item ? item.minimum_time_months : 0
}

function cancelEdit() {
  editing.value = null
}

async function saveEdit() {
  const target = editing.value
  if (!target) return

  message.value = ''
  saving.value = true
  try {
    await request(`/api/${target.kind}/${target.id}`, {
      method: 'PATCH',
      body: {
        name: editDraft.name,
        // Los meses mínimos solo existen en las posiciones; mandarlos en un
        // nivel sería un campo que su esquema no conoce.
        ...(target.kind === 'positions' ? { minimumTimeMonths: editDraft.minimumTimeMonths } : {}),
      },
    })
    editing.value = null
    await refreshOf(target.kind)
  } catch (err) {
    message.value = apiErrorMessage(err)
  } finally {
    saving.value = false
  }
}

/* ---- activar / desactivar ---- */

/**
 * Desactivar pregunta; activar no. La confirmación es para lo que quita algo de
 * en medio, no para lo que lo devuelve.
 */
const pending = ref<{ name: string; run: () => Promise<void> } | null>(null)

function toggle(kind: Catalog, item: Position | Level) {
  const activating = item.active !== 1
  const run = async () => {
    try {
      await request(`/api/${kind}/${item.id}`, { method: 'PATCH', body: { active: activating } })
      // Si se estaba editando justo eso, el formulario deja de tener sentido.
      if (isEditing(kind, item.id)) editing.value = null
      await refreshOf(kind)
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
      <input v-model="showInactive" type="checkbox" class="size-4" />
      <span>{{ $t('common.showInactive') }}</span>
      <span class="text-[var(--text-muted)]">· {{ $t('catalogs.showInactiveHint') }}</span>
    </label>

    <p v-if="message" role="alert" class="mt-4 text-sm">{{ message }}</p>
    <p v-if="positionsError || levelsError" role="alert" class="mt-4 text-sm">
      {{ apiErrorMessage(positionsError ?? levelsError) }}
    </p>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <!-- ------------------------------------------------------ posiciones -->
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
              class="field"
            />
          </label>
          <label class="w-32">
            <span class="sr-only">{{ $t('catalogs.minimumMonths') }}</span>
            <input
              v-model.number="newPosition.minimumTimeMonths"
              type="number"
              min="0"
              max="600"
              :placeholder="$t('catalogs.minimumMonths')"
              class="field"
            />
          </label>
          <button type="submit" class="btn btn-primary">{{ $t('common.create') }}</button>
        </form>

        <ul class="mt-4 flex list-none flex-col p-0">
          <li
            v-for="item in positions"
            :key="item.id"
            class="border-b border-[var(--hairline)] py-2 last:border-0"
          >
            <!-- Modo edición: el nombre y los meses pasan a ser campos. -->
            <form
              v-if="isEditing('positions', item.id)"
              class="flex flex-wrap items-center gap-2"
              novalidate
              @submit.prevent="saveEdit"
            >
              <label class="min-w-[140px] flex-1">
                <span class="sr-only">{{ $t('catalogs.positionName') }}</span>
                <input v-model="editDraft.name" type="text" required class="field" />
              </label>
              <label class="w-28">
                <span class="sr-only">{{ $t('catalogs.minimumMonths') }}</span>
                <input
                  v-model.number="editDraft.minimumTimeMonths"
                  type="number"
                  min="0"
                  max="600"
                  class="field"
                />
              </label>
              <button type="submit" :disabled="saving" class="btn btn-primary py-1">
                {{ $t('common.save') }}
              </button>
              <button type="button" class="btn btn-secondary py-1" @click="cancelEdit">
                {{ $t('common.cancel') }}
              </button>
            </form>

            <div v-else class="flex items-center justify-between gap-3">
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
              <span class="whitespace-nowrap">
                <button
                  type="button"
                  class="text-sm text-[var(--text-secondary)] underline underline-offset-2"
                  @click="startEdit('positions', item)"
                >
                  {{ $t('common.edit') }}
                </button>
                <button
                  type="button"
                  class="ml-3 text-sm text-[var(--text-secondary)] underline underline-offset-2"
                  @click="toggle('positions', item)"
                >
                  {{ item.active ? $t('users.deactivate') : $t('users.activate') }}
                </button>
              </span>
            </div>
          </li>
        </ul>
      </section>

      <!-- ---------------------------------------------------------- niveles -->
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
              class="field"
            />
          </label>
          <button type="submit" class="btn btn-primary">{{ $t('common.create') }}</button>
        </form>

        <ul class="mt-4 flex list-none flex-col p-0">
          <li
            v-for="item in levels"
            :key="item.id"
            class="border-b border-[var(--hairline)] py-2 last:border-0"
          >
            <form
              v-if="isEditing('levels', item.id)"
              class="flex flex-wrap items-center gap-2"
              novalidate
              @submit.prevent="saveEdit"
            >
              <label class="min-w-[140px] flex-1">
                <span class="sr-only">{{ $t('catalogs.levelName') }}</span>
                <input v-model="editDraft.name" type="text" required class="field" />
              </label>
              <button type="submit" :disabled="saving" class="btn btn-primary py-1">
                {{ $t('common.save') }}
              </button>
              <button type="button" class="btn btn-secondary py-1" @click="cancelEdit">
                {{ $t('common.cancel') }}
              </button>
            </form>

            <div v-else class="flex items-center justify-between gap-3">
              <span :class="item.active ? '' : 'text-[var(--text-muted)]'">
                {{ item.name }}
                <span v-if="!item.active" class="text-sm text-[var(--text-secondary)]">
                  · {{ $t('users.inactive') }}
                </span>
              </span>
              <span class="whitespace-nowrap">
                <button
                  type="button"
                  class="text-sm text-[var(--text-secondary)] underline underline-offset-2"
                  @click="startEdit('levels', item)"
                >
                  {{ $t('common.edit') }}
                </button>
                <button
                  type="button"
                  class="ml-3 text-sm text-[var(--text-secondary)] underline underline-offset-2"
                  @click="toggle('levels', item)"
                >
                  {{ item.active ? $t('users.deactivate') : $t('users.activate') }}
                </button>
              </span>
            </div>
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

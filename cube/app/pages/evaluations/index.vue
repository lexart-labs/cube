<script setup lang="ts">
/**
 * Listado de evaluaciones.
 *
 * El alcance lo decide el servidor: un lead ve todas y un developer solo las
 * suyas, mande lo que mande la petición. Por eso la página exige sesión y no
 * rol: para una persona evaluada, este es el sitio donde consulta su historial.
 */
import { getRole } from '#shared/evaluation'

definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const { request } = useApi()
const { isLead, isAdmin, user } = useAuth()

useHead({ title: () => `${t('evaluation.listTitle')} · Cube` })

interface EvaluationRow {
  id: number
  evaluatedUserId: number
  authorUserId: number | null
  active: number
  evaluatedName: string | null
  authorName: string | null
  roleKey: string
  evaluatedOn: string
  weightedAverage: number
  scorePercent: number
  generatedAt: string | null
}

/**
 * Las eliminadas no salen por defecto, pero se pueden pedir: si desaparecieran
 * de todas las pantallas, eliminar una por error sería definitivo (regla 9).
 * El servidor solo atiende la petición a lead y admin.
 */
const showDeleted = ref(false)

const { data, pending, error, refresh } = await useAsyncData(
  'evaluations:list',
  () =>
    request<{ evaluations: EvaluationRow[] }>('/api/evaluations', {
      query: showDeleted.value ? { includeDeleted: 'true' } : {},
    }),
  { watch: [showDeleted] },
)

const rows = computed(() => data.value?.evaluations ?? [])

/** Editar y eliminar son de quien la hizo, o de un administrador. */
const canEdit = (row: EvaluationRow) => isAdmin.value || row.authorUserId === user.value?.id

const message = ref('')
const actionError = ref('')

/** Eliminar pregunta; restaurar no: la confirmación es para lo que quita. */
const pendingRow = ref<EvaluationRow | null>(null)

async function confirmDelete() {
  const row = pendingRow.value
  pendingRow.value = null
  if (row) await setActive(row, false)
}

async function setActive(row: EvaluationRow, active: boolean) {
  message.value = ''
  actionError.value = ''
  try {
    await request(`/api/evaluations/${row.id}`, { method: 'PATCH', body: { active } })
    message.value = active ? t('evaluation.restoredNotice') : t('evaluation.deletedNotice')
    await refresh()
  } catch (err) {
    actionError.value = apiErrorMessage(err)
  }
}

/** El catálogo puede haber cambiado; si el rol ya no existe, se muestra la clave. */
const roleLabel = (key: string) => getRole(key)?.label ?? key

const formatDate = (value: string) => new Date(value).toLocaleDateString(locale.value)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">{{ $t('evaluation.listTitle') }}</h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ $t('evaluation.listSubtitle') }}</p>
      </div>
      <NuxtLink v-if="isLead" to="/evaluations/new" class="btn btn-primary">
        {{ $t('evaluation.new') }}
      </NuxtLink>
    </div>

    <label v-if="isLead" class="mt-4 flex flex-wrap items-center gap-2 text-sm">
      <input v-model="showDeleted" type="checkbox" class="size-4" />
      <span>{{ $t('evaluation.showDeleted') }}</span>
      <span class="text-[var(--text-muted)]">· {{ $t('evaluation.showDeletedHint') }}</span>
    </label>

    <p v-if="message" role="status" class="mt-4 text-sm text-[var(--text-secondary)]">
      {{ message }}
    </p>
    <p v-if="actionError" role="alert" class="mt-4 text-sm">{{ actionError }}</p>

    <p v-if="error" role="alert" class="mt-8 text-sm">{{ apiErrorMessage(error) }}</p>

    <p v-else-if="pending" class="mt-8 text-sm text-[var(--text-secondary)]">
      {{ $t('common.loading') }}
    </p>

    <div v-else-if="!rows.length" class="card mt-8 p-8 text-center">
      <p class="text-[var(--text-secondary)]">{{ $t('evaluation.empty') }}</p>
      <NuxtLink v-if="isLead" to="/evaluations/new" class="link mt-3 inline-block text-sm">
        {{ $t('evaluation.new') }}
      </NuxtLink>
    </div>

    <!-- La tabla desborda en horizontal dentro de su propio contenedor: el
         cuerpo de la página nunca hace scroll lateral. -->
    <div v-else class="card mt-8 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[var(--gridline)] text-left">
            <th class="px-4 py-3 font-medium">{{ $t('evaluation.collaborator') }}</th>
            <th class="px-4 py-3 font-medium">{{ $t('evaluation.role') }}</th>
            <th class="px-4 py-3 font-medium">{{ $t('evaluation.date') }}</th>
            <th class="px-4 py-3 text-right font-medium">{{ $t('evaluation.weightedAverage') }}</th>
            <th class="px-4 py-3 font-medium">{{ $t('evaluation.narrative') }}</th>
            <!-- La columna solo existe para quien puede hacer algo con ella:
                 a un developer le quedaría una cabecera sobre celdas vacías. -->
            <th v-if="isLead" class="px-4 py-3 text-right font-medium">
              {{ $t('common.actions') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="border-b border-[var(--gridline)] last:border-0"
          >
            <td class="px-4 py-3">
              <NuxtLink :to="`/evaluations/${row.id}`" class="link">
                {{ row.evaluatedName ?? '—' }}
              </NuxtLink>
              <span v-if="row.authorName" class="block text-xs text-[var(--text-muted)]">
                {{ $t('dashboard.evaluatedBy', { name: row.authorName }) }}
              </span>
              <!-- Texto, no solo color: el estado nunca se codifica solo con color. -->
              <span v-if="!row.active" class="block text-xs text-[var(--text-secondary)]">
                {{ $t('evaluation.deletedBadge') }}
              </span>
            </td>
            <td class="px-4 py-3">{{ roleLabel(row.roleKey) }}</td>
            <td class="px-4 py-3">{{ formatDate(row.evaluatedOn) }}</td>
            <td class="px-4 py-3 text-right tabular-nums">
              <span class="font-semibold">{{ row.weightedAverage.toFixed(2) }}</span>
              <span class="text-[var(--text-muted)]"> · {{ row.scorePercent }}%</span>
            </td>
            <td class="px-4 py-3 text-[var(--text-secondary)]">
              {{
                row.generatedAt
                  ? $t('evaluation.narrativeReady')
                  : $t('evaluation.narrativeMissing')
              }}
            </td>
            <td v-if="isLead" class="px-4 py-3 text-right whitespace-nowrap">
              <template v-if="canEdit(row)">
                <NuxtLink :to="`/evaluations/${row.id}`" class="link">
                  {{ $t('evaluation.edit') }}
                </NuxtLink>
                <button
                  v-if="row.active"
                  type="button"
                  class="ml-3 text-[var(--text-secondary)] underline underline-offset-2"
                  @click="pendingRow = row"
                >
                  {{ $t('evaluation.delete') }}
                </button>
                <button
                  v-else
                  type="button"
                  class="ml-3 text-[var(--text-secondary)] underline underline-offset-2"
                  @click="setActive(row, true)"
                >
                  {{ $t('evaluation.restore') }}
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiConfirmDialog
      :open="pendingRow !== null"
      :title="$t('evaluation.confirmDeleteTitle', { name: pendingRow?.evaluatedName ?? '' })"
      :message="$t('evaluation.confirmDeleteBody')"
      :confirm-label="$t('evaluation.confirmDeleteAction')"
      danger
      @confirm="confirmDelete"
      @cancel="pendingRow = null"
    />
  </div>
</template>

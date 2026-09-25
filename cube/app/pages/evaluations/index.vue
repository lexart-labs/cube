<script setup lang="ts">
/**
 * Listado de evaluaciones IDEAL.
 *
 * El alcance lo decide el servidor: un lead ve todas y un developer solo las
 * suyas, mande lo que mande la petición. Por eso la página exige sesión y no
 * rol: para una persona evaluada, este es el sitio donde consulta su historial.
 */
import { getRole } from '#shared/ideal'

definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const { request } = useApi()
const { isLead } = useAuth()

useHead({ title: () => `${t('ideal.listTitle')} · Cube` })

interface IdealRow {
  id: number
  evaluatedUserId: number
  evaluatedName: string | null
  authorName: string | null
  roleKey: string
  evaluatedOn: string
  weightedAverage: number
  scorePercent: number
  generatedAt: string | null
}

const { data, pending, error } = await useAsyncData('ideal:list', () =>
  request<{ evaluations: IdealRow[] }>('/api/ideal'),
)

const rows = computed(() => data.value?.evaluations ?? [])

/** El catálogo puede haber cambiado; si el rol ya no existe, se muestra la clave. */
const roleLabel = (key: string) => getRole(key)?.label ?? key

const formatDate = (value: string) => new Date(value).toLocaleDateString(locale.value)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">{{ $t('ideal.listTitle') }}</h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ $t('ideal.listSubtitle') }}</p>
      </div>
      <NuxtLink v-if="isLead" to="/evaluations/new" class="btn btn-primary">
        {{ $t('evaluation.newIdeal') }}
      </NuxtLink>
    </div>

    <p v-if="error" role="alert" class="mt-8 text-sm">{{ apiErrorMessage(error) }}</p>

    <p v-else-if="pending" class="mt-8 text-sm text-[var(--text-secondary)]">
      {{ $t('common.loading') }}
    </p>

    <div v-else-if="!rows.length" class="card mt-8 p-8 text-center">
      <p class="text-[var(--text-secondary)]">{{ $t('ideal.empty') }}</p>
      <NuxtLink v-if="isLead" to="/evaluations/new" class="link mt-3 inline-block text-sm">
        {{ $t('evaluation.newIdeal') }}
      </NuxtLink>
    </div>

    <!-- La tabla desborda en horizontal dentro de su propio contenedor: el
         cuerpo de la página nunca hace scroll lateral. -->
    <div v-else class="card mt-8 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[var(--gridline)] text-left">
            <th class="px-4 py-3 font-medium">{{ $t('ideal.collaborator') }}</th>
            <th class="px-4 py-3 font-medium">{{ $t('ideal.role') }}</th>
            <th class="px-4 py-3 font-medium">{{ $t('evaluation.date') }}</th>
            <th class="px-4 py-3 text-right font-medium">{{ $t('ideal.weightedAverage') }}</th>
            <th class="px-4 py-3 font-medium">{{ $t('ideal.narrative') }}</th>
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
            </td>
            <td class="px-4 py-3">{{ roleLabel(row.roleKey) }}</td>
            <td class="px-4 py-3">{{ formatDate(row.evaluatedOn) }}</td>
            <td class="px-4 py-3 text-right tabular-nums">
              <span class="font-semibold">{{ row.weightedAverage.toFixed(2) }}</span>
              <span class="text-[var(--text-muted)]"> · {{ row.scorePercent }}%</span>
            </td>
            <td class="px-4 py-3 text-[var(--text-secondary)]">
              {{ row.generatedAt ? $t('ideal.narrativeReady') : $t('ideal.narrativeMissing') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

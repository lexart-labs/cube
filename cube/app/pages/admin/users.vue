<script setup lang="ts">
/**
 * Administración de usuarios. Solo admin.
 *
 * Desactivar a alguien o cambiarle la contraseña **cierra sus sesiones
 * abiertas** en el mismo momento: el servidor las revoca y la interfaz lo
 * confirma. v1 no podía hacerlo — sus JWT de 365 días seguían siendo válidos
 * aunque la persona ya no trabajara ahí (HIGH-03).
 */
definePageMeta({ middleware: 'admin' })

const { request } = useApi()
const { t } = useI18n()

interface UserRow {
  id: number
  name: string
  email: string
  role: 'developer' | 'lead' | 'admin'
  active: number
  position: string | null
  level: string | null
  lead_name: string | null
}

const search = ref('')
const roleFilter = ref<string | null>(null)
/**
 * null = todos. La lista incluye a los desactivados por defecto, marcados en la
 * columna de estado: a quien se desactiva hay que poder encontrarlo para
 * volver a activarlo.
 */
const statusFilter = ref<'true' | 'false' | null>(null)
const page = ref(0)
const LIMIT = 20

const debouncedSearch = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    debouncedSearch.value = value
    page.value = 0
  }, 300)
})

const { data, pending, error, refresh } = await useAsyncData(
  'admin:users',
  () =>
    request<{ items: UserRow[]; total: number }>('/api/users', {
      query: {
        page: page.value,
        limit: LIMIT,
        ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
        ...(roleFilter.value ? { role: roleFilter.value } : {}),
        ...(statusFilter.value ? { active: statusFilter.value } : {}),
      },
    }),
  { watch: [page, debouncedSearch, roleFilter, statusFilter] },
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / LIMIT))

/* ---- alta ---- */
const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'developer' as UserRow['role'],
})

async function createUser() {
  createError.value = ''
  creating.value = true
  try {
    await request('/api/users', { method: 'POST', body: { ...form } })
    showCreate.value = false
    Object.assign(form, { name: '', email: '', password: '', role: 'developer' })
    await refresh()
  } catch (err) {
    createError.value = apiErrorMessage(err)
  } finally {
    creating.value = false
  }
}

/* ---- activar / desactivar ---- */
const actionMessage = ref('')
const actionError = ref('')

/**
 * Desactivar pregunta; activar no. Y pregunta en un modal propio, no con
 * `confirm()`: el del navegador no se traduce y, tras varios avisos seguidos,
 * ofrece silenciar los siguientes — justo el que importa.
 */
const pendingUser = ref<UserRow | null>(null)

function toggleActive(user: UserRow) {
  if (user.active === 1) {
    pendingUser.value = user
    return
  }
  void setActive(user, true)
}

async function confirmDeactivate() {
  const user = pendingUser.value
  pendingUser.value = null
  if (user) await setActive(user, false)
}

async function setActive(user: UserRow, active: boolean) {
  actionMessage.value = ''
  actionError.value = ''
  try {
    const result = await request<{ sessionsRevoked: number }>(`/api/users/${user.id}`, {
      method: 'PATCH',
      body: { active },
    })
    if (!active) {
      actionMessage.value = t('users.sessionsRevoked', { count: result.sessionsRevoked })
    }
    await refresh()
  } catch (err) {
    actionError.value = apiErrorMessage(err)
  }
}

async function changeRole(user: UserRow, role: string) {
  actionError.value = ''
  try {
    await request(`/api/users/${user.id}`, { method: 'PATCH', body: { role } })
  } catch (err) {
    actionError.value = apiErrorMessage(err)
  } finally {
    // Pase lo que pase se recarga: si el cambio falló, el <select> tiene que
    // volver al rol que la persona sigue teniendo de verdad.
    await refresh()
  }
}

useHead({ title: () => `${t('users.title')} · Cube` })
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold tracking-tight">{{ $t('users.title') }}</h1>
      <button
        type="button"
        class="btn btn-primary"
        @click="showCreate = !showCreate"
      >
        {{ $t('users.new') }}
      </button>
    </div>

    <form
      v-if="showCreate"
      class="card mt-6 p-6"
      novalidate
      @submit.prevent="createUser"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.name') }}</span>
          <input
            v-model="form.name"
            type="text"
            required
            class="field mt-1"
          >
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.email') }}</span>
          <input
            v-model="form.email"
            type="email"
            required
            autocomplete="off"
            class="field mt-1"
          >
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.initialPassword') }}</span>
          <span class="mt-1 block text-xs text-[var(--text-muted)]">
            {{ $t('users.passwordHint') }}
          </span>
          <input
            v-model="form.password"
            type="password"
            required
            minlength="12"
            autocomplete="new-password"
            class="field mt-1"
          >
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.role') }}</span>
          <select
            v-model="form.role"
            class="field mt-1"
          >
            <option value="developer">{{ $t('roles.developer') }}</option>
            <option value="lead">{{ $t('roles.lead') }}</option>
            <option value="admin">{{ $t('roles.admin') }}</option>
          </select>
        </label>
      </div>

      <p v-if="createError" role="alert" class="mt-4 text-sm">{{ createError }}</p>

      <div class="mt-4 flex gap-2">
        <button
          type="submit"
          :disabled="creating"
          class="btn btn-primary"
        >
          {{ creating ? $t('evaluation.saving') : $t('common.create') }}
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="showCreate = false"
        >
          {{ $t('common.cancel') }}
        </button>
      </div>
    </form>

    <div class="mt-6 flex flex-wrap gap-3">
      <label class="min-w-[200px] flex-1">
        <span class="sr-only">{{ $t('common.search') }}</span>
        <input
          v-model="search"
          type="search"
          :placeholder="$t('users.searchPlaceholder')"
          class="field"
        >
      </label>

      <label class="text-sm">
        <span class="sr-only">{{ $t('users.role') }}</span>
        <select
          v-model="roleFilter"
          class="field w-auto"
          @change="page = 0"
        >
          <option :value="null">{{ $t('users.allRoles') }}</option>
          <option value="developer">{{ $t('roles.developer') }}</option>
          <option value="lead">{{ $t('roles.lead') }}</option>
          <option value="admin">{{ $t('roles.admin') }}</option>
        </select>
      </label>

      <label class="text-sm">
        <span class="sr-only">{{ $t('users.status') }}</span>
        <select
          v-model="statusFilter"
          class="field w-auto"
          @change="page = 0"
        >
          <option :value="null">{{ $t('users.allStatuses') }}</option>
          <option value="true">{{ $t('users.active') }}</option>
          <option value="false">{{ $t('users.inactive') }}</option>
        </select>
      </label>
    </div>

    <p v-if="actionMessage" role="status" class="mt-4 text-sm text-[var(--text-secondary)]">
      {{ actionMessage }}
    </p>
    <p v-if="actionError" role="alert" class="mt-4 text-sm">{{ actionError }}</p>
    <p v-if="error" role="alert" class="mt-4 text-sm">{{ apiErrorMessage(error) }}</p>

    <div class="mt-6" :class="pending ? 'opacity-60 transition-opacity' : ''">
      <p v-if="!items.length && !pending" class="text-sm text-[var(--text-secondary)]">
        {{ $t('common.noResults') }}
      </p>

      <div v-else class="card overflow-x-auto">
        <table class="w-full border-collapse bg-[var(--surface-1)] text-sm">
          <thead>
            <tr class="border-b border-[var(--hairline)] text-left">
              <th scope="col" class="px-4 py-2 font-medium text-[var(--text-secondary)]">
                {{ $t('users.name') }}
              </th>
              <th scope="col" class="px-4 py-2 font-medium text-[var(--text-secondary)]">
                {{ $t('users.email') }}
              </th>
              <th scope="col" class="px-4 py-2 font-medium text-[var(--text-secondary)]">
                {{ $t('users.role') }}
              </th>
              <th scope="col" class="px-4 py-2 font-medium text-[var(--text-secondary)]">
                {{ $t('users.position') }}
              </th>
              <th scope="col" class="px-4 py-2 font-medium text-[var(--text-secondary)]">
                {{ $t('users.status') }}
              </th>
              <th scope="col" class="px-4 py-2 text-right font-medium text-[var(--text-secondary)]">
                {{ $t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.id"
              class="border-b border-[var(--hairline)] last:border-0"
            >
              <td class="px-4 py-2">{{ item.name }}</td>
              <td class="px-4 py-2 text-[var(--text-secondary)]">{{ item.email }}</td>
              <td class="px-4 py-2">
                <select
                  :value="item.role"
                  class="field w-auto py-1"
                  @change="changeRole(item, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="developer">{{ $t('roles.developer') }}</option>
                  <option value="lead">{{ $t('roles.lead') }}</option>
                  <option value="admin">{{ $t('roles.admin') }}</option>
                </select>
              </td>
              <td class="px-4 py-2 text-[var(--text-secondary)]">
                {{ item.position ?? '—' }}
                <span v-if="item.level"> · {{ item.level }}</span>
              </td>
              <td class="px-4 py-2">
                <!-- Texto, no solo color: el estado nunca se codifica solo con color. -->
                {{ item.active ? $t('users.active') : $t('users.inactive') }}
              </td>
              <td class="px-4 py-2 text-right whitespace-nowrap">
                <button
                  type="button"
                  class="text-[var(--text-secondary)] underline underline-offset-2"
                  @click="toggleActive(item)"
                >
                  {{ item.active ? $t('users.deactivate') : $t('users.activate') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="mt-4 flex items-center gap-3 text-sm">
        <button
          type="button"
          :disabled="page === 0"
          class="btn btn-secondary py-1"
          @click="page--"
        >
          {{ $t('common.previous') }}
        </button>
        <span class="text-[var(--text-secondary)]">
          {{ $t('common.pageOf', { page: page + 1, total: totalPages }) }}
        </span>
        <button
          type="button"
          :disabled="page + 1 >= totalPages"
          class="btn btn-secondary py-1"
          @click="page++"
        >
          {{ $t('common.next') }}
        </button>
      </div>
    </div>

    <UiConfirmDialog
      :open="pendingUser !== null"
      :title="$t('users.confirmDeactivateTitle', { name: pendingUser?.name ?? '' })"
      :message="$t('users.confirmDeactivateBody')"
      :confirm-label="$t('users.confirmDeactivateAction')"
      danger
      @confirm="confirmDeactivate"
      @cancel="pendingUser = null"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Administración de usuarios. Solo admin.
 *
 * Desactivar a alguien o cambiarle la contraseña **cierra sus sesiones
 * abiertas** en el mismo momento: el servidor las revoca y la interfaz lo
 * confirma. v1 no podía hacerlo — sus JWT de 365 días seguían siendo válidos
 * aunque la persona ya no trabajara ahí (HIGH-03).
 *
 * La edición vive en una tarjeta propia y no en la fila. Antes lo único que se
 * podía cambiar era el rol, con un `<select>` suelto dentro de la tabla que
 * guardaba al soltarlo: sin confirmación, sin poder deshacer y sin forma de
 * tocar el resto de campos, que solo se podían fijar al crear la cuenta. El
 * formulario cambia todo a la vez y se guarda cuando se pulsa Guardar.
 */
definePageMeta({ middleware: 'admin' })

const { request } = useApi()
const { t } = useI18n()
const { user: currentUser } = useAuth()

type Role = 'developer' | 'lead' | 'admin'

interface UserRow {
  id: number
  name: string
  email: string
  role: Role
  active: number
  position_id: number | null
  level_id: number | null
  lead_id: number | null
  position: string | null
  level: string | null
  lead_name: string | null
}

interface CatalogItem {
  id: number
  name: string
}

const search = ref('')
const roleFilter = ref<string | null>(null)
/**
 * Por defecto solo los activos. Desactivar a alguien es quitarlo de en medio, y
 * si la fila se queda en la lista el listado no refleja lo que se acaba de
 * hacer: la única señal era una palabra en la columna de estado, fácil de pasar
 * por alto en una lista larga.
 *
 * Lo desactivado no se pierde (regla 9): se pide marcando la casilla, y
 * entonces se listan activos e inactivos juntos, cada uno con su estado y con
 * su acción de reactivar. Es el mismo mecanismo que `/admin/catalogs`.
 */
const showInactive = ref(false)
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
        // Con la casilla marcada no se manda `active`: el endpoint devuelve
        // entonces activos e inactivos, que es lo que hay que poder repasar.
        ...(showInactive.value ? {} : { active: 'true' }),
      },
    }),
  { watch: [page, debouncedSearch, roleFilter, showInactive] },
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / LIMIT))

/* ---- catálogos y posibles leads, para los desplegables ---- */

// Solo lo activo: una posición retirada no debe poder asignarse a nadie nuevo.
// Quien ya la tenga la conserva, porque el servidor solo valida lo que llega.
const { data: positionsData } = await useAsyncData('admin:users:positions', () =>
  request<{ items: CatalogItem[] }>('/api/positions'),
)
const { data: levelsData } = await useAsyncData('admin:users:levels', () =>
  request<{ items: CatalogItem[] }>('/api/levels'),
)

/**
 * Candidatos a lead: exactamente los que el servidor acepta como tal, es decir
 * los `lead` y `admin` activos. Se piden en una sola llamada gracias a que
 * `/api/users` admite varios roles separados por comas.
 */
const { data: leadsData, refresh: refreshLeads } = await useAsyncData('admin:users:leads', () =>
  request<{ items: UserRow[] }>('/api/users', {
    query: { role: 'lead,admin', active: 'true', limit: 100, sort: 'name' },
  }),
)

const positions = computed(() => positionsData.value?.items ?? [])
const levels = computed(() => levelsData.value?.items ?? [])
const leads = computed(() => leadsData.value?.items ?? [])

/* ---- alta ---- */
const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')

function emptyForm() {
  return {
    name: '',
    email: '',
    password: '',
    role: 'developer' as Role,
    positionId: null as number | null,
    levelId: null as number | null,
    leadId: null as number | null,
  }
}

const form = ref(emptyForm())

async function createUser() {
  createError.value = ''
  creating.value = true
  try {
    await request('/api/users', {
      method: 'POST',
      body: {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        role: form.value.role,
        // El servidor distingue "no lo mandes" de "ponlo a null": en el alta
        // los opcionales simplemente no se envían.
        ...(form.value.positionId ? { positionId: form.value.positionId } : {}),
        ...(form.value.levelId ? { levelId: form.value.levelId } : {}),
        ...(form.value.leadId ? { leadId: form.value.leadId } : {}),
      },
    })
    showCreate.value = false
    form.value = emptyForm()
    await Promise.all([refresh(), refreshLeads()])
  } catch (err) {
    createError.value = apiErrorMessage(err)
  } finally {
    creating.value = false
  }
}

/* ---- avisos de las acciones ---- */

/**
 * Los mensajes viven fuera de los formularios porque los comparten: guardar,
 * activar y desactivar escriben en el mismo sitio y así nunca hay dos avisos
 * contradictorios en pantalla.
 */
const actionMessage = ref('')
const actionError = ref('')

/* ---- edición ---- */

const editing = ref<UserRow | null>(null)
const saving = ref(false)
const editError = ref('')

/**
 * Los campos se guardan aparte de `editing` y siempre existen. Así la plantilla
 * no tiene que afirmar que hay algo en edición para poder enlazarlos, que es
 * una comprobación que el compilador se cree sin poder verificarla.
 */
const editDraft = reactive({
  name: '',
  email: '',
  role: 'developer' as Role,
  positionId: null as number | null,
  levelId: null as number | null,
  leadId: null as number | null,
  password: '',
})

/** Editarse a uno mismo: el servidor no deja quitarse el rol ni desactivarse. */
const editingSelf = computed(() => editing.value?.id === currentUser.value?.id)

/** Nadie puede ser su propio lead; el servidor también lo rechaza. */
const leadOptions = computed(() => leads.value.filter((lead) => lead.id !== editing.value?.id))

function openEdit(item: UserRow) {
  editError.value = ''
  editing.value = item
  Object.assign(editDraft, {
    name: item.name,
    email: item.email,
    role: item.role,
    positionId: item.position_id,
    levelId: item.level_id,
    leadId: item.lead_id,
    password: '',
  })
}

function cancelEdit() {
  editing.value = null
  editError.value = ''
}

async function saveEdit() {
  const target = editing.value
  if (!target) return

  editError.value = ''
  actionMessage.value = ''
  saving.value = true
  try {
    const result = await request<{ sessionsRevoked: number }>(`/api/users/${target.id}`, {
      method: 'PATCH',
      body: {
        name: editDraft.name,
        email: editDraft.email,
        role: editDraft.role,
        // Aquí sí se manda `null` a propósito: es como se quita una asignación.
        positionId: editDraft.positionId,
        levelId: editDraft.levelId,
        leadId: editDraft.leadId,
        // La contraseña solo viaja si se ha escrito una: en blanco significa
        // "no la toques", no "déjala vacía".
        ...(editDraft.password ? { password: editDraft.password } : {}),
      },
    })

    actionMessage.value = editDraft.password
      ? t('users.savedAndRevoked', { count: result.sessionsRevoked })
      : t('users.saved')
    editing.value = null
    await Promise.all([refresh(), refreshLeads()])
  } catch (err) {
    editError.value = apiErrorMessage(err)
  } finally {
    saving.value = false
  }
}

/* ---- activar / desactivar ---- */

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
    const result = await request<{ sessionsRevoked: number; orphanedReports: number }>(
      `/api/users/${user.id}`,
      { method: 'PATCH', body: { active } },
    )
    if (!active) {
      actionMessage.value = t('users.sessionsRevoked', { count: result.sessionsRevoked })
      // Desactivar a un lead no se bloquea, pero hay que decir que queda gente
      // apuntando a alguien que ya no está.
      if (result.orphanedReports > 0) {
        actionMessage.value += ` ${t('users.orphanedReports', { count: result.orphanedReports })}`
      }
    }
    // Si se estaba editando a esa persona, el formulario ya no refleja la
    // realidad: se cierra en vez de dejar datos viejos en pantalla.
    if (editing.value?.id === user.id) editing.value = null
    await Promise.all([refresh(), refreshLeads()])
  } catch (err) {
    actionError.value = apiErrorMessage(err)
  }
}

const roleLabel = (role: Role) => t(`roles.${role}`)

useHead({ title: () => `${t('users.title')} · Cube` })
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold tracking-tight">{{ $t('users.title') }}</h1>
      <button type="button" class="btn btn-primary" @click="showCreate = !showCreate">
        {{ $t('users.new') }}
      </button>
    </div>

    <!-- ------------------------------------------------------------ alta -- -->
    <form v-if="showCreate" class="card mt-6 p-6" novalidate @submit.prevent="createUser">
      <h2 class="text-lg font-medium">{{ $t('users.new') }}</h2>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.name') }}</span>
          <input v-model="form.name" type="text" required class="field mt-1" />
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.email') }}</span>
          <input v-model="form.email" type="email" required autocomplete="off" class="field mt-1" />
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.initialPassword') }}</span>
          <input
            v-model="form.password"
            type="password"
            required
            minlength="12"
            autocomplete="new-password"
            class="field mt-1"
          />
          <span class="mt-1 block text-xs text-[var(--text-muted)]">
            {{ $t('users.passwordHint') }}
          </span>
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.role') }}</span>
          <select v-model="form.role" class="field mt-1">
            <option value="developer">{{ $t('roles.developer') }}</option>
            <option value="lead">{{ $t('roles.lead') }}</option>
            <option value="admin">{{ $t('roles.admin') }}</option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.position') }}</span>
          <select v-model="form.positionId" class="field mt-1">
            <option :value="null">{{ $t('users.none') }}</option>
            <option v-for="item in positions" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.level') }}</span>
          <select v-model="form.levelId" class="field mt-1">
            <option :value="null">{{ $t('users.none') }}</option>
            <option v-for="item in levels" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.lead') }}</span>
          <select v-model="form.leadId" class="field mt-1">
            <option :value="null">{{ $t('users.none') }}</option>
            <option v-for="item in leads" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
          <span class="mt-1 block text-xs text-[var(--text-muted)]">
            {{ $t('users.leadHint') }}
          </span>
        </label>
      </div>

      <p v-if="createError" role="alert" class="mt-4 text-sm">{{ createError }}</p>

      <div class="mt-4 flex gap-2">
        <button type="submit" :disabled="creating" class="btn btn-primary">
          {{ creating ? $t('evaluation.saving') : $t('common.create') }}
        </button>
        <button type="button" class="btn btn-secondary" @click="showCreate = false">
          {{ $t('common.cancel') }}
        </button>
      </div>
    </form>

    <!-- --------------------------------------------------------- edición -- -->
    <form v-if="editing" class="card mt-6 border-2 p-6" novalidate @submit.prevent="saveEdit">
      <h2 class="text-lg font-medium">{{ $t('users.editing', { name: editing.name }) }}</h2>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.name') }}</span>
          <input v-model="editDraft.name" type="text" required class="field mt-1" />
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.email') }}</span>
          <input v-model="editDraft.email" type="email" required class="field mt-1" />
          <span class="mt-1 block text-xs text-[var(--text-muted)]">
            {{ $t('users.emailHint') }}
          </span>
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.role') }}</span>
          <!-- El servidor rechaza que un admin se quite su propio rol; aquí se
               desactiva el control para que no parezca posible. -->
          <select v-model="editDraft.role" :disabled="editingSelf" class="field mt-1">
            <option value="developer">{{ $t('roles.developer') }}</option>
            <option value="lead">{{ $t('roles.lead') }}</option>
            <option value="admin">{{ $t('roles.admin') }}</option>
          </select>
          <span v-if="editingSelf" class="mt-1 block text-xs text-[var(--text-muted)]">
            {{ $t('users.selfRoleHint') }}
          </span>
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.position') }}</span>
          <select v-model="editDraft.positionId" class="field mt-1">
            <option :value="null">{{ $t('users.none') }}</option>
            <option v-for="item in positions" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.level') }}</span>
          <select v-model="editDraft.levelId" class="field mt-1">
            <option :value="null">{{ $t('users.none') }}</option>
            <option v-for="item in levels" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('users.lead') }}</span>
          <select v-model="editDraft.leadId" class="field mt-1">
            <option :value="null">{{ $t('users.none') }}</option>
            <option v-for="item in leadOptions" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>

        <label class="block sm:col-span-2">
          <span class="text-sm font-medium">{{ $t('users.newPassword') }}</span>
          <input
            v-model="editDraft.password"
            type="password"
            minlength="12"
            autocomplete="new-password"
            :placeholder="$t('users.newPasswordPlaceholder')"
            class="field mt-1"
          />
          <span class="mt-1 block text-xs text-[var(--text-muted)]">
            {{ $t('users.newPasswordHint') }}
          </span>
        </label>
      </div>

      <p v-if="editError" role="alert" class="mt-4 text-sm">{{ editError }}</p>

      <div class="mt-4 flex gap-2">
        <button type="submit" :disabled="saving" class="btn btn-primary">
          {{ saving ? $t('evaluation.saving') : $t('common.save') }}
        </button>
        <button type="button" class="btn btn-secondary" @click="cancelEdit">
          {{ $t('common.cancel') }}
        </button>
      </div>
    </form>

    <!-- --------------------------------------------------------- filtros -- -->
    <div class="mt-6 flex flex-wrap gap-3">
      <label class="min-w-[200px] flex-1">
        <span class="sr-only">{{ $t('common.search') }}</span>
        <input
          v-model="search"
          type="search"
          :placeholder="$t('users.searchPlaceholder')"
          class="field"
        />
      </label>

      <label class="text-sm">
        <span class="sr-only">{{ $t('users.role') }}</span>
        <select v-model="roleFilter" class="field w-auto" @change="page = 0">
          <option :value="null">{{ $t('users.allRoles') }}</option>
          <option value="developer">{{ $t('roles.developer') }}</option>
          <option value="lead">{{ $t('roles.lead') }}</option>
          <option value="admin">{{ $t('roles.admin') }}</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm">
        <input v-model="showInactive" type="checkbox" class="size-4" @change="page = 0" />
        <span>{{ $t('common.showInactive') }}</span>
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
                {{ $t('users.lead') }}
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
              :class="editing?.id === item.id ? 'bg-[var(--surface-2)]' : ''"
            >
              <td class="px-4 py-2">{{ item.name }}</td>
              <td class="px-4 py-2 text-[var(--text-secondary)]">{{ item.email }}</td>
              <td class="px-4 py-2">{{ roleLabel(item.role) }}</td>
              <td class="px-4 py-2 text-[var(--text-secondary)]">
                {{ item.position ?? '—' }}
                <span v-if="item.level"> · {{ item.level }}</span>
              </td>
              <td class="px-4 py-2 text-[var(--text-secondary)]">{{ item.lead_name ?? '—' }}</td>
              <td class="px-4 py-2">
                <!-- Texto, no solo color: el estado nunca se codifica solo con color. -->
                {{ item.active ? $t('users.active') : $t('users.inactive') }}
              </td>
              <td class="px-4 py-2 text-right whitespace-nowrap">
                <button
                  type="button"
                  class="text-[var(--text-secondary)] underline underline-offset-2"
                  @click="openEdit(item)"
                >
                  {{ $t('common.edit') }}
                </button>
                <button
                  type="button"
                  class="ml-3 text-[var(--text-secondary)] underline underline-offset-2"
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
        <button type="button" :disabled="page === 0" class="btn btn-secondary py-1" @click="page--">
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

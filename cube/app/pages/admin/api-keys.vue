<script setup lang="ts">
/**
 * Claves de la API externa. Solo admin.
 *
 * La pantalla existe para que la lista de acceso se vea y se toque desde el
 * mismo sitio donde se crea la clave. Cuando la lista blanca vive en un
 * fichero de configuración, nadie la revisa y acaba en «permitir todo»; aquí
 * una clave sin entradas se muestra como BLOQUEADA en su propia tarjeta.
 *
 * El token solo se puede ver una vez, justo después de crearlo. No es una
 * limitación de la interfaz: el servidor guarda únicamente su hash.
 */
definePageMeta({ middleware: 'admin' })

const { request } = useApi()
const { t } = useI18n()

/** Los permisos que el servidor reconoce (`API_SCOPES`). */
const SCOPES = ['users:create'] as const
type Scope = (typeof SCOPES)[number]

interface AllowlistEntry {
  id?: number
  kind: 'ip' | 'domain'
  pattern: string
  note: string | null
}

interface ApiKey {
  id: number
  name: string
  prefix: string
  scopes: Scope[]
  active: number
  expiresAt: string | null
  lastUsedAt: string | null
  lastUsedIp: string | null
  createdAt: string
  createdBy: string | null
  allowlist: AllowlistEntry[]
}

const statusFilter = ref<'true' | 'false' | null>(null)

const { data, pending, error, refresh } = await useAsyncData(
  'admin:api-keys',
  () =>
    request<{ items: ApiKey[] }>('/api/api-keys', {
      query: statusFilter.value ? { active: statusFilter.value } : {},
    }),
  { watch: [statusFilter] },
)

const items = computed(() => data.value?.items ?? [])

const message = ref('')
const actionError = ref('')

/* ------------------------------------------------------------------ alta -- */

const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')

interface Draft {
  name: string
  scopes: Scope[]
  expiresAt: string
  allowlist: AllowlistEntry[]
}

function emptyDraft(): Draft {
  return { name: '', scopes: ['users:create'], expiresAt: '', allowlist: [] }
}

const form = ref<Draft>(emptyDraft())

/**
 * La clave recién creada. Se guarda en memoria y solo hasta que se cierre el
 * aviso: no se vuelve a pedir al servidor porque el servidor ya no la tiene.
 */
const freshToken = ref<{ token: string; name: string } | null>(null)
const copied = ref(false)

async function createKey() {
  createError.value = ''
  creating.value = true
  try {
    const result = await request<{ id: number; token: string }>('/api/api-keys', {
      method: 'POST',
      body: {
        name: form.value.name,
        scopes: form.value.scopes,
        allowlist: cleanAllowlist(form.value.allowlist),
        ...(form.value.expiresAt ? { expiresAt: form.value.expiresAt } : {}),
      },
    })
    freshToken.value = { token: result.token, name: form.value.name }
    copied.value = false
    showCreate.value = false
    form.value = emptyDraft()
    await refresh()
  } catch (err) {
    createError.value = apiErrorMessage(err)
  } finally {
    creating.value = false
  }
}

async function copyToken() {
  if (!freshToken.value) return
  try {
    await navigator.clipboard.writeText(freshToken.value.token)
    copied.value = true
  } catch {
    // Sin permiso de portapapeles queda el <code>, que se selecciona a mano.
    copied.value = false
  }
}

/* ------------------------------------------------------- edición por clave -- */

/**
 * Borradores por clave. Se reconstruyen con cada carga para que lo que se ve
 * sea siempre lo que hay guardado: tras salvar se recarga, y si algo falló en
 * el servidor los campos vuelven al estado real en vez de quedarse mostrando
 * un cambio que no ocurrió.
 */
const drafts = ref<Record<number, Draft>>({})

watch(
  items,
  (list) => {
    drafts.value = Object.fromEntries(
      list.map((key) => [
        key.id,
        {
          name: key.name,
          scopes: [...key.scopes],
          expiresAt: key.expiresAt ? key.expiresAt.slice(0, 10) : '',
          allowlist: key.allowlist.map((entry) => ({ ...entry })),
        } satisfies Draft,
      ]),
    )
  },
  { immediate: true },
)

/**
 * Cada clave con su borrador ya emparejado.
 *
 * Se resuelve aquí y no en la plantilla para que ahí no haya que afirmar que
 * el borrador existe: un `!` en una plantilla es una comprobación que el
 * compilador se cree sin poder verificarla.
 */
const rows = computed(() =>
  items.value.flatMap((key) => {
    const draft = drafts.value[key.id]
    return draft ? [{ key, draft }] : []
  }),
)

/** Quita las filas que se dejaron a medio rellenar al añadirlas. */
function cleanAllowlist(list: AllowlistEntry[]) {
  return list
    .filter((entry) => entry.pattern.trim().length > 0)
    .map((entry) => ({
      kind: entry.kind,
      pattern: entry.pattern.trim(),
      ...(entry.note && entry.note.trim() ? { note: entry.note.trim() } : {}),
    }))
}

function addEntry(draft: Draft, kind: 'ip' | 'domain') {
  draft.allowlist.push({ kind, pattern: '', note: null })
}

/**
 * Atajo de desarrollo. Las tres entradas van juntas porque las tres hacen
 * falta: Node entrega `::1` tan a menudo como `127.0.0.1`, y el navegador
 * manda además `Origin: http://localhost:<puerto>`.
 */
function addLocalhost(draft: Draft) {
  const note = t('apiKeys.localhostNote')
  for (const entry of [
    { kind: 'ip', pattern: '127.0.0.1', note },
    { kind: 'ip', pattern: '::1', note },
    { kind: 'domain', pattern: 'localhost', note },
  ] as const) {
    const already = draft.allowlist.some(
      (existing) => existing.kind === entry.kind && existing.pattern === entry.pattern,
    )
    if (!already) draft.allowlist.push({ ...entry })
  }
}

const saving = ref<number | null>(null)

async function saveKey(key: ApiKey, draft: Draft) {
  message.value = ''
  actionError.value = ''
  saving.value = key.id
  try {
    await request(`/api/api-keys/${key.id}`, {
      method: 'PATCH',
      body: {
        name: draft.name,
        scopes: draft.scopes,
        expiresAt: draft.expiresAt === '' ? null : draft.expiresAt,
        allowlist: cleanAllowlist(draft.allowlist),
      },
    })
    message.value = t('apiKeys.saved')
    await refresh()
  } catch (err) {
    actionError.value = apiErrorMessage(err)
    await refresh()
  } finally {
    saving.value = null
  }
}

/* --------------------------------------------------- activar / desactivar -- */

/** Desactivar pregunta; activar no. La confirmación es para lo que quita. */
const pendingKey = ref<ApiKey | null>(null)

function toggleActive(key: ApiKey) {
  if (key.active === 1) {
    pendingKey.value = key
    return
  }
  void setActive(key, true)
}

async function confirmDeactivate() {
  const key = pendingKey.value
  pendingKey.value = null
  if (key) await setActive(key, false)
}

async function setActive(key: ApiKey, active: boolean) {
  message.value = ''
  actionError.value = ''
  try {
    await request(`/api/api-keys/${key.id}`, { method: 'PATCH', body: { active } })
    await refresh()
  } catch (err) {
    actionError.value = apiErrorMessage(err)
  }
}

/* ------------------------------------------------------------- presentación */

const origin = useRequestURL().origin

/** Ejemplo copiable. Es código, no texto de interfaz: no se traduce. */
const usageExample = computed(
  () =>
    `curl ${origin}/api/external/v1/whoami \\\n  -H "X-API-Key: cube_…"\n\n` +
    `curl -X POST ${origin}/api/external/v1/users \\\n` +
    `  -H "X-API-Key: cube_…" \\\n` +
    `  -H "Content-Type: application/json" \\\n` +
    `  -d '{"name":"Ada Lovelace","email":"ada@lexart.tech","password":"una-clave-larga-2026"}'`,
)

function shortDate(value: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function isBlocked(key: ApiKey): boolean {
  return key.allowlist.length === 0
}

function isExpired(key: ApiKey): boolean {
  if (!key.expiresAt) return false
  return new Date(key.expiresAt.replace(' ', 'T')).getTime() <= Date.now()
}

useHead({ title: () => `${t('apiKeys.title')} · Cube` })
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold tracking-tight">{{ $t('apiKeys.title') }}</h1>
      <button type="button" class="btn btn-primary" @click="showCreate = !showCreate">
        {{ $t('apiKeys.new') }}
      </button>
    </div>
    <p class="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">{{ $t('apiKeys.intro') }}</p>

    <!--
      El token, una sola vez. Se muestra arriba del todo y con su propio aviso
      porque quien acaba de crear la clave tiene que copiarla ANTES de seguir:
      el servidor solo guarda el hash.
    -->
    <section v-if="freshToken" class="card mt-6 border-2 p-6">
      <h2 class="text-lg font-medium">{{ $t('apiKeys.tokenTitle') }}</h2>
      <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ $t('apiKeys.tokenBody') }}</p>

      <code
        class="mt-4 block overflow-x-auto rounded-md border border-[var(--hairline)] p-3 font-mono text-sm break-all"
        >{{ freshToken.token }}</code
      >

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" class="btn btn-primary" @click="copyToken">
          {{ copied ? $t('apiKeys.tokenCopied') : $t('apiKeys.tokenCopy') }}
        </button>
        <button type="button" class="btn btn-secondary" @click="freshToken = null">
          {{ $t('apiKeys.tokenDone') }}
        </button>
      </div>
    </section>

    <!-- ---------------------------------------------------------- alta --- -->
    <form v-if="showCreate" class="card mt-6 p-6" novalidate @submit.prevent="createKey">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">{{ $t('apiKeys.name') }}</span>
          <span class="mt-1 block text-xs text-[var(--text-muted)]">
            {{ $t('apiKeys.nameHint') }}
          </span>
          <input
            v-model="form.name"
            type="text"
            required
            maxlength="191"
            :placeholder="$t('apiKeys.namePlaceholder')"
            class="field mt-1"
          />
        </label>

        <label class="block">
          <span class="text-sm font-medium">{{ $t('apiKeys.expiresAt') }}</span>
          <span class="mt-1 block text-xs text-[var(--text-muted)]">
            {{ $t('apiKeys.expiresAtHint') }}
          </span>
          <input v-model="form.expiresAt" type="date" class="field mt-1" />
        </label>
      </div>

      <fieldset class="mt-4">
        <legend class="text-sm font-medium">{{ $t('apiKeys.scopes') }}</legend>
        <p class="text-xs text-[var(--text-muted)]">{{ $t('apiKeys.scopesHint') }}</p>
        <label v-for="scope in SCOPES" :key="scope" class="mt-2 flex items-center gap-2 text-sm">
          <input v-model="form.scopes" type="checkbox" :value="scope" class="size-4" />
          <span>{{ $t('apiKeys.scopeUsersCreate') }}</span>
          <code class="text-xs text-[var(--text-muted)]">{{ scope }}</code>
        </label>
      </fieldset>

      <fieldset class="mt-4">
        <legend class="text-sm font-medium">{{ $t('apiKeys.allowlist') }}</legend>
        <p class="text-xs text-[var(--text-muted)]">{{ $t('apiKeys.allowlistHint') }}</p>

        <div
          v-for="(entry, index) in form.allowlist"
          :key="`new-${index}`"
          class="mt-2 flex flex-wrap items-center gap-2"
        >
          <span class="w-20 text-xs text-[var(--text-secondary)]">
            {{ entry.kind === 'ip' ? $t('apiKeys.ip') : $t('apiKeys.domain') }}
          </span>
          <label class="min-w-[180px] flex-1">
            <span class="sr-only">
              {{ entry.kind === 'ip' ? $t('apiKeys.ip') : $t('apiKeys.domain') }}
            </span>
            <input
              v-model="entry.pattern"
              type="text"
              class="field"
              :placeholder="
                entry.kind === 'ip' ? $t('apiKeys.ipPlaceholder') : $t('apiKeys.domainPlaceholder')
              "
            />
          </label>
          <label class="min-w-[140px] flex-1">
            <span class="sr-only">{{ $t('apiKeys.note') }}</span>
            <input
              v-model="entry.note"
              type="text"
              class="field"
              :placeholder="$t('apiKeys.notePlaceholder')"
            />
          </label>
          <button
            type="button"
            class="text-sm text-[var(--text-secondary)] underline underline-offset-2"
            @click="form.allowlist.splice(index, 1)"
          >
            {{ $t('apiKeys.remove') }}
          </button>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <button type="button" class="btn btn-secondary py-1" @click="addEntry(form, 'ip')">
            {{ $t('apiKeys.addIp') }}
          </button>
          <button type="button" class="btn btn-secondary py-1" @click="addEntry(form, 'domain')">
            {{ $t('apiKeys.addDomain') }}
          </button>
          <button type="button" class="btn btn-secondary py-1" @click="addLocalhost(form)">
            {{ $t('apiKeys.addLocalhost') }}
          </button>
        </div>

        <p v-if="form.allowlist.length === 0" class="mt-2 text-sm text-[var(--text-secondary)]">
          {{ $t('apiKeys.blockedHint') }}
        </p>
      </fieldset>

      <p v-if="createError" role="alert" class="mt-4 text-sm">{{ createError }}</p>

      <div class="mt-4 flex gap-2">
        <button type="submit" :disabled="creating" class="btn btn-primary">
          {{ creating ? $t('common.loading') : $t('common.create') }}
        </button>
        <button type="button" class="btn btn-secondary" @click="showCreate = false">
          {{ $t('common.cancel') }}
        </button>
      </div>
    </form>

    <!-- --------------------------------------------------------- listado --- -->
    <div class="mt-6 flex flex-wrap items-center gap-3">
      <label class="text-sm">
        <span class="sr-only">{{ $t('apiKeys.status') }}</span>
        <select v-model="statusFilter" class="field w-auto">
          <option :value="null">{{ $t('common.all') }}</option>
          <option value="true">{{ $t('apiKeys.active') }}</option>
          <option value="false">{{ $t('apiKeys.inactive') }}</option>
        </select>
      </label>
    </div>

    <p v-if="message" role="status" class="mt-4 text-sm text-[var(--text-secondary)]">
      {{ message }}
    </p>
    <p v-if="actionError" role="alert" class="mt-4 text-sm">{{ actionError }}</p>
    <p v-if="error" role="alert" class="mt-4 text-sm">{{ apiErrorMessage(error) }}</p>

    <div class="mt-4" :class="pending ? 'opacity-60 transition-opacity' : ''">
      <p v-if="!items.length && !pending" class="text-sm text-[var(--text-secondary)]">
        {{ $t('apiKeys.noKeys') }}
      </p>

      <ul class="flex list-none flex-col gap-4 p-0">
        <li v-for="{ key, draft } in rows" :key="key.id" class="card p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-medium" :class="key.active ? '' : 'text-[var(--text-muted)]'">
                {{ key.name }}
              </h2>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">
                <code class="font-mono">cube_{{ key.prefix }}_…</code>
                <!-- Texto, no solo color: el estado nunca se codifica solo con color. -->
                <span> · {{ key.active ? $t('apiKeys.active') : $t('apiKeys.inactive') }}</span>
                <span v-if="isExpired(key)"> · {{ $t('apiKeys.expired') }}</span>
                <span v-if="isBlocked(key)"> · {{ $t('apiKeys.blocked') }}</span>
              </p>
            </div>

            <button
              type="button"
              class="text-sm text-[var(--text-secondary)] underline underline-offset-2 whitespace-nowrap"
              @click="toggleActive(key)"
            >
              {{ key.active ? $t('apiKeys.deactivate') : $t('apiKeys.activate') }}
            </button>
          </div>

          <dl class="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            <div>
              <dt class="text-[var(--text-muted)]">{{ $t('apiKeys.lastUsed') }}</dt>
              <dd>
                {{ key.lastUsedAt ? shortDate(key.lastUsedAt) : $t('apiKeys.never') }}
                <span v-if="key.lastUsedIp" class="text-[var(--text-muted)]">
                  · {{ key.lastUsedIp }}
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-[var(--text-muted)]">{{ $t('apiKeys.expiresAt') }}</dt>
              <dd>{{ key.expiresAt ? shortDate(key.expiresAt) : $t('apiKeys.neverExpires') }}</dd>
            </div>
            <div>
              <dt class="text-[var(--text-muted)]">{{ $t('apiKeys.createdBy') }}</dt>
              <dd>{{ key.createdBy ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-[var(--text-muted)]">{{ $t('apiKeys.scopes') }}</dt>
              <!-- Una clave sin permisos entra y no puede nada: tiene que verse
                   aquí y no solo al desplegar las casillas. -->
              <dd>{{ key.scopes.length ? key.scopes.join(', ') : $t('apiKeys.noScopes') }}</dd>
            </div>
          </dl>

          <p v-if="isBlocked(key)" class="mt-3 text-sm">{{ $t('apiKeys.blockedHint') }}</p>

          <fieldset class="mt-4 border-t border-[var(--hairline)] pt-4">
            <legend class="sr-only">{{ $t('apiKeys.scopes') }}</legend>
            <span class="text-sm font-medium">{{ $t('apiKeys.scopes') }}</span>
            <label
              v-for="scope in SCOPES"
              :key="scope"
              class="mt-2 flex items-center gap-2 text-sm"
            >
              <input v-model="draft.scopes" type="checkbox" :value="scope" class="size-4" />
              <span>{{ $t('apiKeys.scopeUsersCreate') }}</span>
              <code class="text-xs text-[var(--text-muted)]">{{ scope }}</code>
            </label>
          </fieldset>

          <fieldset class="mt-4">
            <legend class="text-sm font-medium">{{ $t('apiKeys.allowlist') }}</legend>

            <p
              v-if="draft.allowlist.length === 0"
              class="mt-1 text-sm text-[var(--text-secondary)]"
            >
              {{ $t('apiKeys.allowlistEmpty') }}
            </p>

            <div
              v-for="(entry, index) in draft.allowlist"
              :key="`${key.id}-${index}`"
              class="mt-2 flex flex-wrap items-center gap-2"
            >
              <span class="w-20 text-xs text-[var(--text-secondary)]">
                {{ entry.kind === 'ip' ? $t('apiKeys.ip') : $t('apiKeys.domain') }}
              </span>
              <label class="min-w-[180px] flex-1">
                <span class="sr-only">
                  {{ entry.kind === 'ip' ? $t('apiKeys.ip') : $t('apiKeys.domain') }}
                </span>
                <input
                  v-model="entry.pattern"
                  type="text"
                  class="field"
                  :placeholder="
                    entry.kind === 'ip'
                      ? $t('apiKeys.ipPlaceholder')
                      : $t('apiKeys.domainPlaceholder')
                  "
                />
              </label>
              <label class="min-w-[140px] flex-1">
                <span class="sr-only">{{ $t('apiKeys.note') }}</span>
                <input
                  v-model="entry.note"
                  type="text"
                  class="field"
                  :placeholder="$t('apiKeys.notePlaceholder')"
                />
              </label>
              <button
                type="button"
                class="text-sm text-[var(--text-secondary)] underline underline-offset-2"
                @click="draft.allowlist.splice(index, 1)"
              >
                {{ $t('apiKeys.remove') }}
              </button>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class="btn btn-secondary py-1" @click="addEntry(draft, 'ip')">
                {{ $t('apiKeys.addIp') }}
              </button>
              <button
                type="button"
                class="btn btn-secondary py-1"
                @click="addEntry(draft, 'domain')"
              >
                {{ $t('apiKeys.addDomain') }}
              </button>
              <button type="button" class="btn btn-secondary py-1" @click="addLocalhost(draft)">
                {{ $t('apiKeys.addLocalhost') }}
              </button>
            </div>
          </fieldset>

          <div class="mt-4">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="saving === key.id"
              @click="saveKey(key, draft)"
            >
              {{ saving === key.id ? $t('common.loading') : $t('apiKeys.saveAllowlist') }}
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- ------------------------------------------------------------- uso --- -->
    <section class="card mt-8 p-6">
      <h2 class="text-lg font-medium">{{ $t('apiKeys.usageTitle') }}</h2>
      <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ $t('apiKeys.usageBody') }}</p>
      <pre
        class="mt-4 overflow-x-auto rounded-md border border-[var(--hairline)] p-3 font-mono text-xs"
        >{{ usageExample }}</pre>
    </section>

    <UiConfirmDialog
      :open="pendingKey !== null"
      :title="$t('apiKeys.confirmDeactivateTitle', { name: pendingKey?.name ?? '' })"
      :message="$t('apiKeys.confirmDeactivateBody')"
      :confirm-label="$t('apiKeys.confirmDeactivateAction')"
      danger
      @confirm="confirmDeactivate"
      @cancel="pendingKey = null"
    />
  </div>
</template>

# Cube v2

Aplicación de **evaluaciones de desarrolladores** con el estándar IDEAL LEXART. Sustituye a
`backend/` (Express) y `webapp/` (Vue 2) del sistema v1, retirados del árbol el 2026-09-25 (AD-06).
El onboarding/offboarding pasa a la plataforma de Lexart, y el modelo de evaluación de 27
indicadores se retiró entero: un solo instrumento, una sola escala.

Ver [`../Roadmap.md`](../Roadmap.md) para el plan por fases y [`../Security.md`](../Security.md)
para la especificación de seguridad que este código debe cumplir.

**Estado:** el código está escrito entero. Lo que **no** se ha hecho todavía está en
[Pendientes conocidos](#pendientes-conocidos) — resumido: nada de esto se ha ejecutado nunca contra
la base de producción, y v1 sigue siendo el sistema que funciona en el servidor.

| Fase | Estado |
|---|---|
| 1 · Andamiaje y configuración segura | ✅ |
| 2 · Esquema unificado y migración | 🟡 escrita, sin ejecutar contra una base real |
| 3 · API y núcleo de seguridad | ✅ 19 endpoints |
| 4 · Frontend de evaluaciones | ✅ |
| 5 · Frontend de onboarding | ⬛ retirada (AD-06) |
| 6 · Infraestructura y CI | 🟡 v1 fuera del árbol; el CI nunca ha corrido en GitHub |
| 7 · IDEAL LEXART (AD-05) | ✅ único modelo: bloques con peso + redacción con IA |

## Requisitos

- **Node.js >= 22.11** — la cadena de build lo exige: `postcss-merge-longhand` (vía cssnano,
  que Nuxt usa para minificar CSS) declara `engines: ^22.11.0 || ^24.11.0 || >=26.0` y usa
  `Set.prototype.difference`, que no existe en Node 20. Además Node 20 llegó a EOL en abril de
  2026. Probado sobre **Node 24.20.0 LTS**.
- **npm >= 11** — npm 10.8 falla al resolver el grafo de peers de Nuxt 4 con
  `Cannot read properties of null (reading 'edgesOut')`. Node 24 ya trae npm 11.
- MySQL 8

### Nota sobre `overrides`

`package.json` fija `esbuild: ^0.28.0`. `@nuxtjs/i18n` arrastra `@intlify/bundle-utils`, que pide
`esbuild@^0.25.4`, mientras que Vite 8 (el que usa Nuxt 4.5) exige `^0.27 || ^0.28`. Se unifica en
una sola versión: esbuild es un binario nativo y no conviene tener tres copias en el árbol.
Revisar si se puede quitar cuando `@nuxtjs/i18n` actualice.

## Puesta en marcha

```bash
cp .env.example .env
# Genera cada secreto y pégalo en .env:
openssl rand -hex 32     # NUXT_SESSION_SECRET

npm install
npm run dev              # http://localhost:3000
```

**La aplicación no arranca con la configuración incompleta.** Si falta un secreto, es corto o es
un valor de plantilla conocido, el proceso aborta enumerando todos los problemas. Es deliberado:
en v1 un despliegue con la variable olvidada arrancaba con un secreto publicado en el repositorio
(`Security.md`, HIGH-05).

Para la redacción con IA, opcionalmente: `NUXT_GEMINI_API_KEY` (clave de Google AI Studio) y
`NUXT_GEMINI_MODEL`. **Sin clave, Cube arranca y funciona igual**; solo esa función queda
deshabilitada, con aviso en pantalla.

**El esquema se crea solo.** Al arrancar, la aplicación aplica las tablas que falten
(`CREATE TABLE IF NOT EXISTS`, idempotente). Contra una base vacía no hace falta ningún comando
manual. Si MySQL no responde, el servidor **arranca igual** y `GET /api/health` devuelve 503 hasta
que la base vuelva: un reinicio de MySQL de diez segundos no debe convertirse en un crash-loop.

## Datos de prueba

`npm run db:seed` crea catálogos, cinco usuarios y cuatro evaluaciones IDEAL.

### Cuentas de ejemplo

Todas comparten la misma contraseña: **`cube-demo-2026!`**

| Email | Rol | Para qué sirve |
|---|---|---|
| `admin@cube.test` | admin | Acceso completo: usuarios y catálogos |
| `lead@cube.test` | lead | Crea y edita evaluaciones |
| `dev@cube.test` | developer | Tiene **3 evaluaciones IDEAL** (2025-Q1, 2025-Q3, 2026-Q1): es la cuenta para ver el panel con evolución |
| `dev2@cube.test` | developer | 1 evaluación |
| `legacy@cube.test` | developer | Contraseña guardada en **MD5**, para probar el rehash transparente a bcrypt (`Roadmap.md` §6) |

Todo esto vive en `server/db/bootstrap.ts` (`SEED_PASSWORD`) y lo consumen
los tests E2E desde `tests/e2e/helpers.ts`. Si cambias las credenciales, cambian en los dos sitios.

### Las salvaguardas de la semilla

Son cuentas con contraseña conocida y escrita en el repositorio, así que sembrar es una operación
con consecuencias:

- **Aborta con `NODE_ENV=production`**, salvo `SEED_FORCE=true` explícito.
- **No toca nada si la base ya tiene usuarios**, salvo `SEED_FORCE=true`.
- `NUXT_SEED_ON_STARTUP=true` siembra al arrancar, y **solo** si la base no tiene ni un usuario.
  Por defecto está en `false`. ⚠️ Nunca la actives en un entorno real: es regalar una cuenta de
  administrador.

```bash
npm run db:seed          # siembra
SEED_FORCE=true npm run db:seed    # re-siembra sobre una base con datos
```

## Docker

Todo el stack corre con compose. Es la forma recomendada: no necesitas MySQL ni una versión
concreta de Node en la máquina.

```bash
cp .env.example .env
openssl rand -hex 32     # -> NUXT_SESSION_SECRET
# rellena también NUXT_DB_PASSWORD y MYSQL_ROOT_PASSWORD (distintas entre sí)

npm run docker:up        # producción, en segundo plano -> http://localhost:3000
npm run docker:dev       # desarrollo con recarga en caliente
npm run docker:logs      # sigue los logs de la aplicación
npm run docker:db        # abre un cliente mysql contra la base
npm run docker:sh        # shell dentro del contenedor de la aplicación
npm run docker:down      # para el stack (conserva los datos)
npm run docker:reset     # para el stack y BORRA los volúmenes
```

O directamente:

```bash
docker compose up --build
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build   # desarrollo
```

Para sembrar dentro del stack, una vez levantado:

```bash
docker compose exec app node server/db/seed.ts
```

### Decisiones del stack

- **Compose aborta si falta un secreto.** Las variables usan `${VAR:?mensaje}`, así que un
  `.env` incompleto falla en el arranque en vez de tomar un valor por defecto. El compose de v1
  fijaba `MYSQL_ROOT_PASSWORD: password` en el propio fichero (`Security.md`, HIGH-05).
- **MySQL se publica solo en `127.0.0.1`.** Sin ese prefijo, Docker abre el puerto en todas las
  interfaces y se salta el firewall del host. Comenta la sección `ports` del servicio `db` si no
  necesitas conectarte desde la máquina.
- **No se monta nada en `/docker-entrypoint-initdb.d`**, a propósito: MySQL solo ejecuta esos
  scripts la primera vez que se crea el volumen, así que una migración añadida después no haría
  nada y el fallo sería silencioso. El esquema lo aplica la aplicación al arrancar, que es
  idempotente y se ejecuta siempre.
- **La aplicación no corre como root** (usuario `node`, uid 1000) y la imagen de runtime solo
  contiene `.output`: ni código fuente, ni dependencias de desarrollo, ni cadena de build.
- **La aplicación espera a que MySQL esté sano**, no solo a que el contenedor exista
  (`depends_on: condition: service_healthy`).
- **El build no recibe secretos.** `runtimeConfig` se resuelve al arrancar, así que no hay
  credenciales en ninguna capa de la imagen.

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm run preview      # sirve el build
npm run lint         # eslint
npm run typecheck    # vue-tsc
npm run test         # vitest (unitarios)
npm run test:e2e     # playwright — levanta .output/ él mismo: exige `build` previo y base sembrada
npm run verify:build # comprueba que el build sea autosuficiente (ver abajo)

npm run db:seed      # datos de ejemplo
npm run db:backup    # vuelca las bases de v1 antes de migrar
npm run db:migrate   # migra v1 -> v2 (acepta -- --dry-run)
npm run db:verify    # contrasta origen y destino tras migrar
```

### `verify:build` — por qué existe

`npm run build` puede pasar y el contenedor morir igualmente. Pasó: `bcryptjs` se
importaba sin estar declarado en `package.json`. En desarrollo funcionaba porque Node lo
resolvía subiendo hasta el `node_modules` del proyecto; en Docker, la etapa de runtime solo
contiene `.output` y el arranque fallaba con `ERR_MODULE_NOT_FOUND`.

`verify:build` comprueba lo que `build` no comprueba: que todo lo que `.output/server/package.json`
declara esté realmente vendorizado, y que el servidor arranque desde un directorio sin ningún
`node_modules` alcanzable hacia arriba. **Ejecútalo antes de construir la imagen.**

## Migración desde v1

La migración **no transforma v1 en el sitio**: lee de `lexart_cube` y escribe en la base nueva con
el esquema de v2. v1 sigue intacta y en marcha, la verificación compara ambas en vivo, y revertir es
descartar la base nueva.

Migra lo que v2 conserva: **catálogos y usuarios**. No migra el onboarding (AD-06) ni las
evaluaciones de los 27 indicadores, cuyo modelo se retiró: una suma sobre 135 no se convierte en un
promedio ponderado 1-5. Ambos conjuntos se quedan en las bases de v1, y por eso `db:backup` sigue
volcando las dos.

Además de la configuración normal, necesita las credenciales de **origen**:

```bash
MIGRATE_SOURCE_HOST=127.0.0.1     # por defecto 127.0.0.1
MIGRATE_SOURCE_USER=...
MIGRATE_SOURCE_PASSWORD=...
MIGRATE_SOURCE_DB=lexart_cube     # por defecto
MIGRATE_ONBOARDING_DB=onboarding_db   # solo para el backup; no se migra
```

```bash
npm run db:backup                   # mysqldump de ambas bases -> ./backups/<fecha>/
npm run db:migrate -- --dry-run     # informa qué haría, sin escribir una fila
npm run db:migrate
npm run db:verify                   # conteos origen vs destino e integridad
```

Qué hace: elimina `idCompany` / `company_slug` (AD-02), descarta las tablas de los módulos
retirados y añade `password_hash` + `password_algo` para el rehash.

**Hallazgo que condiciona la migración.** `evaluations.idLextracking` de v1 no apunta a `users.id`
ni a `users.idLextracking`, sino al identificador canónico `COALESCE(idLextracking, id)` — v1 hace
ese fallback en `users.service.js:288`. Si dos usuarios colisionan en esa clave, las evaluaciones
quedarían mal asignadas **sin error alguno**; `buildCanonicalIndex` detecta y reporta esos casos.

## Qué está implementado

### Pantallas

| Ruta | Acceso | Contenido |
|---|---|---|
| `/login` | público | Entrada a Cube |
| `/dashboard` | sesión | Vista del desarrollador: su puntaje más reciente, evolución y historial |
| `/evaluations` | sesión | Listado. Un developer ve solo las suyas |
| `/evaluations/new` | lead/admin | Alta IDEAL: bloques con peso por rol, promedio ponderado y redacción con IA |
| `/evaluations/:id` | sesión | Detalle, con el cuestionario del rol con el que se evaluó |
| `/admin/users` | admin | Alta, cambio de rol, filtro por estado, activar/desactivar (**revoca las sesiones abiertas**) |
| `/admin/catalogs` | admin | Posiciones y niveles. Se desactivan, nunca se borran, y los desactivados se siguen viendo |

Las guardas de cliente (`middleware/auth.ts`, `middleware/admin.ts`) solo evitan pantallas vacías;
la autorización real la aplica `requireRole()` en cada endpoint.

### API — 19 endpoints

Sesión en cookie `httpOnly` `cube_session`, y **un solo dominio de identidad**: el actor sale
siempre de `event.context.user`, que solo puebla `server/middleware/01.auth.ts`. Un invariante
comprueba que no reaparezca un contexto paralelo.

| Método y ruta | Requiere |
|---|---|
| `POST /api/auth/login` | público · 10 intentos / 15 min por IP y por cuenta, con retroceso |
| `POST /api/auth/logout` · `GET /api/auth/me` | sesión |
| `GET`/`DELETE /api/auth/sessions` | sesión · listar y cerrar todas |
| `POST /api/ideal` | lead · crea la evaluación, calcula el promedio y pide la redacción |
| `POST /api/ideal/:id/narrative` | lead · reintenta solo la redacción |
| `GET /api/ideal` · `GET /api/ideal/:id` | sesión · un developer solo ve las suyas |
| `GET /api/positions` · `GET /api/levels` | sesión · solo lo activo salvo `?includeInactive=true` |
| `POST`/`PATCH` de posiciones y niveles | admin |
| `GET /api/users` | lead · `?active=true\|false` filtra por estado; sin el parámetro salen todos |
| `POST /api/users` · `PATCH /api/users/:id` | admin |
| `GET /api/health` | público · 503 mientras la base no responda |

### IDEAL LEXART — el modelo de evaluación vigente

Bloques con peso según el rol (Arquitecto L1/L2/L3, Desarrollador L3), notas de 1 a 5, promedio
ponderado y una redacción en español e inglés generada con Gemini. Decisión registrada como **AD-05**
en `../Roadmap.md`.

- **Catálogo y fórmula en un solo sitio**: `shared/ideal.ts`, importado por el formulario (alias
  `#shared/`) y por el servidor. El promedio que se ve mientras se rellena y el que se guarda
  salen de la misma función, no de dos copias.
- **Las preguntas son un borrador** derivado de las responsabilidades por rol de v1
  (`webapp/src/data/jobAssignments.js`). Están en una lista plana y comentada para que corregirlas
  sea editar ese fichero; cambiarlas no afecta a las evaluaciones ya guardadas, que almacenan las
  notas junto al rol con el que se hicieron.
- **El bloque de idiomas tiene escala cerrada** (1 solo español · 3 dos idiomas · 5 tres idiomas).
  Un 2 o un 4 no significan nada ahí, y la validación los rechaza.
- **Se guarda primero y se redacta después.** Si la IA falla o no está configurada, la evaluación
  queda registrada sin narrativa, la pantalla lo explica y hay un botón para reintentar. Veinte
  notas rellenadas a mano no se pierden por un timeout de red.
- **El nombre de la persona no se envía a Google.** El prompt lleva rol, notas y observaciones; donde
  iría el nombre, el modelo escribe un testigo que el servidor sustituye al recibir la respuesta.
  Además, el nombre se depura de las observaciones antes de enviarlas. Lo que sí viaja es el texto
  libre del lead: ahí puede colarse cualquier cosa, y conviene saberlo.
- **Modelo configurable** (`NUXT_GEMINI_MODEL`, por defecto `gemini-3.8-flash`). Google retira
  modelos cada pocos meses; `gemini-1.5-flash`, por ejemplo, ya devuelve 404.
- Límite de 30 generaciones por hora y usuario: cada llamada cuesta dinero.

El modelo anterior —27 indicadores sobre 135— **se retiró entero el 2026-09-25**. No quedó como
archivo de solo lectura: las dos escalas no son comparables, y mantener las dos obligaba a
desambiguar en cada consulta, cada gráfico y cada test para poder leer un histórico que sigue
estando en la base de v1 y en su backup.

### Desactivar, no borrar

Nada se borra de verdad: las posiciones, los niveles y los usuarios se desactivan (`active = 0`)
porque hay evaluaciones que los referencian y borrarlos dejaría ese historial sin contexto. Dos
consecuencias que el código tiene que sostener:

- **Lo desactivado se sigue viendo y se puede reactivar.** `/admin/catalogs` tiene "mostrar
  desactivados" (`?includeInactive=true`) y `/admin/users` un filtro de estado. Una lista que solo
  devuelve lo activo convierte "desactivar" en "perder".
- **Desactivar siempre pregunta**, con `<UiConfirmDialog>` —un `<dialog>` nativo, traducible y con
  el foco gestionado por el navegador—, nunca con `confirm()`. Reactivar no pregunta: la
  confirmación es para lo que quita algo de en medio.

### Seguridad, en corto

- Identidad **solo** desde `event.context.user`. Ningún handler lee `user-id` ni `company_slug`
  (era el IDOR CRIT-07).
- Sesión **opaca en base de datos**, no JWT: el logout revoca al instante y cambiar la contraseña
  cierra las sesiones abiertas (HIGH-03).
- bcrypt coste 12, con rehash transparente desde MD5 en el primer login correcto.
- Sin registro abierto: las cuentas las crea un administrador.
- **No queda un solo `v-html` en la aplicación**: el texto libre se guarda saneado y se pinta con
  `white-space: pre-wrap`. La clase de XSS desaparece en vez de mitigarse.
- Contrato de error único `{ statusCode, message }` con `requestId`. Nunca `sqlMessage`, nunca
  trazas.

## Estructura

```
shared/ideal.ts   Catálogo, pesos y fórmula de IDEAL. Una sola fuente para cliente
                  y servidor (alias `#shared/`); el cálculo no se duplica.
app/              Vue 3 + Tailwind — pages, components (ideal/, viz/, ui/),
                  composables, middleware, layouts
server/           Nitro — api/{auth,ideal,users,positions,levels}, db/, middleware/,
                  plugins/, utils/
tests/            unit/ (vitest) y e2e/ (playwright)
```

**No hay `storage/`.** La aplicación no sube ni sirve ficheros desde que se retiró el onboarding
(AD-06): no queda un `multipart/form-data` en todo el código.

## Tests y CI

```
tests/unit/    13 ficheros, 152 tests — vitest, sin base de datos
tests/e2e/     37 tests — playwright: panel, IDEAL, administración, navegación y Security.md §9
```

`tests/unit/invariants.test.ts` comprueba **el código, no el comportamiento**, porque las
vulnerabilidades de v1 fueron fallos de disciplina y no de lógica: que ningún fichero del servidor
lea `user-id`, que todo handler llame a `requireUser`/`requireRole` salvo los públicos por diseño,
que ninguna consulta interpole `body`/`query`/`params` en el SQL, y que no haya `console.*` en
`server/`. El detector de interpolación tiene su propio test, para no dar falsa tranquilidad. El
quinto invariante cubre el cliente: que `app.vue` envuelva la página en `<NuxtLayout>` —sin eso
Nuxt no aplica ningún layout y la aplicación se queda sin barra ni márgenes— y que ninguna llamada
a la API use `$fetch` directamente, porque en SSR no reenvía la cookie de sesión.

> `vitest.config.ts` limita los workers a las CPUs que el cgroup permite de verdad, no a las que
> anuncia la máquina. Sin eso, en un contenedor con cuota de 1 CPU se lanzaban ocho procesos a
> repartirse un core y los tests de bcrypt —coste 12 a propósito— fallaban por contención, no por
> lógica. El timeout por test es de 20 s por la misma razón.

`.github/workflows/ci.yml` — cinco trabajos: `static` (lint, tipos, unitarios), `security`
(`npm audit --audit-level=high` + gitleaks sobre el historial completo), `build` (+ `verify:build`),
`e2e` y `docker`. **El CI levanta MySQL 8.4 como servicio**, aplica el esquema, siembra y corre los
E2E contra una base real: es el único sitio donde el esquema y los endpoints se ejecutan de verdad.
El trabajo `docker` comprueba además que el contenedor arranca, sirve `/login` y **no corre como
root**. Los secretos del CI se generan por ejecución con `openssl rand`.

## Diseño

La paleta viene de CUBE v1 (`webapp/src/styles.css`), pero **revalidada**, no dada por buena por
ser la de la marca. Se ejecutó el validador de la skill `dataviz` sobre cada color:

| Color | Origen v1 | Veredicto |
|---|---|---|
| `#0676ff` | `--blue-4` | ✅ Pasa todos los umbrales en claro **y** en oscuro. Es el color de los datos. |
| `#ffb900` | `--brand-color` | ❌ Falla como color de datos: luminosidad 0.829 fuera de banda y 1.72:1 sobre blanco. Sobre el header oscuro da 7.99:1 — **ahí y solo ahí** vive el acento de marca. |
| `#2c2d31` | `--color-header` | Barra superior. Es lo que hace reconocible a Cube. |
| `#888787` | `--text-color-mid` | 3.58:1 sobre blanco, insuficiente para texto corrido. Sustituido por `#55565a` (7.33:1) y `#75767a` (4.54:1). |

**Montserrat va autoalojada** (`@fontsource-variable/montserrat`). Cargarla desde Google Fonts
obligaría a abrir `font-src` en la CSP y filtraría la IP de cada visitante a un tercero.

Las primitivas (`.card`, `.field`, `.btn`, `.link`) están en `app/assets/css/main.css`: un cambio
de radio o de sombra ocurre en un sitio, no en veinte plantillas.

**El rombo/radar de v1 se elimina** y amCharts 4 con él (sin mantenimiento desde amCharts 5,
licencia comercial). En su lugar, SVG propio en `app/components/viz/`: `ScoreHero` (la cifra
grande y su variación) y `TrendLine` (la evolución). Las barras horizontales por indicador se
fueron con el modelo de 27 indicadores; el criterio que las eligió sigue valiendo para lo que venga:
barras cuando el trabajo del lector es comparar magnitudes, nunca un radar. Cada gráfico tiene su
vista de tabla; ningún valor es accesible solo por el gráfico ni solo por el color. **El puntaje no
se colorea por bandas de severidad**: pintar de rojo el desempeño de una persona convierte un dato
en un juicio. El único color de estado de la interfaz es `--danger`, y solo para el botón que
confirma una acción destructiva.

**i18n en es/en/pt.** Ninguna cadena queda incrustada en los componentes, y un test comprueba que
los tres ficheros tienen exactamente las mismas claves, sin valores vacíos y con interpolaciones
coincidentes: una traducción que falta no lanza error, vue-i18n cae al idioma por defecto y el
fallo solo lo ve quien use ese idioma.

## Reglas que no se negocian caso por caso

Son propiedades verificadas, no convenciones de estilo. Ver `Roadmap.md` §4.

1. **Identidad.** El actor sale siempre de `event.context.user`. Ningún handler lee `user-id`,
   `token` ni `company_slug` de las cabeceras — ese patrón de v1 es el IDOR CRIT-07.
2. **Autorización explícita.** Autenticación como middleware global con allow-list de rutas
   públicas; cada handler de administración declara `requireRole()`. Olvidarlo deniega, no expone.
3. **Validación en la frontera.** Todo `body`, `query` y `params` pasa por Zod. Las consultas usan
   solo parámetros vinculados; lo que SQL no permite parametrizar (`ORDER BY`, columnas) va contra
   allow-list.
4. **Nada de `console.*` en `server/`.** Usa `server/utils/logger.ts`, que redacta secretos y PII
   automáticamente. ESLint lo impide.
5. **Un solo dominio de identidad.** Nada puebla un `event.context` paralelo. El onboarding tenía
   el suyo y se fue con el módulo; un invariante impide que vuelva sin que se vea.
6. **Nada de `v-html`, nada de `$fetch` directo en `app/`.** El texto libre se guarda saneado y se
   pinta con `.plain-text`; las llamadas van por `useApi().request` o `useRequestFetch()`, porque
   en SSR `$fetch` no reenvía la cookie de sesión.
7. **Nada se borra: se desactiva**, y lo desactivado se sigue viendo y se puede reactivar.
8. **Toda acción destructiva confirma con `<UiConfirmDialog>`**, nunca con `confirm()` del
   navegador. Reactivar no pregunta.
9. **Toda cadena visible va a `i18n/locales/{es,en,pt}.json`**, con las mismas claves y las mismas
   interpolaciones en los tres idiomas. Hay test.

De la 1 a la 6, y la 8, las comprueba `tests/unit/invariants.test.ts` leyendo el código fuente en
vez de ejecutarlo; la 9, `tests/unit/i18n.test.ts`. La 7 no se puede comprobar por grep —que una
lista devuelva lo desactivado es comportamiento, no texto— y la cubre `tests/e2e/admin.spec.ts`
contra una base real. Las vulnerabilidades de v1 no fueron fallos de lógica sino de disciplina, y la
disciplina se verifica o no existe.

## Pendientes conocidos

Están aquí porque el riesgo real de v2 no es el código escrito, sino lo que todavía no se ha
ejecutado. Detalle en `Roadmap.md` §5 y §9.

- ⛔ **Nada está commiteado.** `cube/` y `.github/` siguen sin trackear. Hasta que se commiteen y
  se suban, el CI no puede ejecutarse, y el CI es el único sitio donde esto corre contra MySQL.
- ⛔ **La migración nunca se ha ejecutado**, ni siquiera en `--dry-run`: el entorno de desarrollo no
  tiene MySQL ni Docker. Un error de nombre de columna no lo detecta nada de lo escrito.
- ⛔ **Los gráficos no se han visto renderizados en un navegador.** La geometría se verificó
  numéricamente sobre el SVG generado —así aparecieron dos recortes de etiqueta—, pero a Chromium
  le faltan bibliotecas de sistema que requieren root. En un entorno completo, `npm run test:e2e`
  ya tiene el binario.
- ⛔ **El CI no ha corrido nunca en GitHub.** Todo lo verde se verificó localmente.
- ⛔ **Los secretos del inventario de `Security.md` §8 siguen sin rotar.** Borrar v1 del árbol no
  invalida ninguno: siguen en el historial de git.
- 🟡 **v1 sigue en producción.** Se retiró del árbol el 2026-09-25 (AD-06), pero el servicio se
  despliega desde `origin/main` / `origin/develop` y sigue funcionando. Apagarlo de verdad —parar
  pm2, retirar los virtual hosts, archivar las bases— está pendiente.
- ⛔ **La mitigación P0 de v1 (CRIT-01, CRIT-02, CRIT-03) se perdió del árbol sin commitear** y
  sigue explotable en producción. `Security.md` §10.1 describe qué hacía.
- ⬜ **Plan de carrera: no existe.** AD-03 lo dejó fuera del alcance de v2. Si vuelve, es diseño
  nuevo: hoy solo están `positions` y `levels` como contexto de la evaluación.

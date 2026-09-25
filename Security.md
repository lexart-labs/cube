# Security.md — Auditoría de seguridad y plan de endurecimiento

**Proyecto:** Cube (Lexart Labs)
**Fecha de auditoría:** 2026-09-08
**Rama:** `v2`
**Alcance:** `backend/` (Express 4), `webapp/` (Vue 2.6), `ext/onboarding/` (Nuxt 3), infraestructura (`docker-compose.yml`, `.env.sample`)
**Método:** revisión manual del código fuente completo. Cada hallazgo referencia `archivo:línea` verificado en el commit `70e8c98`.

> Este documento cumple dos funciones: (1) inventario de deuda de seguridad del sistema actual,
> y (2) **especificación normativa** de cómo debe construirse Cube v2. Ningún hallazgo se cierra
> hasta que exista una prueba automatizada o un comando de verificación que lo demuestre
> (ver [§9 Verificación](#9-verificación)).

> ### Actualización 2026-09-25 — AD-06
>
> El árbol de v1 (`backend/`, `webapp/`, `ext/onboarding/`, `db/`) **se borró de la rama `v2`**, y
> el módulo de onboarding **se retiró también de v2**. Qué significa eso para este documento:
>
> - **Los `archivo:línea` de v1 ya no se resuelven en el árbol de trabajo.** Están en el historial
>   de git y en `origin/main` / `origin/develop`. Siguen siendo la evidencia de cada hallazgo.
> - **v1 sigue en producción y sigue vulnerable.** Borrar el código de esta rama no despliega nada
>   ni cierra nada. CRIT-01, CRIT-02 y CRIT-03 continúan explotables hoy.
> - **La mitigación P0 (§10.1) nunca se commiteó** y desapareció con el árbol. Lo que describe §10.1
>   es trabajo que existió en el directorio de trabajo el 2026-09-21 y ya no está.
> - **Los hallazgos del onboarding no tienen equivalente en v2**, porque el módulo ya no existe:
>   CRIT-01, CRIT-02, CRIT-03, CRIT-06 y HIGH-08 quedan como deuda **de v1 únicamente**.
> - **HIGH-10** (cifrado de columnas KYC) queda **fuera de alcance** en v2: ya no hay columnas
>   sensibles. No está cerrado; dejó de aplicar.
> - **§8 sigue vigente en su totalidad.** Borrar el código **no invalida ningún secreto**: el pepper
>   `y0ur.k3y`, las API keys y los JWT siguen en el historial y siguen sin rotar.

---

## 1. Resumen ejecutivo

| Severidad | Cantidad | Estado |
|---|---|---|
| 🔴 Crítica | 7 | Abiertas |
| 🟠 Alta | 10 | Abiertas |
| 🟡 Media | 9 | Abiertas |
| 🔵 Baja / Higiene | 6 | Abiertas |
| **Total** | **32** | |

**Riesgo agregado: CRÍTICO.**

Tres hallazgos permiten compromiso total sin ninguna credencial válida:

1. El panel de administración de onboarding **no valida la firma del token** — solo comprueba que
   los headers existan. Un atacante puede aprobar, crear o borrar usuarios enviando `token: x`.
2. Los contratos firmados y los documentos de identidad de los candidatos (NDA, cédula, IBAN,
   dirección) se guardan **dentro de un directorio servido estáticamente**, accesibles sin sesión.
3. Existe un endpoint de subida de archivos **sin autenticación alguna** que escribe en el
   webroot sin validar tipo ni extensión.

A esto se suma inyección SQL en ocho servicios, contraseñas con MD5 sin salt, y envío de
contraseñas en texto plano por correo. La combinación expone datos personales y financieros de
los desarrolladores, lo que además implica exposición regulatoria (GDPR art. 32 / Ley 18.331 UY
de Protección de Datos Personales, por el tratamiento de documentos de identidad y datos bancarios).

---

## 2. Hallazgos críticos

### CRIT-01 · Autenticación simulada en el módulo de onboarding
**Archivo:** `backend/routes/onboarding.js:8-17`
**CWE:** CWE-287 (Improper Authentication) · **CVSS 3.1: 9.8 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)**

```js
const validateAuth = (req, res, next) => {
  const { token, 'user-id': userId } = req.headers;
  if (!token || !userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // Add additional token validation logic here if needed   <-- nunca se añadió
  next();
};
```

El middleware comprueba la **presencia** de dos headers. No verifica firma, expiración,
pertenencia ni rol. Todos los endpoints de onboarding lo usan: listar candidatos con su PII,
aprobar, cambiar estado, crear usuarios y **borrar** (`DELETE /onboarding/users/:id`).

**Explotación:**
```bash
curl -H 'token: cualquier-cosa' -H 'user-id: 1' https://cube.lexart.tech/onboarding/users
curl -X DELETE -H 'token: x' -H 'user-id: 1' https://cube.lexart.tech/onboarding/users/42
```

**Corrección:** eliminar `validateAuth`. Todo endpoint pasa por el middleware de sesión
verificada, y los de administración además por `requireRole('admin')`.

---

### CRIT-02 · PII y contratos firmados expuestos públicamente
**Archivos:** `backend/server.js:147`, `backend/server.js:171`, `backend/routes/onboarding.js:161`
**CWE:** CWE-552 (Files Accessible to External Parties) · **CVSS 3.1: 9.1**

```js
app.use(express.static(__dirname + '/public'));   // server.js:147
app.use('/public', express.static('public'));     // server.js:171
```
```js
cb(null, './public/uploads/signed-documents')     // routes/onboarding.js:161
```

Los NDAs y acuerdos de servicio firmados —que contienen nombre completo, documento de identidad,
dirección y datos bancarios— se escriben en un directorio servido estáticamente. Cualquiera con
la URL los descarga sin sesión. El nombre se genera con `Date.now()` + `Math.random()`
(`routes/onboarding.js:172`), ambos predecibles: `Math.random()` no es criptográficamente seguro
y el timestamp reduce el espacio de búsqueda a un rango acotado por la fecha de alta del candidato.

**Corrección:**
1. Mover el almacenamiento a `storage/uploads/`, **fuera del webroot**.
2. Servir mediante `GET /api/onboarding/documents/[id]` con verificación de sesión y de que el
   solicitante sea el propio candidato o un administrador.
3. Nombres con `crypto.randomUUID()`.
4. Cabecera `Content-Disposition: attachment` y `X-Content-Type-Options: nosniff`.
5. **Acción inmediata en producción:** rotar los ficheros existentes y auditar los logs de acceso
   de NGINX en busca de descargas no autenticadas previas.

---

### CRIT-03 · Subida de archivos sin autenticación
**Archivo:** `ext/onboarding/server/api/upload.post.js` (fichero completo)
**CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type) · **CVSS 3.1: 8.6**

El handler no invoca `validateApiKey` ni verifica JWT — es el único endpoint de `server/api/`
sin ningún control (ver tabla de cobertura en §6). Además:

- no valida extensión ni MIME;
- escribe en `path.join(process.cwd(), 'public', 'uploads')`, servido estáticamente por Nuxt;
- devuelve la URL pública del archivo.

Permite a un anónimo alojar contenido arbitrario bajo el dominio corporativo (phishing, abuso de
reputación, distribución de malware) y consumir disco sin límite.

**Corrección:** exigir sesión, límite de tamaño, allow-list de extensiones, validación por
**magic bytes** (no por el `Content-Type` que envía el cliente), almacenamiento fuera del webroot
y rate limiting por IP y por usuario.

---

### CRIT-04 · Inyección SQL en ocho servicios
**CWE:** CWE-89 · **CVSS 3.1: 9.8**

Interpolación directa de entrada del usuario en la sentencia SQL:

| Archivo | Líneas | Patrón |
|---|---|---|
| `backend/services/courses.service.js` | 10, 51 | `` `AND name LIKE '%${query}%'` `` |
| `backend/services/users.service.js` | 19, 508 | `` `AND u.name LIKE '%${query}%'` `` |
| `backend/services/users.service.js` | 674, 682 | `` `IN (${techsFilter})`, `idCompany = ${idCompany}` `` |
| `backend/services/candidates.service.js` | 12, 38 | `fullName/email/position LIKE '%${search}%'` |
| `backend/services/partners.service.js` | 13, 69 | `p.name/p.email LIKE '%${search}%'` |
| `backend/services/collaborators.service.js` | 64, 177 | `u.name LIKE '%${name_to_filter}%'` |
| `backend/services/levels.service.js` | 22, 62 | `WHERE u.idCompany=${id_company}`, `WHERE id = ${id}` |
| `backend/services/careers.service.js` | 78 | `WHERE id=${id}` |

Adicionalmente `courses.service.js:16` interpola la paginación sin validar
(`LIMIT ${PAGE_SIZE} OFFSET ${PAGE_SIZE * page}`): si `page` no es numérico el resultado es
`NaN`, y sin saneamiento previo es un vector de inyección en el `OFFSET`.

**Explotación:** `GET /courses/all?query=' UNION SELECT ... -- ` — el parámetro llega sin filtro
desde `routes/courses.js:6`.

**Corrección:**
- Parámetros vinculados **siempre**, incluido el patrón `LIKE` (`WHERE name LIKE ?` con el valor
  `%texto%` como parámetro).
- Para fragmentos que no admiten parámetros (nombres de columna, `ORDER BY`, dirección de orden):
  **allow-list** contra un mapa estático de valores permitidos.
- `LIMIT`/`OFFSET`: validar como entero con Zod (`z.coerce.number().int().min(0).max(1000)`) antes de interpolar.
- Regla de lint en CI que prohíbe template literals dentro de llamadas a la capa de datos.

---

### CRIT-05 · Contraseñas con MD5 sin salt
**Archivos:** `backend/services/users.service.js:403`, `:237`, `:207`
**CWE:** CWE-916 (Use of Password Hash With Insufficient Computational Effort) · **CVSS 3.1: 8.1**

```sql
WHERE u.email = ? AND u.password = MD5(?) AND u.active = 1   -- users.service.js:403
```

MD5 sin salt es reversible en la práctica: una GPU moderna calcula del orden de 10^10 hashes por
segundo, y las tablas rainbow públicas cubren la mayoría de contraseñas humanas. El hash se
calcula además **dentro del motor MySQL**, lo que deja la contraseña en claro en los logs de
consultas lentas y en el `general_log` si están habilitados.

**Corrección:** `bcrypt` con coste 12 (o `argon2id`, preferido), hash en la aplicación —nunca en
SQL—, y comparación en tiempo constante. Ver [§7 Migración de contraseñas](#7-migración-de-contraseñas)
para el procedimiento de transición.

---

### CRIT-06 · Contraseñas en texto plano por correo electrónico
**Archivo:** `ext/onboarding/server/api/users/create.post.js:62`, `:125`
**CWE:** CWE-319 (Cleartext Transmission of Sensitive Information) · **CVSS 3.1: 7.5**

```js
password, // Send plain password in email          <-- línea 62
...
<p><strong>Password:</strong> ${password}</p>      <-- línea 125
```

La contraseña queda en tránsito SMTP, en el buzón del destinatario indefinidamente, en los logs
del proveedor de correo (Mailgun) y en cualquier copia de seguridad de esos buzones.

**Corrección:** enviar un **enlace de activación de un solo uso** (token aleatorio de 32 bytes,
válido 24 h, invalidado al usarse) para que la persona establezca su propia contraseña. La
contraseña nunca se genera ni se transmite en el servidor.

---

### CRIT-07 · IDOR: la identidad del actor se toma de un header manipulable
**Archivos:** `backend/routes/courses.js:7,15,29,37`, `backend/routes/users.js:41,69,83`
**CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key) · **CVSS 3.1: 8.1**

El middleware JWT ya resuelve el usuario y lo deja en `req.user` (`middleware.service.js:28`),
pero los handlers lo ignoran y usan el header `user-id` que envía el cliente:

```js
let response = await Course.all(req.headers['user-id'], page || 0, query);   // courses.js:7
let response = await User.upsert(post, req.headers['user-id'], ...);         // users.js:83
```

Con un token válido cualquiera —el de un desarrollador junior, por ejemplo— se leen y modifican
las evaluaciones de cualquier otro usuario cambiando un número en un header.

**Corrección (regla arquitectónica de v2):** la identidad del actor sale **exclusivamente** de
`event.context.user`, derivado de la cookie de sesión firmada. Ningún handler vuelve a leer
`user-id`, `token` ni `company_slug` de los headers. Los headers `user-id`/`user_id` se retiran
de la allow-list de CORS para que ni siquiera puedan enviarse.

---

## 3. Hallazgos de severidad alta

### HIGH-01 · Ausencia total de control de roles
**Archivos:** todos los routers de `backend/routes/`
**CWE:** CWE-862 (Missing Authorization)

Ningún endpoint comprueba `req.user.type`. El middleware distingue "autenticado" de "anónimo",
pero no "desarrollador" de "administrador". Cualquier usuario con sesión válida accede a la
administración de usuarios, niveles, posiciones y onboarding.

**Corrección:** helper `requireRole('admin' | 'lead')` aplicado explícitamente en cada handler de
administración. Denegación por defecto: un endpoint sin declaración de rol se rechaza en tiempo
de arranque mediante un test que enumera las rutas y verifica que todas declaran su política.

---

### HIGH-02 · Endpoints sin ningún middleware de autenticación
**Archivo:** `backend/routes/users.js:152, 167, 176, 185`

```js
router.get('/skills/:id', async function (req, res) { ... });              // :152
router.post('/skills/:id/:idTech', async function (req, res) { ... });     // :167
router.delete('/skills/:id/:idTech', async function (req, res) { ... });   // :176
router.get('/companies/participate', async function (req, res) { ... });   // :185
```

Cuatro rutas públicas por omisión: permiten enumerar y **modificar** las habilidades de cualquier
usuario sin sesión. (El módulo de skills se elimina en v2, pero el patrón —olvidar el middleware—
debe prevenirse estructuralmente.)

**Corrección:** en v2 la autenticación es un **middleware global de servidor** con allow-list
explícita de rutas públicas (`/api/auth/login`, `/api/onboarding/register`). Olvidar declararlo
resulta en denegación, no en exposición.

---

### HIGH-03 · JWT de 365 días, sin revocación, con el usuario completo en el payload
**Archivo:** `backend/services/utils.service.js:10-18`

```js
const jwtConfig = { expiresIn: '365d', algorithm: 'HS256' };
const token = jwt.sign({ data: usr }, secret, jwtConfig);
```

Un token filtrado es válido un año. No hay lista de revocación: cambiar la contraseña, desactivar
la cuenta o despedir a la persona **no invalida** los tokens ya emitidos. El payload incluye el
objeto de usuario completo, legible por cualquiera que obtenga el token (JWT es firmado, no cifrado).

**Corrección:** access token de **15 minutos** + refresh token rotativo (rotación en cada uso,
detección de reutilización), ambos en cookies `httpOnly`. Tabla `sessions` en base de datos como
lista de revocación, lo que habilita logout real y "cerrar sesión en todos los dispositivos".
Payload mínimo: `sub` (id) y `role`.

---

### HIGH-04 · `makeLexToken`: pepper en el código y hash roto
**Archivo:** `backend/services/utils.service.js:19`

```js
makeLexToken: (password, email) => sha1(`${md5(password)}${email}y0ur.k3y`).toUpperCase(),
```

Tres problemas acumulados: el pepper `y0ur.k3y` está en el repositorio (público en el historial de
git y en cualquier clon), MD5 y SHA-1 están ambos rotos para este uso, y el token resultante es
**derivado determinísticamente de la contraseña** — es decir, equivalente a la contraseña, y se
almacena en el cliente.

**Corrección:** eliminar el mecanismo. La integración con Lextracking se retira en v2; si en el
futuro se necesita un token de servicio, debe ser un valor aleatorio opaco emitido por el servidor,
almacenado hasheado, con expiración y revocable.

---

### HIGH-05 · Secretos con valores por defecto funcionales
**Archivos:** `ext/onboarding/nuxt.config.js:10-30`, `ext/onboarding/docker-compose.yml:26-38`

```js
jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
apiKey: process.env.API_KEY || 'your-super-secret-api-key-for-backend-communication',
```
```yaml
MYSQL_ROOT_PASSWORD: password
JWT_SECRET=your-super-secret-jwt-key
```

Si una variable de entorno falta en el despliegue, la aplicación **arranca igual** con un secreto
conocido y presente en el repositorio. Un atacante puede firmar sus propios JWT.

**Corrección:** validar la configuración al arrancar con Zod y **fallar el arranque** si falta o
es débil cualquier secreto requerido (`NUXT_SESSION_SECRET`, `NUXT_DB_PASSWORD`,
`NUXT_KYC_ENCRYPTION_KEY`). Sin valores por defecto, nunca. Longitud mínima 32 bytes.

---

### HIGH-06 · La capa de datos resuelve los errores como si fueran resultados
**Archivo:** `backend/config/conn.js:22-28`

```js
connection.query(sql, arr, function (error, results, fields) {
  if (error){
    resolve(error)        // <-- resuelve, no rechaza
  } else {
    resolve(results);
  }
});
```

Un error SQL se entrega a la lógica de negocio como si fuera un conjunto de resultados. El código
llamante hace `response.length > 0` sobre un objeto `Error`, lo que produce comportamiento
indefinido: consultas fallidas que se interpretan como "sin resultados", y en el peor caso
controles de acceso que fallan en abierto.

**Corrección:** `mysql2/promise` con **pool** de conexiones y propagación real de errores
(`reject`). Manejo centralizado que registra el detalle en servidor y devuelve un error genérico
al cliente.

---

### HIGH-07 · Filtración de detalles internos en las respuestas de error
**Archivos:** `backend/services/utils.service.js:49,53`, `backend/services/courses.service.js:97,116`

```js
toReturn = { status: 400, message: response.sqlMessage }   // utils.service.js:49,53
const error = {error: errorMessage, trace: e}              // courses.service.js:97
return { "error":"Error al ingresar curso", "stack": e }   // courses.service.js:116
```

`sqlMessage` revela nombres de tablas y columnas; `trace`/`stack` revelan rutas del sistema de
ficheros y versiones de dependencias. Es reconocimiento gratuito para un atacante y acelera
notablemente la explotación de CRIT-04.

**Corrección:** contrato de error único `{ statusCode, message }` con mensajes genéricos.
El detalle va al log estructurado del servidor con un `requestId` que se devuelve al cliente para
soporte. En producción, `stack` nunca cruza el límite del proceso.

---

### HIGH-08 · Secretos y datos personales en los logs
**Archivos:** `ext/onboarding/server/utils/apiAuth.js:11`, `backend/services/middleware.service.js:26`, `backend/routes/users.js:82`

```js
console.log("apiKey: ", apiKey)                       // apiAuth.js:11 — la API key en claro
console.log("email, idCompany: ", email, idCompany)   // middleware.service.js:26
console.log("user-id :: ", req.headers['user-id'])    // routes/users.js:82
```

La API key de integración se escribe en el log en cada petición. Quien tenga acceso de lectura a
los logs (operadores, agregadores de logs de terceros, backups) obtiene la credencial.

**Corrección:** logger estructurado (`pino`) con redacción automática de campos sensibles
(`password`, `token`, `apiKey`, `authorization`, `iban`, `identity_document`). Regla de ESLint
`no-console` en `server/`. Rotar la API key actual — debe considerarse comprometida.

---

### HIGH-09 · CORS: se aceptan peticiones sin `Origin` con credenciales
**Archivo:** `backend/server.js:115-126`

```js
if (!origin) return callback(null, true);   // :118
...
credentials: true,                          // :126
```

La allow-list de orígenes es correcta, pero la excepción para peticiones sin `Origin` combinada
con `credentials: true` debilita la protección. Además la allow-list de headers incluye
`user-id`, `user_id`, `token`, `company_slug` y `lextoken` (`:137-141`) — precisamente los
headers que hacen posible CRIT-07.

**Corrección:** en v2 la sesión viaja en cookie `SameSite=Lax`, lo que neutraliza CSRF entre
sitios por diseño. Allow-list estricta de orígenes sin excepciones. Solo se permiten los headers
`Content-Type` y `Accept`. Token anti-CSRF de doble envío para las mutaciones.

---

### HIGH-10 · Datos KYC sin cifrado en reposo
**Archivo:** `ext/onboarding/db_scripts/ext_onboarding_init.sql` (tabla `pending_users_kyc_data`)

Se almacenan en texto plano: `identity_document`, `iban`, `bank_information`, `full_address`,
`phone`, `emergency_phone`, `company_rut`. Un volcado de la base —por SQLi (CRIT-04), por acceso
a un backup, o por credenciales de base de datos filtradas— entrega documentos de identidad y
datos bancarios directamente utilizables para fraude.

**Corrección:** cifrado a nivel de columna con **AES-256-GCM**, clave gestionada fuera de la base
de datos (variable de entorno en el corto plazo; KMS/secret manager como objetivo), con IV único
por registro y etiqueta de autenticación almacenada. Índices sobre HMAC determinista si se
necesita búsqueda exacta. Política de retención: purga de los datos KYC a los N meses del alta.

---

## 4. Hallazgos de severidad media

### MED-01 · Token de sesión en `localStorage`
`webapp/src/services/auth.service.js:9` — el token de sesión se guarda en `localStorage` bajo la clave `token-app-<APP_NAME>`.
Accesible desde JavaScript, por lo que cualquier XSS lo exfiltra. Agravado por MED-02 y por la
vigencia de un año del token (HIGH-03).
**Corrección:** cookie `httpOnly` + `Secure` + `SameSite=Lax`. El JavaScript del cliente nunca ve el token.

### MED-02 · `v-html` sin sanitizar
Tres usos: `webapp/src/components/EvaluationsComp.vue:40` y `webapp/src/views/Dashboard.vue:147`
(ambos pasan por `sanitizeObservaciones` con DOMPurify — correcto), y
`ext/onboarding/components/ComplianceStep.vue:162` — **sin sanitizar**:

```html
<div v-else v-html="modalContent.content" class="prose max-w-none"></div>
```

El contenido proviene de la tabla `contract_templates`. Si un administrador es comprometido, o si
las plantillas se editan alguna vez desde una fuente menos confiable, se obtiene XSS almacenado
sobre el flujo que recoge los datos KYC — el peor lugar posible para un XSS en este sistema.
**Corrección:** DOMPurify en cliente **y** sanitización en servidor al guardar la plantilla
(defensa en profundidad), más una CSP que bloquee scripts en línea.

### MED-03 · Sin cabeceras de seguridad
No hay `helmet` ni equivalente. Faltan `Content-Security-Policy`, `Strict-Transport-Security`,
`X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy`.
**Corrección:** módulo `nuxt-security` con CSP restrictiva (sin `unsafe-inline`, usando nonces),
HSTS con `max-age=31536000; includeSubDomains; preload`.

### MED-04 · Sin límite de intentos (rate limiting)
No hay límite en ningún endpoint. El login tiene reCAPTCHA (`users.service.js:409`), pero no
impide el credential stuffing distribuido ni protege al resto de la API. Combinado con MD5
(CRIT-05), el coste de un ataque de fuerza bruta es muy bajo.
**Corrección:** límite por IP **y** por cuenta en `/api/auth/login` (10 intentos / 15 min, con
retroceso exponencial), límite global por IP en la API, y límite específico en subidas.
Bloqueo temporal de cuenta tras N fallos, con notificación por correo al titular.

### MED-05 · Aleatoriedad no criptográfica en nombres de archivo
`backend/server.js:73` y `backend/routes/onboarding.js:172` usan
`Math.round(Math.random() * seed)`. `Math.random()` es predecible; combinado con `Date.now()`
reduce el espacio de búsqueda de los documentos expuestos por CRIT-02.
**Corrección:** `crypto.randomUUID()`.

### MED-06 · Tipo de archivo determinado por datos del cliente
`backend/server.js:87-98` y `backend/routes/onboarding.js:185-208` validan `file.mimetype`, que lo
declara el cliente y es trivialmente falsificable.
**Corrección:** validar los **magic bytes** del contenido (`%PDF-` para PDF, firmas de JPEG/PNG)
además de la extensión, y volver a servir siempre con un `Content-Type` fijado por el servidor.

### MED-07 · Registro abierto sin verificación
`ext/onboarding/server/api/auth/register.post.js` — inserta en `pending_users` sin reCAPTCHA
(a diferencia de `login.post.js`, que sí lo tiene) y sin verificación de correo.
**Corrección:** el alta la inicia un administrador mediante invitación, o bien registro con
verificación de correo + reCAPTCHA + rate limiting.

### MED-08 · Base de datos sin TLS y con conexión única
`backend/config/conn.js:4-12` — `mysql.createConnection` (no pool), sin `ssl`. Tráfico en claro
entre la aplicación y MySQL; una sola conexión es además un punto único de fallo que, al caerse,
deja la aplicación inoperativa hasta reiniciar el proceso.
**Corrección:** `mysql2/promise` con pool (límite 10), `ssl: { rejectUnauthorized: true }`,
tiempos de espera explícitos y reintento con retroceso.

### MED-09 · Dependencias sin soporte o con vulnerabilidades conocidas
| Paquete | Versión | Situación |
|---|---|---|
| `vue` | 2.6.11 | **Fin de vida desde dic-2023**, sin parches de seguridad |
| `@vue/cli-service` | 4.5 | Webpack 4, cadena de build sin mantenimiento |
| `axios` | 0.23 / 0.24 | Anterior a los arreglos de SSRF y de fuga de cabeceras en redirecciones |
| `jsonwebtoken` | 8.5.1 | Anterior a los arreglos de confusión de algoritmo de la v9 |
| `md5`, `locutus` | — | Primitivas criptográficas rotas, se eliminan |
| `@amcharts/amcharts4` | 4.10 | Sin mantenimiento (sucedido por amCharts 5) + licencia comercial |

**Corrección:** el stack de v2 parte de versiones con soporte. `npm audit --audit-level=high` en
CI como bloqueante, y Dependabot con auto-merge para parches.

---

## 5. Higiene y prácticas de desarrollo

| ID | Hallazgo | Corrección |
|---|---|---|
| LOW-01 | Sin CI: no existe `.github/`. Ningún lint, test ni auditoría automatizada. | Workflow con lint + typecheck + test + `npm audit` + análisis SAST. |
| LOW-02 | Cobertura de tests casi nula: 3 ficheros (`backend/tests/`, `webapp/tests/`) para 23 servicios. | Vitest sobre lógica de evaluaciones y sobre auth/RBAC; Playwright para los dos flujos completos. |
| LOW-03 | `.env.sample` fija `LOGIN_EMAIL=alexadm@lexartlabs.com` — cuenta administrativa real en el repositorio. | Placeholders genéricos. Verificar si esa cuenta sigue activa. |
| LOW-04 | Sin política de rotación de secretos ni inventario de los mismos. | Sección §8 de este documento; rotación trimestral y tras cada incidente. |
| LOW-05 | Contenedores Docker ejecutan como `root`; sin `Dockerfile` multi-etapa. | Multi-etapa, usuario sin privilegios, imagen base `-slim`, `HEALTHCHECK`. |
| LOW-06 | Sin registro de auditoría de acciones administrativas. Existe `lead_dev_logs`, pero no cubre aprobaciones ni cambios de rol. | Tabla `audit_log` inmutable: actor, acción, recurso, IP, marca temporal. Obligatoria para el flujo de onboarding. |

---

## 6. Cobertura de autenticación por endpoint (estado actual)

`ext/onboarding/server/api/` — resultado del recuento de comprobaciones `validateApiKey` / `jwt.verify`:

| Endpoint | Comprobaciones | Estado |
|---|---|---|
| `upload.post.js` | **0** | 🔴 CRIT-03 |
| `auth/login.post.js` | 0 | ✅ correcto (es el login) |
| `auth/register.post.js` | 0 | 🟡 MED-07 |
| `kyc/get.get.js`, `kyc/submit.post.js` | 1 | ✅ |
| `contracts/*.js` (4 ficheros) | 1 | ✅ |
| `upload-contract.post.js` | 1 | ✅ |
| `users/*.js` (7 ficheros) | 2 | ✅ |

`backend/routes/` — endpoints sin middleware alguno: `users.js:152, 167, 176, 185` (HIGH-02).
El resto usa `Mdl.middleware`, que autentica pero **no autoriza** (HIGH-01).

---

## 7. Migración de contraseñas

MD5 no es reversible: no se pueden convertir los hashes existentes a bcrypt sin conocer las
contraseñas en claro. Procedimiento:

1. Añadir las columnas `password_hash` (bcrypt) y `password_algo` (`'md5-legacy' | 'bcrypt'`).
2. Migrar los hashes MD5 existentes con `password_algo = 'md5-legacy'`.
3. **Opción A — rehash transparente (recomendada, sin fricción):** en el primer login correcto, si
   `password_algo = 'md5-legacy'`, verificar contra MD5 y —dentro de la misma petición, con la
   contraseña aún en memoria— recalcular con bcrypt, actualizar el registro y marcar `'bcrypt'`.
   Transcurrida la ventana de migración (60 días), invalidar todo `'md5-legacy'` restante y forzar
   el restablecimiento de esas cuentas.
4. **Opción B — restablecimiento forzoso:** invalidar todas las contraseñas y enviar enlace de
   restablecimiento a cada usuario. Más seguro (ninguna contraseña se verifica jamás contra MD5)
   pero con coste operativo y de comunicación.

**Decisión: Opción A**, con la fecha límite de 60 días fijada en el `Roadmap.md` y comunicación
previa a los usuarios. El código de verificación MD5 se elimina del repositorio al vencer la ventana.

---

## 8. Inventario y rotación de secretos

Deben considerarse **comprometidos** y rotarse antes del despliegue de v2:

| Secreto | Motivo |
|---|---|
| `API_KEY` de onboarding ↔ Cube | Registrada en claro en cada petición (HIGH-08) |
| `SECRET` de JWT | Tokens de un año en circulación; sin revocación (HIGH-03) |
| Pepper `y0ur.k3y` | Presente en el código fuente y en el historial de git (HIGH-04) |
| `MYSQL_ROOT_PASSWORD` | Valor `password` en `ext/onboarding/docker-compose.yml` |
| Credenciales de la cuenta `LOGIN_EMAIL` | Cuenta administrativa nombrada en `.env.sample` |
| `LX_MAIL_AUTH`, `MAILGUN_API_KEY` | Rotación preventiva |
| Clave de la cuenta de servicio de Google | Rotación preventiva |

**Reglas permanentes:**
- Ningún secreto en el repositorio, ni siquiera como valor por defecto (HIGH-05).
- `.env` en `.gitignore` (ya lo está) + `gitleaks` como hook de pre-commit y en CI.
- Rotación trimestral e inmediata tras cualquier incidente o salida de personal con acceso.
- Auditar el historial de git en busca de secretos ya commiteados; si aparecen, rotarlos —
  reescribir el historial no basta, un clon previo ya los tiene.

---

## 9. Verificación

Cada hallazgo se cierra con una comprobación reproducible. Estos comandos forman parte de la
definición de "terminado" de cada fase del `Roadmap.md`.

```bash
# CRIT-07 — Forjar user-id ya no cambia la identidad del actor (debe devolver SOLO lo propio)
curl -H 'user-id: 1' -b "session=<cookie-de-otro-usuario>" localhost:3000/api/evaluations

# CRIT-04 — Inyección SQL en el buscador (debe devolver 400 de validación, nunca datos)
curl -b "session=<admin>" "localhost:3000/api/evaluations?query=%27%20OR%201%3D1--"

# CRIT-01 — Administración de onboarding sin sesión → 401
curl -X POST localhost:3000/api/onboarding/candidates/1/approve

# CRIT-03 — Subida sin sesión → 401
curl -X POST -F file=@x.pdf localhost:3000/api/onboarding/upload

# CRIT-02 — Acceso directo al fichero → 404; vía endpoint sin sesión → 401
curl -I localhost:3000/uploads/signed-documents/cualquier.pdf
curl -I localhost:3000/api/onboarding/documents/1

# MED-04 — Límite de intentos en login → 429 antes del intento 11
for i in $(seq 1 15); do curl -s -o /dev/null -w '%{http_code} ' \
  -X POST localhost:3000/api/auth/login -d '{"email":"a@b.c","password":"x"}' \
  -H 'Content-Type: application/json'; done

# MED-03 — Cabeceras de seguridad presentes
curl -sI localhost:3000/ | grep -iE 'content-security|strict-transport|x-content-type|referrer-policy'

# HIGH-01 — RBAC: un desarrollador no accede a administración → 403
curl -b "session=<dev>" localhost:3000/api/users

# MED-09 / LOW-01 — Cadena automatizada
npm run lint && npm run typecheck && npm run test && npm audit --audit-level=high
```

**Pruebas automatizadas obligatorias antes del despliegue de v2:**
- Test que enumera todas las rutas de `server/api/` y falla si alguna no declara política de acceso.
- Test de RBAC por rol (`dev`, `lead`, `admin`) sobre cada endpoint de administración.
- Test de que los documentos de onboarding no son accesibles sin sesión ni por ruta directa.
- Test de ida y vuelta del cifrado KYC (cifra → almacena → recupera → descifra → valor original).
- Test de que ningún handler lee `user-id`, `token` ni `company_slug` de los headers (grep en CI).

---

## 10. Orden de remediación recomendado

| Prioridad | Hallazgos | Momento |
|---|---|---|
| **P0 — mitigar en producción ya** | CRIT-01, CRIT-02, CRIT-03 | Antes de v2. Son explotables hoy sin credenciales. **Corregido el 2026-09-21 en el directorio de trabajo (§10.1), nunca commiteado, retirado con el árbol de v1 el 2026-09-25. Sigue abierto en producción.** |
| **P1 — parte del núcleo de v2** | CRIT-04 … CRIT-07, HIGH-01 … HIGH-03, HIGH-06, HIGH-07 | Fases 1-3 del `Roadmap.md`. Son propiedades de la arquitectura nueva, no parches. |
| **P2 — endurecimiento** | HIGH-04, HIGH-05, HIGH-08 … HIGH-10, MED-01 … MED-06, MED-08 | Fases 3-5. |
| **P3 — proceso** | MED-07, MED-09, LOW-01 … LOW-06 | Fase 6, más rutina permanente. |

### 10.1 Mitigación P0 en v1 — qué se hizo y qué queda

> **⛔ 2026-09-25 — este código ya no existe.** Se escribió el 2026-09-21 sobre el árbol de v1, no
> llegó a commitearse y se fue al borrar `backend/`, `webapp/` y `ext/onboarding/` (AD-06). Producción
> no lo tuvo nunca. Lo que sigue describe la forma que tenía la corrección, por si hay que rehacerla:
> el punto de partida sería `origin/develop`, que está como antes de esa mitigación.

Corregido en el código de v1 (`backend/`, `ext/onboarding/`, `webapp/`), no con reglas de NGINX:
las reglas dependen de la configuración de un servidor que no está en el repositorio, y la parte
que más expone (los contratos) tenía tres copias públicas, no una.

| | Antes | Ahora |
|---|---|---|
| **CRIT-01** | `validateAuth` solo miraba que existieran `token` y `user-id` | `backend/services/adminAuth.service.js`: JWT verificado con `SECRET`, usuario cargado de la base, rol `admin`/`pm` exigido; `router.use` en todo `/onboarding`. `approve` toma el actor de la sesión, no de `user-id`. |
| **CRIT-02** | Contratos en `backend/public/uploads/signed-documents` (copia de paso nunca borrada), en `ext/onboarding/public/uploads/{contracts,signed-documents}` (almacén real, servido por Nuxt) y el PDF **personalizado** en `ext/onboarding/public/contracts/NDA_Contract.pdf` (un solo fichero compartido por todos los candidatos) | Almacén en `ext/onboarding/storage/uploads/` (`UPLOADS_DIR`), fuera del webroot. Única salida: `GET /api/files/:kind/:filename` con API key (backend) o sesión del candidato (solo su foto). El backend hace de proxy para el administrador en `GET /onboarding/documents/:kind/:filename`, en streaming, con `Content-Disposition: attachment` y `nosniff`. El PDF de contrato se genera en memoria. El backend usa un directorio temporal fuera de `public/` y borra al reenviar; `/uploads/signed-documents` responde 404 explícito. **Al arrancar, ambos servicios mueven lo que quede en `public/` al almacén privado**, así que el despliegue no depende de un paso manual. |
| **CRIT-03** | `POST /api/upload` sin sesión, sin tipo, sin tamaño, a `public/uploads` | Sesión del candidato obligatoria, 5 MB, tipo por magic bytes (JPEG/PNG/WebP/GIF), nombre `<userId>_<uuid>`, almacén privado. `upload-contract` y `upload-signed-documents` validan también la cabecera `%PDF-`. |

Además: `validateApiKey` compara en tiempo constante y ya no escribe la API key en el log.

**Queda en el servidor, y no lo hace el código:**

1. Desplegar los tres componentes. `run.deploy.sh` cubre `backend` y `webapp`; la extranet
   (`ext/onboarding`) se construye y reinicia aparte. `webapp` **necesita rebuild**: los enlaces
   a `uploads/…` estaban compilados en el bundle.
2. Comprobar que `ONBOARDING_API_KEY` (backend) y `API_KEY` (extranet) coinciden: ahora la
   descarga del administrador pasa por ahí.
3. NGINX, como defensa en profundidad si sirve `public/` directamente: `location ^~ /uploads/`
   y `location ^~ /contracts/` → 404 en la extranet; `location ^~ /uploads/signed-documents`
   → 404 en el backend. Con el código nuevo no hay nada que servir ahí, pero cuesta una línea.
4. Auditar los logs de acceso anteriores al despliegue: `GET /uploads/signed-documents/`,
   `GET /uploads/contracts/`, `GET /contracts/NDA_Contract.pdf`,
   `GET /contracts/Service_Agreement_Contract.pdf` y `POST /api/upload` sin cookie. Cualquier
   200 de fuera de la red de Lexart es una descarga de PII que hay que notificar.
5. Revisar `storage/uploads/photos` de la extranet tras el primer arranque: ahí cae todo lo que
   había en `public/uploads/`, incluido lo que un anónimo pudiera haber subido por CRIT-03.
   Solo se sirven extensiones de imagen; lo demás se puede borrar.
6. Rotar los secretos de §8. Sigue pendiente.

**Verificación tras desplegar** (los mismos comandos que §9, contra producción):

```bash
# CRIT-01 — sin sesión, con las cabeceras que antes bastaban → 401
curl -s -o /dev/null -w '%{http_code}\n' -H 'token: x' -H 'user-id: 1' https://<backend>/onboarding/users
# CRIT-02 — ruta directa → 404; endpoint sin credenciales → 401
curl -s -o /dev/null -w '%{http_code}\n' https://<extranet>/uploads/signed-documents/cualquiera.pdf
curl -s -o /dev/null -w '%{http_code}\n' https://<extranet>/api/files/signed-documents/cualquiera.pdf
curl -s -o /dev/null -w '%{http_code}\n' https://<backend>/uploads/signed-documents/cualquiera.pdf
# CRIT-03 — subida sin sesión → 401
curl -s -o /dev/null -w '%{http_code}\n' -F file=@foto.png https://<extranet>/api/upload
```

Tests: `backend/tests/routes/onboarding.test.js` (10 casos: 401/403 por rol, 404 en la ruta
estática, allow-list de tipos y nombres, proxy en streaming con cabeceras).

---

## Anexo — Referencias

- OWASP Top 10 2021: A01 Broken Access Control (CRIT-01, CRIT-07, HIGH-01, HIGH-02),
  A02 Cryptographic Failures (CRIT-05, CRIT-06, HIGH-04, HIGH-10),
  A03 Injection (CRIT-04, MED-02), A05 Security Misconfiguration (CRIT-02, HIGH-05, HIGH-09, MED-03),
  A06 Vulnerable Components (MED-09), A07 Identification and Authentication Failures (HIGH-03, MED-04).
- OWASP ASVS 4.0 — nivel objetivo **L2** (la aplicación trata documentos de identidad y datos bancarios).
- OWASP Cheat Sheets: Password Storage, File Upload, SQL Injection Prevention, Session Management.
- GDPR art. 32 · Ley 18.331 (Uruguay) de Protección de Datos Personales — aplicables por el
  tratamiento de documentos de identidad y datos bancarios en el módulo de onboarding.

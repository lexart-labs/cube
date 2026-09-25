#!/usr/bin/env bash
#
# Verifica que el build sea autosuficiente, como lo será dentro del contenedor.
#
# Existe por un fallo real: `bcryptjs` se importaba sin estar declarado en
# package.json. En desarrollo funcionaba porque Node lo resolvía subiendo el
# árbol hasta el `node_modules` del proyecto; en Docker, la etapa de runtime
# solo tiene `.output` y el contenedor moría con ERR_MODULE_NOT_FOUND.
#
# Comprueba dos cosas que el `npm run build` a secas no comprueba:
#   1. Que todo lo que `.output/server/package.json` declara está realmente
#      vendorizado en `.output/server/node_modules`.
#   2. Que el servidor arranca desde un directorio aislado, sin ningún
#      `node_modules` alcanzable hacia arriba.
#
# Uso:  npm run verify:build     (requiere haber hecho `npm run build` antes)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="$ROOT/.output"

if [ ! -d "$OUTPUT" ]; then
  echo "No existe .output. Ejecuta 'npm run build' primero." >&2
  exit 1
fi

echo "1/2 · Comprobando que las dependencias externas estén vendorizadas…"
node -e '
const fs = require("fs");
const path = require("path");
const out = process.argv[1];
const pkg = JSON.parse(fs.readFileSync(path.join(out, "server/package.json"), "utf8"));
const deps = Object.keys(pkg.dependencies ?? {});
const missing = deps.filter((name) => {
  try {
    fs.accessSync(path.join(out, "server/node_modules", name, "package.json"));
    return false;
  } catch { return true; }
});
if (missing.length) {
  console.error("Declaradas como externas pero NO vendorizadas:\n  " + missing.join("\n  "));
  console.error("\nSuele significar que el paquete no está en package.json, así que");
  console.error("`npm ci` no lo instala y Nitro no puede empaquetarlo.");
  process.exit(1);
}
console.log(`   ${deps.length} dependencias externas, todas presentes.`);
' "$OUTPUT"

echo "2/2 · Arrancando el servidor en aislamiento…"
ISOLATED="$(mktemp -d)"
trap 'rm -rf "$ISOLATED"' EXIT
cp -r "$OUTPUT" "$ISOLATED/.output"

# Un `node_modules` alcanzable hacia arriba invalidaría la prueba.
probe="$ISOLATED"
while [ "$probe" != "/" ]; do
  if [ -d "$probe/node_modules" ]; then
    echo "El directorio temporal no está aislado: existe $probe/node_modules" >&2
    exit 1
  fi
  probe="$(dirname "$probe")"
done

PORT="${VERIFY_PORT:-3999}"
export NODE_ENV=production PORT
# Secretos de usar y tirar: solo interesa que el proceso levante.
export NUXT_SESSION_SECRET="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"
export NUXT_DB_HOST=127.0.0.1 NUXT_DB_PORT=3306 NUXT_DB_USER=verify NUXT_DB_NAME=verify
export NUXT_DB_PASSWORD="$(node -e 'console.log(require("crypto").randomBytes(24).toString("base64url"))')"

cd "$ISOLATED"
node .output/server/index.mjs > "$ISOLATED/run.log" 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true; rm -rf "$ISOLATED"' EXIT

for _ in $(seq 1 30); do
  if ! kill -0 $SERVER 2>/dev/null; then
    echo "   El servidor murió al arrancar:" >&2
    tail -20 "$ISOLATED/run.log" >&2
    exit 1
  fi
  if curl -sf -o /dev/null "http://127.0.0.1:$PORT/login"; then break; fi
  sleep 1
done

status_login="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/login")"
status_api="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/evaluations")"

echo "   /login -> $status_login | /api/evaluations sin sesión -> $status_api"

if [ "$status_login" != "200" ] || [ "$status_api" != "401" ]; then
  echo "Respuestas inesperadas. Se esperaba 200 y 401." >&2
  tail -20 "$ISOLATED/run.log" >&2
  exit 1
fi

echo "Build verificado: autosuficiente y arranca aislado."

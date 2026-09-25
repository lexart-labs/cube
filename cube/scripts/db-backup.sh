#!/usr/bin/env bash
# Copia de seguridad de las bases de v1 ANTES de migrar.
# La migración escribe en una base nueva y no toca v1, pero un backup previo es
# la única red de seguridad real si algo se ejecuta por error contra el origen.
set -euo pipefail

HOST="${MIGRATE_SOURCE_HOST:-127.0.0.1}"
PORT="${MIGRATE_SOURCE_PORT:-3306}"
USER="${MIGRATE_SOURCE_USER:?define MIGRATE_SOURCE_USER}"
SOURCE_DB="${MIGRATE_SOURCE_DB:-lexart_cube}"
# onboarding_db ya no se migra (AD-06: el módulo se retiró de v2), pero se
# respalda igual: contiene KYC y contratos de personas reales y, al apagar v1,
# este volcado pasa a ser la única copia.
ONBOARDING_DB="${MIGRATE_ONBOARDING_DB:-onboarding_db}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR:-./backups}/$STAMP"

mkdir -p "$OUT"
export MYSQL_PWD="${MIGRATE_SOURCE_PASSWORD:?define MIGRATE_SOURCE_PASSWORD}"

echo "Volcando $SOURCE_DB -> $OUT/$SOURCE_DB.sql"
mysqldump -h "$HOST" -P "$PORT" -u "$USER" --single-transaction --routines "$SOURCE_DB" > "$OUT/$SOURCE_DB.sql"

if mysqldump -h "$HOST" -P "$PORT" -u "$USER" --single-transaction "$ONBOARDING_DB" > "$OUT/$ONBOARDING_DB.sql" 2>/dev/null; then
  echo "Volcando $ONBOARDING_DB -> $OUT/$ONBOARDING_DB.sql"
else
  rm -f "$OUT/$ONBOARDING_DB.sql"
  echo "AVISO: no se pudo volcar $ONBOARDING_DB (¿está en otro servidor?)"
fi

echo "Backup completo en $OUT"
ls -lh "$OUT"

/**
 * Esquema de la base de datos, como módulo TypeScript.
 *
 * Está aquí y no en un \`.sql\` suelto por una razón concreta: Nitro empaqueta
 * JavaScript, no ficheros de datos. Un \`schema.sql\` no llega a \`.output\`, así
 * que leerlo con \`readFile\` funciona en desarrollo y falla en el contenedor —
 * el mismo fallo que tuvimos con \`bcryptjs\`.
 *
 * Como módulo, el bundler lo incluye siempre y no hay dos caminos distintos
 * según el entorno.
 *
 * GENERADO desde el antiguo schema.sql. Editar aquí; es la única fuente.
 */
export const SCHEMA_SQL = `-- ---------------------------------------------------------------------------
-- Cube v2 — esquema unificado
--
-- Single-tenant (Roadmap AD-02): no hay \`companies\` ni \`idCompany\`.
-- Una sola base (AD-04).
--
-- Diferencias deliberadas respecto a v1:
--   · snake_case en todo; v1 mezclaba camelCase y snake_case.
--   · Claves foráneas reales. v1 no tenía ninguna: la integridad se confiaba
--     al código de aplicación, y por eso hay filas huérfanas.
--   · Índices sobre las columnas por las que realmente se filtra.
--   · utf8mb4 en todas las tablas; v1 mezclaba utf8mb3 y utf8mb4, lo que rompe
--     emojis y algunos acentos en las observaciones.
--   · Nombres que dicen lo que guardan: \`evaluations.idLextracking\` pasa a
--     \`evaluated_user_id\`, e \`idUser\` a \`author_user_id\`.
-- ---------------------------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------------

-- Ex \`careers\`. Se descartan \`roadmap\`, \`idCompany\` e \`idCareerType\` (AD-03).
CREATE TABLE IF NOT EXISTS positions (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                 VARCHAR(191) NOT NULL,
  minimum_time_months  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  active               TINYINT(1) NOT NULL DEFAULT 1,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_positions_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS levels (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(191) NOT NULL,
  active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_levels_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Identificador del sistema externo Lextracking. En v1 era la clave por la
  -- que se relacionaban evaluaciones y skills, aunque la columna se llamara
  -- igual que un id local. Se conserva solo para poder migrar y correlacionar.
  lextracking_id  INT UNSIGNED DEFAULT NULL,

  name            VARCHAR(191) NOT NULL,
  email           VARCHAR(191) NOT NULL,
  role            ENUM('developer','lead','admin') NOT NULL DEFAULT 'developer',

  -- bcrypt produce 60 caracteres; MD5 heredado, 32.
  password_hash   VARCHAR(255) NOT NULL,

  -- Marca el algoritmo de \`password_hash\`. Las filas migradas entran como
  -- 'md5-legacy' y pasan a 'bcrypt' en el primer login correcto
  -- (Roadmap §6, rehash transparente). MD5 no es reversible: no se puede
  -- convertir sin la contraseña en claro.
  password_algo   ENUM('bcrypt','md5-legacy') NOT NULL DEFAULT 'bcrypt',

  position_id     INT UNSIGNED DEFAULT NULL,
  level_id        INT UNSIGNED DEFAULT NULL,
  lead_id         INT UNSIGNED DEFAULT NULL,

  active          TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_lextracking (lextracking_id),
  KEY idx_users_role_active (role, active),
  KEY idx_users_lead (lead_id),
  CONSTRAINT fk_users_position FOREIGN KEY (position_id) REFERENCES positions (id) ON DELETE SET NULL,
  CONSTRAINT fk_users_level    FOREIGN KEY (level_id)    REFERENCES levels (id)    ON DELETE SET NULL,
  CONSTRAINT fk_users_lead     FOREIGN KEY (lead_id)     REFERENCES users (id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
-- Evaluaciones IDEAL LEXART — el dominio principal
-- ---------------------------------------------------------------------------

-- El modelo de 27 indicadores sobre 135 que venía de v1 se retiró entero el
-- 2026-09-25 junto con su tabla \`evaluations\`: las dos escalas no eran
-- comparables y mantener las dos obligaba a desambiguar en cada consulta.
--
-- Las preguntas del catálogo pueden cambiar con el tiempo; por eso se guardan
-- las notas JUNTO al rol con el que se evaluó, y el promedio ya calculado. Una
-- evaluación vieja se sigue leyendo aunque el cuestionario haya cambiado.
CREATE TABLE IF NOT EXISTS ideal_evaluations (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,

  author_user_id    INT UNSIGNED DEFAULT NULL,
  evaluated_user_id INT UNSIGNED NOT NULL,

  -- Clave del rol en \`shared/ideal.ts\` (arquitecto-l1, desarrollador-l3, …).
  role_key          VARCHAR(64) NOT NULL,
  evaluated_on      DATE NOT NULL,

  -- Notas por bloque, en el orden de las preguntas del catálogo.
  scores            JSON NOT NULL,

  -- Promedio ponderado en la escala 1.00-5.00 y su equivalente en porcentaje,
  -- que es como el resto de Cube muestra los puntajes.
  weighted_average  DECIMAL(3,2) NOT NULL,
  score_percent     TINYINT UNSIGNED NOT NULL,

  observations      TEXT DEFAULT NULL,

  -- Redacción generada. NULL mientras no se haya generado: la evaluación se
  -- guarda aunque la IA falle, para no perder el trabajo de quien la rellenó.
  narrative_es      TEXT DEFAULT NULL,
  narrative_en      TEXT DEFAULT NULL,
  ai_model          VARCHAR(64) DEFAULT NULL,
  generated_at      TIMESTAMP NULL DEFAULT NULL,

  active            TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_ideal_evaluated (evaluated_user_id, active, evaluated_on),
  KEY idx_ideal_author (author_user_id),
  CONSTRAINT fk_ideal_author    FOREIGN KEY (author_user_id)    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_ideal_evaluated FOREIGN KEY (evaluated_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
-- Sesiones — habilitan la revocación real
-- ---------------------------------------------------------------------------

-- v1 emitía JWT de 365 días sin lista de revocación: cambiar la contraseña,
-- desactivar la cuenta o dar de baja a la persona NO invalidaba los tokens ya
-- emitidos (HIGH-03). Esta tabla es lo que hace posible el logout real.
CREATE TABLE IF NOT EXISTS sessions (
  id                  CHAR(36) NOT NULL,
  user_id             INT UNSIGNED NOT NULL,

  -- Solo el SHA-256 del token de sesión. Un volcado de esta tabla no permite
  -- suplantar a nadie: el token en claro solo existe en la cookie del cliente.
  token_hash          CHAR(64) NOT NULL,

  -- Caducidad por inactividad, además de la absoluta de \`expires_at\`.
  last_seen_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Revocación explícita: es lo que hace posible el logout real y el
  -- "cerrar sesión en todos los dispositivos" que v1 no podía ofrecer.
  revoked_at          TIMESTAMP NULL DEFAULT NULL,
  expires_at          TIMESTAMP NOT NULL,

  user_agent          VARCHAR(255) DEFAULT NULL,
  ip_address          VARBINARY(16) DEFAULT NULL,

  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (token_hash),
  KEY idx_sessions_user (user_id, revoked_at),
  KEY idx_sessions_expiry (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
-- Auditoría
-- ---------------------------------------------------------------------------

-- v1 no registraba las acciones administrativas: no había forma de saber quién
-- aprobó a un candidato ni quién borró a un usuario (LOW-06). Append-only.
CREATE TABLE IF NOT EXISTS audit_log (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id     INT UNSIGNED DEFAULT NULL,
  action       VARCHAR(64) NOT NULL,
  resource     VARCHAR(64) NOT NULL,
  resource_id  VARCHAR(64) DEFAULT NULL,
  metadata     JSON DEFAULT NULL,
  ip_address   VARBINARY(16) DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_actor (actor_id, created_at),
  KEY idx_audit_resource (resource, resource_id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
`

/**
 * Divide el esquema en sentencias sueltas.
 *
 * \`connection.query\` con \`multipleStatements\` admitiría el script entero, pero
 * esa opción está desactivada a propósito en el pool (un control contra la
 * inyección apilada, ver server/db/index.ts). Ejecutarlas una a una permite
 * mantenerla desactivada también aquí.
 */
export function schemaStatements(): string[] {
  return SCHEMA_SQL
    // Comentarios de línea completa: no aportan nada al motor.
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
}

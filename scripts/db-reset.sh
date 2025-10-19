#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env"
  set +a
fi

DB_URL="${RLS_TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:6543/ibimina_test}"
DB_NAME=$(echo "$DB_URL" | sed -E 's#.*/([^/?]+)(\?.*)?$#\1#')
ADMIN_URL="${DB_URL%/$DB_NAME}/postgres"
ADMIN_DEFAULT_EMAIL="${ADMIN_DEFAULT_EMAIL:-info@ikanisa.com}"
ADMIN_DEFAULT_NAME="${ADMIN_DEFAULT_NAME:-System Admin}"
ESCAPED_ADMIN_NAME=${ADMIN_DEFAULT_NAME//\'/\'\'}
ADMIN_DEFAULT_PASSWORD="${ADMIN_DEFAULT_PASSWORD:-MoMo!!0099}"
ESCAPED_ADMIN_EMAIL=${ADMIN_DEFAULT_EMAIL//\'/\'\'}
ESCAPED_ADMIN_PASSWORD=${ADMIN_DEFAULT_PASSWORD//\'/\'\'}

psql "$ADMIN_URL" -v ON_ERROR_STOP=1 <<SQL
DROP DATABASE IF EXISTS "$DB_NAME" WITH (FORCE);
CREATE DATABASE "$DB_NAME";
ALTER DATABASE "$DB_NAME" SET app.admin_default_email = '$ESCAPED_ADMIN_EMAIL';
ALTER ROLE postgres SET app.admin_default_email = '$ESCAPED_ADMIN_EMAIL';
ALTER DATABASE "$DB_NAME" SET app.admin_default_password = '$ESCAPED_ADMIN_PASSWORD';
ALTER ROLE postgres SET app.admin_default_password = '$ESCAPED_ADMIN_PASSWORD';
ALTER DATABASE "$DB_NAME" SET app.admin_default_name = '$ESCAPED_ADMIN_NAME';
ALTER ROLE postgres SET app.admin_default_name = '$ESCAPED_ADMIN_NAME';
SQL

psql "$DB_URL" -v ON_ERROR_STOP=1 \
  -v ADMIN_DEFAULT_EMAIL="$ADMIN_DEFAULT_EMAIL" \
  -v ADMIN_DEFAULT_PASSWORD="$ADMIN_DEFAULT_PASSWORD" \
  -v ADMIN_DEFAULT_NAME="$ADMIN_DEFAULT_NAME" \
  -f "$ROOT_DIR/supabase/tests/fixtures/bootstrap.sql"

for migration in $(ls "$ROOT_DIR"/supabase/migrations/*.sql | sort); do
  echo "Applying migration: $migration"
  psql "$DB_URL" -v ON_ERROR_STOP=1 \
    -v ADMIN_DEFAULT_EMAIL="$ADMIN_DEFAULT_EMAIL" \
    -v ADMIN_DEFAULT_PASSWORD="$ADMIN_DEFAULT_PASSWORD" \
    -v ADMIN_DEFAULT_NAME="$ADMIN_DEFAULT_NAME" \
    -f "$migration" >/dev/null \
    || { echo "Failed applying $migration" >&2; exit 1; }
done

psql "$DB_URL" -v ON_ERROR_STOP=1 \
  -v ADMIN_DEFAULT_EMAIL="$ADMIN_DEFAULT_EMAIL" \
  -v ADMIN_DEFAULT_PASSWORD="$ADMIN_DEFAULT_PASSWORD" \
  -v ADMIN_DEFAULT_NAME="$ADMIN_DEFAULT_NAME" \
  -f "$ROOT_DIR/supabase/tests/rls/e2e_friendly_seed.sql" >/dev/null

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
APP_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
REPO_ROOT=$(cd "$APP_DIR/../.." && pwd)
cd "$REPO_ROOT"

DB_URL="${RLS_TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:6543/ibimina_test}"
DB_NAME=$(echo "$DB_URL" | sed -E 's#.*/([^/?]+)(\?.*)?$#\1#')
ADMIN_URL="${DB_URL%/$DB_NAME}/postgres"

psql "$ADMIN_URL" -v ON_ERROR_STOP=1 <<SQL
DROP DATABASE IF EXISTS "$DB_NAME" WITH (FORCE);
CREATE DATABASE "$DB_NAME";
SQL

psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$REPO_ROOT/supabase/tests/fixtures/bootstrap.sql"

for migration in $(ls "$REPO_ROOT"/supabase/migrations/*.sql | sort); do
  echo "Applying migration: $migration"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$migration" >/dev/null \
    || { echo "Failed applying $migration" >&2; exit 1; }
done

psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$REPO_ROOT/supabase/tests/rls/e2e_friendly_seed.sql" >/dev/null

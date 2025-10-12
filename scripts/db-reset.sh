#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

DB_URL="${RLS_TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:6543/ibimina_test}"
DB_NAME=$(echo "$DB_URL" | sed -E 's#.*/([^/?]+)(\?.*)?$#\1#')
ADMIN_URL="${DB_URL%/$DB_NAME}/postgres"

psql "$ADMIN_URL" -v ON_ERROR_STOP=1 <<SQL
DROP DATABASE IF EXISTS "$DB_NAME" WITH (FORCE);
CREATE DATABASE "$DB_NAME";
SQL

psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$ROOT_DIR/supabase/tests/fixtures/bootstrap.sql"

for migration in $(ls "$ROOT_DIR"/supabase/migrations/*.sql | sort); do
  echo "Applying migration: $migration"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$migration" >/dev/null \
    || { echo "Failed applying $migration" >&2; exit 1; }
done

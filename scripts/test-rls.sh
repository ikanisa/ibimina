#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
DB_URL="${RLS_TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:6543/ibimina_test}"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env"
  set +a
fi

"$ROOT_DIR/scripts/db-reset.sh"

status=0
for test in $(ls "$ROOT_DIR"/supabase/tests/rls/*.sql | sort); do
  echo "Running RLS test: $test"
  if ! psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$test" >/dev/null; then
    echo "❌ RLS test failed: $test" >&2
    status=1
  fi
done

exit $status

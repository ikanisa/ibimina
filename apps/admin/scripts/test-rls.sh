#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
APP_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
REPO_ROOT=$(cd "$APP_DIR/../.." && pwd)
DB_URL="${RLS_TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:6543/ibimina_test}"

bash "$SCRIPT_DIR/db-reset.sh"

status=0
for test in $(ls "$REPO_ROOT"/supabase/tests/rls/*.sql | sort); do
  echo "Running RLS test: $test"
  if ! psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$test" >/dev/null; then
    echo "❌ RLS test failed: $test" >&2
    status=1
  fi
done

exit $status

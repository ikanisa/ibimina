#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)

DEFAULT_DB_PORT="${IBIMINA_TEST_DB_PORT:-6543}"
DEFAULT_DB_NAME="${IBIMINA_TEST_DB_NAME:-ibimina_test}"
DEFAULT_DB_URL="postgresql://postgres:postgres@localhost:${DEFAULT_DB_PORT}/${DEFAULT_DB_NAME}"

if [[ -z "${RLS_TEST_DATABASE_URL:-}" ]]; then
  export RLS_TEST_DATABASE_URL="$DEFAULT_DB_URL"
else
  export RLS_TEST_DATABASE_URL
fi

DB_URL="$RLS_TEST_DATABASE_URL"

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  CALLED_DIRECTLY=true
else
  CALLED_DIRECTLY=false
fi

echo "Preparing database at $DB_URL"

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is required but not available in PATH." >&2
  exit 1
fi

PGCONNECT_TIMEOUT=2
export PGCONNECT_TIMEOUT

printf 'Waiting for Postgres to accept connections'
for attempt in {1..30}; do
  if psql "$DB_URL" -c 'select 1' >/dev/null 2>&1; then
    echo " - ready"
    break
  fi
  printf '.'
  sleep 2
  if [[ $attempt -eq 30 ]]; then
    echo "" >&2
    echo "Error: Timed out waiting for Postgres at $DB_URL" >&2
    exit 1
  fi
  printf '\rWaiting for Postgres to accept connections'
done

DB_RESET_SCRIPT="$REPO_ROOT/apps/pwa/staff-admin/scripts/db-reset.sh"
if [[ ! -x "$DB_RESET_SCRIPT" ]]; then
  echo "Error: Expected reset script at $DB_RESET_SCRIPT" >&2
  exit 1
fi

echo "Running migrations and seed fixtures..."
RLS_TEST_DATABASE_URL="$DB_URL" bash "$DB_RESET_SCRIPT"

echo "Database ready for RLS/auth testing."
echo "Exported RLS_TEST_DATABASE_URL=$DB_URL"

if [[ "$CALLED_DIRECTLY" == true ]]; then
  cat <<EONOTE
Note: environment variables set by this script apply only to the current process.
For interactive shells, run:\n  source scripts/db/setup-local.sh
EONOTE
fi

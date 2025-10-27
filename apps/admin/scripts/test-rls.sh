#!/usr/bin/env bash
set -euo pipefail

# Trap errors for better debugging
trap 'echo "Error on line $LINENO. Exit code: $?" >&2' ERR

# Get script directories
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
APP_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
REPO_ROOT=$(cd "$APP_DIR/../.." && pwd)

# Configuration
DB_URL="${RLS_TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:6543/ibimina_test}"

# Validate dependencies
if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is not installed or not in PATH" >&2
  exit 1
fi

# Reset the database first
echo "Resetting test database..."
if ! bash "$SCRIPT_DIR/db-reset.sh"; then
  echo "Error: Database reset failed" >&2
  exit 1
fi

# Run RLS tests
status=0
test_count=0
failed_tests=0
passed_tests=0

echo "Running RLS tests..."
while IFS= read -r -d '' test; do
  test_name=$(basename "$test")
  ((test_count++))
  echo "  Running: $test_name"
  
  if psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$test" >/dev/null 2>&1; then
    echo "    ✓ Passed"
    ((passed_tests++))
  else
    echo "    ✗ Failed: $test_name" >&2
    ((failed_tests++))
    status=1
  fi
done < <(find "$REPO_ROOT/supabase/tests/rls" -maxdepth 1 -name "*.test.sql" -type f -print0 2>/dev/null | sort -z)

# Print summary
echo ""
echo "RLS Test Summary:"
echo "  Total:  $test_count"
echo "  Passed: $passed_tests"
echo "  Failed: $failed_tests"

if [[ $status -eq 0 ]]; then
  echo "All RLS tests passed ✓"
else
  echo "Some RLS tests failed ✗" >&2
fi

exit $status

#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Supabase access token not provided; skipping type validation."
  exit 0
fi

PROJECT_REF=$(awk -F '"' '/project_id/ { print $2; exit }' supabase/config.toml)
if [[ -z "${PROJECT_REF}" ]]; then
  echo "Unable to determine Supabase project reference from supabase/config.toml" >&2
  exit 1
fi

TMP_DIR=$(mktemp -d)
trap 'rm -rf "${TMP_DIR}"' EXIT
OUTPUT_FILE="apps/admin/lib/supabase/types.ts"
GENERATED_FILE="${TMP_DIR}/supabase.types.ts"

supabase gen types typescript \
  --project-ref "${PROJECT_REF}" \
  --schema "public,storage,graphql_public,app,app_helpers" \
  > "${GENERATED_FILE}"

if ! diff -u "${OUTPUT_FILE}" "${GENERATED_FILE}"; then
  echo "Supabase type definitions are out of date. Run 'supabase gen types typescript --project-ref ${PROJECT_REF} --schema public,storage,graphql_public,app,app_helpers > ${OUTPUT_FILE}' locally and commit the result." >&2
  exit 1
fi

echo "Supabase type definitions are up to date."

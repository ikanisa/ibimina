#!/usr/bin/env bash
set -euo pipefail

TARGET_FILE="packages/supabase-schemas/src/database.types.ts"
TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

if [[ ! -f "$TARGET_FILE" ]]; then
  echo "Expected Supabase types file '$TARGET_FILE' does not exist." >&2
  echo "Run 'pnpm gen:types' to generate it." >&2
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found on PATH." >&2
  echo "Install it from https://supabase.com/docs/guides/cli then re-run the command." >&2
  exit 1
fi

MODE="${SUPABASE_TYPES_MODE:-}"  # optional override: "remote" or "local"
if [[ -z "$MODE" ]]; then
  if [[ "${CI:-}" == "true" || -n "${SUPABASE_ACCESS_TOKEN:-}" || -n "${SUPABASE_ACCESS_TOKEN_FILE:-}" ]]; then
    MODE="remote"
  else
    MODE="local"
  fi
fi

generate_remote_types() {
  local project_ref="${PROJECT_REF:-${SUPABASE_PROJECT_REF:-}}"
  if [[ -z "$project_ref" && -f supabase/config.toml ]]; then
    project_ref="$(sed -nE 's/^project_id = "([^"]+)"/\1/p' supabase/config.toml | head -n1)"
  fi

  if [[ -z "$project_ref" ]]; then
    echo "Unable to determine Supabase project ref for remote type generation." >&2
    echo "Set PROJECT_REF or SUPABASE_PROJECT_REF, or ensure supabase/config.toml exists." >&2
    return 1
  fi

  if ! supabase gen types typescript --project-id "$project_ref" >"$TMP_FILE"; then
    echo "Failed to generate Supabase types from remote project '$project_ref'." >&2
    echo "Ensure the Supabase CLI is logged in (supabase login) and you have access to the project." >&2
    return 1
  fi
}

generate_local_types() {
  if ! supabase gen types typescript --local >"$TMP_FILE"; then
    echo "Failed to generate Supabase types from the local development stack." >&2
    echo "Make sure 'supabase start' is running, or set SUPABASE_TYPES_MODE=remote to use the linked project." >&2
    return 1
  fi
}

case "$MODE" in
  remote)
    if ! generate_remote_types; then
      exit 1
    fi
    ;;
  local)
    if ! generate_local_types; then
      exit 1
    fi
    ;;
  *)
    echo "Unsupported SUPABASE_TYPES_MODE '$MODE'. Expected 'remote' or 'local'." >&2
    exit 1
    ;;
esac

if ! cmp -s "$TMP_FILE" "$TARGET_FILE"; then
  echo "Supabase types are out of date. Run 'pnpm gen:types' and commit the updated file." >&2
  if command -v git >/dev/null 2>&1; then
    git --no-pager diff --no-index --color=always "$TARGET_FILE" "$TMP_FILE" || true
  elif command -v diff >/dev/null 2>&1; then
    diff -u "$TARGET_FILE" "$TMP_FILE" || true
  fi
  exit 1
fi

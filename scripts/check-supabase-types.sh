#!/usr/bin/env bash
set -euo pipefail

TARGET_FILE="apps/admin/lib/supabase/types.ts"
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

supabase gen types typescript --local >"$TMP_FILE"

if ! cmp -s "$TMP_FILE" "$TARGET_FILE"; then
  echo "Supabase types are out of date. Run 'pnpm gen:types' and commit the updated file." >&2
  if command -v git >/dev/null 2>&1; then
    git --no-pager diff --no-index --color=always "$TARGET_FILE" "$TMP_FILE" || true
  elif command -v diff >/dev/null 2>&1; then
    diff -u "$TARGET_FILE" "$TMP_FILE" || true
  fi
  exit 1
fi

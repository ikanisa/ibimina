#!/usr/bin/env bash
set -euo pipefail

# Config
PROJECT_REF="${PROJECT_REF:-${SUPABASE_PROJECT_REF:-}}"
ENV_NAME="${ENV_NAME:-unknown}"
SCHEMA_FILE="${SCHEMA_FILE:-supabase/schema.sql}"   # canonical generated snapshot
EXPECTED_BRANCH="${EXPECTED_BRANCH:-main}"           # change if needed

echo "==> [${ENV_NAME}] Verifying Supabase schema & migrations"

# 1) Ensure CLI is logged in (token recommended in CI)
if ! supabase --version >/dev/null 2>&1; then
  echo "Supabase CLI not found"; exit 1;
fi

# 2) Confirm project link
if ! grep -q "project_ref" supabase/config.toml; then
  echo "Project not linked. Run: supabase link --project-ref <ref>"; exit 1;
fi

# 3) Pull remote DB schema for comparison (no data)
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "==> Pulling remote schema snapshot"
supabase db pull --use-migra --schema public --local "$TMP_DIR/remote_schema.sql" >/dev/null

# 4) Generate local snapshot from migrations (purely from files)
echo "==> Building local snapshot from migrations"
supabase db diff --schema public --linked --sql-only >/dev/null 2>&1 || true # warm-up; ignore
supabase migration list --format json > "$TMP_DIR/migrations.json"

# Rebuild local schema.sql deterministically (no network)
supabase gen types typescript --linked >/dev/null 2>&1 || true # harmless; warms connection
supabase db build --schema public --output "$TMP_DIR/local_schema.sql"

# 5) Normalize & compare (ignore comments/whitespace)
normalize() { sed -E 's/--.*$//g' "$1" | tr -d '\r' | sed '/^[[:space:]]*$/d'; }

if ! diff -u <(normalize "$TMP_DIR/local_schema.sql") <(normalize "$TMP_DIR/remote_schema.sql"); then
  echo "❌ Schema drift detected between migrations and remote DB."
  echo "   -> A migration may be missing or out-of-order."
  echo "Hints:"
  echo " - If remote is ahead: run 'supabase db pull' locally, then create a corrective migration."
  echo " - If local is ahead: apply migrations to the env (staging/prod) before deploy."
  exit 2
fi

# 6) Ensure canonical schema snapshot is up to date (optional but nice)
if ! cmp -s "$TMP_DIR/local_schema.sql" "$SCHEMA_FILE"; then
  echo "⚠️ Updating canonical $SCHEMA_FILE to reflect current migrations."
  mkdir -p "$(dirname "$SCHEMA_FILE")"
  cp "$TMP_DIR/local_schema.sql" "$SCHEMA_FILE"
  # If running in CI, treat stale snapshot as failure to force commit
  if [[ "${CI:-}" == "true" ]]; then
    echo "❌ schema.sql was stale. Commit the refreshed file."
    exit 3
  fi
fi

# 7) Smoke‑check migrations apply cleanly (dry-run)
echo "==> Dry-run applying migrations to a scratch DB"
supabase db reset --dry-run >/dev/null

echo "✅ Schema verified. No drift; migrations apply cleanly."

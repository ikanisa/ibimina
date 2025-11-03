#!/usr/bin/env bash
set -euo pipefail

if [[ "${GITHUB_ACTIONS:-false}" != "true" ]]; then
  echo "This helper is intended for CI usage and requires the GitHub Actions runtime." >&2
fi

if [[ -z "${GITHUB_ENV:-}" ]]; then
  echo "GITHUB_ENV is not defined; unable to export secrets." >&2
  exit 1
fi

SECRET_ID="${1:-}"
if [[ -z "$SECRET_ID" ]]; then
  echo "Usage: $0 <aws-secrets-manager-secret-id>" >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI is required to fetch secrets" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to parse AWS Secrets Manager JSON payloads" >&2
  exit 1
fi

SECRET_PAYLOAD=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ID" --query 'SecretString' --output text)

if [[ -z "$SECRET_PAYLOAD" || "$SECRET_PAYLOAD" == "None" ]]; then
  echo "Secret payload is empty; skipping export" >&2
  exit 0
fi

TEMP_ENV=$(mktemp)
trap 'rm -f "$TEMP_ENV"' EXIT

echo "$SECRET_PAYLOAD" \
  | jq -r 'to_entries[] | select(.value != null) | "\(.key)=\(.value)"' > "$TEMP_ENV"

SECRET_COUNT=$(wc -l < "$TEMP_ENV" | tr -d ' ')

while IFS= read -r SECRET_LINE || [[ -n "$SECRET_LINE" ]]; do
  # Skip empty lines to avoid emitting useless mask commands
  if [[ -z "$SECRET_LINE" ]]; then
    continue
  fi

  SECRET_VALUE="${SECRET_LINE#*=}"
  if [[ -n "$SECRET_VALUE" ]]; then
    echo "::add-mask::${SECRET_VALUE}"
  fi
done < "$TEMP_ENV"

cat "$TEMP_ENV" >> "$GITHUB_ENV"

echo "Loaded $SECRET_COUNT secrets from AWS Secrets Manager"

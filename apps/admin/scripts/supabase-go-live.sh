#!/usr/bin/env bash
set -euo pipefail

COMMAND=${1:-}
ENV_FILE=${SUPABASE_SECRETS_FILE:-supabase/.env.production}
PROJECT_REF=${SUPABASE_PROJECT_REF:-}

FUNCTIONS=(
  admin-reset-mfa
  analytics-forecast
  bootstrap-admin
  export-report
  export-statement
  gsm-maintenance
  payments-apply
  import-statement
  ingest-sms
  invite-user
  metrics-exporter
  parse-sms
  recon-exceptions
  reporting-summary
  reports-export
  scheduled-reconciliation
  secure-import-members
  settle-payment
  sms-ai-parse
  sms-inbox
  sms-review
)

usage() {
  cat <<USAGE
Usage: $0 <command>

Commands:
  bootstrap         Run migrations, set secrets (if file present), deploy functions
  migrate           Apply pending migrations to the linked project
  set-secrets       Run 'supabase secrets set --env-file ${ENV_FILE}'
  deploy-functions  Deploy all edge functions listed in this script

Environment variables:
  SUPABASE_PROJECT_REF   (required) project reference, e.g. vacltfdslodqybxojytc
  SUPABASE_SECRETS_FILE  path to secrets env file (default: supabase/.env.production)

Before running, ensure:
  - 'supabase login' has been executed with an access token
  - 'supabase link --project-ref $SUPABASE_PROJECT_REF' has been run in this repo
USAGE
}

require_project_ref() {
  if [[ -z "${PROJECT_REF}" ]]; then
    echo "SUPABASE_PROJECT_REF is not set" >&2
    exit 1
  fi
}

run_migrations() {
  echo "Applying database migrations…"
  supabase migration up --linked --include-all --yes
}

run_set_secrets() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    echo "Secrets file '${ENV_FILE}' not found. Skipping." >&2
    return 0
  fi
  echo "Setting Supabase secrets from ${ENV_FILE}…"
  supabase secrets set --env-file "${ENV_FILE}"
}

deploy_functions() {
  echo "Deploying edge functions…"
  for fn in "${FUNCTIONS[@]}"; do
    echo "  -> $fn"
    supabase functions deploy "$fn"
  done
}

case "${COMMAND}" in
  bootstrap)
    require_project_ref
    run_migrations
    run_set_secrets
    deploy_functions
    ;;
  migrate)
    require_project_ref
    run_migrations
    ;;
  set-secrets)
    require_project_ref
    run_set_secrets
    ;;
  deploy-functions)
    require_project_ref
    deploy_functions
    ;;
  *)
    usage
    exit 1
    ;;
 esac

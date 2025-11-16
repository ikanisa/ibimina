#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PNPM_VERSION="$(node -p "require('${ROOT_DIR}/package.json').packageManager.split('@')[1]")"

info() { echo -e "\033[1;34m[bootstrap]\033[0m $1"; }
success() { echo -e "\033[1;32m[bootstrap]\033[0m $1"; }
warn() { echo -e "\033[1;33m[bootstrap]\033[0m $1"; }

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    local current_version
    current_version="$(pnpm --version)"
    if [[ "$current_version" != "$PNPM_VERSION" ]]; then
      warn "pnpm $current_version found; activating $PNPM_VERSION via Corepack"
      corepack prepare "pnpm@${PNPM_VERSION}" --activate
    fi
  else
    info "pnpm not found; enabling Corepack and installing ${PNPM_VERSION}"
    corepack enable
    corepack prepare "pnpm@${PNPM_VERSION}" --activate
  fi
}

copy_template() {
  local source="$1"
  local target="$2"

  if [[ -f "${ROOT_DIR}/${target}" ]]; then
    return
  fi

  if [[ -f "${ROOT_DIR}/${source}" ]]; then
    info "Creating ${target} from ${source}"
    cp "${ROOT_DIR}/${source}" "${ROOT_DIR}/${target}"
  else
    warn "Skipped ${target}; template ${source} not found"
  fi
}

run_bootstrap() {
  cd "$ROOT_DIR"

  ensure_pnpm

  info "Installing workspace dependencies"
  PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}" pnpm install --frozen-lockfile

  info "Ensuring env templates exist"
  copy_template ".env.example" ".env"
  copy_template ".env.example" ".env.local"
  copy_template "supabase/.env.example" "supabase/.env.local"
  copy_template "apps/website/.env.example" "apps/website/.env.local"

  if [[ "${SKIP_ENV_VALIDATION:-0}" != "1" ]]; then
    info "Running environment validation"
    pnpm run check:env
  else
    warn "Skipping environment validation because SKIP_ENV_VALIDATION=1"
  fi

  info "Running lint smoke test"
  pnpm run lint

  success "Bootstrap complete"
}

run_bootstrap

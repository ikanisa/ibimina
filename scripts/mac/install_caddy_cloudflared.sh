#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

function err() {
  printf "\033[31mERROR:\033[0m %s\n" "$1" >&2
}

function check_dependency() {
  local cmd="$1"
  local install_hint="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "Missing dependency: '$cmd'. ${install_hint}"
    exit 1
  fi
}

check_dependency "brew" "Install Homebrew from https://brew.sh/."

if ! brew bundle --help >/dev/null 2>&1; then
  err "The 'brew bundle' command is unavailable. Run 'brew tap homebrew/bundle' to enable it."
  exit 1
fi

BREWFILE_CANDIDATES=()
if [[ -n "${BREWFILE:-}" ]]; then
  BREWFILE_CANDIDATES+=("$BREWFILE")
fi
BREWFILE_CANDIDATES+=(
  "$SCRIPT_DIR/Brewfile"
  "$REPO_ROOT/Brewfile"
  "$REPO_ROOT/Brewfile.mac"
)

SELECTED_BREWFILE=""
for candidate in "${BREWFILE_CANDIDATES[@]}"; do
  if [[ -f "$candidate" ]]; then
    SELECTED_BREWFILE="$candidate"
    break
  fi
done

if [[ -z "$SELECTED_BREWFILE" ]]; then
  err "Could not find a Brewfile. Looked in:\n  - ${BREWFILE_CANDIDATES[*]}\nSet the BREWFILE environment variable to point to a valid Brewfile."
  exit 1
fi

printf "Using Brewfile: %s\n" "$SELECTED_BREWFILE"

brew bundle --file "$SELECTED_BREWFILE"

cat <<'NEXT_STEPS'

Next steps:
  1. Authenticate with Cloudflare if required:
       cloudflared login
  2. Start Caddy in the foreground (helpful for debugging):
       scripts/mac/caddy_up.sh
     or run it in the background:
       scripts/mac/caddy_bg.sh
  3. Start Cloudflared (foreground):
       scripts/mac/tunnel_up.sh
     or run it in the background:
       scripts/mac/tunnel_bg.sh

Use the corresponding *_down.sh scripts to stop background services.
NEXT_STEPS

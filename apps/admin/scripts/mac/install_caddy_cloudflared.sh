#!/usr/bin/env bash
set -euo pipefail

# Trap errors for better debugging
trap 'echo "Error on line $LINENO. Exit code: $?" >&2' ERR

# Get script directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Error reporting function
function err() {
  printf "\033[31mERROR:\033[0m %s\n" "$1" >&2
}

# Success message function
function success() {
  printf "\033[32m✓\033[0m %s\n" "$1"
}

# Dependency checking function
function check_dependency() {
  local cmd="$1"
  local install_hint="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "Missing dependency: '$cmd'. ${install_hint}"
    exit 1
  fi
}

# Validate we're on macOS
if [[ "$(uname -s)" != "Darwin" ]]; then
  err "This script is designed for macOS only."
  echo "For other platforms, please install Caddy and Cloudflared manually."
  exit 1
fi

# Check for Homebrew
check_dependency "brew" "Install Homebrew from https://brew.sh/"

# Check for brew bundle command
if ! brew bundle --help >/dev/null 2>&1; then
  err "The 'brew bundle' command is unavailable."
  echo "Run 'brew tap homebrew/bundle' to enable it."
  exit 1
fi

# Find Brewfile
BREWFILE_CANDIDATES=()
if [[ -n "${BREWFILE:-}" ]]; then
  BREWFILE_CANDIDATES+=("$BREWFILE")
fi
BREWFILE_CANDIDATES+=(
  "$SCRIPT_DIR/Brewfile"
  "$REPO_ROOT/Brewfile"
  "$REPO_ROOT/Brewfile.mac"
  "$REPO_ROOT/infra/mac/Brewfile"
)

SELECTED_BREWFILE=""
for candidate in "${BREWFILE_CANDIDATES[@]}"; do
  if [[ -f "$candidate" ]]; then
    SELECTED_BREWFILE="$candidate"
    break
  fi
done

if [[ -z "$SELECTED_BREWFILE" ]]; then
  err "Could not find a Brewfile."
  echo "Searched in:"
  for candidate in "${BREWFILE_CANDIDATES[@]}"; do
    echo "  - $candidate"
  done
  echo ""
  echo "Set the BREWFILE environment variable to point to a valid Brewfile."
  exit 1
fi

echo "Using Brewfile: $SELECTED_BREWFILE"
echo ""

# Install dependencies
if brew bundle --file "$SELECTED_BREWFILE"; then
  success "Dependencies installed successfully"
else
  err "Failed to install dependencies"
  exit 1
fi

# Print next steps
cat <<'NEXT_STEPS'

════════════════════════════════════════════════════════════════
Next Steps
════════════════════════════════════════════════════════════════

1. Authenticate with Cloudflare (if required):
   $ cloudflared login

2. Start Caddy:
   Foreground (for debugging):
     $ scripts/mac/caddy_up.sh
   Background:
     $ scripts/mac/caddy_bg.sh

3. Start Cloudflared tunnel:
   Foreground (for debugging):
     $ scripts/mac/tunnel_up.sh
   Background:
     $ scripts/mac/tunnel_bg.sh

4. Stop background services:
   $ scripts/mac/caddy_down.sh
   $ scripts/mac/tunnel_down.sh

════════════════════════════════════════════════════════════════
NEXT_STEPS

success "Installation complete"

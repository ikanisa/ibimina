#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

export NODE_ENV="${NODE_ENV:-production}"
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"
export NODE_PATH="${APP_DIR}/node_modules${NODE_PATH:+:${NODE_PATH}}"

if [ ! -d ".next" ]; then
  echo "Missing .next build artifacts. Run 'pnpm run build' before calling start." >&2
  exit 1
fi

PORT_ENV="${PORT:-3000}"
HOST_ENV="${HOSTNAME:-0.0.0.0}"
EXTRA_ARGS=()
USE_STANDALONE="${ADMIN_USE_STANDALONE_START:-${USE_STANDALONE_START:-1}}"

while (($#)); do
  case "$1" in
    --port|-p)
      if [ -z "${2:-}" ]; then
        echo "Missing value for --port" >&2
        exit 1
      fi
      PORT_ENV="$2"
      shift 2
      ;;
    --hostname|--host|-H)
      if [ -z "${2:-}" ]; then
        echo "Missing value for --hostname" >&2
        exit 1
      fi
      HOST_ENV="$2"
      shift 2
      ;;
    *)
      EXTRA_ARGS+=("$1")
      shift
      ;;
  esac
done

export PORT="$PORT_ENV"
export HOSTNAME="$HOST_ENV"

if [ "$USE_STANDALONE" = "1" ] && [ -d ".next/standalone" ]; then
  if [ ! -L ".next/standalone/node_modules" ]; then
    rm -rf ".next/standalone/node_modules"
    ln -s "$APP_DIR/node_modules" ".next/standalone/node_modules"
  fi
  STANDALONE_DIST=".next/standalone/node_modules/next/dist"
  if [ ! -f "$STANDALONE_DIST/server/lib/cpu-profile.js" ] || [ ! -f "$STANDALONE_DIST/lib/get-network-host.js" ]; then
    SOURCE_DIST="$(node -p "require('path').join(require('path').dirname(require.resolve('next/package.json')), 'dist')" 2>/dev/null || true)"
    if [ -n "$SOURCE_DIST" ] && [ -d "$SOURCE_DIST" ]; then
      mkdir -p "$STANDALONE_DIST"
      rsync -a "$SOURCE_DIST"/ "$STANDALONE_DIST"/ >/dev/null
    fi
  fi
  if [ -d ".next/server/vendor-chunks" ]; then
    mkdir -p ".next/standalone/.next/server"
    rsync -a --delete ".next/server/vendor-chunks" ".next/standalone/.next/server/" >/dev/null
  fi
  if [ "${#EXTRA_ARGS[@]}" -gt 0 ]; then
    exec node .next/standalone/server.js "${EXTRA_ARGS[@]}"
  else
    exec node .next/standalone/server.js
  fi
fi

if [ "${#EXTRA_ARGS[@]}" -gt 0 ]; then
  exec pnpm exec next start --hostname "$HOSTNAME" --port "$PORT" "${EXTRA_ARGS[@]}"
else
  exec pnpm exec next start --hostname "$HOSTNAME" --port "$PORT"
fi

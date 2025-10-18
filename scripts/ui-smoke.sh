#!/usr/bin/env bash
set -euo pipefail

BYPASS_TOKEN="vPBDHSvo4eEDu8FS3MeVzVGoszMH0umr"
BASE_URL="https://ibimina-f4i1hfzof-ikanisa.vercel.app"
COOKIE_JAR="/tmp/sacco_smoke_$(date +%s).cookies"
EMAIL="info@ikanisa.com"
PASSWORD="MoMo!!0099"

function cleanup {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT SIGINT SIGTERM

# Acquire bypass cookie
curl -s -c "$COOKIE_JAR" "${BASE_URL}/?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${BYPASS_TOKEN}" >/dev/null

# Hit the login page to grab any CSRF tokens (not used in this simple fetch)
curl -s -b "$COOKIE_JAR" -H "x-vercel-protection-bypass: ${BYPASS_TOKEN}" "${BASE_URL}/login" >/dev/null

# Ask Supabase Auth password grant to ensure credentials work
auth_response=$(curl -s -o /tmp/auth_response.json -w "%{http_code}" \
  "https://vacltfdslodqybxojytc.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY2x0ZmRzbG9kcXlieG9qeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzI3MzUsImV4cCI6MjA3NTU0ODczNX0.XBJckvtgeWHYbKSnd1ojRd7mBKjdk5OSe0VDqS1PapM" \
  -H "Content-Type: application/json" \
  --data "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if [[ "$auth_response" != "200" ]]; then
  echo "[ui-smoke] Supabase Auth password grant failed with HTTP $auth_response" >&2
  cat /tmp/auth_response.json >&2
  exit 1
fi

# Touch a trivial dynamic route (dashboard) to confirm bypass works
curl -s -o /tmp/dashboard.html -w "%{http_code}" -b "$COOKIE_JAR" -H "x-vercel-protection-bypass: ${BYPASS_TOKEN}" "${BASE_URL}/dashboard" >/tmp/dashboard_status
if [[ "$(cat /tmp/dashboard_status)" != "200" ]]; then
  echo "[ui-smoke] dashboard fetch failed" >&2
  sed -n '1,40p' /tmp/dashboard.html >&2
  exit 1
fi

echo "[ui-smoke] UI bypass + Supabase auth handshake OK"

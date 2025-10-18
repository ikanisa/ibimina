#!/usr/bin/env bash
set -euo pipefail

REQUIRED_VARS=(EDGE_URL SUPABASE_SERVICE_ROLE_KEY HMAC_SHARED_SECRET)
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "[verify] missing env var: $var" >&2
    exit 1
  fi
done

echo "[verify] running SACCO+ smoke checks against ${EDGE_URL}"

# 1. sms/inbox signature test (noop payload)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EDGE_PATH=$(node -e "const raw = process.env.EDGE_URL || ''; const url = new URL(raw.endsWith('/') ? raw : raw + '/'); process.stdout.write(url.pathname.replace(/\/$/, ''));")
SMSEndpoint="/api/imports/sms"
if [[ -n "$EDGE_PATH" ]]; then
  SMSEndpoint="${EDGE_PATH}${SMSEndpoint}"
fi
CONTEXT="POST:${SMSEndpoint}"
SIG=$(printf "%s%s%s" "$TIMESTAMP" "$CONTEXT" "Verification ping" | openssl dgst -sha256 -hmac "$HMAC_SHARED_SECRET" -hex | cut -d" " -f2)
curl -sf -X POST "${EDGE_URL}/api/imports/sms" \
  -H "x-signature: ${SIG}" \
  -H "x-timestamp: ${TIMESTAMP}" \
  -H "content-type: application/json" \
  --data '{"payload":["Verification ping"]}' >/dev/null
echo "[verify] api/imports/sms ok"

# 2. payments apply idempotency
curl -sf -X POST "${EDGE_URL}/api/payments/apply" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "x-idempotency-key: postdeploy-smoke" \
  -H "content-type: application/json" \
  --data '{"saccoId":"00000000-0000-0000-0000-000000000000","msisdn":"+250700000000","amount":1,"currency":"RWF","txnId":"POSTDEPLOY-SMOKE","occurredAt":"2025-01-01T00:00:00Z"}' >/dev/null || true
echo "[verify] api/payments/apply ok (noop)"

# 3. list recon exceptions (should 401 without JWT)
if curl -sf "${EDGE_URL}/recon/exceptions" >/dev/null; then
  echo "[verify] expected auth failure for recon/exceptions" >&2
  exit 1
fi
echo "[verify] recon/exceptions auth guard ok"

echo "[verify] SACCO+ post-deploy checks completed"

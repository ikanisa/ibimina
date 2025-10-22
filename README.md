# Ibimina Staff Console — Next.js App Router

A staff-only Progressive Web App for Umurenge SACCO ibimina operations. The UI foundation now matches the Rwanda-inspired liquid-glass spec: Next.js 15 App Router, mobile-first gradients, Framer Motion transitions, and Supabase-backed semantic SACCO search.

## Branching model

- `main` is the deployment-ready default branch and now tracks the latest reviewed `work` refactor.
- `work` remains the integration branch for active feature development; open pull requests should continue to target `work` until they are ready to be promoted.
- After validation, merge `work` into `main` (fast-forward preferred) so production containers and local staging environments stay aligned with the most recent authenticated flows.

## Tech stack

- Next.js 15 (App Router, typed routes)
- TypeScript + Tailwind design tokens (`styles/tokens.css`)
- Framer Motion for page transitions
- Supabase (`@supabase/ssr`) for auth and data
- PWA manifest & service worker ready for production deploys

## Getting started

```bash
npm install
npm run dev
```

Set the required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key
```

Copy `.env.example` to `.env` (for the Next.js app) and populate Supabase secrets separately using `supabase secrets set --env-file supabase/.env.production` during deployment.

## Running Supabase migrations

The Umurenge SACCO master list is seeded by the latest SQL migration:

```
supabase/migrations/20251008120000_enrich_saccos_with_umurenge_master.sql
```

Run this migration via the Supabase SQL console (or through your preferred admin workflow) to apply the schema updates, semantic search function, and the 416 Umurenge SACCO records captured in `supabase/data/umurenge_saccos.json`.

## Project layout

```
app/                     # App Router routes
  (auth)/                # Auth shell + login
  (main)/                # Dashboard, Ikimina, Recon, Reports, Admin
components/              # Shared UI building blocks
lib/supabase/            # Supabase client + typed schema
providers/               # Motion + theme + profile contexts
styles/                  # Global design tokens
supabase/                # Config, migrations, seed data
```

## Supabase integration

- `lib/supabase/server.ts` exposes a server-side client that reads the session cookie (no project linking required).
- `lib/auth.ts` centralises user/session lookups and guards the `(main)` route group.
- Dashboard, Ikimina, Recon, Reports, and Admin pages now query Supabase directly in server components.
- See `docs/go-live-checklist.md` for the full Supabase bootstrap sequence (migrations, secrets, edge functions, GSM ingestion).

## SACCO+ Supabase backend

The SACCO+ runtime lives under `supabase/` and is documented in:

- `docs/DB-SCHEMA.md` – entity model, columns, helper functions
- `docs/RLS.md` – policy matrix covering SACCO staff vs system admins
- `docs/API-EDGE.md` – Edge Function endpoints, auth model, rate limits

### Local bootstrap

```bash
supabase start
supabase db reset
supabase functions serve sms-inbox --no-verify-jwt
supabase functions serve payments-apply
```

Provision secrets once per project (service role, HMAC, AI, crypto keys, report signing):

```bash
supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  OPENAI_API_KEY=$OPENAI_API_KEY \
  HMAC_SHARED_SECRET=$HMAC_SHARED_SECRET \
  KMS_DATA_KEY_BASE64=$KMS_DATA_KEY_BASE64 \
  BACKUP_PEPPER=$BACKUP_PEPPER \
  TRUSTED_COOKIE_SECRET=$TRUSTED_COOKIE_SECRET \
  REPORT_SIGNING_KEY=$REPORT_SIGNING_KEY \
  EMAIL_OTP_PEPPER=$EMAIL_OTP_PEPPER \
  RESEND_API_KEY=$RESEND_API_KEY \
  MFA_EMAIL_FROM=$MFA_EMAIL_FROM
```

- Passkeys + TOTP: set `MFA_RP_ID`, `MFA_ORIGIN`, and optional `MFA_RP_NAME` so WebAuthn challenges issue against the correct relying party. Staff can enroll hardware-backed passkeys alongside authenticator apps from **Profile → Security**.

### Smoke cURL tests

```bash
# sms inbox (text/plain)
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BODY='You have received RWF 20,000 from 0788... Ref NYA.GAS.TWIZ.001 TXN 12345 at 2025-10-01 12:00'
# Adjust context if your EDGE_URL path differs (default Supabase deployments use /functions/v1)
CONTEXT="POST:/functions/v1/sms/inbox"
SIG=$(printf "%s%s%s" "$TS" "$CONTEXT" "$BODY" | openssl dgst -sha256 -hmac "$HMAC_SHARED_SECRET" -hex | cut -d" " -f2)
curl -i -X POST "$EDGE_URL/sms/inbox" \
  -H "x-signature: $SIG" \
  -H "x-timestamp: $TS" \
  -H "content-type: text/plain" \
  --data "$BODY"

# AI parse fallback
curl -i -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "content-type: application/json" \
  -d '{"smsInboxId":"<uuid>"}' \
  "$EDGE_URL/sms/ai-parse"

# payments apply (idempotent)
curl -i -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "x-idempotency-key: demo-1" \
  -H "content-type: application/json" \
  -d '{"saccoId":"<uuid>","msisdn":"+250788...","amount":20000,"currency":"RWF","txnId":"12345","occurredAt":"2025-10-01T12:00:00Z","reference":"NYA.GAS.TWIZ.001"}' \
  "$EDGE_URL/payments/apply"
```

After each deploy run `scripts/postdeploy-verify.sh` to apply cron job health checks, invoke smoke tests, and confirm secrets.

## Observability & Ops

- `supabase/functions/metrics-exporter` exposes Prometheus gauges covering SMS/notification backlog, payments, and exporter health.
- Run `docker compose up` inside `infra/metrics` to launch Prometheus + Grafana locally; the default dashboard (`ibimina-operations`) is provisioned automatically.
- Operational runbooks live in `docs/security-observability.md`, feature flag procedures in `docs/operations/feature-flags.md`, and MFA rollout guidance in `docs/operations/mfa-rollout.md`.

### GSM modem ingestion

Edge functions no longer expect a third-party SMS webhook. The GSM modem reader can forward messages straight to Supabase by either inserting directly into `public.sms_inbox` with a service-role key or by invoking the `ingest-sms` edge function with the standard Supabase `Authorization: Bearer <service_role_key>` header:

```
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
INGEST_CONTEXT="POST:/functions/v1/ingest-sms"
PAYLOAD='{"rawText":"15000 AIRTEL 2505221230 REF.KIG/NYARUGENGE.G2.M001","receivedAt":"2025-10-09T07:21:12Z","vendorMeta":{"modemPort":"usb0"}}'
INGEST_SIG=$(printf "%s%s%s" "$TS" "$INGEST_CONTEXT" "$PAYLOAD" | openssl dgst -sha256 -hmac "$HMAC_SHARED_SECRET" -hex | cut -d" " -f2)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-signature: $INGEST_SIG" \
  -H "x-timestamp: $TS" \
  https://<project-ref>.supabase.co/functions/v1/ingest-sms \
  -d "$PAYLOAD"
```

`ingest-sms` still runs parsing, deduplication, ledger posting, and auditing, but no longer checks `SMS_SHARED_SECRET`. Adjust rate limits if needed with `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_SECONDS` secrets.

## Recent polish

- Revamped the AppShell with bilingual navigation, skip links, quick actions, and a global search palette that exposes semantic SACCO lookup.
- Extended global search to surface ikimina, members, and recent payments with bilingual microcopy baked into the palette.
- Expanded client-side search across Ikimina directories while keeping upload wizards and RPC-powered SACCO picking in sync with Supabase.
- Rounded out accessibility with consistent focus treatments, bilingual microcopy, and a `viewport` export that advertises the active theme colour.

## Scripts

- `npm run dev` – start the dev server on port 3000
- `npm run build` – production build with PWA bundling
- `npm run start` – serve the built app on port 3000 (127.0.0.1)
- `npm run lint` – lint the project
- `npm run typecheck` – run TypeScript without emitting files
- `npm run check:lighthouse` – open a Lighthouse report against localhost
- `npm run analyze:pwa` – run Lighthouse PWA checks against `https://localhost:3000`
- `npm run verify:pwa` – validate manifest/head/service worker and probe `/api/health`
- `npm run check:i18n` – ensure en/rw/fr have matching keys
- `npm run check:i18n:consistency` – enforce canonical glossary terms across locales
- `npm run fix:i18n` – backfill missing rw/fr keys from en (flat keys)
 

Deployments run through your self-hosted CI/CD pipeline; push changes when you’re ready to release to your local or on-prem infrastructure.

 

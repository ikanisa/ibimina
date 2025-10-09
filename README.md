# Ibimina Staff Console — Next.js App Router

A staff-only Progressive Web App for Umurenge SACCO ibimina operations. The UI foundation now matches the Rwanda-inspired liquid-glass spec: Next.js 15 App Router, mobile-first gradients, Framer Motion transitions, and Supabase-backed semantic SACCO search.

## Tech stack

- Next.js 15 (App Router, typed routes)
- TypeScript + Tailwind design tokens (`styles/tokens.css`)
- Framer Motion for page transitions
- Supabase (`@supabase/ssr`) for auth and data
- PWA manifest & service worker ready for Lovable Cloud deploys

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

Run this migration inside Lovable Cloud’s SQL console (or through your preferred Supabase admin workflow) to apply the schema updates, semantic search function, and the 416 Umurenge SACCO records captured in `supabase/data/umurenge_saccos.json`.

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

- `lib/supabase/server.ts` exposes a server-side client that reads the session cookie (no project linking required in Lovable Cloud).
- `lib/auth.ts` centralises user/session lookups and guards the `(main)` route group.
- Dashboard, Ikimina, Recon, Reports, and Admin pages now query Supabase directly in server components.
- See `docs/go-live-checklist.md` for the full Supabase bootstrap sequence (migrations, secrets, edge functions, GSM ingestion).

## Observability & Ops

- `supabase/functions/metrics-exporter` exposes Prometheus gauges covering SMS/notification backlog, payments, and exporter health.
- Run `docker compose up` inside `infra/metrics` to launch Prometheus + Grafana locally; the default dashboard (`ibimina-operations`) is provisioned automatically.
- Operational runbooks live in `docs/security-observability.md`, feature flag procedures in `docs/operations/feature-flags.md`, and MFA rollout guidance in `docs/operations/mfa-rollout.md`.

### GSM modem ingestion

Edge functions no longer expect a third-party SMS webhook. The GSM modem reader can forward messages straight to Supabase by either inserting directly into `public.sms_inbox` with a service-role key or by invoking the `ingest-sms` edge function with the standard Supabase `Authorization: Bearer <service_role_key>` header:

```
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://<project-ref>.supabase.co/functions/v1/ingest-sms \
  -d '{
        "rawText": "15000 AIRTEL 2505221230 REF.KIG/NYARUGENGE.G2.M001",
        "receivedAt": "2025-10-09T07:21:12Z",
        "vendorMeta": {"modemPort": "usb0"}
      }'
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
- `npm run check:lighthouse` – open a Lighthouse report against localhost
- `npm run analyze:pwa` – run Lighthouse PWA checks against `https://localhost:3000`
- `npm run verify:pwa` – validate manifest/head/service worker and probe `/api/health`

Deployments continue through Lovable Cloud; push changes or publish from the Lovable dashboard when ready.

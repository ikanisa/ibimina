# Changelog

All notable changes to this project will be documented in this file. Dates are
in YYYY-MM-DD.

## [0.1.3] - 2025-10-16

- Normalised SACCO search slugs via helper-trigger pipeline and backfilled data;
  staging history now records `20251015000000_client_app` so replaying
  migrations on fresh databases no longer breaks, and schema changes remain
  reproducible across
  environments.【F:supabase/migrations/20251020134500_fix_search_slug.sql†L1-L47】【F:supabase/migrations/20251015000000_client_app.sql†L1-L10】
- Added a security adoption dashboard for administrators, surfacing MFA coverage
  metrics, at-risk accounts, and SACCO-by-SACCO coverage alongside outreach
  automation
  tooling.【F:app/(main)/admin/page.tsx†L237-L309】【F:components/admin/mfa-insights-card.tsx†L1-L199】【F:lib/mfa/insights.ts†L1-L192】
- Added scheduled report subscriptions with localized UI controls and
  Supabase-backed automation so SACCO leadership receives recurring PDFs and
  CSVs
  automatically.【F:components/reports/report-subscriptions-card.tsx†L1-L236】【F:app/(main)/reports/actions.ts†L1-L164】
- Introduced the `app.report_subscriptions` table, policies, and triggers to
  persist export plans securely under SACCO row-level
  security.【F:supabase/migrations/20251016090000_add_report_subscriptions.sql†L1-L64】
- Added a first-party `/api/reports/export` endpoint that streams RLS-scoped
  CSVs with optional separators and HMAC signatures, ensuring admins and SACCO
  staff can self-serve ledger exports without relying on edge
  functions.【F:app/api/reports/export/route.ts†L1-L220】
- Added `/api/imports/statement` and `/api/imports/sms` REST entrypoints that
  enforce SACCO permissions, call Supabase ingestion functions, and return rich
  summaries now consumed by the statement import wizard for both file and SMS
  workflows.【F:app/api/imports/statement/route.ts†L1-L157】【F:app/api/imports/sms/route.ts†L1-L248】【F:components/ikimina/statement-import-wizard.tsx†L1-L566】
- Hardened MFA issuance by hashing all rate-limit keys, throttling
  `/api/mfa/initiate` per user and IP, and salting WhatsApp OTP storage to align
  with AuthX replay
  protections.【F:app/api/mfa/initiate/route.ts†L1-L78】【F:src/auth/limits.ts†L1-L71】【F:lib/authx/start.ts†L1-L139】
- Improved offline resilience by caching authenticated API responses, linking
  the offline queue to Background Sync, and polishing quick action/install
  banner focus management for WCAG
  compliance.【F:service-worker.js†L1-L176】【F:providers/offline-queue-provider.tsx†L1-L233】【F:components/layout/app-shell.tsx†L1-L420】【F:components/system/add-to-home-banner.tsx†L1-L112】【F:lib/offline/sync.ts†L1-L44】

## [0.1.2] - 2025-10-10

- CI hardening: add TypeScript typecheck, cache Next.js build, enforce i18n key
  parity, and add glossary consistency check.
- i18n: update rw/fr translations; add fixer and consistency scripts; add i18n
  glossary docs.
- Developer UX: add PR template and README updates.

See details: docs/releases/2025-10-10-ci-i18n-hardening.md

## [0.1.1] - 2025-10-10

- i18n migration and cleanup: moved UI to t()/Trans, expanded dictionaries, and
  polished Recon/Profile/Ikimina strings.

See details: docs/releases/2025-10-10-i18n-migration.md

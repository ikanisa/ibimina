# Changelog

All notable changes to this project will be documented in this file. Dates are
in YYYY-MM-DD.

## [1.0.0] - 2025-12-05

### Added

- Finalised architecture docs (`ARCHITECTURE.md`, `docs/REPORT.md`) covering
  Vercel ↔ Supabase topology, RLS validation, and operational runbooks.
- Published go-live collateral (`GO_LIVE_CHECKLIST.md`, `docs/ENVIRONMENT.md`,
  `docs/RLS_TESTS.md`, `docs/MOBILE_RELEASE.md`) to govern deployments and
  migrations.
- Authored release notes for Vercel production launch and Supabase migration
  batch (`docs/releases/2025-12-05-vercel-supabase.md`).

### Verification

- `pnpm run check:deploy`
- `pnpm --filter @ibimina/testing run test:rls`
- Supabase migration diff archived in release PR attachments.

See details: `docs/releases/2025-12-05-vercel-supabase.md`

## [0.1.4] - 2025-11-01

- Captured the cross-platform refactor inventory in `docs/REFACTOR_PLAN.md` to
  drive the PR `00` → `10` programme and surface risk hotspots for reviewers.
- Documented that no schema or runtime changes ship in this planning PR; all
  follow-up work remains in subsequent branches.

See details: docs/releases/2025-11-01-pr00-refactor-plan.md

## [0.1.3] - 2025-10-16

### Added

- Normalised SACCO search slugs via helper-trigger pipeline with reproducible
  migrations (`20251020134500_fix_search_slug.sql`,
  `20251015000000_client_app.sql`).
- Introduced security adoption dashboard surfacing MFA coverage and outreach
  automation (`app/(main)/admin/page.tsx`,
  `components/admin/mfa-insights-card.tsx`, `lib/mfa/insights.ts`).
- Added scheduled report subscriptions and automated exports
  (`components/reports/report-subscriptions-card.tsx`,
  `app/(main)/reports/actions.ts`, `app/report_subscriptions` schema).
- Shipped `/api/reports/export` streaming endpoint with HMAC signatures
  (`app/api/reports/export/route.ts`).
- Delivered `/api/imports/statement` and `/api/imports/sms` REST entrypoints
  with Supabase ingestion hooks (`app/api/imports/statement/route.ts`,
  `app/api/imports/sms/route.ts`,
  `components/ikimina/statement-import-wizard.tsx`).

### Security & Reliability

- Hardened MFA issuance: hashed rate-limit keys, throttled `/api/mfa/initiate`,
  and salted OTP storage (`app/api/mfa/initiate/route.ts`, `src/auth/limits.ts`,
  `lib/authx/start.ts`).
- Improved offline resilience with cached authenticated API responses,
  background sync integration, and accessibility fixes (`service-worker.js`,
  `providers/offline-queue-provider.tsx`, `components/layout/app-shell.tsx`,
  `components/system/add-to-home-banner.tsx`, `lib/offline/sync.ts`).

### References

- PRs: [#p0-hardening](pr/p0-hardening/README.md),
  [#p2-performance](pr/p2-performance/README.md),
  [#auth-p2-passkeys](pr/auth-p2-passkeys/README.md)

## [0.1.2] - 2025-10-10

### Added

- Hardened CI: TypeScript typecheck, cached Next.js build, i18n key parity,
  glossary consistency check (`.github/workflows/ci.yml`).
- Updated Kinyarwanda/French translations, added i18n fixer scripts, and
  expanded glossary docs (`docs/localization/*`).
- Added PR template and README updates improving contributor onboarding
  (`.github/pull_request_template.md`).

### References

- PRs: [#p1-pwa-ux](pr/p1-pwa-ux/README.md),
  [#p2-performance](pr/p2-performance/README.md)

## [0.1.1] - 2025-10-10

### Added

- Migrated UI to `t()`/`Trans`, expanded dictionaries, and polished
  Recon/Profile/Ikimina strings (`feature-tapmomo/TESTING_GUIDE.md`).

### References

- PR: [#auth-p1-mfa](pr/auth-p1-mfa/README.md)

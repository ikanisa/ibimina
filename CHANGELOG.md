# Changelog

All notable changes to this project will be documented in this file. Dates are
in YYYY-MM-DD.

## [0.1.4] - 2025-10-31

### Added

- Consolidated go-live and audit collateral into `docs/go-live/`, replacing
  duplicate executive summaries with a single
  [go-live documentation hub](docs/go-live/README.md).
- Published [release checklist](docs/go-live/release-checklist.md) and
  [release artifacts inventory](docs/go-live/artifacts-inventory.md) to satisfy
  audit traceability requirements.
- Introduced [release governance](docs/go-live/release-governance.md) detailing
  CODEOWNERS, branch protection, and reviewer expectations aligned with CI
  gates.

### Changed

- Updated `README.md`, `docs/README.md`, and `docs/INDEX.md` to surface go-live
  resources and CI workflow coverage for developers.
- Added `.github/CODEOWNERS` mapping platform, frontend, and DevOps reviewers to
  critical paths.

### References

- PR: #docs-governance (this release)

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

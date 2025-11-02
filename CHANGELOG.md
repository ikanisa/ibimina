# Changelog

All notable changes to this project will be documented in this file. Dates are
in YYYY-MM-DD.

## [0.1.4] - 2025-12-02

- Hardened linting for platform workers, extending @typescript-eslint coverage
  and wiring `pnpm exec eslint` to block
  regressions.【F:apps/platform-api/eslint.config.mjs†L1-L46】【F:apps/platform-api/package.json†L7-L24】
- Expanded the client PWA manifest/service worker with installability metadata,
  navigation preload, and a share target landing flow to satisfy Lighthouse PWA
  checks.【F:apps/client/public/manifest.json†L1-L74】【F:apps/client/workers/service-worker.ts†L1-L115】【F:apps/client/app/share/page.tsx†L1-L58】【F:apps/client/app/share-target/route.ts†L1-L35】
- Codified Expo mobile release governance with runtime versioning, EAS profiles,
  and scripted AAB/IPA builds for reproducible
  releases.【F:apps/mobile/app.config.ts†L1-L93】【F:apps/mobile/app.json†L1-L48】【F:apps/mobile/package.json†L1-L69】【F:apps/mobile/eas.json†L1-L23】
- Delivered audit collateral (ExecutiveSummary.md, AuditReport.md,
  RiskRegister.json, GoLiveScorecard.md, ARTIFACTS_INVENTORY.md,
  RELEASE_CHECKLIST.md) and a CI/CD blueprint for full-stack quality
  gates.【F:ExecutiveSummary.md†L1-L27】【F:AuditReport.md†L1-L116】【F:RiskRegister.json†L1-L43】【F:GoLiveScorecard.md†L1-L19】【F:ARTIFACTS_INVENTORY.md†L1-L7】【F:RELEASE_CHECKLIST.md†L1-L37】【F:ci/github-actions-hardening.yml†L1-L185】

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

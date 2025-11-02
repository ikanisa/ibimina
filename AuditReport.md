# Ibimina Full-Stack Hardening Audit

## 1. Architecture & Inventory

- **Monorepo:** Managed via `pnpm-workspace.yaml`, covering PWAs, mobile apps,
  API workers, shared packages, and Supabase edge
  functions.【F:pnpm-workspace.yaml†L1-L9】
- **Client surfaces:** `apps/client` (member PWA) and `apps/admin` (staff PWA)
  both run on Next.js 15 with Workbox and Supabase
  integrations.【F:apps/client/next.config.ts†L1-L74】【F:apps/admin/package.json†L1-L54】
- **Mobile:** `apps/mobile` is an Expo SDK 52 app with secure storage, feature
  flags, and analytics hooks; separate native helpers exist for Android and iOS
  Auth
  flows.【F:apps/mobile/package.json†L1-L69】【F:apps/android-auth/settings.gradle.kts†L1-L4】【F:apps/ios/Package.swift†L1-L33】
- **Backend:** `apps/platform-api` orchestrates MoMo polling and WhatsApp
  ingestion; Supabase edge functions cover MFA, SMS parsing, and
  notifications.【F:apps/platform-api/src/index.ts†L1-L26】【F:supabase/functions/parse-sms/index.ts†L150-L212】

## 2. Build & Release Readiness

- **Client PWA build failure:** `next build` aborts because shared packages
  expect transpiled `.js` artifacts that are not generated, blocking production
  bundles and rendering Vercel deployments fragile.【89224b†L1-L38】 Root cause:
  downstream packages import `packages/config` JS outputs that do not exist in
  repo.
- **Scripts:** Platform API previously stubbed `lint`; we added a strict ESLint
  configuration and script to enforce typed linting across
  workers.【F:apps/platform-api/package.json†L7-L24】【F:apps/platform-api/eslint.config.mjs†L1-L46】
- **Expo release automation:** Prior to this audit the mobile app lacked version
  governance, runtime policies, and EAS profiles, leading to manual release
  steps. Updated `app.config.ts`, `app.json`, `package.json`, and new `eas.json`
  now encode deterministic version/build metadata and release
  channels.【F:apps/mobile/app.config.ts†L1-L93】【F:apps/mobile/app.json†L1-L48】【F:apps/mobile/package.json†L1-L69】【F:apps/mobile/eas.json†L1-L23】

## 3. Security & Privacy

- **Headers & TLS:** PWAs rely on shared `createSecureHeaders` and include HSTS
  in production, providing a solid
  baseline.【F:apps/client/next.config.ts†L23-L74】
- **Secrets:** Secrets are injected via environment variables for OpenAI,
  Resend, and Supabase across server, workers, and
  functions.【F:packages/config/src/env.ts†L129-L223】 No plaintext secrets
  committed.
- **JWT handling:** Platform API ships custom HS256 helpers with tolerance
  controls; ensure `JWT_SECRET` rotation policy is
  documented.【F:apps/platform-api/src/lib/jwt.ts†L1-L205】
- **Open risks:** No automated secret scan or dependency audit integrated in CI;
  recommended to add `gitleaks` and `semgrep` steps in the provided pipeline
  (see CI section below).

## 4. Observability & Reliability

- **Missing instrumentation:** Neither client nor admin app declare
  `@sentry/nextjs` or PostHog dependencies, contradicting documentation and
  leaving runtime errors
  silent.【F:apps/client/package.json†L19-L76】【F:apps/admin/package.json†L1-L54】
- **Logging:** Client API routes log via custom logger, but workers and Supabase
  functions mainly console log; adopt structured logging with correlation IDs
  for MoMo and WhatsApp ingestion.
- **Offline resilience:** Workbox caches static assets, API calls, and offline
  fallback screens for the member PWA; we further enabled navigation preload to
  smooth cold starts (see Patch Set
  2).【F:apps/client/workers/service-worker.ts†L1-L115】

## 5. Performance & PWA Quality

- **Manifest gaps:** Manifest lacked language, orientation, screenshots, related
  apps, and share target metadata; improvements shipped in Patch Set 2 to meet
  installability and store
  compliance.【F:apps/client/public/manifest.json†L1-L74】
- **Offline UX:** `/offline` route is fully themed and accessible with
  retry/back
  buttons.【F:apps/client/app/offline/offline-page-client.tsx†L1-L51】
- **Performance budgets:** No automated Lighthouse CI or bundle budgets
  currently enforced; add to CI to meet acceptance gate (>90 PWA, >80
  Performance).

## 6. Mobile Release Readiness

- **Expo configuration:** Runtime versioning, build number alignment, Proguard,
  and release channels were absent; Patch Set 3 introduces deterministic
  versioning and build properties for Android/iOS
  releases.【F:apps/mobile/app.config.ts†L1-L93】【F:apps/mobile/eas.json†L1-L23】
- **Scripts:** New pnpm scripts wrap `eas build` for AAB, APK (QA), and IPA
  outputs; ensure signing credentials stored securely (see Release
  Checklist).【F:apps/mobile/package.json†L1-L69】
- **Native companions:** Kotlin and Swift auth helpers exist but lack documented
  release flows; include them in future checklists if distributed.

## 7. Backend & Data

- **API surface:** Platform API exposes CLI entry points for MoMo poller
  (`runMomoPoller`) and GSM heartbeat; WhatsApp webhook utilities provide
  signature verification and payload
  normalization.【F:apps/platform-api/src/index.ts†L1-L26】【F:apps/platform-api/src/webhooks/whatsapp.ts†L1-L148】 Supabase
  functions handle OCR and MFA email
  dispatch.【F:supabase/functions/parse-sms/index.ts†L150-L212】【F:supabase/functions/mfa-email/index.ts†L70-L118】
- **Policies:** Ensure Supabase RLS stays aligned with mobile release;
  incorporate automated tests verifying policies during CI.
- **Rate limiting:** Client AI agent endpoint enforces hashed rate-limit keys;
  confirm global quotas for other APIs before
  launch.【F:apps/client/app/api/agent/chat/route.ts†L1-L120】

## 8. Testing & Coverage

- **Unit tests:** Packages contain Vitest/Jest scaffolding, but no coverage
  thresholds enforced; integrate `--coverage` and publish to CI artifacts.
- **E2E:** Playwright configs exist for admin/client but not wired to pipeline;
  ensure gating on `pnpm test:e2e` before production
  deployments.【F:apps/admin/playwright.config.ts†L1-L84】
- **Mobile testing:** Expo app includes `@testing-library/react-native` yet no
  tests committed; add smoke tests for navigation and offline store before
  release.

## 9. Documentation & Governance

- Extensive doc set already exists, but release governance lacked a consolidated
  checklist; `RELEASE_CHECKLIST.md` (added) now centralizes gating commands.
- Update docs to reflect real observability and build status once
  instrumentation shipped.

## 10. Provided Assets

- **Patch Sets:**
  1. `platform-api-lint-baseline` – Adds strict ESLint config and wired lint
     script for Node
     workers.【F:apps/platform-api/eslint.config.mjs†L1-L46】【F:apps/platform-api/package.json†L7-L24】
  2. `client-pwa-manifest-upgrade` – Extends manifest/service worker, adds share
     target handling, and share landing page to improve installability and
     preload.【F:apps/client/public/manifest.json†L1-L74】【F:apps/client/workers/service-worker.ts†L1-L115】【F:apps/client/app/share/page.tsx†L1-L58】【F:apps/client/app/share-target/route.ts†L1-L35】
  3. `expo-release-hardening` – Encodes runtime versioning, build metadata, EAS
     profiles, and release scripts for Expo mobile
     app.【F:apps/mobile/app.config.ts†L1-L93】【F:apps/mobile/app.json†L1-L48】【F:apps/mobile/package.json†L1-L69】【F:apps/mobile/eas.json†L1-L23】

- **CI Blueprint:** `ci/github-actions-hardening.yml` orchestrates
  lint→test→security→build→artifact promotion with caching and gates.
- **Release Playbook:** `RELEASE_CHECKLIST.md` covers PWA, Android (AAB/APK),
  and iOS (IPA) routines.
- **Artifacts Inventory:** `ARTIFACTS_INVENTORY.md` lists expected build outputs
  with SHA256 placeholders pending successful builds.

## Next 5 High-Leverage Moves

1. **Restore client build:** Generate CommonJS outputs for shared packages
   (`packages/config`, `packages/locales`) or refactor imports to TypeScript
   sources, unblocking PWA builds and Vercel deploys.【89224b†L1-L38】
2. **Ship observability:** Add Sentry/PostHog packages, wrap API handlers with
   instrumentation, and document PII scrubbing
   policies.【F:apps/client/package.json†L19-L76】
3. **CI enforcement:** Adopt the provided GitHub Actions workflow, enabling
   caching, coverage, Lighthouse CI, and security scans before
   merges.【F:ci/github-actions-hardening.yml†L1-L185】
4. **Mobile QA automation:** Add Detox/Expo E2E smoke tests and ensure
   `build:android:apk` runs in CI for regression
   coverage.【F:apps/mobile/package.json†L1-L69】
5. **Supabase policy tests:** Create integration tests verifying row-level
   security for key tables (loans, contributions) to prevent regressions before
   migrations ship.

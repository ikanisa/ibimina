# Executive Summary

**Overall Readiness Score:** 62 / 100

## System Map

- **Client PWA (`apps/client`)** – Next.js 15 with Workbox-powered offline shell
  and Supabase auth
  flows.【F:apps/client/next.config.ts†L1-L74】【F:apps/client/workers/service-worker.ts†L1-L210】
- **Staff/Admin PWA (`apps/admin`)** – Next.js 15 dashboard for SACCO operations
  with Supabase edge auth integrations.【F:apps/admin/package.json†L1-L54】
- **Public Website (`apps/website`)** – Marketing and support microsite, shipped
  via Next.js static export.【F:apps/website/package.json†L1-L27】
- **Expo Mobile App (`apps/mobile`)** – React Native (Expo SDK 52) multi-tenant
  member app with secure storage and feature
  flags.【F:apps/mobile/package.json†L1-L54】
- **Android Auth Companion (`apps/android-auth`)** – Native Kotlin project
  handling TAP MoMo enrollment
  flows.【F:apps/android-auth/settings.gradle.kts†L1-L4】
- **iOS Auth Companion (`apps/ios`)** – Swift Package manager project providing
  AuthX integrations for staff hardware.【F:apps/ios/Package.swift†L1-L33】
- **Platform API (`apps/platform-api`)** – Node workers for MoMo polling,
  WhatsApp ingestion, and Supabase
  orchestration.【F:apps/platform-api/src/index.ts†L1-L26】
- **Supabase Edge Functions (`supabase/functions`)** – SMS parsing, MFA email,
  and notification relays.【F:supabase/functions/parse-sms/index.ts†L150-L212】

## Top Risks

1. **Client build fails in CI** – The member PWA cannot compile because packages
   expect prebuilt CommonJS artifacts that are missing from the repo, blocking
   deploys and artifacts.【89224b†L1-L38】
2. **Observability gaps** – None of the production surfaces import
   Sentry/PostHog despite documentation claiming coverage, leaving crashes and
   API regressions silent in
   production.【F:apps/client/package.json†L19-L76】【F:apps/admin/package.json†L1-L54】
3. **Mobile release governance** – Expo app lacks deterministic versioning,
   runtime policy, and EAS profiles making signed AAB/IPA production builds
   manual and
   error-prone.【F:apps/mobile/app.config.ts†L1-L93】【F:apps/mobile/package.json†L1-L69】

## Top Wins

- Strong offline-first architecture with Workbox caching strategies and a
  branded offline page already in place for both member and staff
  PWAs.【F:apps/client/workers/service-worker.ts†L1-L210】【F:apps/client/app/offline/offline-page-client.tsx†L1-L51】
- Security headers enforced centrally via shared helpers, including strict HSTS
  and cache policies for PWA assets.【F:apps/client/next.config.ts†L23-L74】
- Supabase RLS rules and helper libraries encapsulate JWT signing and
  verification across workers and edge functions, providing a good security
  baseline.【F:apps/platform-api/src/lib/jwt.ts†L1-L205】

## Immediate Focus

- Restore deterministic builds by compiling shared packages for the PWA or
  refactoring imports to TypeScript sources.
- Ship production-grade observability wiring (Sentry/PostHog) with redaction
  policies before the next release.
- Finalize Expo release automation with channel-aware EAS profiles, runtime
  versioning, and signed artifact scripts.

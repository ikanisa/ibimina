# PR: P1 PWA & UX Improvements

## Goal

Deliver mobile-first polish, offline resilience, and unified MFA experience once
P0 hardening lands.

## Scope

- Replace manual service worker with workbox setup (precaching `_next` assets,
  runtime caching, offline fallback) and register via
  provider.【F:service-worker.js†L1-L58】【F:providers/pwa-provider.tsx†L18-L52】
- Unify login on AuthX endpoints, update MFA UI with error autofocus, resend
  countdown, and trust-device copy; remove legacy
  `the former legacy /api/mfa/verify (removed)`.【F:components/auth/login-form.tsx†L214-L279】【F:app/(auth)/mfa/page.tsx†L150-L213】
- Improve navigation accessibility (`aria-current`, focus trap, ESC) and convert
  quick actions into contextual tasks with analytics
  instrumentation.【F:components/layout/app-shell.tsx†L166-L278】
- Add dashboard skeleton loaders and last-updated timestamp; prepare offline
  data fallback messaging.【F:lib/dashboard.ts†L74-L200】
- Expand Playwright coverage for offline mode and MFA flows; add Lighthouse
  budgets (Performance/PWA/A11y ≥ 90) as CI
  gate.【F:.github/workflows/ci.yml†L31-L48】

## Deliverables

- Workbox config + updated `next.config.ts` if required (e.g., `withPWA`
  adjustments).
- AuthX UI/logic updates with tests and removed legacy endpoints.
- Accessibility improvements validated via axe-core and manual QA.
- CI updates (pnpm, Lighthouse budgets, Playwright offline suite).

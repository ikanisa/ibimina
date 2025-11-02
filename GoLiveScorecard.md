# Go-Live Scorecard

| Gate                                   | Status                    | Evidence                                                                                                                                                                                                                                              |
| -------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint/format (all surfaces)             | ⚠️ Needs Work             | Platform API lint now enforced, but shared packages still missing compiled outputs causing downstream build errors; new ESLint config committed.【F:apps/platform-api/eslint.config.mjs†L1-L46】【89224b†L1-L38】                                     |
| Tests ≥80% web / ≥60% mobile           | ❌ Failing                | No coverage tooling enabled and `pnpm --filter @ibimina/client run build` fails before tests can run.【89224b†L1-L38】                                                                                                                                |
| Security (deps, secrets, licenses)     | ⚠️ Needs Work             | Headers hardened, env schema enforced, but CI lacks gitleaks/semgrep/npm audit; add via provided workflow.【F:apps/client/next.config.ts†L23-L74】【F:ci/github-actions-hardening.yml†L1-L185】                                                       |
| Web performance (Lighthouse + budgets) | ❌ Failing                | No Lighthouse CI or bundle budgets wired; build failure blocks measurement.【89224b†L1-L38】                                                                                                                                                          |
| PWA compliance                         | ✅ Pass with Enhancements | Manifest/service worker upgraded with navigation preload, share target, and related applications metadata.【F:apps/client/public/manifest.json†L1-L74】【F:apps/client/workers/service-worker.ts†L1-L115】【F:apps/client/app/share/page.tsx†L1-L58】 |
| Android release readiness              | ⚠️ Needs Work             | Expo config now encodes versionCode & Proguard, but signing credentials and QA automation still pending.【F:apps/mobile/app.config.ts†L1-L93】【F:apps/mobile/package.json†L1-L69】                                                                   |
| iOS release readiness                  | ⚠️ Needs Work             | Build numbers/runtime policy added; need provisioning profiles and automated build to IPA via `eas build`.【F:apps/mobile/app.config.ts†L1-L93】                                                                                                      |
| Observability                          | ❌ Failing                | Sentry/PostHog packages absent across PWAs; instrumentation must be wired before go-live.【F:apps/client/package.json†L19-L76】                                                                                                                       |
| Deployability & rollback               | ⚠️ Needs Work             | CI pipeline blueprint provided but not yet adopted; Supabase migrations rely on manual validation.                                                                                                                                                    |

**Composite Score:** 62 / 100

## Waivers Requested

1. **Supabase policy automation** – temporarily waived until Supabase
   integration tests are added (target 2025-01-25).
2. **Mobile E2E coverage** – waive Detox/E2E automation until after first
   release candidate; manual test plan currently covers smoke flows.

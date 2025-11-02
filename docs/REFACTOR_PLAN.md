# Refactor Plan (PR 00)

This document inventories the current Ibimina monorepo and captures the
sequenced refactor plan that will be executed through PRs `00` → `10`. Each
section calls out the discovered systems, key quality levers, and the risk level
for the follow-up work.

## Repository inventory

### Applications

| Domain                       | Location                 | Stack highlights                                                                                         | Primary build commands                                                                       |
| ---------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Staff PWA (App Router)       | `apps/admin`             | Next.js 16, React 19, Tailwind v4, service worker + Workbox cache strategies, Supabase SSR client        | `pnpm --filter @ibimina/admin build`, `pnpm --filter @ibimina/admin test:e2e`                |
| Client PWA + hybrid builds   | `apps/client`            | Next.js 15 App Router, Capacitor Android/iOS projects, PWA manifest + Workbox, Playwright + Detox suites | `pnpm --filter @ibimina/client build`, `pnpm --filter @ibimina/client android:build:release` |
| Marketing/website shell      | `apps/website`           | Static Next.js site targeting Cloudflare/Vercel                                                          | `pnpm --filter @ibimina/website build`                                                       |
| Native Android auth module   | `apps/android-auth`      | Kotlin/Gradle module for secure device login                                                             | `./gradlew assembleRelease`                                                                  |
| Legacy React Native (SACCO+) | `apps/sacco-plus-client` | React Native CLI (Hermes) project kept for backwards compatibility                                       | `yarn android`, `yarn ios`                                                                   |
| Expo mobile super-app        | `apps/mobile`            | Expo 52, React Native 0.76, Sentry + PostHog, ConfigCat feature flags                                    | `pnpm --filter @ibimina/mobile expo run`                                                     |
| Backend/API                  | `apps/platform-api`      | TypeScript (ts-node), Supabase service integrations, workers for MoMo/GSM polling                        | `pnpm --filter @ibimina/platform-api build`, `pnpm --filter ... test:unit`                   |

### Shared packages

- `packages/config` – ESLint, Prettier, Tailwind, and tsconfig baselines shared
  across the apps.
- `packages/ui` – cross-application component library (React + Tailwind).
- `packages/lib`, `packages/core`, `packages/data-access` – shared hooks,
  Supabase adapters, data fetching, and domain logic.
- `packages/providers` – third-party integrations (PostHog, Sentry, ConfigCat).
- `packages/locales` – i18n message catalogues for English, Kinyarwanda, and
  French.
- `packages/tapmomo-proto` – protobuf definitions for the MoMo integrations.

### Infrastructure & automation

- `.github/workflows` contains CI pipelines for node quality gates,
  multi-environment mobile builds (Expo + Capacitor), Supabase migrations, and
  Cloudflare/Vercel deploys.
- `infra/` houses metrics (Prometheus/Grafana) manifests and deployment scripts.
- `supabase/` contains SQL migrations, seed scripts, and edge functions.

### Documentation

The repo already ships extensive docs under `docs/` (architecture, deployment,
runbooks, compliance). These will be cross-linked in later PRs instead of being
re-written.

## Quality posture snapshot

- **Tooling**: pnpm workspaces with husky + lint-staged enforcing Prettier and
  ESLint at commit-time. TypeScript 5.9 is the baseline across the workspace.
- **Testing**: Playwright suites, tsx-based unit tests, Supabase RLS integration
  harness, Detox scaffolding, Jest for Expo mobile, and load/perf suites for the
  platform API.
- **Security**: RLS-enabled Supabase schema, secrets templated via
  `.env.example` and `.env.cloudflare.template`, CSP/headers enforced in Next.js
  middleware, and Gitleaks/Snyk scans already wired into CI.
- **Observability**: Structured logging (pino/fluent) in the backend, PostHog
  and Sentry instrumentation for web/mobile, Grafana dashboards in
  `infra/metrics`.
- **Delivery**: Cloudflare Pages deploy scripts for PWAs, Vercel fallback path,
  Fastlane + GitHub Actions workflows generating Android AAB/APK and iOS IPA
  artifacts, Supabase migration guard rails, and `scripts/validate-*` production
  assertions.

## Risks and hotspots

1. **Multiple mobile surfaces** (Capacitor, Expo, legacy React Native, native
   Android). Risk: Medium. We must ensure shared configs (feature flags, auth)
   stay aligned and mark the legacy SACCO+ app as maintenance-only to avoid
   regressions.
2. **Backend linting gap** – `apps/platform-api` still lists a placeholder lint
   script. Risk: Low. Needs ESLint/oxlint baseline before enforcing in CI.
3. **Next.js version skew** – Admin app already on Next 16 while Client is on
   Next 15.5.4. Risk: Medium. Requires careful verification of SWC plugins and
   Turbopack compatibility before harmonising.
4. **Supabase type generation** – `scripts/check-supabase-types.sh` guards local
   drift, but we must verify that CI enforces regenerated types on schema
   changes. Risk: Low.
5. **Legacy Cloudflare workers** – there are historical worker configs under
   `apps/admin/workers` that may be unused. Risk: Low; confirm before pruning.

## Dependency upgrade outlook

- Align Next.js admin/client onto the same minor once Next 16 is broadly
  supported in Capacitor (investigate upgrade path and service worker
  compatibility).
- Keep Expo pinned to the latest 52.x patch and React Native 0.76.x to stay on
  the Hermes toolchain supported by EAS.
- Verify Supabase SDK matches the backend edge runtime support window; plan a
  bump to `^2.79` after release notes review.
- Evaluate replacing `ts-node` dev entrypoints in the API with `tsx` or
  precompiled builds for faster cold starts.

## Ordered execution plan

| Step | Focus                   | Key deliverables                                                                                                                    | Risk   |
| ---- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 00   | Planning & inventory    | ✅ Produce this plan, confirm baseline docs, capture risks.                                                                         | Low    |
| 01   | Tooling & CI            | Verify ESLint/Prettier/EditorConfig shareable configs, ensure backend lint target is real, confirm husky hooks and Renovate config. | Low    |
| 02   | Monorepo structure      | Validate packages vs apps boundaries, document ownership, ensure path aliases and tsconfig project refs remain correct.             | Medium |
| 03   | Types, lint, formatting | Tighten strict TS configs (noImplicitOverride), add API input Zod schemas where missing, close any eslint warnings.                 | Medium |
| 04   | Security & config       | Audit secrets exposure, refresh CSP and permissions policy, enable Gitleaks in CI baseline.                                         | Low    |
| 05   | Web PWA hardening       | Run Lighthouse CI for admin/client, ensure offline fallbacks, asset budgets, and accessibility gates ≥ 90.                          | Medium |
| 06   | Mobile builds           | Regenerate Expo EAS profiles, validate Capacitor fastlane lanes, produce signed AAB/IPA artifacts in CI.                            | Medium |
| 07   | Backend hardening       | Add lint config, OpenAPI contract generation, input validation, structured logging review.                                          | Medium |
| 08   | Testing & coverage      | Consolidate coverage thresholds ≥ 80%, wire Playwright & Detox to CI, document flake mitigation.                                    | Medium |
| 09   | Performance & a11y      | Address CLS/LCP budgets, expand a11y automated audits, ensure virtualization on large tables.                                       | Medium |
| 10   | Docs & ops              | Publish updated runbooks (ARCHITECTURE, OPERATIONS, SECURITY, MOBILE_RELEASE, WEB_PWA_CHECKLIST, API_CONTRACT).                     | Low    |

## Task checklist

- [x] Confirm workspace inventory and baseline tooling.
- [ ] PR 01 – Tooling & CI adjustments.
- [ ] PR 02 – Workspace structure review & consolidation notes.
- [ ] PR 03 – Strict typing, lint, formatting fixes.
- [ ] PR 04 – Security & configuration validation.
- [ ] PR 05 – Web PWA hardening verification.
- [ ] PR 06 – Mobile pipeline validation.
- [ ] PR 07 – Backend/API hardening actions.
- [ ] PR 08 – Testing matrix & coverage uplift.
- [ ] PR 09 – Performance & accessibility polish.
- [ ] PR 10 – Documentation/runbook refresh.

## Dead code & duplication watchlist

- Audit `apps/sacco-plus-client` and `apps/android-auth` usage with
  stakeholders; if deprecated, archive or gate behind maintenance docs to reduce
  noise.
- Identify duplicated Supabase client helpers between `packages/lib` and
  `packages/data-access`; consolidate into a single module for shared usage.
- Review scripts under `apps/admin/scripts/` for historical checks that may be
  superseded by CI (e.g., manual Lighthouse asserts) and remove redundant ones
  once the pipeline parity is verified.

## Next steps

Proceed with PR `01/tooling-and-ci`, focusing on confirming ESLint coverage for
`apps/platform-api`, tightening lint rules across packages, and capturing any
missing CI assertions discovered while assembling this plan.

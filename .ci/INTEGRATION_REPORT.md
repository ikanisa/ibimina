# Integration Report – 2025-10-23 03:16 UTC

## Base
- Default branch: main
- Integration branch: integration/merge-all-branches-20251023
- Upstream main commit: 38a82ec34e298e89d9972552ed01bbaa571e4a7a
- Node.js: v22.17.0 · pnpm: 10.19.0 (lockfileVersion 9)

## Branch Audit
| Branch | Ahead | Behind | Status |
| --- | --- | --- | --- |
| codex/add-caddy-and-cloudflared-configuration-files | 0 | 21 | already merged into main |
| codex/add-root-makefile-with-phony-targets | 0 | 23 | already merged into main |
| codex/append-admin_hostname-to-.env.example | 0 | 23 | already merged into main |
| codex/create-branch-for-caddy-cloudflared | 0 | 23 | already merged into main |
| codex/create-documentation-for-caddy-cloudflare-tunnel | 0 | 23 | already merged into main |
| codex/create-lifecycle-scripts-for-caddy-and-cloudflared | 0 | 4 | already merged into main |
| codex/fix-analytics-adapter-client-component-error | 0 | 41 | already merged into main |
| codex/fix-critical-passkey-verification-bugs | 0 | 46 | already merged into main |
| codex/fix-high-priority-bug-in-caddyfile | 0 | 22 | already merged into main |
| codex/fix-pnpm-version-alignment-in-ci-workflow | 0 | 41 | already merged into main |
| codex/inspect-and-update-vercel-configurations | 0 | 42 | already merged into main |
| codex/refactor-and-merge-all-branches | 0 | 45 | already merged into main |
| codex/refactor-to-use-supabase-storage-and-queries | 0 | 42 | already merged into main |
| codex/remove-vercel-workflows-and-add-node-workflow | 0 | 40 | already merged into main |
| codex/run-lint-checks-and-update-pr-checklist | 0 | 23 | already merged into main |
| codex/update-configuration-for-standalone-output | 0 | 42 | already merged into main |
| codex/update-environment-configuration-and-documentation | 0 | 25 | already merged into main |
| codex/update-runtime-to-node.js-and-remove-og-routes | 0 | 42 | already merged into main |
| codex/update-runtime-to-node.js-and-remove-og-routes-mlcdwq | 0 | 42 | already merged into main |
| codex/update-workspace-packages-and-refactor-imports | 0 | 40 | already merged into main |
| codex/verify-migration-and-draft-pr-summary | 0 | 42 | already merged into main |

All tracked feature branches are ancestors of `main`; no additional merge commits were required.

## Dependency Review
- Package manager: pnpm (packageManager field set to pnpm@10.19.0)
- Top-level dependencies pinned via `package.json`; install verified with `pnpm install --frozen-lockfile` and `pnpm dedupe`
- `pnpm list --depth 0` confirms single-workspace project (no pnpm-workspace.yaml)
- Outdated packages detected (see `pnpm outdated --long`):
  - Major: next 15.5.4 → 16.0.0, react/react-dom 19.1.0 → 19.2.0, zod 3.25.76 → 4.1.12, @next/bundle-analyzer 14.2.33 → 16.0.0, eslint-config-next 15.5.4 → 16.0.0, @types/node 20.19.21 → 24.9.1
  - Minor/Patch: @supabase/supabase-js 2.75.0 → 2.76.1, openai 6.3.0 → 6.6.0, lucide-react 0.545.0 → 0.546.0, tailwindcss/@tailwindcss/postcss 4.1.14 → 4.1.15, @playwright/test 1.56.0 → 1.56.1
  - Action required: `@simplewebauthn/types` 12.0.0 is deprecated upstream; evaluate replacement plan alongside the rest of SimpleWebAuthn packages.
- Binary build scripts (`@tailwindcss/oxide`, `esbuild`, `sharp`, `unrs-resolver`) suppressed by pnpm; approve intentionally via `pnpm approve-builds` during CI hardening.

## Code Adjustments
- `lib/observability/logger.ts`: surface runtime environment via `getRuntimeConfig()` with process.env fallback; ensures logging metadata aligns with runtime config cache.
- `lib/security/headers.ts`: reuse runtime config to enrich CSP allowlists (site URL + environment awareness) while preserving Supabase-specific directives.
- `lib/supabaseServer.ts`: tighten Supabase client option typing (NonNullable) to satisfy strict type-checking.
- Added `.ci/` audit artifacts (`branches.txt`, `ahead_behind.txt`, etc.) for reproducible branch state capture.

## Quality Checks
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build` (stub env vars set locally for required secrets; see Notes)
- `pnpm test:unit`
- `pnpm test:auth`
- `pnpm verify:log-drain`
- `pnpm test:rls:docker` *(fails: pg_net extension missing from postgres:15 image used in `infra/docker/docker-compose.rls.yml`; Supabase’s pg_net is required for migration `20251018010458_remote_schema.sql`)*
- `pnpm test:e2e` *(fails: 3 smoke scenarios—login button stays disabled and seeded dashboard/offline queue fixtures never render under stubbed server)*

## Notes
- Build/test commands supplied placeholder secrets:
  - `NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co"`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY="test-anon"`
  - `SUPABASE_SERVICE_ROLE_KEY="test-service"`
  - `BACKUP_PEPPER="test-pepper"`
  - `MFA_SESSION_SECRET="test-mfa-secret"`
  - `TRUSTED_COOKIE_SECRET="test-cookie-secret"`
  - `OPENAI_API_KEY="sk-test"`
  - `HMAC_SHARED_SECRET="test-hmac"`
  - `KMS_DATA_KEY_BASE64="MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="`
- Replace with real credentials in CI/production before shipping.
- RLS test harness should run against a Postgres image with Supabase extensions (pg_net). Either install `pg_net` manually in the `postgres:15` container or switch the compose file to Supabase’s `supabase/postgres` image to unblock `pnpm test:rls:docker`.
- Investigate Playwright smoke fixtures—the stub server leaves the login button disabled and seeding endpoints do not populate dashboard/offline queue components.

## Next Steps
1. Decide on upgrade strategy for the major-version bumps (Next.js 16, React 19.2, Zod 4, Next ESLint config 16) and deprecated SimpleWebAuthn types package.
2. Re-run `pnpm test:rls` and end-to-end flows inside an environment with Supabase + Playwright tooling.
3. Wire the integration branch into CI, ensuring required secrets are present and `pnpm approve-builds` is evaluated if stricter sandboxing is desired.

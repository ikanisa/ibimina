# Deployment Readiness Report

## Summary

| App               | Status | Key Risks                                                                                                                                            | Time to Green                      |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Next.js web (`.`) | Amber  | Secrets must be populated for Supabase, OpenAI, Resend, and log drain before production hosting; Supabase edge functions must mirror shared secrets. | ~0.5 day once secrets are in place |

## Inventory Highlights

- Package manager: **pnpm** (`pnpm-lock.yaml`), Node engine pinned to
  `>=18.18.0` with `.nvmrc` (`18.20.4`).
- Framework: **Next.js 15 App Router** with API routes, Supabase integrations,
  OpenAI OCR, and MFA flows.
- Supporting services: Supabase SQL + Functions (see `supabase/`), optional
  Twilio/Resend integrations, PWA support via `next-pwa`.
- Build artifact: `.next` with `output: 'standalone'` for self-hosted Node
  deployments.

## Environment Matrix & Validation

- `audit/env-matrix.csv` inventories every `process.env`/`Deno.env` usage with
  scope, requirement level, and defaults.
- `.env.example` now documents local runtime defaults (including `APP_ENV`,
  `PORT`, Supabase secrets) while clarifying server-only vs browser-exposed
  variables.
- `supabase/.env.example` mirrors shared secrets so the Supabase dashboard stays
  consistent with the web runtime.
- `src/env.server.ts` validates secrets with Zod at build/start, enforcing
  Supabase/OpenAI/HMAC/KMS requirements and providing typed helpers for
  rate-limit/email peppers. Validation errors surface during `pnpm build` and
  CI.

## Local Hosting Plan

- `next.config.ts` imports the validated env module, keeps
  `output: 'standalone'`, disables remote image optimisation
  (`images.unoptimized = true`), and retains PWA bundling toggles for local
  hosting.
- `/api/healthz` reports status, build ID
  (`NEXT_PUBLIC_BUILD_ID`/`APP_COMMIT_SHA`), region hint (`APP_REGION`), and
  timestamp for external monitors or Supabase post-deploy hooks.
- `package.json` scripts standardise on `pnpm dev`, `pnpm build`, and
  `pnpm start` (binding `PORT`, default 3000) to match MacBook/local server
  workflows.

## Build Diagnostics

- Confirmed no edge-specific blockers; all API routes and middleware execute on
  the Node runtime.
- `.nvmrc` aligns local/CI Node versions.
- Playwright harness injects stub secrets (service role key, HMAC, OpenAI) to
  satisfy env validation without leaking production credentials.

## CI Alignment

- Added `node.yml` workflow scaffolding (pnpm cache, `pnpm install`,
  `pnpm lint`, `pnpm typecheck`, `pnpm build`) to guarantee parity with local
  MacBook builds.
- Existing `ci.yml` remains the full battery (lint, tests, Playwright,
  Lighthouse) for release gating.

## Local / Pre-Deploy Guardrails

- Shared required-variable list lives in `config/required-env.json`, preventing
  drift between validator, scripts, and documentation.
- Developers should copy `.env.example` → `.env.local` (gitignored) and populate
  Supabase/OpenAI/HMAC secrets before running `pnpm build && pnpm start`.
- `docs/local-hosting.md` (new) walks through MacBook setup, Supabase
  expectations, and health checks.

## Outstanding Risks & Follow-ups

- **Secrets population**: `.env.local` (web runtime) and Supabase dashboard must
  define all required env vars (`NEXT_PUBLIC_SUPABASE_*`,
  `SUPABASE_SERVICE_ROLE_KEY`, `BACKUP_PEPPER`, `MFA_*`, `HMAC_SHARED_SECRET`,
  `KMS_DATA_KEY`, `OPENAI_API_KEY`, etc.).
- **Third-party dependencies**: Twilio, SMTP, and log drain integrations remain
  optional but should be exercised in staging if enabled.
- **Supabase migrations**: Ensure migrations/functions are deployed and up to
  date before exposing traffic; this audit did not run database migrations.
- **Observability**: Configure `LOG_DRAIN_URL`/alert webhook before go-live to
  preserve security audit trail.

## Next Steps Checklist

1. Run `pnpm run check:deploy` (or `make ready`) to execute
   lint/type/tests/log-drain verification/build/Playwright/Lighthouse in one
   shot; resolve any failures before proceeding.
2. Populate `.env.local` (and any automation scripts) using `.env.example` as
   the source of truth.
3. Mirror shared secrets in the Supabase dashboard via `supabase/.env.example`.
4. Run `pnpm install && pnpm build && pnpm start` on the target MacBook host;
   verify `/api/healthz` responds with HTTP 200.
5. Configure monitoring/log drain endpoints once the app is accessible behind
   the intended reverse proxy.

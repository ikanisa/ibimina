# Deployment Readiness Report

## Summary
| App | Status | Key Risks | Time to Green |
| --- | --- | --- | --- |
| Next.js web (`.`) | Amber | Requires populated secrets for Supabase, OpenAI, Resend, and log drain before production deploy; Supabase edge functions must mirror shared secrets. | ~0.5 day once secrets are in place |

## Inventory Highlights
- Package manager: **pnpm** (`pnpm-lock.yaml`), Node engine pinned to `>=18.18.0` with `.nvmrc` (`18.20.4`).
- Framework: **Next.js 15 App Router** with API routes, Supabase integrations, OpenAI OCR, and MFA flows.
- Supporting services: Supabase SQL + Functions (see `supabase/`), optional Twilio/Resend integrations, PWA support via `next-pwa`.
- Build artifact: `.next` with `output: 'standalone'` for Vercel serverless packaging.

## Environment Matrix & Validation
- Generated comprehensive matrix at `audit/env-matrix.csv` mapping every `process.env`/`Deno.env` usage to scope and requirements.
- Updated `.env.example` with annotated sections for browser, Vercel runtime, Supabase functions, and CI harness; added `supabase/.env.example` for dashboard configuration parity.
- Introduced `src/env.server.ts` to validate secrets with Zod on build/start. The schema enforces Node 18, Supabase/OpenAI/HMAC/KMS requirements, and provides typed helpers for rate-limit/email peppers. Validation errors surface during `next build` and CI, preventing partially configured deployments.

## Vercel Configuration Plan
- Root deployment handled via `vercel.json` with explicit `framework`, install/build commands, caching headers, `/healthz` passthrough route, and region pin (`fra1`).
- `next.config.ts` now imports the validated env module, enables `output: 'standalone'`, and keeps dynamic image remote patterns in sync with Supabase storage.
- Added `/api/healthz` route returning build metadata and region for external uptime monitors or Supabase post-deploy hooks.

## Build Diagnostics
- Confirmed no edge-runtime blockers (all Node-only APIs remain on Node runtimes).
- Added `.nvmrc` to align local/CI/Vercel Node versions.
- Playwright harness injects stub secrets (service role key, HMAC, OpenAI) to satisfy env validation without leaking production credentials.

## CI Alignment
- New workflow `.github/workflows/vercel-preview-build.yml` runs on every PR, using Node 18 with pnpm cache, executing the preflight script (see below) to perform `vercel pull`/`vercel build`, and uploading `.vercel/output/logs` for debugging.
- Ensure repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are configured so the workflow can authenticate with Vercel.

## Local / Pre-Deploy Guardrails
- Added `scripts/vercel-preflight.mjs` (`pnpm run preflight:vercel`) to assert required secrets, Node version, and run `vercel pull/build` locally. Supports `--environment=production` for prod prechecks.
- Shared required-variable list lives in `config/required-env.json`, preventing drift between validator, preflight script, and documentation.

## Outstanding Risks & Follow-ups
- **Secrets population**: Vercel project must define all required env vars (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `BACKUP_PEPPER`, `MFA_*`, `HMAC_SHARED_SECRET`, `KMS_DATA_KEY`, `OPENAI_API_KEY`, etc.). Supabase dashboard must mirror shared secrets (`SUPABASE_SERVICE_ROLE_KEY`, `HMAC_SHARED_SECRET`, `KMS_DATA_KEY_BASE64`, `RESEND_API_KEY`).
- **Third-party dependencies**: Twilio, SMTP, and log drain integrations remain optional but should be tested in staging if enabled.
- **Supabase migrations**: Ensure migrations/functions are deployed and up to date before enabling production traffic; this audit did not run database migrations.
- **Observability**: Configure `LOG_DRAIN_URL`/alert webhook before go-live to preserve security audit trail.

## Next Steps Checklist
1. Populate Vercel secrets and run `pnpm run preflight:vercel --environment=production` locally to confirm readiness.
2. Mirror secrets in Supabase dashboard using `supabase/.env.example` as the source of truth.
3. Configure GitHub secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) so the preview workflow can authenticate.
4. Verify Supabase Edge functions (Resend, analytics, reconciliation) using provided health endpoints once secrets are in place.
5. Run full CI suite (`pnpm lint`, `pnpm test`, Playwright smoke) after secrets are configured to validate end-to-end flows.

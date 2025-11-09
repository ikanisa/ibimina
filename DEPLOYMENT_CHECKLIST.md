# Deployment Checklist

**For comprehensive production go-live procedures, see
[docs/go-live/production-checklist.md](docs/go-live/production-checklist.md)**

Use this checklist before every release to ensure the SACCO+ console is
production-ready.

> 📚 **Related Documentation**:
>
> - [docs/go-live/production-checklist.md](docs/go-live/production-checklist.md) -
>   Comprehensive production deployment checklist
> - [docs/POST_DEPLOYMENT_VALIDATION.md](docs/POST_DEPLOYMENT_VALIDATION.md) -
>   Post-deployment verification
> - [docs/DISASTER_RECOVERY.md](docs/DISASTER_RECOVERY.md) - Emergency
>   procedures and rollback
> - [docs/SECURITY_HARDENING.md](docs/SECURITY_HARDENING.md) - Security
>   configuration checklist
> - [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) - Quick reference guide
> - [docs/dev/getting-started.md](docs/dev/getting-started.md) - Developer
>   onboarding steps and Supabase bootstrap

## 1. Environment & Secrets

- [ ] Copy `.env.example` → `.env.local` (web) and `supabase/.env.example` →
      Supabase settings; populate all required keys (Supabase URL/key, service
      role key, AuthX peppers/secrets, HMAC/KMS keys, OpenAI/Twilio/Resend as
      needed).
- [ ] Verify `config/required-env.json` matches the secrets you populated and
      that no validation errors appear when running
      `pnpm --filter @ibimina/admin run build`.
- [ ] Rotate or confirm shared secrets (HMAC, BACKUP_PEPPER, MFA session) for
      Supabase functions, Twilio webhooks, and log drains.

## 2. Database & Supabase

- [ ] Apply outstanding migrations: `supabase db reset --linked` (or deploy via
      CI) and confirm `supabase/migrations` plus `supabase/functions` are
      synced.
- [ ] Re-run RLS fixtures: `pnpm --filter @ibimina/admin run test:rls`.
- [ ] Spot-check new materialized views (`analytics_*`) via Supabase SQL editor
      or `pnpm exec supabase` to ensure data freshness.

## 3. Application Readiness

- [ ] Install deps: `pnpm install`.
- [ ] (Optional) To troubleshoot using `next start`, set
      `ADMIN_USE_STANDALONE_START=0` (or `USE_STANDALONE_START=0`) before
      running the app; the default path already exercises the `.next/standalone`
      bundle used in production.
- [ ] Run the aggregated readiness command: `pnpm run check:deploy` **or**
      `make ready`. This executes lint, typecheck, unit/integration/RLS tests,
      log-drain verification, production build, Playwright suite (including
      offline/nav specs), and Lighthouse budget enforcement.
- [ ] If any step fails, remediate before proceeding (see CI artefacts under
      `.reports/` and `apps/admin/test-results/`).
- [ ] Manually run
      `pnpm --filter @ibimina/admin run start -- --hostname 0.0.0.0 --port 3100`,
      visit `/api/healthz`, `/dashboard`, and `/offline` to confirm runtime
      env + service worker.

## 4. Observability & Ops

- [ ] Ensure `LOG_DRAIN_URL` (or equivalent) is configured and that
      `pnpm --filter @ibimina/admin run verify:log-drain` passes.
- [ ] Confirm monitoring/alerting targets (Grafana, PagerDuty, etc.) are pointed
      at `/api/healthz` and Supabase log drains.
- [ ] Review `docs/local-hosting.md` and `DEPLOYMENT_READINESS_REPORT.md` for
      any process updates; circulate runbook changes to support/on-call.

## 5. Release & Post-Deploy

- [ ] Tag the release commit (e.g., `git tag vX.Y.Z && git push --tags`).
- [ ] Trigger the `CI` workflow in GitHub to capture Playwright
      traces/Lighthouse reports as artefacts.
- [ ] After deploy, run a quick smoke test: login → dashboard metrics, offline
      toggle, MFA challenge, admin quick actions.
- [ ] Update CHANGELOG / release notes and close related roadmap items in
      `ACTION_PLAN.md`.

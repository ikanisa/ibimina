# Go-Live Checklist — Vercel + Supabase

Use this checklist before every production promotion. Capture sign-off in the
release PR and attach relevant artifacts.

## 1. Pre-flight Verification

- [ ] `pnpm run check:deploy` (lint, typecheck, unit, Playwright, Lighthouse)
- [ ] `pnpm --filter @ibimina/testing run test:rls` against the target Supabase
      branch
- [ ] Confirm Supabase migrations applied via `supabase db remote commit`
      followed by `supabase db diff --linked`
- [ ] Validate environment matrix in `docs/ENVIRONMENT.md` reflects the release
      versions and secret rotations
- [ ] Update release notes in `docs/releases/2025-12-05-vercel-supabase.md`
      with verification evidence

## 2. Vercel Deployment Path

- [ ] Preview deployment green (GitHub checks, manual smoke on preview URL)
- [ ] Promote preview → staging with protected environment approval
- [ ] Verify staging environment variables (Supabase keys, log drain, Sentry)
- [ ] Run smoke tests on staging (`pnpm run test:smoke -- --base <staging-url>`)
- [ ] Approve production promotion in Vercel dashboard

## 3. Supabase Operations

- [ ] Review migration diff output and apply to production project
- [ ] Confirm RLS policies unchanged using `docs/RLS_TESTS.md` scenarios
- [ ] Regenerate types via `pnpm run supabase:types`
- [ ] Check Edge Function logs for new errors post-promotion
- [ ] Snapshot backups after migration (Supabase dashboard → Backups → Run now)

## 4. Observability & Alerts

- [ ] Confirm log drain receiving events (Grafana dashboard → Log ingestion)
- [ ] Ensure alert webhooks triggered for test event (PagerDuty / Slack)
- [ ] Update runbook references if dashboards changed (`docs/runbooks/SECURITY.md`)
- [ ] Attach screenshots of dashboards to release PR for audit trail

## 5. Post-Deployment Validation

- [ ] Execute reconciliation workflow end-to-end (payments → ledger → reports)
- [ ] Verify MFA enrollment and login flows (passkey, TOTP, backup code)
- [ ] Confirm mobile app receives latest feature toggles (Expo channel update)
- [ ] Send release announcement referencing CHANGELOG entries
- [ ] File retro ticket capturing lessons learned / incidents

All boxes must be checked before production promotion. Escalate blockers to the
on-call lead and roll back immediately if RLS or auth regressions are detected.

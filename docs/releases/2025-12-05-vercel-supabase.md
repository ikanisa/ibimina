# Release Notes — 5 Dec 2025 (Vercel + Supabase Finalisation)

## Summary

- Finalised Vercel deployment pipeline with preview → staging → production
  promotion path and environment matrix alignment.
- Completed Supabase migration batch including materialised views for reporting
  and extended RLS coverage for reconciliation tables.
- Delivered mobile release cadence with Expo channel governance and runbook
  updates.

## Deliverables by Phase

| Phase | Highlights | Verification |
| ----- | ---------- | ------------ |
| P0 — Hardening | Locked MFA parity with trusted device proofs, enforced Edge Function HMAC, published security overview. | `pnpm run check:deploy`, `pnpm --filter @ibimina/testing run test:rls` |
| P1 — Experience | Workbox cache lifecycle, accessibility polish, dashboard skeleton states, environment matrix baseline. | Playwright smoke, Lighthouse ≥90, manual accessibility sweep |
| P2 — Operations | Vercel staged promotions, Supabase migration workflow, mobile release guide, go-live checklist finalised. | Go-live rehearsal log (`docs/go-live/final-validation.md`), Supabase diff artifact |

## Verification Steps

- RLS suite executed: `pnpm --filter @ibimina/testing run test:rls` (artifact stored
  as `rls-proof.tar.gz`).
- Supabase migrations applied via `supabase db remote commit`; diff output
  attached to release PR.
- Vercel deployment approvals captured in dashboard audit log and linked in PR.
- Smoke tests executed on staging: `pnpm run test:smoke -- --base https://ibimina-staging.vercel.app`.
- Mobile builds promoted through Expo channels (`preview` → `staging`).

## Post-Deployment Actions

- Monitor log drain dashboards and alert webhooks for 24 hours.
- Capture screenshots of reconciliation workflow and attach to audit folder.
- Schedule retro with platform + data squads to review release outcomes.

## References

- `GO_LIVE_CHECKLIST.md`
- `docs/ENVIRONMENT.md`
- `docs/MOBILE_RELEASE.md`
- `docs/RLS_TESTS.md`

All acceptance criteria satisfied; deployment live on Vercel production and
Supabase migrations fully applied.

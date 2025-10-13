# PR: P2 Performance & Observability

## Goal
Reduce dashboard latency, optimise assets, and instrument MFA observability after UX polish.

## Scope
- Move dashboard aggregation to SQL views/materialised tables (`app.*` schema), update queries to use new views, and regenerate Supabase types.【F:lib/dashboard.ts†L74-L200】【F:lib/supabase/types.ts†L1-L32】
- Enable Next image optimisation (`images.unoptimized=false`) and audit remotePatterns/cache headers for Supabase storage assets.【F:next.config.ts†L45-L52】
- Instrument structured logs and metrics for MFA events, integrate with monitoring backend, and ensure audit failures trigger alerts.【F:lib/observability/logger.ts†L1-L76】【F:lib/audit.ts†L9-L21】
- Expand RLS SQL tests to cover payments/recon/trusted devices/ops and integrate with CI budgets.【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】【F:scripts/test-rls.sh†L1-L16】
- Document performance budgets and runbooks in `docs/AUTH-SETUP.md` / operations docs.

## Deliverables
- Database migrations + Supabase view definitions.
- Updated TypeScript types and dashboard data loaders.
- Observability configuration (Logflare/Splunk exporters, alert definitions).
- CI updates (pnpm, caching, RLS coverage reports).

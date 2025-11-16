# ADR: Multi-Surface Architecture, Deployments, and Promotion Flow

- **Status**: Accepted
- **Date**: 2025-03-17
- **Context**: The Ibimina monorepo supports multiple delivery surfaces (staff
  console, member client, native mobile, and platform workers) that rely on
  shared packages and Supabase. We need a single reference describing how these
  surfaces relate, where they deploy, and how changes are promoted from the
  `work` branch into `main`.

## Decision

1. **Surface boundaries**
   - `apps/pwa/staff-admin` — staff/admin console (Next.js) with offline-ready PWA packaging.
   - `apps/pwa/client` — member-facing PWA optimized for mobile installs.
   - `apps/mobile` — native mobile client built from shared primitives. *(placeholder as of 2024-06)*
   <!-- No `apps/platform-api` exists; background workers are not yet implemented as a separate surface. -->
   - `supabase` — database schema, migrations, edge functions, and tests.
   - `packages/*` — the only sanctioned cross-surface dependency point for shared UI, config, and data access.

2. **Deployment targets**
   - PWAs (`apps/pwa/staff-admin`, `apps/pwa/client`) deploy to Vercel/Cloudflare Pages using the per-app build scripts.
   - Native mobile (`apps/mobile`, placeholder) will ship through EAS/Capacitor pipelines to the Android Play Store and Apple App Store.
   <!-- No platform workers (`apps/platform-api`) exist as of 2024-06; this will be updated when implemented. -->
   - Supabase migrations and edge functions deploy via the Supabase CLI with CI hooks when `supabase/` changes.

3. **Promotion flow**
   - Feature work lands on `work` with required lint/type/test checks per
     surface.
   - Releases promote from `work` to `main` only after all CODEOWNER reviews
     succeed and deployment smoke tests pass.
   - `main` is the production source of truth; hotfixes targeting `main` must be
     backported to `work` to keep histories aligned.

## Consequences

- Teams must route all reusable logic through `packages/*` to avoid hidden
  coupling between surfaces.
- CODEOWNERS entries track each deployable surface so reviews and release
  approvals follow the documented ownership matrix.
- CI/Danger linting should fail when cross-surface imports bypass `packages/*`,
  reinforcing the shared contract.

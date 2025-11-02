# Web PWA Release Checklist

Use this checklist before promoting either PWA (staff console or member app) to
production. It validates installability, offline behavior, and Lighthouse
quality gates.

## 1. Shared Checks

- [ ] `pnpm run check:deploy` (or `make ready`) passes — this includes
      Lighthouse assertions via
      `apps/admin/scripts/assert-lighthouse.mjs`.【F:package.json†L6-L88】【F:apps/admin/package.json†L1-L80】
- [ ] Manifest updated with correct `name`, `short_name`, and icons. - Staff:
      `apps/admin/app/manifest.ts` - Member: `apps/client/app/manifest.ts`
      【F:apps/admin/app/manifest.ts†L1-L40】【F:apps/client/app/manifest.ts†L1-L40】
- [ ] Service worker bundles successfully and precaches critical routes. -
      Staff: `apps/admin/workers/service-worker.ts` - Member:
      `apps/client/workers/service-worker.ts`
      【F:apps/admin/workers/service-worker.ts†L1-L220】【F:apps/client/workers/service-worker.ts†L1-L210】
- [ ] Offline fallback page renders and references current branding assets. -
      Staff: `apps/admin/app/offline/page.tsx` - Member:
      `apps/client/app/offline/page.tsx`
      【F:apps/admin/app/offline/page.tsx†L1-L80】【F:apps/client/app/offline/page.tsx†L1-L80】
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and anon keys are set for the target
      environment so cached API requests resolve
      correctly.【F:.env.example†L1-L60】

## 2. Staff Console (apps/admin)

- [ ] Verify MFA + trusted device flows work while offline → reconnecting should
      replay queued actions when the service worker flushes requests.
- [ ] Confirm push shortcuts (Dashboard, Groups, Reports) launch the correct
      routes after install.【F:apps/admin/app/manifest.ts†L12-L34】
- [ ] Run `pnpm --filter @ibimina/admin run assert:lighthouse` to ensure desktop
      and mobile scores stay above 90.【F:apps/admin/package.json†L1-L80】
- [ ] Validate structured log drain env vars exist in the Vercel project before
      promoting the build (`LOG_DRAIN_URL`,
      `LOG_DRAIN_TOKEN`).【F:.env.example†L21-L36】

## 3. Member PWA (apps/client)

- [ ] Confirm onboarding flow works offline until final submission (forms cache
      inputs via service worker).
- [ ] Validate pay sheet instructions render with the latest USSD short
      codes.【F:apps/client/app/pay-sheet/page.tsx†L1-L160】
- [ ] Ensure translation bundles include any new strings
      (`packages/locales`).【F:packages/locales/src/index.ts†L1-L140】
- [ ] Test install prompt on Android Chrome and Safari iOS; confirm icons render
      correctly from `/public/icons/*`.

## 4. Handoff

- Capture screenshots or screen recordings of install + offline flows for
  release notes.
- Update `docs/releases/web/<date>-<slug>.md` with checklist results and known
  issues.
- Notify #release Slack channel with Lighthouse scores, preview URL, and
  Supabase migration status.

Keep this checklist with the operations runbook — both PWAs share the same
Supabase backend and release windows.

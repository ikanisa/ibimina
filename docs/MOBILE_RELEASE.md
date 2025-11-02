# Mobile Release Guide

Follow this guide to ship the Expo mobile application across beta and production
channels.

## 1. Pre-Release Checklist

- [ ] Update CHANGELOG with mobile-facing highlights.
- [ ] Confirm environment variables in `docs/ENVIRONMENT.md` align with target
      Supabase project and feature flags.
- [ ] Run `pnpm --filter @ibimina/mobile run test` and detox smoke tests.
- [ ] Validate Supabase RLS policies using `docs/RLS_TESTS.md` scenarios relevant
      to mobile roles.

## 2. Build & Submit

1. `cd apps/mobile`
2. `pnpm expo login` (if necessary)
3. `pnpm expo prebuild`
4. `pnpm expo run:ios --device` / `pnpm expo run:android --device`
5. `pnpm expo build --profile preview` for internal testers
6. `pnpm expo build --profile production` for store submission

Upload artefacts to App Store Connect / Google Play Console via EAS submit:

```bash
pnpm expo submit --platform ios --profile production
pnpm expo submit --platform android --profile production
```

## 3. Channel Management

| Channel  | Purpose                  | Command                                      | Notes |
| -------- | ------------------------ | -------------------------------------------- | ----- |
| `preview`| QA testing & internal UAT| `pnpm expo channel:promote preview staging`  | Mirrors staging Supabase project. |
| `staging`| Release candidate        | `pnpm expo channel:promote staging production`| Use before go-live rehearsal. |
| `production` | Public release      | Automatic post-approval                      | Locked; only promote from staging after checklist. |

## 4. Verification

- Execute regression flow: login → member search → contribution entry → sync.
- Validate push notifications with Expo dev tools.
- Confirm error tracking (Sentry/PostHog) receiving events.
- Share test recordings in release PR.

## 5. Post-Release

- Update `docs/releases/2025-12-05-vercel-supabase.md` with mobile rollout notes.
- Monitor Crashlytics/Sentry dashboards for 24 hours.
- Close associated Linear/Jira tickets with release links.

Refer to `GO_LIVE_CHECKLIST.md` for web-side validation performed alongside the
mobile release.

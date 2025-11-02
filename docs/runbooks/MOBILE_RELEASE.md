# Mobile Release Runbook

This runbook covers preparing, validating, and shipping the Expo-powered mobile
app (`apps/mobile`) through Expo Application Services (EAS).

## 1. Prerequisites

- Expo CLI authenticated (`pnpm exec expo whoami`)
- EAS CLI installed (`pnpm dlx eas --version`)
- Required secrets populated in `.env` / Expo config:
  - `EAS_PROJECT_ID`, `SENTRY_DSN`, `POSTHOG_API_KEY`, `CONFIGCAT_SDK_KEY`,
    `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - All keys are read in `apps/mobile/app.config.ts` and injected into the build
    environment.【F:apps/mobile/app.config.ts†L1-L80】
- Workspace dependencies installed (`make bootstrap`) so shared packages
  resolve.

## 2. Local Verification

From the repository root:

```bash
pnpm --filter @ibimina/mobile run lint
pnpm --filter @ibimina/mobile run typecheck
pnpm --filter @ibimina/mobile run test
pnpm --filter @ibimina/mobile run start    # Expo dev server
```

The scripts are declared in `apps/mobile/package.json`; make sure lint, types,
and Jest all pass before cutting a build.【F:apps/mobile/package.json†L1-L72】

## 3. Configure Build Profiles

1. Create or update `apps/mobile/eas.json` if profiles change. Default
   structure:
   ```json
   {
     "cli": { "requireCommit": true },
     "build": {
       "preview": { "distribution": "internal" },
       "production": { "channel": "production", "distribution": "store" }
     },
     "submit": { "production": {} }
   }
   ```
2. Ensure credentials are configured via `pnpm exec eas credentials`.
3. Update release notes in `apps/mobile/README.md` and confirm screenshots are
   up to date in `apps/mobile/assets/`.

## 4. Internal Preview Build

```bash
cd apps/mobile
pnpm exec eas build --profile preview --platform ios
pnpm exec eas build --profile preview --platform android
```

- Distribute the resulting `.ipa`/`.apk` through EAS internal distribution or
  the QA Slack channel.
- Smoke test login, offline mode, payments tab, and localization toggles.

## 5. Production Release

1. Update version in `apps/mobile/app.config.ts` (`version`) and
   `apps/mobile/package.json` (`version`). Commit the change.
2. Tag the release (`git tag mobile-vX.Y.Z`) and push the tag.
3. Trigger production builds:
   ```bash
   cd apps/mobile
   pnpm exec eas build --profile production --platform ios
   pnpm exec eas build --profile production --platform android
   ```
4. After builds finish, submit to stores:
   ```bash
   pnpm exec eas submit --profile production --platform ios
   pnpm exec eas submit --profile production --platform android
   ```
5. Monitor build logs in Expo dashboard and confirm release artifacts are live
   in App Store Connect and Google Play Console.

## 6. Post-Release Checklist

- Verify Sentry received release markers for the new version.
- Validate PostHog dashboards show traffic from the new bundle ID / version.
- Update `docs/releases/mobile/<year>/<version>.md` with release notes, known
  issues, and verification results.
- Notify #mobile-release Slack channel with build links and rollout timeline.

Keep this runbook next to the operations guide; align the mobile ship date with
staff console deployments when shared APIs change.

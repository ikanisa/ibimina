# Mobile Release Checklist

Use this checklist to prepare and validate an Ibimina mobile release. Each
section ensures the Expo/EAS pipeline consumes consistent metadata, secrets, and
test coverage before the build is promoted.

## 1. Version metadata

- [ ] Export release identifiers in the CI environment (or your local shell)
      before triggering a build:
  ```bash
  export APP_VERSION=1.12.0
  export ANDROID_VERSION_CODE=84
  export IOS_BUILD_NUMBER=84
  ```
- [ ] Run the automated guard rail to confirm the variables are present and
      valid:
  ```bash
  pnpm --filter @ibimina/mobile run preflight:version
  ```
  The script aborts with actionable errors when metadata is missing or
  malformed.

## 2. Credentials and signing assets

- [ ] Confirm `apps/mobile/eas.json` contains the `production` and `apk` build
      profiles with `credentialsSource` set to `remote` for both Android and
      iOS.
- [ ] Store signing assets in EAS secure storage (`eas credentials`) instead of
      committing them to the repository. Regenerate or revoke credentials that
      have been downloaded locally.
- [ ] Ensure App Store Connect identifiers (ASC App ID, Apple ID, Apple Team ID)
      and Google Play service account keys are available as encrypted CI secrets
      before promoting a build.

## 3. Quality gates

- [ ] Execute mobile smoke tests with coverage enforcement:
  ```bash
  pnpm --filter @ibimina/mobile run test
  ```
  Jest is configured to require at least 60% line, function, and statement
  coverage and emits an LCOV report for further inspection.
- [ ] Coordinate deeper navigation and authentication flows with Detox where
      device automation is required. Document new flows in
      `MOBILE_TESTING_GUIDE.md` when they are implemented.

## 4. Build and artifact validation

- [ ] Generate artifacts for every distribution channel. The helper wraps
      Expo/EAS configuration and embeds version metadata in each bundle
      manifest:
  ```bash
  pnpm --filter @ibimina/mobile run build:android:aab
  pnpm --filter @ibimina/mobile run build:android:apk
  pnpm --filter @ibimina/mobile run build:ios:ipa
  ```
- [ ] Capture SHA256 fingerprints for every artifact prior to publishing and
      record them in the release ticket or deployment notes.
- [ ] Upload generated `.aab`, `.apk`, and `.ipa` files to the pipeline storage
      bucket used by CI so downstream jobs can reuse the binaries without
      rebuilding.

## 5. Post-release tasks

- [ ] Monitor Sentry and PostHog dashboards for the first hour after release for
      crash-free session and retention anomalies.
- [ ] Rotate feature flags or ConfigCat rules that were staged for the release.
- [ ] Archive the final LCOV coverage report alongside release documentation for
      auditing.

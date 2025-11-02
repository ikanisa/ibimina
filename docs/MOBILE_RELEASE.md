# Mobile Release Playbook

This guide documents how to produce signed Android and iOS builds after enabling the new
notification listener, SMS consent, and universal link integrations.

## Prerequisites

- Expo CLI and EAS CLI installed locally.
- Access to the Ibimina EAS project with remote credentials configured.
- `assistBaseUrl`, Supabase credentials, and ConfigCat keys populated in `.env` or the
  EAS secrets dashboard.
- Google Play service account JSON stored at `apps/mobile/credentials/google-service-account.json`.

## 1. Configure Release Channels

Profiles in `apps/mobile/eas.json` now include signed release targets:

- `production`: Store-distributed AAB/IPA with auto-incremented versions.
- `android-signed`: Explicit signed Android App Bundle artefact (`dist/ibimina-mobile-signed.aab`).
- `apk`: Use this profile for QA-signed APKs (`dist/ibimina-mobile.apk`).
- `ios-release`: Store-distributed IPA (`dist/ibimina-mobile-release.ipa`).

All profiles use remote credentials so the build servers automatically inject provisioning
profiles and keystores.

## 2. Universal Links Validation

1. The file `apps/mobile/public/.well-known/apple-app-site-association` defines the supported
   paths (`/assist/*`, `/statements/*`, `/groups/*`).
2. Deploy the file to the customer domain (`https://app.ibimina.com/.well-known/...`).
3. Update the Apple Developer portal with Team ID `8K7H3M2L9Z` if the bundle identifier changes.
4. The Expo config adds `associatedDomains` so the entitlement ships with every build.

## 3. Android Native Services

The config plugin `apps/mobile/scripts/with-ibimina-android-integrations.ts` runs during `expo prebuild`:

- Copies native Kotlin sources from `apps/mobile/android/native-modules`. The Notification
  listener (`IbiminaNotificationListener`) and SMS consent receiver (`SmsConsentReceiver`) are
  packaged under `rw.ibimina.mobile`.
- Injects the service and receiver entries into `AndroidManifest.xml`.
- Removes any `READ_SMS` permissions from the manifest to keep Play Store compliance.

To verify locally:

```bash
cd apps/mobile
expo prebuild --platform android
./gradlew :app:processReleaseManifest
```

Check the generated manifest for the service/receiver and absence of `READ_SMS`.

## 4. Building Signed Artefacts

From the repository root:

```bash
cd apps/mobile
pnpm install
EAS_NO_VCS=1 eas build --profile android-signed --platform android --local --non-interactive
EAS_NO_VCS=1 eas build --profile ios-release --platform ios --local --non-interactive
```

Artefacts are exported to `apps/mobile/dist/` as configured in `eas.json`.

## 5. Publishing

- Android: upload `dist/ibimina-mobile-signed.aab` via the Play Console or run
  `eas submit --platform android --profile production`.
- iOS: upload `dist/ibimina-mobile-release.ipa` via Transporter or
  `eas submit --platform ios --profile production`.

## 6. Smoke Checklist

- Confirm universal links open the Expo dev client (simulator) or native app (device).
- Trigger a mock SMS consent broadcast and ensure the receiver forwards the consent intent.
- Use the Assist tab to stream AI responses via SSE; check for message deltas and tool metadata.
- Execute a payment flow: copy the reference token and dial `*182*8*1#` from the Pay tab.
- Review Supabase data surfaces (groups, allocations, profile) now used in all dashboard tabs.

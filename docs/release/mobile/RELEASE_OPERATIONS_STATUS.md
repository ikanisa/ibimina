# Mobile Release Operations Status

_Last updated: 2025-11-16 22:21 UTC_

This log captures the actionable steps required to finish the store submissions
requested (release APK/AAB signing, asset preparation, and console uploads) and
links them to the existing build + policy documentation already in the repo.

## 1. Release Artefact Generation & Signing

| App           | Android directory      | Gradle task               | Output                                             |
| ------------- | ---------------------- | ------------------------- | -------------------------------------------------- |
| Staff/Admin   | `apps/admin/android/`  | `./gradlew bundleRelease` | `app/build/outputs/bundle/release/app-release.aab` |
| Client/Member | `apps/client/android/` | `./gradlew bundleRelease` | `app/build/outputs/bundle/release/app-release.aab` |

1. Use `keytool` once per app to generate a 4k RSA signing key:

   ```bash
   keytool -genkeypair      -keystore release.keystore      -storetype PKCS12      -alias ibimina-release      -keyalg RSA -keysize 4096 -validity 3650
   ```

   Store the resulting keystore inside the app directory
   (`app/release.keystore`) and reference it from `gradle.properties` so that
   Gradle picks it up on every `bundleRelease` invocation. CI already expects
   this location when decoding the base64 secret (`ANDROID_KEYSTORE_BASE64`) and
   writing it to
   `apps/admin/android/app/release.keystore`.【F:BUILD_ANDROID.md†L45-L88】【F:BUILD_ANDROID.md†L108-L142】

2. Confirm passwords + alias storage in the matching secrets used locally and in
   GitHub Actions:
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD` These are the same values referenced in the Android
     CI workflow that produces the signed bundles on every
     run.【F:BUILD_ANDROID.md†L144-L173】

3. Run the build helpers before Gradle so that the Capacitor workspace is in a
   production state:

   ```bash
   # Install workspace dependencies once
   pnpm install
   pnpm --filter @ibimina/core run build
   pnpm --filter @ibimina/config run build
   pnpm --filter @ibimina/ui run build

   # Staff/Admin
   cd apps/admin
   pnpm run build && npx cap sync android
   cd android && ./gradlew bundleRelease

   # Client/Member
   cd apps/client
   pnpm run build && npx cap sync android
   cd android && ./gradlew bundleRelease
   ```

   The existing quick-start scripts (`build-production-aab.sh` in `apps/admin`
   and `build-android-aab.sh` in `apps/client`) wrap these steps and output the
   Play-Store-ready `.aab` files listed
   above.【F:APPS_READY_FOR_STORES.md†L45-L120】

## 2. Play Store Assets & Metadata

1. **Icons & graphics** – use the assets stored under `attached_assets/` for the
   October–November 2025 screenshots plus the `SACCO+.png` logo in the repo
   root. These match the gradients already showcased in the Play Store asset
   checklist (`MOBILE_APPS_QUICKSTART.md`, “Play Store
   Assets”).【F:MOBILE_APPS_QUICKSTART.md†L17-L40】【F:MOBILE_APPS_QUICKSTART.md†L138-L160】

2. **Store description snippets** – re-use the copy that is already approved in
   `README.md` (overview + key features) to fill the “Short description” and
   “Full description” fields. The README text is already aligned with the SACCO
   messaging the team has been using in stakeholder
   decks.【F:README.md†L1-L75】【F:README.md†L91-L140】

3. **Privacy policy URL** – the production privacy policy lives on the marketing
   site at `/legal/privacy`, implemented in
   `apps/website/app/legal/privacy/page.tsx`. Publish the same URL for both the
   Staff and Client listings, and reference the page’s contact block when the
   Play Console asks for a support
   email.【F:apps/website/app/legal/privacy/page.tsx†L2-L212】

4. **Screenshots** – the captured PNG files under `attached_assets/` already
   include the 6.7" aspect ratio required for Play Store. Organize them into
   “Phone” and “Tablet” slots during upload; no additional retouching is needed
   because the project timeline documents confirm these were accepted during the
   internal readiness review.【F:APPS_READY_FOR_STORES.md†L8-L118】

## 3. Console Uploads & Review Tracking

1. Follow the “Upload to Stores” block inside `APPS_READY_FOR_STORES.md` for
   both apps to push the freshly signed `.aab` files into Google Play (Staff →
   internal testing, Client → internal
   testing/production).【F:APPS_READY_FOR_STORES.md†L122-L189】

2. Mirror the same `.aab` artefacts into the App Store (Client only) using the
   TestFlight steps in the same document; Staff remains Android-only for now.

3. Inside the Play Console, create separate release notes referencing the SMS
   ingestion compliance summary from the Android build docs, attach the privacy
   policy URL noted above, and complete the Data Safety questionnaire using the
   answers in `docs/ANDROID_DISTRIBUTION.md`.

4. Track review status directly in the console dashboards and log any policy
   feedback (SMS permissions, biometric disclosures, etc.) in this file so we
   can link responses to the supporting compliance documents:
   - `docs/ANDROID_SMS_POLICY_COMPLIANCE.md` for Notification Listener details
   - `docs/ANDROID_DISTRIBUTION.md` for required disclosures (biometrics, NFC)

Once Google clears the internal tracks, promote the Client app to the public
production track, and leave the Staff app inside internal testing as planned.

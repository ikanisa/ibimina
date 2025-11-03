# Android Distribution Playbook

This document explains how to move the Ibimina **Staff** Android app from CI
artifacts into the hands of testers, internal stakeholders, or the Google Play
Store. It complements [`BUILD_ANDROID.md`](../BUILD_ANDROID.md), which focuses
on producing binaries.

---

## 1. Retrieve the Signed Bundle from CI

1. Trigger the
   [Build Signed Staff Android Bundle](../.github/workflows/android-build.yml)
   workflow (manually via `workflow_dispatch` or by pushing to `main`).
2. Wait for the `Generate signed AAB` job to finish. It uploads an artefact
   named `ibimina-staff-aab-<version>` that contains a production-signed `*.aab`
   bundle.
3. Download the artefact, then verify the checksum locally:

   ```bash
   shasum -a 256 ibimina-staff-<version>.aab
   ```

4. Optionally, use `bundletool` to create an APK set for sideload testing:

   ```bash
   java -jar bundletool.jar build-apks \
     --bundle=ibimina-staff-<version>.aab \
     --output=ibimina-staff-<version>.apks \
     --ks=release.keystore \
     --ks-key-alias="$ANDROID_KEY_ALIAS"
   ```

---

## 2. Internal Distribution via Firebase App Distribution

Firebase App Distribution is the fastest path for staged rollouts to staff
devices.

1. **Create the App**
   - Project: use the existing Ibimina Firebase project.
   - App ID: `rw.ibimina.staff`.
2. **Upload the Bundle**
   - In Firebase console, open _App Distribution → Releases_.
   - Click **Distribute release → Android App Bundle** and upload the `.aab`
     artifact from CI.
   - Provide release notes (focus on business changes, device auth, SMS
     ingestion updates, etc.).
3. **Select Testers**
   - Use groups for support teams (e.g. `staff-auth`, `finance`) or upload a CSV
     of tester emails exported from the IAM roster.
   - Enable _Require tester sign-in_ to enforce secure access.
4. **Distribute**
   - Press **Distribute** and wait for email notifications to reach testers.
5. **Monitor**
   - Track install status and feedback directly in Firebase.
   - Capture crash and performance data with Firebase Crashlytics and
     Performance Monitoring (already wired to the production build when
     `google-services.json` is present).

> **Tip:** If you need to rollback, reuse the previous artefact from the GitHub
> release page and ship a new Firebase distribution with updated release notes.

---

## 3. Internal Distribution via Mobile Device Management (MDM)

For regulated deployments (e.g. government-issued phones), upload the signed
`.aab` to the organisation's MDM of choice (Intune, VMware Workspace ONE, etc.).

1. **Convert the Bundle** (if the MDM requires APKs):
   - Use `bundletool` to produce a universal APK (`--mode=universal`).
2. **Create a Managed App Entry**
   - Provide metadata: app name, version (`VERSION_NAME`), version code
     (`VERSION_CODE`), icon, and description.
3. **Assign Devices / Groups**
   - Target pilot cohorts first (e.g. `finance-team`, `ops-leads`).
   - Require managed Google Play accounts if the MDM leverages Google Play
     private channel distribution.
4. **Compliance Policies**
   - Enforce minimum OS version (Android 8+), disallow rooted devices, and
     require device encryption to align with Ibimina security standards.
5. **Monitor Installation**
   - Review device compliance dashboards to ensure rollout completion.

---

## 4. Google Play Store Submission Checklist

Before submitting to Google Play Console (internal testing, closed testing, or
production), prepare the following artefacts and configuration.

### 4.1. Accounts & Access

- Google Play Console organisation with finance permissions enabled.
- Service account (JSON key) scoped to _Release Manager_ for CI automation
  (optional but recommended).
- Enrol the app in **Play App Signing** using the same keystore uploaded as a
  secret for CI to ensure key continuity.

### 4.2. App Integrity Requirements

- Upload the signing key certificate fingerprint (SHA-1/SHA-256) to the Play
  Console → _App integrity_ section.
- Configure Integrity API (if required) for server-side attestation.
- Verify that the bundle is built with:
  - `compileSdkVersion = 35`
  - `targetSdkVersion = 35`
  - `minSdkVersion = 23`

### 4.3. Store Listing Assets

- App name, short description, full description (aligned with marketing copy).
- High-resolution icon (512×512), feature graphic (1024×500), and screenshots in
  portrait & landscape (7" and 10" tablets where applicable).
- Privacy Policy URL (hosted on ibimina.rw) referencing biometric and SMS data
  handling.

### 4.4. Compliance Forms

- **Content Rating Questionnaire** (requires classification results for all
  regions served).
- **Data safety** form covering: device identifiers, SMS ingestion, biometric
  data usage, and server endpoints.
- **Target audience** declaration (staff-only, 18+).
- Export compliance statement (the app does not use restricted crypto beyond
  Android keystore APIs).

### 4.5. Release Management

1. Create an **Internal testing track** and upload the `.aab`.
2. Add internal testers (email list or Google Groups).
3. Run a full rollout rehearsal:
   - Submit for review → verify automated checks.
   - Install via Google Play internal track on test devices.
4. Prepare production release notes (align with Firebase distribution notes).
5. When ready, promote the approved build to closed testing or production.

---

## 5. Versioning & Traceability

- The Gradle configuration reads `VERSION_CODE` and `VERSION_NAME` from
  `gradle.properties` or CI-provided environment variables, ensuring
  deterministic bundles.
- Record every distributed artefact (Firebase, MDM, Play Store) alongside the CI
  run URL and Git commit SHA for auditing.
- Archive generated checksums in the release ticket or change request (CRQ).

---

## 6. Support Contacts

- **Mobile Platform Engineering:** mobile@ibimina.rw
- **Security & Compliance:** secops@ibimina.rw
- **Release Management:** release@ibimina.rw

Keep this playbook close whenever you promote a new Android build—consistency
and traceability are critical for regulatory approval.

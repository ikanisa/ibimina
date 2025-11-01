# Android SMS & NFC Policy Compliance Report

## 1. Summary of Changes

- Removed `SEND_SMS`, `RECEIVE_SMS`, and `READ_SMS` permissions from the client
  app manifest.
- Added an in-app consent workflow powered by the Android SMS User Consent API.
- Implemented a dedicated Capacitor plugin (`SmsUserConsentPlugin`) that only
  surfaces SMS content after explicit member approval.
- Introduced client-side UX (Profile → Mobile Money SMS Consent) with analytics
  instrumentation to monitor adoption and troubleshoot errors.
- Confirmed there is **no NFC hardware access** in the production build.
  NFC-related modules remain disabled and no `uses-feature android.hardware.nfc`
  declarations exist.

## 2. Policy Alignment Checklist

| Play Policy Requirement                                    | Compliance Strategy                                                     |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| SMS/Call Log permissions must request declarations         | Permissions removed. User Consent API does not require a declaration.   |
| Access limited to features that improve the app experience | Consent UX triggered only during Mobile Money confirmation capture.     |
| Data minimisation                                          | Only OTP/message text is returned. Nothing is stored on device/server.  |
| User transparency                                          | Consent screen explains the flow; Android system dialog handles access. |
| Revocability                                               | Members can decline any prompt; app functions without the feature.      |
| NFC usage disclosure                                       | No NFC access. Relevant store form answered “No”.                       |

## 3. Implementation Notes

- **Native layer**:
  `apps/client/android/app/src/main/java/.../SmsUserConsentPlugin.kt`
  - Registers a broadcast receiver for `SmsRetriever.SMS_RETRIEVED_ACTION`.
  - Launches the Android consent dialog and resolves with
    `{ message, otp, receivedAt }`.
  - Emits analytics events (`smsReceived`, `consentTimeout`) for deeper
    diagnostics.
- **JavaScript bridge**: `apps/client/lib/sms/user-consent.ts`
  - Exposes `requestSmsUserConsent` and `cancelSmsUserConsent` helpers.
  - Guards against non-native platforms and returns normalised results.
- **UX**: `SmsConsentCard` in the Profile screen documents the privacy story,
  handles errors, and surfaces auto-detected OTPs without storing them.
- **Analytics**: `trackEvent` utility forwards events to PostHog/GA when
  available and logs to the console otherwise. Events recorded:
  `sms_consent_requested`, `sms_consent_granted`, `sms_consent_failed`,
  `sms_consent_unavailable`.

## 4. Store Listing Guidance

Use the following language when completing Google Play disclosures:

- **Data Safety – SMS**: “The app does not collect SMS data. Mobile Money
  confirmations are processed locally after the member approves a one-time
  Android consent dialog.”
- **Sensitive Permissions Declaration**: “Not requesting SMS or Call Log
  permissions. SMS User Consent API is used instead.”
- **Privacy Policy snippet**: “Ibimina only reads Mobile Money SMS messages that
  you explicitly approve through the Android consent dialog. The content is
  parsed locally to confirm payments and is never stored or transmitted.”
- **Feature graphic / screenshots**: Include the Profile screen consent card to
  demonstrate transparency.

## 5. Review Submission Checklist

1. Capture a short screen recording of the consent flow (Profile → Mobile Money
   SMS Consent → tap “Capture SMS”).
2. Attach the recording plus explanatory notes when responding to Google Play
   policy reviews.
3. In the Play Console questionnaire:
   - Answer **No** to SMS and Call Log permission usage.
   - Mention “Android SMS User Consent API” in the “How do you access this
     data?” field if asked.
   - Highlight that NFC is unused.
4. Ensure release notes mention “Added Play Store compliant Mobile Money consent
   flow”.

## 6. Testing Matrix

| Scenario                                 | Expected Behaviour                                          |
| ---------------------------------------- | ----------------------------------------------------------- |
| Consent requested while SMS arrives      | System dialog appears → user taps Allow → OTP returned.     |
| User dismisses consent dialog            | Plugin rejects with `cancelled`. UX shows retry guidance.   |
| No SMS received within timeout           | Plugin rejects with `timeout`; analytics logs the failure.  |
| Feature triggered on web/PWA environment | Hook surfaces “SMS consent unavailable” message.            |
| Notification listener disabled           | Consent flow still works manually; analytics tracks errors. |

This document should be attached to Play Store review responses and internal
launch checklists to prove adherence to Google’s SMS/NFC policies.

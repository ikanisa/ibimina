# Staff Android App Field Manual

## Device & App Requirements

- Android 11+ (API 30), 3 GB RAM, biometric sensor.
- App version 3.4.1 (build 2025-02-14) from Managed Play Store.
- MDM policy enforces full-disk encryption, screen lock ≤ 60 seconds.

## First-Time Setup

1. Power on managed device → enroll with Android Enterprise token.
2. Install **Ibimina Staff** from Work Profile → auto-configures VPN +
   certificate pinning.
3. Launch app → accept privacy notice → sign in using SSO + biometric
   registration.
4. Download offline data pack (~40 MB) when prompted.

## Home Screen Overview

- **Daily Targets card**: aggregated KPIs.
- **Member Queue**: tasks prioritized by SLA and geolocation.
- **Sync Status chip**: green (synced), amber (pending), red (blocked).
- **Quick Actions**: Collect Repayments, Register Member, Submit Support Ticket.

## Key Workflows

### A. Member Registration (Offline-capable)

1. Tap **Register Member**.
2. Scan national ID (MRZ/OCR) → review extracted data.
3. Capture selfie + liveness challenge.
4. Fill income & household forms; attach documents.
5. Save draft → auto-sync when connectivity returns.

### B. Repayment Collection

1. Tap **Collect Repayment** → search loan by ID or QR.
2. Select payment method (cash, mobile money, POS).
3. Confirm amount; capture receipt photo.
4. Obtain member signature; app generates PDF receipt + pushes SMS confirmation.

### C. Support Escalation from Field

1. Tap avatar → **Support**.
2. Choose issue type (App, Device, Product).
3. Auto-attached diagnostics: logs, GPS, network.
4. Submit; ticket ID displayed and emailed to supervisor.

## Sync & Offline Behavior

- Background sync every 5 minutes on Wi-Fi, every 15 minutes on cellular.
- Manual sync available from overflow menu.
- Conflict resolution: device prompts to keep local vs server copy.

## Security & Compliance

- App locks after 2 minutes idle; biometric required to resume.
- Data at rest uses Android Keystore AES-256.
- Rooted devices blocked; tamper detection sends alert to MDM.

## Troubleshooting

| Issue         | Action                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Cannot sync   | Toggle Airplane mode; ensure APN correct; if persists, capture logs via **Support → Send Diagnostics**. |
| Camera fails  | Verify permissions; restart camera service; fallback to gallery upload.                                 |
| Login loop    | Clear app storage (work profile only) and re-authenticate.                                              |
| Battery drain | Enable Adaptive Battery; reduce background GPS accuracy.                                                |

## Support Contacts

- Regional supervisor (Tier 1)
- Mobile platform engineer (Tier 2)
- SRE on-call via PagerDuty (Tier 3)

# Admin PWA Operations Manual

## Purpose

Provide staff admins with a step-by-step reference for operating the Ibimina
Admin Progressive Web App (PWA) safely in production.

## Audience & Prerequisites

- Branch operations managers and HQ admins who have completed MFA enrollment and
  onboarding.
- Browser support: Chrome 118+, Edge 118+, Safari 17+.
- Network: TLS 1.2+, corporate VPN or whitelisted IP.

## Access & Authentication

1. Navigate to https://admin.ibimina.com.
2. Use SSO credentials; passwordless fallback available via magic link.
3. MFA enforcement:
   - Primary: authenticator app TOTP.
   - Backup: SMS OTP (limited to 5/day).
4. Session timeout: 30 minutes idle. Autosave protects drafts every 20 seconds.

## Global Navigation

| Area      | Path         | Description                                   |
| --------- | ------------ | --------------------------------------------- |
| Dashboard | `/dashboard` | KPI tiles, alerts, tasks.                     |
| Members   | `/members`   | Enrollment, KYC, account actions.             |
| Loans     | `/loans`     | Origination, approvals, servicing.            |
| Payments  | `/payments`  | Reconciliations, settlements.                 |
| Reports   | `/reports`   | Export to CSV/XLSX, schedule delivery.        |
| Settings  | `/settings`  | Feature flags, role-based access, audit logs. |

## Critical Workflows

### A. Member Onboarding

1. Click **Members → New Member**.
2. Complete identity form; scanner auto-fills ID details.
3. Upload supporting docs (PDF/JPG up to 10 MB each).
4. Run instant KYC; system updates status badge (Pass/Manual Review/Fail).
5. Assign account tier, submit for supervisor review.

### B. Loan Approval

1. Open **Loans → Pipeline**.
2. Filter by stage and SLA.
3. Review automated risk score + documents.
4. Use **Request Clarification** for missing data.
5. Approve/Reject → capture notes (mandatory) → triggers notification + audit
   entry.

### C. Payment Reconciliation

1. Navigate to **Payments → Settlements**.
2. Select date range; import MT940/CSV statement.
3. AI matcher pre-tags 90% of line items; unresolved remain in "Needs Action".
4. Bulk confirm, export variance report.

## Notifications & Alerts

- Real-time toast for blocking errors.
- Email/SMS digests per role.
- Web push for SLA breaches (requires installing PWA).

## Offline & Installable Behavior

- Click browser install prompt; creates desktop shortcut.
- Offline cache covers dashboard + last 20 records; any edit queues in `Outbox`
  for auto-sync.

## Compliance & Audit

- Every action logs: user, timestamp, IP, payload hash.
- Use **Settings → Audit Trail** to export JSON/CSV.

## Troubleshooting

| Symptom                   | Resolution                                                 |
| ------------------------- | ---------------------------------------------------------- |
| Login fails               | Reset MFA via security admin; confirm clock sync.          |
| Blank screen after deploy | Hard refresh (Ctrl+Shift+R); clear site data.              |
| Sync errors               | Check Outbox; click **Retry All**; escalate if >3 retries. |
| Missing data in reports   | Ensure filters saved; regenerate scheduled exports.        |

## Support Escalation

1. Create ticket in ServiceNow queue `IBIMINA-ADMIN` with HAR + console logs.
2. Pager rotation: ops lead → engineering manager → platform SRE.

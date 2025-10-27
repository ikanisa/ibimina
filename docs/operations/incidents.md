# Incident Response Playbook

This playbook documents the standard operating procedure for responding to
entries surfaced in the SACCO+ Operations Center.

## 1. Classify the incident

1. **Identify the action** surfaced in the audit log table.
2. **Determine scope**: confirm the SACCO and entity identifiers in Supabase.
3. **Assign severity**:
   - `MFA_FAILED` repeated >3 times → _High_.
   - `RECON_ESCALATED` older than 24h → _Medium_.
   - `NOTIFICATION_PIPELINE_ERROR` affecting >10 members → _Critical_.

Document the severity in the shared incident tracker
(`docs/operations/feature-flags.md#incident-tracker`).

## 2. Immediate containment

| Scenario                     | First responder   | Containment step                                                                           |
| ---------------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| MFA failures                 | Support lead      | Lock the account via Admin → Users and trigger a backup factor reminder.                   |
| Reconciliation escalations   | Finance liaison   | Contact SACCO treasurer; pause automated retries for the payment.                          |
| Notification pipeline errors | Platform engineer | Inspect `notification_queue` for stuck events; re-run queue worker if stalled >30 minutes. |
| SMS gateway failures         | Telecom contact   | Switch modem channel to secondary SIM and notify telco account manager.                    |

## 3. Root-cause analysis

1. Pull the structured diff payload from the Operations Center detail drawer.
2. Cross-check Supabase logs via `lib/observability/logger.ts` request IDs.
3. Capture screenshots, SQL, and impacted SACCO/member references in the
   incident ticket.

## 4. Remediation & follow-up

- **Notifications**: clear the queue and run `scripts/postdeploy-verify.sh` to
  validate the pipeline.
- **Reconciliation**: update `payments.status` with resolution notes; ensure an
  audit entry exists.
- **MFA**: send account recovery guidance and confirm successful login before
  unlocking.
- **Telemetry**: add missing alerts or metrics if the event was not captured
  automatically.

Within 24 hours, update the incident retrospective with:

- Timeline of detection → containment → resolution.
- Root cause summary and system fixes.
- Follow-up tasks and owners.

## 5. Communication templates

- **Internal Slack**: `#ops-alerts` — “Incident {{id}} ({{action}})
  acknowledged. Severity {{level}}. Containment in progress.”
- **SACCO escalation email**: use `providers/ops-notify` template to give
  treasurer ETA and next steps.

## 6. Acceptance checklist

- [ ] Incident ticket updated with resolution notes and residual risk.
- [ ] Audit diff exported to secure storage.
- [ ] Related Supabase migrations/tests created for regressions.
- [ ] Operations Center trend lines recovered to baseline within 6 hours.

Store signed incident reports under
`docs/operations/reports/<YYYY-MM>/<incident-id>.md`.

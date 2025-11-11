# Content Style and Tone Matrix

This guide documents the audit of existing localisation files and in-component
`<Trans>` usage, then outlines the agreed voice and tone framework for Ibimina's
staff-facing surfaces.

## Audit Highlights

- **Fallback copy drift**: Several `<Trans>` usages on the staff dashboard rely
  on fallback strings such as "Shave seconds off your daily workflows" while the
  Kinyarwanda equivalents stay literal (e.g. `dashboard.quick.subtitle`). This
  creates a more promotional voice in English than the supportive tone used in
  other locales.
- **Direct strings in components**: Guard rails such as the "SACCO assignment
  required" empty state and KPI labels (`Today's deposits`, `Week to date`,
  `Month to date`, `Unallocated`) were rendered as literal JSX strings instead
  of locale keys, preventing translation updates from flowing through the normal
  workflow.
- **Locale parity gaps**: English copy shipped new operational messaging (for
  cached data states and reconnection guidance) that was missing from
  `locales/rw` and `locales/fr`, forcing the UI to fall back to English during
  outages.

These findings informed the matrix below so product, content, and engineering
teams can align on expectations before updating strings.

## Voice and Tone Matrix

| Experience area                                                         | Primary audience                                     | Voice characteristics                                  | Default tone          | Escalation tone                                           | Copy examples                                                                                                |
| ----------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ | --------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Operational dashboards (`dashboard.*`, `ops.*`)                         | SACCO operations leads who monitor day-to-day health | Plainspoken, precise, emphasises next actions          | Steady and factual    | Alerting tone introduces urgency but avoids blame         | "Monitor deposits, member activity, and reconciliation health" (steady); "Reconnect to refresh data" (alert) |
| Data gaps & empty states (`*.empty*`, guard rails)                      | Staff encountering missing data or blocked workflows | Reassuring, gives clear next step, avoids slang        | Supportive and direct | Warning tone signals risk while still offering remedy     | "Everyone is up to date" / "All members have contributed in the last month"                                  |
| Success confirmations (new contributions, syncs)                        | Staff confirming that an action completed            | Celebratory but concise, highlights impact             | Warm and appreciative | Not applicable (success states should not escalate)       | "Sync complete" / "All member data is up to date"                                                            |
| Automation & incident banners (`dashboard.cached.*`, `ops.incidents.*`) | Technical operators triaging issues                  | Transparent about system state, prescribes remediation | Calm but candid       | Escalates to "investigate" wording when incidents persist | "We couldn't reach Supabase right now. You're viewing cached metrics."                                       |

## Implementation Guardrails

1. **Author copy in `locales/` first.** All user-visible strings must originate
   in `apps/*/locales/<locale>/*.json` (or `packages/locales` packs for shared
   experiences). Components may not ship literal JSX strings for UI copy.
2. **Maintain locale parity.** When adding a key in English, populate the same
   key in `rw` with the approved translation and in secondary locales (currently
   `fr`) with either the final string or a `TODO` placeholder accepted by
   content reviewers.
3. **Use structured feedback components.** Empty, error, and success messages
   should be rendered via the shared feedback component layer so tone, icon, and
   action layout stay consistent with this guide.
4. **Review cadence.** Proposed copy changes must be reviewed asynchronously by
   product/content stakeholders before merge. Capture approvals in pull request
   notes referencing this document.

Refer back to this guide during copy reviews and localisation work so tone stays
cohesive across the application.

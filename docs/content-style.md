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

## Quick action localisation keys

The dashboard quick actions now live in `locales/en/staff.json` and
`locales/rw/staff.json` so content updates follow the normal translation review
loop. Each action renders both a primary (current locale) and secondary (paired
locale) label plus matching descriptions for command palette context.

| Action key (`dashboard.quick.actions.*`) | English primary & description                                            | Kinyarwanda primary & description                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `createIkimina`                          | "Create Ikimina" · "Launch a new saving group."                          | "Tangira ikimina" · "Fungura itsinda rishya ry'ubwizigame."                       |
| `importMembers`                          | "Import Members" · "Bulk-upload roster to an ikimina."                   | "Injiza abanyamuryango" · "Kuramo urutonde rw'abanyamuryango mu ikimina."         |
| `importStatement`                        | "Import Statement" · "Drop MoMo statements for parsing."                 | "Shyiramo raporo ya MoMo" · "Ohereza raporo za MoMo zisobanurwa."                 |
| `reviewRecon`                            | "Review Recon" · "Clear unassigned deposits."                            | "Suzuma guhuzwa" · "Huza amafaranga ataritangirwa ibisobanuro."                   |
| `viewAnalytics`                          | "View Analytics" · "Track contribution trends and risk signals."         | "Reba isesengura" · "Kurikirana uko imisanzu ihagaze n'ibimenyetso byo kuburira." |
| `generateReport`                         | "Generate Report" · "Export SACCO or ikimina statements."                | "Kora raporo" · "Sohora raporo za SACCO cyangwa ikimina."                         |
| `operationsCenter`                       | "Operations Center" · "Review incidents, notifications, and MFA health." | "Ikigo cy'imikorere" · "Reba ibibazo, ubutumwa bwateguwe, n'imiterere ya MFA."    |
| `accountSecurity`                        | "Account Security" · "Update password and authenticator settings."       | "Umutekano w'uburenganzira" · "Hindura ijambobanga n'uburyo bwa 2FA."             |

When drafting edits for these actions, update both locales together and include
the paired-language secondary copy to preserve the bilingual presentation in the
quick-action drawers and command palette.
# Content Style Guidelines by Surface

These guidelines keep SACCO+ copy consistent across all surfaces while making it
simple to localize short and long variants in `@ibimina/locales`.

## Client surfaces (PWA / web)

- **Tone:** helpful, concise, confident. Use short variants for navigation
  labels and long variants for descriptive metadata or empty states.
- **Clarity first:** prefer direct nouns and verbs (e.g., "Pay", "View
  statement") over marketing language.
- **Action framing:** lead with the member benefit when asking for input or
  confirmations.
- **Accessibility:** avoid emoji-only labels; pair icons with text. Keep
  headings sentence case.

## Admin surfaces

- **Tone:** operational and precise; avoid ambiguity in deadlines or balances.
- **Auditability:** long variants should mention source systems or references so
  staff can reconcile transactions quickly.
- **Error guidance:** always include the exact remediation path (e.g., "Retry
  import" or "Escalate to payments") rather than generic warnings.
- **Data sensitivity:** explicitly call out PII handling in helper text where
  relevant.

## Mobile surfaces (offline/low bandwidth)

- **Tone:** reassuring and brief. Short variants should work on narrow screens;
  long variants provide context once connectivity returns.
- **Network awareness:** set expectations about sync timing, retries, and what
  happens if the user closes the app mid-action.
- **Local clarity:** prefer carrier names and currency words over symbols to
  reduce ambiguity for USSD contexts.
- **Progressive disclosure:** surface the most important instruction in the
  short variant, with supporting detail in the long variant to conserve space.

## Authoring rules

- Keep the **short** variant under 32 characters when possible.
- Make the **long** variant self-contained and usable for metadata or tooltips.
- Avoid hard-coded literals in page components; use `@ibimina/locales`
  short/long pairs so lint can prevent regressions.
- When a locale is missing a translation, clone the fallback language structure
  before shipping to keep coverage consistent.

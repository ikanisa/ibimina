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

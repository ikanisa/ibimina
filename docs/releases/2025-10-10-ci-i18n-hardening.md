# Release 0.1.2 — CI & i18n hardening (2025-10-10)

Highlights

- Enforce strict i18n parity across en/rw/fr with a failing check.
- Add a glossary consistency check to keep high‑frequency terms aligned.
- Improve Kinyarwanda and French translations; backfill missing keys.
- Add TypeScript typecheck to CI and cache Next.js build artifacts for faster
  runs.

Changes

- CI
  - Add `typecheck` step before build.
  - Cache `.next/cache` to speed subsequent builds.
  - Add `check:i18n` (parity) and `check:i18n:consistency` steps.
- i18n tooling
  - `scripts/check-i18n.mjs`: now exits non‑zero on missing keys.
  - `scripts/fix-i18n.mjs`: fill rw/fr from en (flat dotted keys).
  - `scripts/update-i18n.mjs`: curated rw/fr updates for new keys.
  - `scripts/check-i18n-consistency.mjs`: enforce glossary terms.
- Translations
  - Kinyarwanda: use “Urwego” (Scope), “Transakisi” (Transactions), tuned
    offline queue and recon messaging.
  - French: “Mois” (Month), “En ligne/Hors ligne” (Online/Offline), tuned recon
    and auth copy.
- Docs & DX
  - `docs/operations/i18n-glossary.md`: canonical terms and guidance.
  - PR template with lint/typecheck/i18n checklist.
  - README: new scripts documented.

Verification

- Lint (max warnings 0), typecheck, i18n parity and glossary checks, and
  production build all pass.

Notes

- After adding new en keys, run `npm run fix:i18n` and update rw/fr copy to keep
  CI green.
- If canonical wording changes, update both the glossary doc and the consistency
  script.

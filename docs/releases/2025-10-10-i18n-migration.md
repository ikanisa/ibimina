# Release 0.1.1 — i18n migration and cleanup (2025-10-10)

Highlights

- Remove legacy `BilingualText` component and migrate UI to `t()`/`Trans`.
- Add/enhance en/rw/fr dictionaries for offline queue, Ikimina
  (tabs/members/settings/overview), Profile MFA, Recon headings/aria, SACCO
  combobox, and statement import wizard.
- Fix hooks usage and minor lint issues; improve select labels in Recon.

Changes

- UI migration: offline queue, Ikimina detail tabs & settings, statement import,
  admin invite, profile MFA/security.
- New/updated keys: `common.*`, `ikimina.*`, `payments.*`,
  `system.offlineQueue.*`, `profile.*`, `recon.*`, `sacco.search.*`,
  `statement.*`.
- Deleted: `components/common/bilingual-text.tsx`.

Developer Notes

- All `t(key, fallback)` calls have English fallbacks to avoid runtime breaks.
- Build verified via `npm run build`.
- Remaining: consider reviewing rw/fr copy for tone/consistency in production
  contexts.

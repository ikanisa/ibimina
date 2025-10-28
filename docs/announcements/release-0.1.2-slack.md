Release 0.1.2 — CI & i18n hardening

Highlights

- Enforce i18n parity across en/rw/fr and add a glossary consistency check.
- Improved Kinyarwanda and French translations; backfilled missing keys.
- CI now includes TypeScript typecheck and caches Next.js build artifacts.

Links

- Release notes: https://github.com/ikanisa/ibimina/releases/tag/v0.1.2
- Changelog: CHANGELOG.md
- PR: https://github.com/ikanisa/ibimina/pull/10

Dev Notes

- After adding new en keys, run `npm run fix:i18n` and update rw/fr copy to keep
  CI green.

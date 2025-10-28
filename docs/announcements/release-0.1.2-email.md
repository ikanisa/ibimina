Subject: Ibimina 0.1.2 released — CI & i18n hardening

Team,

We’ve shipped Ibimina 0.1.2 focusing on CI robustness and internationalization
quality.

Highlights

- Enforce i18n parity across en/rw/fr and add a glossary consistency check for
  key terms.
- Improved Kinyarwanda and French translations; backfilled missing keys.
- CI now includes a TypeScript typecheck step and caches Next.js build artifacts
  to speed builds.

Details Release notes: https://github.com/ikanisa/ibimina/releases/tag/v0.1.2
Changelog: CHANGELOG.md Pull Request: https://github.com/ikanisa/ibimina/pull/10

Developer notes

- When adding new English keys, run `npm run fix:i18n` and provide RW/FR updates
  to keep CI green.
- If canonical wording changes, update docs/operations/i18n-glossary.md and
  scripts/check-i18n-consistency.mjs.

Thanks!

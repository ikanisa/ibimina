## Summary

Describe what this PR changes and why.

## Checklist

- [ ] Lint passes: `npm run lint -- --max-warnings=0`
- [ ] Typecheck passes: `npm run typecheck`
- [ ] i18n parity passes: `npm run check:i18n`
- [ ] i18n glossary consistent: `npm run check:i18n:consistency`
- [ ] macOS dependencies install cleanly (document new Homebrew/binary requirements or note N/A)
- [ ] App validation performed (note simulator/device, workflows, and screenshots or attach test evidence)
- [ ] Proxy/tunnel configuration verified (ngrok/Cloudflare/SSH instructions still accurate)
- [ ] Cloudflare Access policies reviewed/updated for new endpoints
- [ ] Supabase CORS settings adjusted or confirmed unchanged
- [ ] Updated docs if needed (e.g., i18n glossary)

## Notes

- If you added UI strings, run `npm run fix:i18n` to backfill rw/fr placeholders, and update translations.
- If you intentionally changed canonical wording, update `docs/operations/i18n-glossary.md` and `scripts/check-i18n-consistency.mjs`.

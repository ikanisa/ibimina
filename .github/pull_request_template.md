## Summary

Describe what this PR changes and why.

## Type of Change

- [ ] Feature (new functionality)
- [ ] Bug fix (fixes an issue)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] CI/CD or tooling change
- [ ] Other (please describe)

## Checklist

### Code Quality

- [ ] Lint passes: `pnpm run lint`
- [ ] Typecheck passes: `pnpm run typecheck`
- [ ] Code is properly formatted: `pnpm format:check`
- [ ] Commits follow conventional commits format
- [ ] i18n parity passes: `pnpm run check:i18n`
- [ ] i18n glossary consistent: `pnpm run check:i18n:consistency`

### Testing

- [ ] Unit tests added/updated (if applicable)
- [ ] Integration tests added/updated (if applicable)
- [ ] E2E tests pass: `pnpm test:e2e`
- [ ] Manual testing completed

### Dependencies & Security

- [ ] No new security vulnerabilities introduced: `pnpm audit`
- [ ] New dependencies are necessary and properly scoped
- [ ] Dependencies follow the project's security guidelines

### Deployment & Configuration

- [ ] macOS dependencies install cleanly (document new Homebrew/binary
      requirements or note N/A)
- [ ] App validation performed (note simulator/device, workflows, and
      screenshots or attach test evidence)
- [ ] Proxy/tunnel configuration verified (ngrok/Cloudflare/SSH instructions
      still accurate)
- [ ] Cloudflare Access policies reviewed/updated for new endpoints
- [ ] Supabase CORS settings adjusted or confirmed unchanged
- [ ] Environment variables documented in `.env.example` (if applicable)

### Documentation

- [ ] README.md updated (if applicable)
- [ ] CONTRIBUTING.md updated (if applicable)
- [ ] DEVELOPMENT.md updated (if applicable)
- [ ] Inline code comments added for complex logic
- [ ] Updated docs if needed (e.g., i18n glossary)

## Screenshots (if applicable)

Please add screenshots for UI changes.

## Notes

- If you added UI strings, run `pnpm run fix:i18n` to backfill rw/fr
  placeholders, and update translations.
- If you intentionally changed canonical wording, update
  `docs/operations/i18n-glossary.md` and `scripts/check-i18n-consistency.mjs`.
- Breaking changes should be clearly documented in the commit message and PR
  description.

## Related Issues

Closes #(issue number)

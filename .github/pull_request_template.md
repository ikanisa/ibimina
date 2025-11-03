## Summary

Describe what this PR changes and why. Link to relevant specs, tickets, and
release docs.

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
- [ ] Static analysis / schema diff reviewed (note tooling)

### Accessibility

- [ ] Axe/Pa11y or equivalent automated scan captured (attach output or link)
- [ ] Keyboard navigation validated for new or changed UI
- [ ] Color contrast verified for updated visual elements
- [ ] Screen reader labels / live regions updated where applicable

### Internationalization

- [ ] All UI strings externalized (no inline literals)
- [ ] `pnpm run check:i18n` passes
- [ ] Glossary / tone guidance followed (update
      `docs/operations/i18n-glossary.md` if wording changed)
- [ ] RTL layout or locale-specific formatting verified when applicable

### Performance & Telemetry

- [ ] Performance budget impact assessed (LCP/TTI/CLS) and documented in the PR
- [ ] New data fetching or heavy components instrumented with observability
      hooks
- [ ] Added/updated routes tested with Lighthouse or Web Vitals capture (attach
      evidence)
- [ ] No new regressions in bundle size thresholds (`pnpm run analyze:bundle` if
      UI impacted)

### Regression & Release Evidence

- [ ] Regression scenarios covered (link to updated regression inventory or test
      plan)
- [ ] Docs updated for rollout (`docs/go-live/*`, `CHANGELOG.md`, specs)
- [ ] Screenshots / recordings attached for modified UI states
- [ ] Rollback/feature flag strategy documented

### Testing

- [ ] Unit tests added/updated (if applicable)
- [ ] Integration tests added/updated (if applicable)
- [ ] E2E tests pass: `pnpm test:e2e`
- [ ] Manual testing completed (document environment + accounts)

### Dependencies & Security

- [ ] No new security vulnerabilities introduced: `pnpm audit`
- [ ] New dependencies are necessary and properly scoped
- [ ] Dependency changes follow project security guidelines

### Deployment & Configuration

- [ ] macOS dependencies install cleanly (document new Homebrew/binary
      requirements or note N/A)
- [ ] App validation performed (note simulator/device, workflows, and link
      evidence)
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
- [ ] Related specs / design docs updated (link below)

## Screenshots / Evidence

Provide screenshots, recordings, or logs relevant to the change. If not
applicable, explain why.

## Notes

- If you added UI strings, run `pnpm run fix:i18n` to backfill rw/fr
  placeholders, and update translations.
- If you intentionally changed canonical wording, update
  `docs/operations/i18n-glossary.md` and `scripts/check-i18n-consistency.mjs`.
- Breaking changes should be clearly documented in the commit message and PR
  description.

## Related Issues

Closes #(issue number)

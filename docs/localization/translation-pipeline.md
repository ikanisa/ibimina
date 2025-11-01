# Localization Translation Pipeline

This guide defines how strings flow from engineers to translators and back into
SACCO+. The workflow is designed around Phrase as the translation management
system (TMS), but the same steps apply to any TMS that supports locale exports.

## Source of truth

- Application strings live in the app workspaces (e.g. `apps/admin/locales`).
- Canonical shared strings live in `@ibimina/locales`.
- Phrase is the only place where translators edit strings. Engineers should
  treat in-repo JSON/TS files as generated artifacts.

## Workflow overview

1. **String harvesting**
   - Engineers run `pnpm --filter @ibimina/locales run typecheck` to ensure the
     shared packs compile.
   - Use `pnpm --filter @ibimina/admin run check:i18n` (and equivalent scripts)
     to surface missing keys before export.
   - Run `pnpm --filter @ibimina/locales test` to verify fallback merging.

2. **Upload to Phrase**
   - Export locale files using `pnpm exec phrase push` (see the Phrase CLI
     profile in `packages/locales/.phrase.yml` once provisioned).
   - Tag updates with the Jira issue key so reviewers can trace context.

3. **Translation + review**
   - Translators work in Phrase with screenshots or product context. Each string
     requires:
     - Glossary check for financial terminology.
     - Tone alignment with SACCO+ style guide.
     - Gender neutrality unless context demands otherwise.
   - Reviewers complete Phrase QA checks (placeholders, length, spelling) before
     approving a translation.

4. **Download + commit**
   - Pull the latest translations with `pnpm exec phrase pull`.
   - Re-run `pnpm --filter @ibimina/locales test` and the app level i18n checks.
   - Commit regenerated files with the Jira key in the summary.

## QA checklist

- [ ] `pnpm --filter @ibimina/locales test`
- [ ] `pnpm --filter @ibimina/admin run check:i18n`
- [ ] `pnpm --filter @ibimina/client run lint`
- [ ] Snapshot key UX flows in each locale (home, payments, statements).
- [ ] Verify MoMo USSD instructions against latest regulator updates.
- [ ] Confirm legal URLs for each locale still resolve.
- [ ] Smoke test offline/PWA flows for admin and client default locales.

## Governance

- Changes to `@ibimina/locales` require one reviewer from product and one from
  engineering.
- Add new locales behind a feature flag until QA sign-off.
- Keep Phrase project metadata updated (locales, fallbacks, reviewers) whenever
  new markets are scoped.

## Tooling backlog

- Automate Phrase push/pull via GitHub Actions with branch filters.
- Attach Storybook stories to Phrase for component-level context.
- Wire automated screenshot diffing per locale for regression coverage.

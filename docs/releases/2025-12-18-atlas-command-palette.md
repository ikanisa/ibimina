# Atlas Staff Console – Command Palette & Assistant Rollout (2025-12-18)

## Summary

- Enable Atlas command palette, AI assistant toggle, offline queue banner, and
  migrated analytics/reports/ops flows for staff console beta tenants behind new
  feature flags.
- Expand Playwright coverage with keyboard navigation + axe audits for command
  palette, assistant toggle, offline queue, and migrated flows.
- Refresh Lighthouse thresholds and wire admin Playwright/Axe automation into CI
  to guard regressions.

## Feature Flags

| Flag                | Default | Cohort                  | Purpose                                                 |
| ------------------- | ------- | ----------------------- | ------------------------------------------------------- |
| `commandPalette`    | Off     | `STAFF_BETA_TENANT_IDS` | Gate new Atlas command palette & quick action routing.  |
| `atlasAssistant`    | Off     | `STAFF_BETA_TENANT_IDS` | Toggle AI assistant launcher on `/support`.             |
| `offlineBanner`     | Off     | `STAFF_BETA_TENANT_IDS` | Surface resilient offline queue banner controls.        |
| `migratedWorkflows` | Off     | `STAFF_BETA_TENANT_IDS` | Direct tenants to migrated analytics/reports/ops flows. |

### Enabling flags

1. In Supabase `public.configuration`, insert/update keys for each flag with
   `is_enabled=true` and metadata referencing cohort.
2. Use admin feature flag panel (`/admin/feature-flags`) to verify overrides
   replicate to ConfigCat/Flagsmith if applicable.
3. Confirm `pnpm scripts/check-feature-flags.mjs` passes with new keys.

### Rollback

- Toggle flags to `false` in `public.configuration` (or ConfigCat/Flagsmith) to
  immediately restore legacy UI.
- Re-run `scripts/check-feature-flags.mjs` to confirm disabled state. No code
  rollback required unless DB schema migrations fail.

## Deployment Plan

1. **Pre-flight**
   - Ensure Supabase migrations already deployed (no new schema changes in this
     release).
   - Seed feature flag rows for beta tenants only; keep defaults off for general
     pilot.
2. **Deploy**
   - Ship web bundle via standard CI deploy. New Lighthouse thresholds must pass
     (admin perf ≥0.88, a11y ≥0.96; client perf ≥0.91, etc.).
   - Monitor CI admin Playwright suite for accessibility/keyboard regressions.
3. **Post-deploy validation**
   - With beta tenant account, verify `⌃K/⌘K` opens palette, quick actions route
     correctly, offline banner tracks connectivity, `/support` toggle behaves
     via mouse + keyboard.
   - Confirm assistant toggle obeys feature flag by disabling flag and verifying
     fallback messaging.

## Rollback Strategy

- **Soft rollback**: disable the four flags (see above). This instantly reverts
  to legacy navigation/assistant experiences while retaining deployed code.
- **Full rollback**: if issues persist, redeploy previous commit (no schema
  migrations to reverse). Clearing cached service workers recommended for staff
  PWA.

## Coordination

- **Supabase**: no new migrations, but configuration rows must be updated for
  `commandPalette`, `atlasAssistant`, `offlineBanner`, `migratedWorkflows`.
- **Backend dependencies**: none required; API endpoints already available for
  analytics/reports/ops.
- **Feature flag ops**: document enabling/disabling actions in feature flag
  dashboard runbook.

## Monitoring & Instrumentation

- **PostHog dashboards**: `Atlas Navigation` (command palette open/submit
  events), `Assistant Engagement` (toggle + conversation start), `Offline Queue`
  (banner interactions).
- **Sentry**: watch `AtlasAssistantToggle` and `CommandPaletteInvoke`
  breadcrumbs for elevated error rates.
- **Performance**: check Lighthouse CI artifacts and compare LCP/INP trends; use
  `atlas-beta` dashboard to ensure no regression before removing legacy UI. Keep
  legacy UI enabled until KPIs hold steady for 48 hours.

## Next Steps Before Disabling Legacy UI

- Gather beta tenant feedback via ops channel.
- Review Playwright + Lighthouse trends for two releases.
- If stable, graduate flags to `default=true` and expand cohort beyond
  `STAFF_BETA_TENANT_IDS`.

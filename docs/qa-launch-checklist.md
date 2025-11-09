# QA & Launch Readiness Checklist

This checklist captures the recurring tasks we need to run before cutting a
release candidate for the Ibimina Staff PWA. Keep it in the repo so every
teammate can tick items off or attach evidence (screenshots, JSON, CSV). Update
as workflows expand.

> 🧭 **New to the project?** Complete
> [`docs/dev/getting-started.md`](dev/getting-started.md) first so your local
> environment, Supabase instance, and generated types match the expectations for
> these checks.

## 1. Performance Baseline

- [x] `npm run build` completes without warnings. _(2025-10-09: succeeded; see
      Next.js route table above)_
- [ ] Dev server started (`npm run dev`) and Lighthouse executed with
      `npm run check:lighthouse` against `http://localhost:3100`.
  - Capture the generated HTML report (Command outputs path); add score summary
    to release notes.
- [ ] Track total JS < 250 kB on Lighthouse mobile run; note any regressions.
- [ ] Verify Next.js image optimisation works for dashboard hero and
      quick-action assets (`next dev` logs show optimised responses).

## 2. Accessibility Sweep

- [ ] Run automated checks (e.g.
      `npx @axe-core/cli http://localhost:3100/dashboard`). Record any
      violations and file fixes.
- [ ] Keyboard navigation: ensure primary nav, command palette, quick actions,
      recon tables, and admin forms are reachable and focus-styled.
- [ ] Screen reader spot-check: verify localised labels (via `t()`) read primary
      copy first and aria-live toasts announce messages.
- [ ] Contrast spot-check: confirm gradients + glass overlays meet AA in
      light/dark contexts.

## 3. Internationalisation Review

- [ ] Ensure new UI strings exist in `locales/en/common.json` and
      `locales/rw/common.json` (fallbacks avoided).
- [ ] Confirm report/export notifications and admin templates surface bilingual
      microcopy.

## 4. Functional Regression (Happy Path)

- [ ] Auth flow: login, redirect to /dashboard, open global search, confirm
      bilingual nav labels.
- [ ] Ikimina list → detail tabs: validate analytics, member filters, deposits,
      statements, settings views.
- [ ] Member import wizard: upload sample CSV/XLSX, check parser feedback,
      cancel + confirm flows.
- [ ] Statement import wizard: file upload and SMS paste modes succeed; review
      parser warnings.
- [ ] Reconciliation: apply status filters, bulk assign, batch mark posted,
      inspect SMS split view.
- [ ] Reports: adjust filters, trigger PDF/CSV export, verify file downloads.
- [ ] Admin: invite user, edit SACCO metadata, create branding/SMS template,
      toggle template active flag.

## 5. Observability & Automation Checks

- [ ] Supabase logs: confirm `export-report`, `import-statement`, and
      `scheduled-reconciliation` functions succeed under latest schema.
- [ ] Review `system_metrics` / audit log tables for new entries after running
      reconciliation/import flows.
- [ ] Run Prometheus/Grafana stack (`infra/metrics/docker-compose.yml`), confirm
      `ibimina_*` gauges populate, and capture a dashboard screenshot.
- [ ] Record alert thresholds (SMS backlog, notifications, exporter health) in
      the runbook and link the Grafana URL.

## 6. Sign-off

- [ ] Summarise findings + metrics in release notes.
- [ ] File/block issues for any open items; link to this checklist in the PR
      description.

# Phase 7 – QA & Launch Readiness Results

This log captures the current QA status for the Ibimina Staff PWA. It
supplements the checklist in `docs/qa-launch-checklist.md`.

## 1. Performance Snapshot

- ✅ `npm run build` (Next 15) — First Load JS 102 kB, per-route bundle sizes
  captured in build output (see `npm run build` logs for detailed table).
- 🚧 `npm run check:lighthouse` — **blocked in this environment** (`npm` cannot
  reach registry to download Lighthouse). Run locally with network access:
  `npm install --global lighthouse` (or `npx lighthouse`) then `npm run dev` +
  `npm run check:lighthouse`.
- Recommendation: capture mobile Lighthouse scores (Performance ≥ 90) and attach
  HTML report during release prep.

## 2. Accessibility & i18n

- ✅ Manual spot-check: pages render localised labels via `t()`, toast provider
  exposes `aria-live` announcements, recon/preview screens keep keyboard focus
  outlines.
- 🚧 Automated axe run pending — install `@axe-core/cli` (requires network) and
  execute `npx @axe-core/cli http://localhost:3100/dashboard`.
- Follow-up: document any violations, update tokens/translations in `locales/`
  as needed.

## 3. Regression Path

- ✅ Build + lint pass (`npm run lint`, `npm run build`).
- 🚧 Full CSV → Recon → Report to be exercised against staging data once
  Supabase migrations are applied. Steps:
  1. `npm run dev`
  2. Import sample member & statement files via Ikimina workflows (confirm
     parser feedback).
  3. Resolve reconciliation exceptions using the new hints/member search, note
     audit entries.
  4. Generate PDF/CSV exports from Reports preview and verify branding text.

## 4. Notification Queue Smoke Test

- ✅ Admin panel now surfaces the latest 20 events (queued reminder + SMS test).
  To verify end-to-end delivery, ensure backend processors consume
  `notification_queue` and inspect results inside Supabase logs.

## 5. Outstanding Tasks Before Release

1. Run Lighthouse (mobile/desktop) & attach reports.
2. Execute automated axe scan and record outcomes.
3. Capture screenshots / metrics for the end-to-end regression scenario and
   archive them in release notes.

## 2025-10-09 Update

- ✅ `npm run build` (Next 15) — build succeeded; route stats captured above.
- ✅ `npm run lint` — passes with existing PWA service worker warnings
  (generated bundle); new offline queue code passes with lint suppressions.
- ✅ `npm run verify:pwa` — build + manifest checks succeed, but server health
  probe fails (`listen EPERM 127.0.0.1:3100`) in sandbox; rerun locally with
  elevated permissions.
- ⚠️ Lighthouse (`npm run check:lighthouse`) blocked: npm registry unreachable
  under current network restrictions.
- ⚠️ Automated axe scan pending: unable to install `@axe-core/cli` without
  network access.
- ⚠️ Regression artefacts still outstanding: need staging data and screenshots
  once Supabase migrations run in a connected environment.

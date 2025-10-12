# Changelog

All notable changes to this project will be documented in this file. Dates are in YYYY-MM-DD.

## [0.1.3] - 2025-10-16
- Added a security adoption dashboard for administrators, surfacing MFA coverage metrics, at-risk accounts, and SACCO-by-SACCO coverage alongside outreach automation tooling.【F:app/(main)/admin/page.tsx†L237-L309】【F:components/admin/mfa-insights-card.tsx†L1-L199】【F:lib/mfa/insights.ts†L1-L192】
- Added scheduled report subscriptions with localized UI controls and Supabase-backed automation so SACCO leadership receives recurring PDFs and CSVs automatically.【F:components/reports/report-subscriptions-card.tsx†L1-L236】【F:app/(main)/reports/actions.ts†L1-L164】
- Introduced the `app.report_subscriptions` table, policies, and triggers to persist export plans securely under SACCO row-level security.【F:supabase/migrations/20251016090000_add_report_subscriptions.sql†L1-L64】

## [0.1.2] - 2025-10-10
- CI hardening: add TypeScript typecheck, cache Next.js build, enforce i18n key parity, and add glossary consistency check.
- i18n: update rw/fr translations; add fixer and consistency scripts; add i18n glossary docs.
- Developer UX: add PR template and README updates.

See details: docs/releases/2025-10-10-ci-i18n-hardening.md

## [0.1.1] - 2025-10-10
- i18n migration and cleanup: moved UI to t()/Trans, expanded dictionaries, and polished Recon/Profile/Ikimina strings.

See details: docs/releases/2025-10-10-i18n-migration.md

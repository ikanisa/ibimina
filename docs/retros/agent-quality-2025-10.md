# Agent Quality Retrospective — October 2025

## Metrics Overview

- **Coverage period:** 20–29 Oct 2025 (10 reporting days).
- **Total member interactions:** 3,499, with a **76.9% resolution rate** and
  **15.1% self-service deflection**. Escalations held at **8.0%** of volume.
- **Response speed:** First response averaged **32 seconds**, keeping us within
  the 35-second target. Average handle time trended at **380 seconds (6m20s)**,
  just above the 6-minute goal.
- **Satisfaction:** Daily CSAT averaged **4.66 / 5**, indicating steady
  sentiment across the reporting window.

## Incident Review

1. **2025-10-15 Auth Login Outage** — Production login failed for 35 minutes
   because newly introduced `authx` schema grants were missing. Migration
   `20251018103000_fix_auth_schema_permissions.sql` contains the fix; responders
   must apply it immediately in future
   rollouts.【F:docs/operations/reports/2025-10/2025-10-15-auth-login-outage.md†L1-L68】
2. **2025-10-26 Log Drain Verification** — Manual drain test succeeded; no
   customer impact but validates alerting path remains healthy for future
   incidents.【F:docs/operations/reports/2025-10/2025-10-26-log-drain-verification.md†L1-L14】

## Satisfaction Survey Insights

- Collected **208 responses** across three pulse surveys with weighted CSAT
  **4.51**, CES **4.20**, and NPS **48.8**.
- Twenty negative comments concentrated on confusing fallback steps during MFA
  resets; all cited inconsistent guidance between email templates and the in-app
  wizard.【F:docs/operations/surveys/2025-10-agent-satisfaction.csv†L1-L4】

## Key Learnings

- Handle time is trending downward but remains 20 seconds over target. Coaching
  should focus on quicker knowledge base linking during reconciliation
  questions.【F:apps/platform-api/logs/agentMetrics.csv†L1-L11】
- Auth outages create immediate operational risk; privilege verification for new
  schemas must become a standard deploy
  gate.【F:docs/operations/reports/2025-10/2025-10-15-auth-login-outage.md†L1-L68】
- Survey feedback highlights the need for unified recovery messaging across
  channels, especially for MFA
  assistance.【F:docs/operations/surveys/2025-10-agent-satisfaction.csv†L1-L4】

## Action Items

| Action                                                                | Owner                | Due        | Notes                                                                    |
| --------------------------------------------------------------------- | -------------------- | ---------- | ------------------------------------------------------------------------ |
| Automate Supabase privilege smoke test in CI using seeded credentials | Platform Engineering | 2025-11-08 | Blocks regressions seen in the auth outage report.                       |
| Refresh MFA recovery email/wizard copy to align with support scripts  | Customer Experience  | 2025-11-04 | Target the 20 negative survey comments citing inconsistent instructions. |
| Expand agent knowledge snippets for reconciliation workflows          | Support Enablement   | 2025-11-06 | Aim to trim average handle time below 360 seconds.                       |

## Follow-Up

- **Next review:** 5 Nov 2025 with Quality Lead, focusing on automation
  guardrails and CSAT rebound initiatives. Logged in the shared schedule for
  visibility.【F:docs/retros/review-schedule.json†L1-L9】

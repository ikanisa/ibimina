# Agent Quality Retrospective — October 2025

## Metrics Overview

- **Coverage period:** 20–29 Oct 2025 (10 reporting days).
- **Total member interactions:** 3,499, with a **76.9% resolution rate** and
  **15.1% self-service deflection**. Escalations held at **8.0%** of volume but
  spiked to **32 cases on 24 Oct**, concentrated in reconciliation
  workflows.【F:apps/platform-api/logs/agentMetrics.csv†L2-L11】
- **Response speed:** First response averaged **32 seconds**, keeping us within
  the 35-second target. Average handle time trended at **380 seconds (6m20s)**,
  which is **20 seconds over the 6-minute goal** and tied directly to knowledge
  base lookups for reconciliation
  questions.【F:apps/platform-api/logs/agentMetrics.csv†L2-L11】
- **Satisfaction:** Daily CSAT averaged **4.66 / 5**, indicating steady
  sentiment across the reporting
  window.【F:apps/platform-api/logs/agentMetrics.csv†L2-L11】

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
  **4.51**, CES **4.20**, and NPS
  **48.8**.【F:docs/operations/surveys/2025-10-agent-satisfaction.csv†L1-L4】
- Twenty negative comments (9.6% of responses) concentrated on confusing
  fallback steps during MFA resets; all cited inconsistent guidance between
  email templates and the in-app
  wizard.【F:docs/operations/surveys/2025-10-agent-satisfaction.csv†L1-L4】

## Retro Discussion Highlights

1. **Escalation Clustering:** Support leads reported that the 24 Oct spike came
   from reconciliation edge cases without refreshed macros, mirroring the 35
   minute auth outage risk profile if left
   unaddressed.【F:apps/platform-api/logs/agentMetrics.csv†L2-L11】【F:docs/operations/reports/2025-10/2025-10-15-auth-login-outage.md†L1-L68】
2. **Guidance Drift:** Agents flagged the MFA recovery script as diverging from
   the latest product copy, explaining the sustained negative comment rate and
   prompting cross-functional content
   updates.【F:docs/operations/surveys/2025-10-agent-satisfaction.csv†L1-L4】
3. **Automation Gaps:** Observability still relies on manual drain checks; the
   verification succeeded, but runbooks need to codify alerts for when drains
   fail
   silently.【F:docs/operations/reports/2025-10/2025-10-26-log-drain-verification.md†L1-L14】

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
| Publish daily escalation digest using enhanced metrics tool output    | Platform API         | 2025-11-03 | Surface peak escalation days and owners via agentMetricsSummary.         |
| Align AI prompt guidance with MFA recovery playbooks                  | Quality Programs     | 2025-11-02 | Ensure recommendations match refreshed scripts and tooling.              |

## Follow-Up

- **Next reviews:**
  - 5 Nov 2025 with Quality Lead, focusing on automation guardrails and CSAT
    rebound initiatives.【F:docs/retros/review-schedule.json†L1-L5】
  - 12 Nov 2025 with Platform API and Support Enablement to confirm escalation
    digest automation and MFA script alignment are in
    production.【F:docs/retros/review-schedule.json†L6-L13】

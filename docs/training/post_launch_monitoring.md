# Post-Launch Monitoring & Weekly Reporting

## Daily Monitoring Routines

| Time  | Activity                                            | Owner             | Tooling                          | Output                               |
| ----- | --------------------------------------------------- | ----------------- | -------------------------------- | ------------------------------------ |
| 07:30 | Metrics dashboard review (traffic, conversion, SLA) | Product Analyst   | Looker `Launch-Day` board        | Flag KPI deltas >5%.                 |
| 08:00 | Error log triage                                    | Platform Engineer | Datadog + Sentry                 | Create/close incidents in PagerDuty. |
| 10:00 | Support inbox sweep                                 | Support Lead      | ServiceNow queue `IBIMINA-ADMIN` | Categorize tickets, update tracker.  |
| 13:00 | Data integrity spot check                           | Data Engineer     | dbt + Supabase read replicas     | Compare row counts vs baseline.      |
| 16:00 | Health sync                                         | Ops Duty Manager  | Slack huddle + Confluence notes  | Summarize issues, assign owners.     |
| 20:00 | End-of-day recap                                    | Duty Manager      | Statuspage + email               | Publish summary to leadership list.  |

### Alerting Rules

- P0: API error rate >2% for 5 min → auto page SRE + Engineering Lead.
- P1: Conversion drop >10% vs previous day → Slack alert + standup review.
- P2: Support backlog >30 tickets → add surge agents.

## Weekly Report Template (Fridays)

1. **Executive Summary** (2-3 bullets, highlight wins/risks).
2. **Key Metrics**
   - Traffic, activation, loan approvals, repayment success.
   - Trendline vs targets with sparkline screenshot.
3. **Incident Review**
   - Table: Incident ID, severity, duration, RCA, remediation status.
4. **Support Insights**
   - Ticket volume by category, median response time, top FAQs.
5. **Product Feedback Loop**
   - Summaries of feature requests surfaced during training/usage.
6. **Training & Certification Updates**
   - Newly certified staff, outstanding follow-ups, refresher needs.
7. **Next Week Focus**
   - Experiments, backlog priorities, staffing changes.

## Reporting Workflow

1. Duty Manager drafts report in Confluence template `Post-Launch Weekly`.
2. Attach evidence: dashboard exports, error trends, attendance updates.
3. Route for review (Product, Engineering, Operations) by Monday 10:00 CAT.
4. Archive signed-off reports in SharePoint `OpsReports/Launch-2025`.

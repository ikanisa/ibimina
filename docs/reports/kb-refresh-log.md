# Knowledge Base Refresh Log

This log tracks each scheduled knowledge base refresh cycle, including the
outcomes of the checklist tasks and any follow-up actions.

## Recurring Task Configuration

- **Platform**: Asana (Project: `Customer Knowledge Base Upkeep`)
- **Task name**: `Weekly KB Content Sync`
- **Schedule**: Every Friday at 09:00 CAT
- **Assignee**: Customer Experience Lead
- **Automation**: Asana rule mirrors the task to Jira epic `KB-REFRESH` for
  deployment readiness tracking.
- **Checklist**:
  1. Content review – confirm drafts in `docs/kb/internal/` are up to date.
  2. Localization – validate translated assets with the Localization squad.
  3. Training deck sync – update the enablement deck shared with partners.
  4. Publish – run `pnpm kb:sync` and deploy the website help centre.
  5. Log outcomes – append a row in this file with the cycle status.

## Refresh History

| Date       | Owner                    | Checklist Status | Task Link                                                                   | Notes                                                                                              |
| ---------- | ------------------------ | ---------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 2025-02-21 | Customer Experience Lead | Completed        | [Asana](https://app.asana.com/0/123456789/1122334455) / Jira `KB-REFRESH-1` | Pilot run of the automated sync; partner content placeholders verified and ready for localisation. |

Add new rows chronologically with the latest run at the top.

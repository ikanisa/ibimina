# Atlas Admin UX Review

## Members directory

| Legacy affordance                                               | Atlas redesign mapping                                                                       |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Search input above table                                        | Consolidated into the FilterBar global search with command palette focus (⌘/Ctrl + K).       |
| Group dropdown                                                  | FilterBar "Group" select with saved view support.                                            |
| Status dropdown                                                 | FilterBar status chips with quick toggles and saved views.                                   |
| Total counter in header                                         | Filter summary chips below the FilterBar and assistant context metadata.                     |
| Table columns: Name, Group, Member code, MSISDN, Joined, Status | Atlas DataTable columns with virtualization, row selection, and StatusChip styling.          |
| Manual scan for totals                                          | Command palette actions (`Reset filters`, `Apply saved view`) and assistant context summary. |

### New capabilities

- Saved views persist filter combinations in local storage.
- Command palette actions focus search, reset filters, and activate saved views.
- Assistant panel receives structured context (filters, counts) for AI handoff.

## Member profile

| Legacy affordance                                | Atlas redesign mapping                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Single column profile card                       | Two-column summary with contact details and live metrics.                                         |
| Email, WhatsApp, MoMo, Preferred language labels | Summary detail fields with language mapping.                                                      |
| No edit workflow                                 | Advanced settings drawer with review-before-submit confirmation and `/api/member/onboard` update. |
| No document visibility                           | Documents tab exposing ID metadata and uploads.                                                   |
| Activity hidden in join requests                 | Activity tab timeline sorted by recency.                                                          |

### New capabilities

- Tabbed detail views: Accounts, Loans, Documents, Activity.
- Loans tab summarises applications by stage with DPD insight.
- Drawer workflow includes diff review, language update, and assistant context
  updates.

## Loans pipeline

| Legacy affordance                        | Atlas redesign mapping                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| Loan applications exported via reports   | Dedicated `/admin/loans` pipeline with Kanban and table modes.                |
| Manual stage counts                      | Stage summary cards and contextual assistant metadata.                        |
| No bulk actions                          | Inline bulk action bar (assign reviewer, advance stage, send reminder).       |
| Ad hoc filtering (status/product in SQL) | Filter chips for stage, product, and DPD ranges with saved assistant context. |

### New capabilities

- Toggle between grouped board and atlas-styled table.
- Command-integrated assistant context describing filters/view state.
- DPD filter chips to triage ageing applications.
- Per-stage virtualization with inline selection and metadata badges.

# Knowledge Base Source Inventory

This inventory maps the locations that currently feed or will feed the
customer-facing help centre. It highlights the content owners and how frequently
each source is refreshed so that weekly syncs can prioritise the right
stakeholders.

## Source Catalogue

| Source                         | Location                                    | Owner / Point of Contact         | Format                               | Update Cadence             | Notes                                                          |
| ------------------------------ | ------------------------------------------- | -------------------------------- | ------------------------------------ | -------------------------- | -------------------------------------------------------------- |
| Internal Drafts                | `docs/kb/internal/`                         | Customer Experience Lead         | Markdown playbooks                   | Weekly (Friday)            | Staging area for in-progress KB articles prior to publication. |
| Partner Enablement Packs       | `docs/kb/partners/`                         | Partner Success Manager          | Mix of Markdown + shared drive links | Monthly (first Monday)     | Mirrors the latest handbooks shared by partner organisations.  |
| Published Help Centre          | `apps/website/public/help/`                 | Digital Experience Team          | Static HTML/JSON snippets            | Weekly (Friday)            | Output of the sync pipeline consumed by the marketing site.    |
| Partner CMS: SACCO Alliance    | `https://cms.sacco-alliance.example/api/kb` | SACCO Alliance Ops Liaison       | JSON (Headless CMS)                  | Bi-weekly (Tuesdays)       | Requires API token stored in `SACCO_ALLIANCE_API_TOKEN`.       |
| Shared Drive: Momo Cooperative | `drive://momo-cooperative/KB`               | Cooperative Training Coordinator | Markdown + assets                    | Monthly (second Wednesday) | Mounted via rclone; path configured through `MOMO_DRIVE_PATH`. |

## Workflow Overview

1. Draft or collect updates in the internal and partner folders listed above.
2. Run the [`syncContent.ts`](../../scripts/kb/syncContent.ts) script (or the
   `pnpm kb:sync` command) to pull the latest partner updates and materialise
   them in `apps/website/public/help/` for the website.
3. Review output assets with Customer Experience and Localization teams before
   deploying the marketing site.
4. Record the outcome in
   [`docs/reports/kb-refresh-log.md`](../reports/kb-refresh-log.md) alongside
   any follow-up actions.

## Folder Structure

```
docs/kb/
├── README.md
├── internal/
│   └── (draft articles and SMEs notes)
└── partners/
    └── (sync manifests and partner reference material)
```

Add sub-folders per product area or partner as needed, keeping owners and
cadence aligned with the table above.

# Knowledge Base Source Inventory

This inventory maps the locations that currently feed or will feed the
customer-facing help centre. It highlights the content owners and how frequently
each source is refreshed so that weekly syncs can prioritise the right
stakeholders.

## Source Catalogue

| Source                         | Location                                    | Owner / Point of Contact         | Format                          | Update Cadence             | Notes                                                          |
| ------------------------------ | ------------------------------------------- | -------------------------------- | ------------------------------- | -------------------------- | -------------------------------------------------------------- |
| Internal Drafts                | `docs/kb/internal/`                         | Customer Experience Lead         | Markdown playbooks              | Weekly (Friday)            | Staging area for in-progress KB articles prior to publication. |
| Partner Enablement Packs       | `docs/kb/partners/`                         | Partner Success Manager          | Mix of Markdown + shared assets | Monthly (first Monday)     | Mirrors the latest handbooks shared by partner organisations.  |
| Published Help Centre          | `apps/website/public/help/`                 | Digital Experience Team          | Static HTML/JSON snippets       | Weekly (Friday)            | Output of the sync pipeline consumed by the marketing site.    |
| Partner CMS: SACCO Alliance    | `https://cms.sacco-alliance.example/api/kb` | SACCO Alliance Ops Liaison       | JSON (Headless CMS)             | Bi-weekly (Tuesdays)       | Requires API token stored in `SACCO_ALLIANCE_API_TOKEN`.       |
| Shared Drive: Momo Cooperative | `drive://momo-cooperative/KB`               | Cooperative Training Coordinator | Markdown + assets               | Monthly (second Wednesday) | Mounted via rclone; path configured through `MOMO_DRIVE_PATH`. |

## Inventory Snapshot

### Internal drafts

| File / Folder                                                  | Owner                    | Update Cadence  | Notes                                            |
| -------------------------------------------------------------- | ------------------------ | --------------- | ------------------------------------------------ |
| [`internal/getting-started.md`](./internal/getting-started.md) | Customer Experience Lead | Weekly (Friday) | Draft onboarding journey for new support agents. |

### Partner content folders

| Partner          | Folder                                                                | Owner                            | Update Cadence             | Notes                                                                 |
| ---------------- | --------------------------------------------------------------------- | -------------------------------- | -------------------------- | --------------------------------------------------------------------- |
| SACCO Alliance   | [`partners/sacco-alliance/`](./partners/sacco-alliance/README.md)     | SACCO Alliance Ops Liaison       | Bi-weekly (Tuesdays)       | Source of CMS export manifests and localisation-ready FAQs.           |
| Momo Cooperative | [`partners/momo-cooperative/`](./partners/momo-cooperative/README.md) | Cooperative Training Coordinator | Monthly (second Wednesday) | Shared drive sync of partner enablement decks and knowledge articles. |

## Automation Output

Running [`syncContent.ts`](../../scripts/kb/syncContent.ts) produces JSON
bundles in `apps/website/public/help/` for each enabled source and writes a
`manifest.json` file summarising owners, update cadences, and article counts per
source. The marketing site can inspect the manifest to surface freshness
indicators or flag partners whose content is stale.

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
    ├── sacco-alliance/
    │   └── (CMS exports and sync manifests)
    └── momo-cooperative/
        └── (shared drive exports and partner-ready assets)
```

Add sub-folders per product area or partner as needed, keeping owners and
cadence aligned with the table above.

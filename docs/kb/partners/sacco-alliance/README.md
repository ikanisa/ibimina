# SACCO Alliance Knowledge Base Feed

- **Owner**: SACCO Alliance Operations Liaison
- **Primary contact**: ops-liaison@sacco-alliance.example
- **Update cadence**: Bi-weekly (Tuesdays)
- **Upstream system**: Headless CMS
  (`https://cms.sacco-alliance.example/api/kb`)
- **Authentication**: Bearer token stored in `SACCO_ALLIANCE_API_TOKEN`

## Contents

| Asset                  | Description                                    | Last Reviewed | Action Items                             |
| ---------------------- | ---------------------------------------------- | ------------- | ---------------------------------------- |
| `export-manifest.json` | Lists article slugs to fetch via the CMS API.  | 2025-02-14    | Align locales with localisation backlog. |
| `faqs/`                | Markdown FAQs grouped by partner journey step. | 2025-02-14    | Awaiting translation review.             |
| `release-notes/`       | HTML snippets embedded in partner newsletters. | 2025-02-14    | Confirm archiving rules with marketing.  |

## Sync Notes

- Keep manifests lean—deprecated articles should be archived in the CMS rather
  than filtered downstream.
- When localisation is pending, add a `needs-localisation` tag in the CMS; the
  sync script surfaces this flag for the review checklist.

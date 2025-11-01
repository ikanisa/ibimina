# Momo Cooperative Knowledge Base Feed

- **Owner**: Cooperative Training Coordinator
- **Primary contact**: training@momo-cooperative.example
- **Update cadence**: Monthly (second Wednesday)
- **Upstream system**: Shared drive mount (`drive://momo-cooperative/KB`)
- **Mount configuration**: `MOMO_DRIVE_PATH` environment variable points to the
  local mount root (configured via rclone).

## Contents

| Asset                 | Description                                           | Last Reviewed | Action Items                                     |
| --------------------- | ----------------------------------------------------- | ------------- | ------------------------------------------------ |
| `handbook/`           | Markdown modules extracted from the partner handbook. | 2025-02-12    | Update screenshots after branding refresh.       |
| `training-decks/`     | Slide decks exported as PDF for partner workshops.    | 2025-02-12    | Sync with enablement team for the April webinar. |
| `localisation-notes/` | CSV mapping of strings that require translation.      | 2025-02-12    | Confirm coverage with Localization squad.        |

## Sync Notes

- Ensure the shared drive is mounted before running `pnpm kb:sync`; otherwise
  the sync script logs a warning and skips this source.
- Keep PDF assets lightweight—files over 5MB should be linked rather than
  embedded in the website to preserve build performance.

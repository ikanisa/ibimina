# Partner Knowledge Base Assets

Partner-facing enablement material lives alongside internal drafts to keep a
single source of truth for the public help centre. Each sub-folder listed below
contains the latest snapshot from our partners plus any processing manifests
required by the sync pipeline.

| Partner          | Folder                                     | Owner                            | Primary Format                | Update Cadence             | Notes                                                                         |
| ---------------- | ------------------------------------------ | -------------------------------- | ----------------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| SACCO Alliance   | [`sacco-alliance/`](./sacco-alliance/)     | SACCO Alliance Ops Liaison       | JSON exports + Markdown       | Bi-weekly (Tuesdays)       | CMS exports pulled through the `sacco-alliance` source configuration.         |
| Momo Cooperative | [`momo-cooperative/`](./momo-cooperative/) | Cooperative Training Coordinator | Markdown + presentation decks | Monthly (second Wednesday) | Drive synchronisation managed by the `momo-cooperative` source configuration. |

Refer to
[`scripts/kb/sources.config.json`](../../scripts/kb/sources.config.json) to
enable or disable an upstream partner during sync runs.

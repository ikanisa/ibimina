# Knowledge Base Sync Scripts

`scripts/kb/syncContent.ts` consolidates partner and internal knowledge base
sources into the static assets served by `apps/website/public/help`.

## Usage

```bash
pnpm kb:sync
```

The command reads the [`sources.config.json`](./sources.config.json) file to
determine which sources to pull. Each entry supports the following properties:

- `id` – unique identifier used for the output filename.
- `name` – human-readable label used in logs and metadata.
- `owner` – stakeholder responsible for the source.
- `type` – either `cms` (HTTP JSON endpoint) or `drive` (local/shared
  directory).
- `path` – for `drive` sources, the directory to scan. Relative paths resolve
  from the repository root.
- `endpoint` – for `cms` sources, the API endpoint to fetch.
- `tokenEnv` – optional environment variable that stores the API token for CMS
  sources.
- `outputSubdir` – optional subfolder inside `apps/website/public/help`.
- `enabled` – when set to `false`, the source is ignored.
- `updateCadence` – optional human-readable cadence used by the manifest output.

## Output

For every enabled source the script writes a JSON bundle shaped as:

```json
{
  "source": {
    "id": "internal-drafts",
    "name": "Internal Draft Articles",
    "owner": "Customer Experience Lead",
    "type": "drive",
    "fetchedAt": "2025-02-21T08:00:00.000Z"
  },
  "articles": [
    {
      "slug": "getting-started-with-the-help-centre-sync",
      "title": "Getting Started with the Help Centre Sync",
      "content": "# Getting Started with the Help Centre Sync...",
      "format": "markdown"
    }
  ]
}
```

These bundles can be imported directly by the marketing site or transformed
further during the Next.js build step. After processing all sources the script
also writes a `manifest.json` file that summarises article counts, owners, and
update cadences so downstream services can flag stale content.

# Knowledge Base Update Workflow

This workflow keeps the Atlas support knowledge bases in sync across Markdown
source files, embeddings, and Supabase content tables.

## 1. Author or update Markdown content

All seed knowledge base articles live under
[`supabase/seed/kb`](../supabase/seed/kb/). Each file includes a JSON front
matter block that defines scope, language, tags, and policy metadata. Example:

```markdown
---
{
  "title": "USSD Collection Quick Start (English)",
  "language_code": "en",
  "tags": ["ussd", "collections", "training"],
  "policy_tag": "ussd",
  "scope": "global",
}
---

Content goes here…
```

Guidelines:

- Use `language_code` with
  [BCP-47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt) tags (e.g., `en`, `rw`,
  `fr`).
- For organization content set `scope` to `org` and include an `org_id` (or
  `org_ids` array) matching `public.organizations.id`.
- Keep content concise and action-oriented; the embedding prompt concatenates
  `title` and `content`.

## 2. Generate embeddings and upsert rows

Run the TypeScript seeding script after editing Markdown files. The script
batches OpenAI embedding calls, retries on transient failures, and upserts into
`global_kb` / `org_kb` using deterministic keys.

```bash
pnpm exec tsx scripts/seedKb.ts \
  --scope global            # optional filters (global|org)
  --language en             # optional ISO/BCP-47 language filter
  --org 2000...001          # optional org filter for org-scoped docs
```

Required environment variables:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Additional tuning (optional): `KB_EMBED_BATCH_SIZE` and `KB_EMBED_MAX_RETRIES`.

Use `--dry-run` to validate parsing and batching without writing to Supabase.

## 3. Validate retrieval quality

After seeding, call the `kb.search` SQL helper to confirm that the new
embeddings surface the expected guidance. Example using the Supabase SQL editor
or `psql`:

```sql
select title, language_code, similarity
from kb.search(
  query_embedding => :embedding_vector, -- output from OpenAI text-embedding-3-large
  target_org => '20000000-0000-0000-0000-000000000001',
  language_filter => 'rw',
  match_limit => 5
);
```

For manual spot checks you can reuse the script output embeddings or generate
ad-hoc vectors in a notebook. Ensure similarity scores stay above the `0.2`
threshold for the top-ranked articles.

## 4. Deploy and monitor

- Commit Markdown and migration changes together so production migrations
  include schema updates.
- The seeding script is idempotent; rerun it whenever Markdown files change.
- Add regression questions to the Atlas agent evaluation suite to track
  retrieval accuracy as the knowledge base evolves.

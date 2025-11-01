# Local RLS/Auth Testing Workflow

This guide explains how to bring up a local Postgres instance with the required
Supabase extensions and seed data so you can run the row-level security (RLS)
and authentication regression tests.

## Prerequisites

- Docker and Docker Compose v2 (`docker compose`)
- `psql` client (installed with PostgreSQL or via `postgresql-client` package)
- Bash 5+

## 1. Start Postgres

```bash
docker compose -f docker-compose.dev.yml up -d postgres
```

The default service exposes Postgres on `localhost:6543` with the database name
`ibimina_dev`. For isolated test runs you can mount the override file to
provision a dedicated database and volume:

```bash
docker compose -f docker-compose.dev.yml -f docker-compose.postgres.test.yml up -d postgres
```

> The override switches the database name to `ibimina_test` and attaches a
> separate volume so test runs do not reuse development data.

## 2. Apply migrations and seed fixtures

From the repository root, **source** the setup script to run migrations, seed
minimal data, and expose `RLS_TEST_DATABASE_URL` in your current shell:

```bash
source scripts/db/setup-local.sh
```

The script waits for Postgres to become reachable, replays the SQL migrations in
`supabase/migrations`, loads the bootstrap fixtures in
`supabase/tests/fixtures/bootstrap.sql`, and seeds the RLS-friendly dataset in
`supabase/tests/rls/e2e_friendly_seed.sql`. When it completes successfully the
`RLS_TEST_DATABASE_URL` environment variable will point to the active database.

## 3. Run the RLS/auth tests

With the environment prepared you can execute the SQL-based RLS suite:

```bash
bash apps/admin/scripts/test-rls.sh
```

The script automatically re-initialises the database each time to guarantee a
clean slate before replaying the tests found in `supabase/tests/rls`.

## 4. Tear down (optional)

When you are done testing you can stop and remove the containers and volumes:

```bash
docker compose -f docker-compose.dev.yml down -v
```

If you launched the override stack for tests, include the same file(s) you used
for `up` so the matching volumes are removed.

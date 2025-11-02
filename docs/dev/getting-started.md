# Ibimina Developer Getting Started

This guide consolidates the required setup for local development across the
monorepo. Follow the sections in order when onboarding a new machine or
refreshing your toolchain.

## 1. Prerequisites

| Tool         | Required version | Notes                                                                        |
| ------------ | ---------------- | ---------------------------------------------------------------------------- |
| Node.js      | 18.20.4          | Match the project `.nvmrc` so Next.js and Supabase CLIs behave consistently. |
| pnpm         | 10.19.0          | Managed through the workspace `packageManager`; enable via Corepack.         |
| Supabase CLI | 1.189+           | Needed for migrations, secrets, and type generation.                         |

```bash
# Activate the Node version (macOS/Linux example)
nvm install 18.20.4
nvm use 18.20.4

# Enable the pinned pnpm release
corepack enable
corepack prepare pnpm@10.19.0 --activate

# Install the Supabase CLI if you have not already
pnpm dlx supabase --help  # or follow Supabase install docs
```

## 2. Install dependencies

```bash
git clone git@github.com:ikanisa/ibimina.git
cd ibimina
make bootstrap  # installs deps + regenerates Supabase types
```

The install step configures workspace hoists, builds shared packages, and wires
up git hooks. Running `make bootstrap` ensures the generated Supabase types in
`apps/admin` and `apps/client` match the latest schema before you start coding.

## 3. Configure environment variables

1. Copy the templates and fill in secrets from your password manager:

   ```bash
   cp .env.example .env.local
   cp supabase/.env.example supabase/.env.local
   ```

2. Populate Supabase credentials, encryption keys, MFA secrets, and optional
   integration tokens as documented in the environment reference. This includes:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `KMS_DATA_KEY` or `KMS_DATA_KEY_BASE64`
   - `BACKUP_PEPPER`, `MFA_SESSION_SECRET`, `TRUSTED_COOKIE_SECRET`
   - Provider-specific keys (Resend, Twilio, OpenAI) as needed

3. Mirror the required keys into Supabase secrets for Edge Functions
   (`supabase/.env.*`).

## 4. Bootstrap Supabase

1. Authenticate and link the target project:

   ```bash
   supabase login
   supabase link --project-ref "$SUPABASE_PROJECT_REF"
   ```

2. Apply all migrations and seed data:

   ```bash
   supabase migration up --linked --include-all --yes
   ```

   This installs the full schema and Umurenge SACCO seed set used by the staff
   and member apps.

3. (Local only) Bring up the Supabase stack with fixtures:

   ```bash
   supabase start
   supabase db reset
   ```

4. Provision secrets for functions and background jobs:

   ```bash
   supabase secrets set --env-file supabase/.env.production
   ```

## 5. Generate Supabase types

Regenerate type definitions whenever the database schema changes so both apps
compile with accurate typings.

```bash
# Admin app schema (app + public schemas)
supabase gen types typescript --linked > apps/admin/lib/supabase/types.ts

# Client app schema (public tables consumed by the member app)
supabase gen types typescript --linked > apps/client/lib/supabase/types.ts
```

Commit the updated files to keep IDE tooling in sync with the deployed schema.

## 6. Verify the workspace

Run the core commands before starting feature work:

```bash
make quickstart  # lint → typecheck → test → build
```

All four stages must pass locally; CI mirrors this sequence through
`pnpm run check:deploy`. `make quickstart` is tuned to finish in under an hour
on a clean machine, enabling new contributors to ship fixes on day one.

## 7. Ship within the first day

1. Create a feature branch and implement your change.
2. Run `make quickstart` to ensure lint, types, tests, and build succeed.
3. Generate a preview deployment with `pnpm run preview:vercel` (or
   `make preview-vercel`). Capture the URL for review notes.
4. Open a pull request targeting `main`, attach preview + Supabase notes, and
   request review from @release-engineering.
5. Once approved, execute `pnpm run release` (or `make release`) to promote the
   build to Vercel production. The command automatically reruns `check:deploy`
   before shipping.

These steps ensure a fully onboarded developer can contribute a reviewed,
production-ready change inside the first day.

## 8. Troubleshooting quick reference

### Lint failures (`pnpm run lint`)

1. Reproduce the CI environment locally with `CI=true pnpm run lint` to catch
   caching or conditional rules.
2. Fix ESLint violations or run `pnpm run lint -- --fix` for auto-fixable
   issues.
3. Rebuild shared packages if path aliases break (`pnpm -r run build`).

### Build failures (`pnpm run build`)

1. Build shared packages in dependency order
   (`pnpm --filter @ibimina/core run build`, etc.).
2. Verify TypeScript path mappings match the workspace layout
   (`tsconfig.base.json`).
3. Clear stale artifacts (`rm -rf packages/*/dist apps/*/.next`), reinstall, and
   rebuild.

### Test failures (`pnpm run test` / `pnpm run test:e2e`)

1. Re-run with verbose output (`pnpm run test:unit -- --verbose`) to spot the
   failing assertion.
2. Validate the RLS test database connection
   (`psql $RLS_TEST_DATABASE_URL -c "SELECT 1;"`).
3. For flaky Playwright specs, prefer `data-testid` selectors and increase
   timeouts where necessary.

If issues persist, escalate with logs and CI artifacts per the troubleshooting
guide.

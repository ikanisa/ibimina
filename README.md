# Ibimina Apps (Staff Admin, Client, Website)

Ibimina delivers SACCO tools for Rwanda: a staff console, a client-facing PWA,
and a marketing site built on a shared Next.js/Tailwind stack. Supabase supplies
auth, database, and real-time features.

## What ships today

- **Staff admin PWA** (`apps/pwa/staff-admin`): onboarding, reconciliation,
  reporting, device-aware MFA.
- **Client PWA** (`apps/pwa/client`): group savings, statements, AI help,
  offline-friendly flows.
- **Website** (`apps/website`): public marketing pages.
- **Shared packages** (`packages/ui`, `packages/lib`, `packages/config`,
  `packages/locales`).

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- **Backend**: Supabase (Postgres + RLS, auth, Edge Functions), @supabase/ssr
  for server helpers.
- **Tooling**: pnpm workspaces, ESLint/Prettier, Playwright, Husky +
  lint-staged.

## Authentication & data access

1. **Create a Supabase project** and enable email logins. Keep RLS on for every
   table.
2. **Link secrets locally** by copying `.env.example` to `.env` and filling the
   required keys below. The same values should be stored in Vercel/Cloudflare
   and CI secret stores.
3. **Passkeys/TOTP**: set `MFA_RP_ID`, `MFA_ORIGIN`, and `MFA_RP_NAME` to match
   the staff domain so WebAuthn challenges validate correctly.
4. **Edge/Webhooks**: use `HMAC_SHARED_SECRET` to sign Supabase Edge Function
   calls (e.g., SMS inbox or reconciliation hooks).
5. **Optional local database**: `supabase start && supabase db reset` seeds the
   schema and sample data for running without a remote project.

### Required environment variables

| Variable                              | Purpose                                                 |
| ------------------------------------- | ------------------------------------------------------- |
| `APP_ENV`                             | Runtime label (`development`, `staging`, `production`). |
| `NEXT_PUBLIC_SUPABASE_URL`            | Supabase project URL for browser clients.               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | Public anon key (RLS enforced).                         |
| `SUPABASE_URL`                        | Supabase service URL for server actions and hooks.      |
| `SUPABASE_SERVICE_ROLE_KEY`           | Service role key for server-only operations.            |
| `KMS_DATA_KEY_BASE64`                 | Base64 32-byte key for encrypting PII.                  |
| `BACKUP_PEPPER`                       | Hex pepper for backup/MFA code hashing.                 |
| `MFA_SESSION_SECRET`                  | Hex secret for MFA session cookies.                     |
| `TRUSTED_COOKIE_SECRET`               | Hex secret for trusted device cookies.                  |
| `HMAC_SHARED_SECRET`                  | Hex secret for verifying webhook/Edge calls.            |
| `MFA_EMAIL_FROM` / `MFA_EMAIL_LOCALE` | Sender and locale for MFA email delivery.               |

Generate secrets locally with:

```bash
openssl rand -base64 32 # KMS_DATA_KEY_BASE64
openssl rand -hex 32    # BACKUP_PEPPER MFA_SESSION_SECRET TRUSTED_COOKIE_SECRET HMAC_SHARED_SECRET
```

## Getting started

1. **Install toolchain**: Node 20 (see `.nvmrc`) and `pnpm i -g pnpm@10.19.0`.
2. **Install dependencies**: `pnpm install`.
3. **Configure env**: `cp .env.example .env` and populate the required
   variables.
4. **Run locally**:
   - Staff admin: `pnpm --filter @ibimina/staff-admin-pwa dev` (port 3100).
   - Client: `pnpm --filter @ibimina/client dev` (port 5000).
   - Website: `pnpm --filter @ibimina/website dev`.
   - Optional: start Supabase locally with `supabase start` before running the
     apps.

See [RUN_TEST_DEPLOY.md](RUN_TEST_DEPLOY.md) for a concise run/test/deploy flow.

## Project layout

```
apps/
  pwa/
    staff-admin/   # Staff/admin console (Next.js App Router)
    client/        # Client PWA (Next.js App Router)
  website/         # Marketing site
packages/
  ui/ lib/ config/ locales/   # Shared components, utilities, config, translations
supabase/                      # SQL migrations, edge functions, seed data
```

## Deployment notes

- Build PWAs with `pnpm build:admin` and `pnpm build:client`; both output
  standalone `.next` bundles.
- The website can be exported statically
  (`pnpm --filter @ibimina/website build`).
- Mirror the required env vars into your hosting provider and CI; keep
  `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` in CI for Supabase
  migrations/edge deployments.

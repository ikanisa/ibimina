# Run / Test / Deploy

A compact workflow for the active Ibimina apps (staff-admin PWA, client PWA,
website).

## 1) Run locally

1. Install dependencies: `pnpm install`
2. Copy envs: `cp .env.example .env` and fill the required variables from the
   README.
3. (Optional) Start Supabase locally for full data + auth:
   `supabase start && supabase db reset`.
4. Launch apps:
   - Staff admin: `pnpm --filter @ibimina/staff-admin-pwa dev` (port 3100)
   - Client: `pnpm --filter @ibimina/client dev` (port 5000)
   - Website: `pnpm --filter @ibimina/website dev`

## 2) Test

- Lint + types: `pnpm lint` then `pnpm typecheck`
- Unit tests: `pnpm --filter @ibimina/staff-admin-pwa test:unit` and
  `pnpm --filter @ibimina/client test:unit`
- Auth/RLS: `pnpm --filter @ibimina/staff-admin-pwa test:auth` and
  `pnpm --filter @ibimina/staff-admin-pwa test:rls`
- E2E: `pnpm --filter @ibimina/staff-admin-pwa test:e2e`

## 3) Deploy

- Build PWAs: `pnpm build:admin` and `pnpm build:client` (standalone Next.js
  output)
- Build website: `pnpm --filter @ibimina/website build` (static export)
- Required secrets in CI/hosting: `APP_ENV`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `KMS_DATA_KEY_BASE64`, `BACKUP_PEPPER`, `MFA_SESSION_SECRET`,
  `TRUSTED_COOKIE_SECRET`, `HMAC_SHARED_SECRET`, `MFA_EMAIL_FROM`,
  `MFA_EMAIL_LOCALE`.
- Supabase automation: keep `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN`
  in CI so migrations and Edge Functions can deploy.
- Typical pipeline: check envs → `pnpm lint && pnpm typecheck` → target tests
  (`pnpm --filter @ibimina/staff-admin-pwa test:e2e`) → build → deploy to
  Vercel/Cloudflare Pages.

# Local Hosting Guide (MacBook)

This guide documents how to run Ibimina end-to-end on a MacBook (or similar Node
host) without relying on a managed PaaS. It assumes Supabase is already
provisioned and reachable from the machine.

## 1. Prerequisites

- **Node.js 20.x** (see `.nvmrc` for the recommended version).
- **pnpm 9+** (`corepack enable pnpm` will activate the correct toolchain).
- Access to the staging/production Supabase project (service role + anon keys)
  and OpenAI credentials.
- Optional: [Caddy + Cloudflared helpers](../scripts/mac/) if you want to expose
  the service via a reverse proxy or tunnel.

## 2. Environment Configuration

1. Copy `.env.example` to `.env` (primary runtime file) and, if you want
   per-developer overrides, to `.env.local` (gitignored).
2. Populate required secrets in `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (and `SUPABASE_JWT_SECRET` if you validate
     Supabase JWTs)
   - `BACKUP_PEPPER`, `MFA_SESSION_SECRET`, `TRUSTED_COOKIE_SECRET`,
     `HMAC_SHARED_SECRET`
   - `KMS_DATA_KEY` **or** `KMS_DATA_KEY_BASE64`
   - `OPENAI_API_KEY`
   - Any integration secrets (SMTP, Twilio, log drain, etc.)
3. Set optional runtime metadata as needed:
   - `APP_ENV=staging|production` (defaults to `local`)

- `GIT_COMMIT_SHA=<git SHA>` for `/api/healthz`
- `APP_REGION=<location>` for regional diagnostics
- `PORT=3100` (or another port) to override the listener

4. Mirror shared secrets in Supabase via `supabase/.env.example` (HMAC key, KMS
   data key, Resend API key, etc.).

## 3. Install & Build

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm build` validates environment variables (via `src/env.server.ts`) and emits
the standalone bundle in `.next/`.

You can also leverage the Makefile helpers:

```bash
make deps   # installs Caddy + Cloudflared via Homebrew (macOS)
make build
```

## 4. Start the Service

```bash
make local-up    # starts Next.js + Caddy in background
# when finished: make local-down
```

- This uses the macOS helpers to run Next.js and Caddy with sensible defaults.
- Verify readiness with `curl http://localhost:3100/api/healthz` (confirm
  `buildId`, `environment`, `timestamp`).
- Ensure `/manifest.json` and `/service-worker.js` are accessible if the PWA
  should remain installable.

The macOS scripts under `scripts/mac/` wrap Caddy and Cloudflared lifecycle
commands for developers who prefer managed certificates or tunnels:

- `scripts/mac/install_caddy_cloudflared.sh` (also invoked by `make deps`)
- `scripts/mac/caddy_up.sh` / `caddy_down.sh` / `caddy_bg.sh`
- `scripts/mac/tunnel_up.sh` / `tunnel_down.sh` / `tunnel_bg.sh`

Makefile shortcuts are available:

```bash
make caddy-up      # foreground
make caddy-bg      # background (logs under ./.logs) — HTTPS on :8443
make caddy-down
make tunnel-up     # foreground
make tunnel-bg     # background
make tunnel-down
```

> ℹ️ Copy `infra/cloudflared/config.yml.example` to
> `infra/cloudflared/config.yml` and fill in your Cloudflare tunnel ID,
> credentials, and hostname before starting the tunnel. The scripts will refuse
> to start if the config is missing or empty. Cloudflared is configured to route
> to `https://localhost:8443` (Caddy).

## 5. Supabase Notes

- Keep Supabase migrations up to date (`supabase db push` or CI pipeline).
- Edge Functions require the same `HMAC_SHARED_SECRET`/`KMS_DATA_KEY_BASE64` as
  the web app.
- Configure Resend/Twilio credentials and WhatsApp sender numbers directly in
  Supabase secrets when those channels are active.
- For local testing without external dependencies, you may stub Twilio/SMTP env
  vars and run `AUTH_E2E_STUB=1`.

## 6. Optional Hardening

- Run the Postgres log-drain verifier: `pnpm run verify:log-drain`.
- Execute Playwright smoke tests against the running instance:
  `pnpm run test:e2e`.
- Use `docs/operations-runbook.md` for log forwarding setup and incident tips.
- For launchd/PM2, ensure environment variables are passed securely (e.g.,
  `LaunchAgent` plist with `EnvironmentVariables` block, or PM2 ecosystem file
  with `env_production`).

## 7. Troubleshooting

- **Port in use:** Stop existing Next.js processes or adjust `PORT`.
- **Env validation failures:** Re-check `.env.local` against `.env.example`;
  `pnpm build` prints the missing keys.
- **Supabase auth errors:** Confirm database migrations and grants (see
  `docs/operations/reports/...` for previous incidents).
- **PWA disabled unexpectedly:** Verify `DISABLE_PWA` is not set to `1` and that
  `next-pwa` is installed.

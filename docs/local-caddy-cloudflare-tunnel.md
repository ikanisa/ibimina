# Local Caddy + Cloudflare Tunnel Guide (macOS)

This guide focuses on macOS developer workstations. Linux usage is out of scope
for now (see [Future Work](#future-work)).

## Prerequisites

- macOS 13 or later with Homebrew installed.
- `pnpm` (see `README.md` for installation steps) and project dependencies.
- Access to the Cloudflare account that owns the target zone.
- Supabase project administrator access.
- Cloudflare Access (Zero Trust) seat provisioned for all local operators.
- Optional: `direnv` or `chezmoi` for managing environment variables securely.

## Install Dependencies

Run the consolidated dependency bootstrapper before any local zero-trust work:

```bash
make deps    # invokes scripts/mac/install_caddy_cloudflared.sh
```

This target installs Homebrew formulas, Node toolchains, Caddy, and Cloudflare
Tunnel binaries where required. If you encounter missing tools, re-run
`make deps` before opening an issue.

## Environment Variables

Add the following secrets to your local environment manager (`.env.local`,
`direnv`, etc.). Replace the placeholder values before use.

```bash
export CLOUDFLARE_ACCOUNT_ID="cf-acc-xxxxxxxxxxxx"
export CLOUDFLARE_TUNNEL_ID="cf-tunnel-xxxxxxxxxxxx"
export CLOUDFLARE_TUNNEL_SECRET="base64-encoded-secret"
export CLOUDFLARE_API_TOKEN="cf-api-token-with-tunnel-scope"
export SUPABASE_SERVICE_ROLE_KEY="supabase-service-role-key"
export SUPABASE_PROJECT_URL="https://your-project.supabase.co"
```

Never commit these secrets. Gate sharing through Cloudflare Access to maintain
the zero-trust posture.

## Caddy and Cloudflare Tunnel Scripts

The repository ships macOS convenience scripts under `scripts/mac/`:

- `install_caddy_cloudflared.sh` – Homebrew bootstrap (also used by
  `make deps`).
- `caddy_up.sh` / `caddy_bg.sh` / `caddy_down.sh` – Caddy lifecycle helpers.
- `tunnel_up.sh` / `tunnel_bg.sh` / `tunnel_down.sh` – Cloudflare Tunnel
  lifecycle helpers.

All background variants log into `./.logs` and record PID files so `*_down.sh`
can terminate them cleanly.

### Foreground Usage

1. Ensure secrets are exported and the tunnel config exists:
   ```bash
   cp infra/cloudflared/config.yml.example infra/cloudflared/config.yml
   # edit infra/cloudflared/config.yml with your tunnel ID + credentials
   ```
2. Start the tunnel in one terminal:
   ```bash
   scripts/mac/tunnel_up.sh
   ```
3. Start Caddy in a second terminal:
   ```bash
   scripts/mac/caddy_up.sh
   ```
4. Visit the Cloudflare-access-protected hostname to confirm the Access login
   prompt appears.

### Background Usage

Use the Makefile targets to supervise the services via `launchctl`, `tmux`, or
your preferred supervisor:

```bash
make tunnel-up
make caddy-up
```

Logs stream to `./.logs/cloudflared.log` and `./.logs/caddy.log`. Stop
background tasks with `make tunnel-down` and `make caddy-down`.

## Cloudflare Access Configuration

1. Navigate to **Zero Trust → Access → Applications**.
2. Create (or update) an application for the local hostname (e.g.,
   `local.ibimina.dev`).
3. Require SSO with the team IdP and enforce device posture checks.
4. Add a new **Service Auth** rule referencing the `CLOUDFLARE_TUNNEL_ID` so
   only the local tunnel can reach the origin.

## Supabase CORS Updates

Update the Supabase project settings:

1. In the Supabase dashboard, open **Authentication → URL Configuration**.
2. Add the tunneled hostname (e.g., `https://local.ibimina.dev`) to the
   **Redirect URLs** and **Additional Redirect URLs** lists.
3. Under **Auth → Config → Allowed CORS Origins**, add the same hostname.
4. Save changes. Propagation typically takes <1 minute.

## Health Checks

- `scripts/cf-tunnel-local.sh --status` returns Cloudflare Tunnel diagnostics.
- `scripts/caddy-local.sh --status` verifies the local Caddy instance is
  healthy.
- `curl -I https://local.ibimina.dev/healthz` should return `200 OK` when both
  services run correctly.

## Stopping Services

Foreground sessions can be stopped with `Ctrl+C`.

For background sessions, run:

```bash
make tunnel-down
make caddy-down
```

These targets terminate processes and clean up PID files under `./tmp/`.

## Rollback / Cleanup

To return to a pre-tunnel state:

1. Stop background jobs (`make tunnel-down`, `make caddy-down`).
2. Revoke the `CLOUDFLARE_TUNNEL_SECRET` via the Cloudflare dashboard.
3. Remove any temporary Supabase CORS entries.
4. Delete local config overrides (e.g., `.env.local`,
   `~/Library/LaunchAgents/local.caddy.plist`).
5. Re-run `make deps` if you need to reinstall stable binaries after cleanup.

## Future Work (Linux)

Document a systemd-based workflow for Debian/Ubuntu hosts, including `systemd`
unit files, `apt` package requirements, and SELinux notes. This remains TODO.

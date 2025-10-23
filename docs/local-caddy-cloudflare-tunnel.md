# Local Caddy + Cloudflare Tunnel Guide (macOS)

This guide walks through running the Ibimina admin locally behind Caddy and a Cloudflare Tunnel. It assumes you are on macOS with Docker Desktop installed and have access to the Cloudflare zone that owns the admin domain.

## Prerequisites

- macOS 13 or later with Homebrew installed.
- Docker Desktop (or another Docker engine) running.
- `pnpm` (see `README.md` for setup instructions) and project dependencies.
- Access to the Cloudflare account that owns `admin.sacco-plus.com` (or your target hostname).
- Supabase project administrator access.
- Cloudflare Access (Zero Trust) seat provisioned for every operator.

## Install Dependencies

Install the JavaScript toolchain as usual:

```bash
pnpm install --frozen-lockfile
```

Then install Cloudflared via Homebrew:

```bash
make deps-cloudflare
```

The script prints next steps for authenticating Cloudflared with your Cloudflare account.

## Environment Files

Prepare runtime configuration for both Next.js and Docker:

```bash
cp .env.example .env.local         # Next.js local overrides (gitignored)
cp .env.template .env              # Docker Compose + Caddy runtime
```

Populate the Supabase keys and any other required secrets before building.

Next configure Cloudflared:

```bash
cp infra/cloudflared/config.yml.example infra/cloudflared/config.yml
```

Edit the new `config.yml` so that:

- `credentials-file` points to the JSON emitted by `cloudflared login` (usually `~/.cloudflared/<UUID>.json`).
- `hostname` matches the Cloudflare Access hostname you plan to expose (e.g., `admin.sacco-plus.com`).

## Lifecycle Commands

Docker Compose runs both the Next.js standalone server and Caddy reverse proxy:

```bash
docker compose up -d --build
```

The Makefile exposes helper targets for Cloudflared and Caddy:

- `make caddy-up` / `make caddy-down` start or stop the Caddy container.
- `make tunnel-up` starts Cloudflared in the foreground (Ctrl+C to stop).
- `make tunnel-bg` / `make tunnel-down` manage Cloudflared in the background and store logs under `.logs/`.

### Foreground Usage

1. Start the app stack:
   ```bash
   docker compose up -d --build
   ```
2. Launch Cloudflared in the foreground:
   ```bash
   make tunnel-up
   ```
3. Visit `https://admin.sacco-plus.com` (or your hostname). Cloudflare Access should prompt for authentication before proxying traffic to the local Caddy instance.

### Background Usage

Prefer the tunnel in the background?

```bash
docker compose up -d --build
make tunnel-bg
```

Logs live in `.logs/cloudflared.out`. Stop the tunnel with `make tunnel-down` when finished.

### Optional: Run Cloudflared via Docker Compose

Prefer to keep everything inside Docker? Add this service to `docker-compose.yml`:

```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: admin-cloudflared
    restart: unless-stopped
    command: tunnel --config /etc/cloudflared/config.yml run
    volumes:
      - ./infra/cloudflared/config.yml:/etc/cloudflared/config.yml:ro
      - ~/.cloudflared/:/root/.cloudflared/:ro
    depends_on:
      - caddy
    networks: [web]
```

Run `cloudflared login` once on the host to mint the credentials JSON under `~/.cloudflared/…`. Afterwards you can manage the tunnel like any other Compose service:

```bash
docker compose up -d cloudflared
docker compose logs -f cloudflared
docker compose rm -sf cloudflared
```

## Cloudflare Access Configuration

Create a self-hosted application in Cloudflare Zero Trust before sharing the URL:

1. **Zero Trust → Access → Applications → Add application → Self-hosted**.
2. Application name: **SACCO Admin** (or your preferred label).
3. Application domain: **admin.sacco-plus.com**.
4. Session duration: **24 hours** (adjust as needed).
5. In the Policies tab, add an Allow policy:
   - Name: `Allow-Staff`
   - Include: Emails → `*@ikanisa.com`
   - (Optional) Require device posture, such as `Is Managed`.
   - (Optional) Exclude additional emails if you need to block specific accounts.

Save the policy so only authorized staff can access the tunnel.

## Supabase CORS Updates

In the Supabase dashboard (**Authentication → URL Configuration**):

1. Add `https://admin.sacco-plus.com` to **Redirect URLs** and **Allowed Origins**.
2. Keep your local URLs (e.g., `http://localhost:3000`) for development.

## Quick Health Checklist

- `http://localhost:3000` – direct Next.js standalone server.
- `http://localhost:8080` – Caddy reverse proxy.
- `docker compose logs -f admin` / `docker compose logs -f caddy` – runtime diagnostics.
- `https://admin.sacco-plus.com` – Cloudflare-tunneled access (prompts for Access login first).

## Stopping Services

```bash
make tunnel-down
make caddy-down
docker compose down
```

Alternatively, stop all containers with `docker compose down` first and then terminate Cloudflared with `make tunnel-down`.

## Cleanup Checklist

1. Stop the tunnel (`make tunnel-down`).
2. Remove containers (`docker compose down`).
3. Revoke the Cloudflared credentials if the tunnel is no longer needed.
4. Remove the tunneled hostname from Supabase CORS entries if you are decommissioning access.
5. Delete any temporary `.env` files that contain secrets you no longer require.

Stay mindful that service-role keys must remain server-side only; never expose them to the browser or commit them to git.

# Local Hosting Plan

## Overview

- **Project**: Ibimina web app
- **Framework**: Next.js 15 (App Router)
- **Package Manager**: pnpm (`pnpm-lock.yaml`)
- **Preferred Node Version**: 20.x (compatible with `engines` + `.nvmrc`)

## Deployable App

### Web (Next.js)

- **Root Directory**: `.`
- **Install Command**: `pnpm install --frozen-lockfile`
- **Build Command**: `pnpm run build`
- **Start Command**: `PORT=3100 pnpm run start`
- **Output Directory**: `.next` (`output: 'standalone'` for simple Node hosting)
- **Environment Strategy**:
  - Copy `.env.example` → `.env.local` and fill Supabase/OpenAI/HMAC/MFA
    secrets.
  - `src/env.server.ts` validates required secrets on `pnpm build`/`pnpm start`.
  - Browser bundle restricted to `NEXT_PUBLIC_*` variables.
- **Runtime Notes**:
  - `images.unoptimized = true` allows serving assets directly via any reverse
    proxy/CDN.
  - `next-pwa` bundles a service worker unless `DISABLE_PWA=1`.
  - `/api/healthz` exposes build metadata, environment labels, and timestamps
    for monitoring.

## Hosting Targets

- **Primary**: MacBook (launchd/PM2) or bare-metal Node 20 service behind
  nginx/Caddy.
- **Secondary**: Docker container (existing `Dockerfile`) deployed to Fly.io,
  ECS, or Kubernetes. Ensure secrets mirror `.env.example`.

## Automation & CI

- `.github/workflows/node.yml` runs `pnpm install`, `pnpm lint`,
  `pnpm typecheck`, and `pnpm build` for quick regression checks.
- `.github/workflows/ci.yml` performs extended checks (tests, Playwright,
  Lighthouse) before release.

## Testing Plan

1. `pnpm install --frozen-lockfile`
2. `pnpm run lint`
3. `pnpm run typecheck`
4. `pnpm run build`
5. `PORT=3100 pnpm run start`
6. Hit `http://localhost:3100/api/healthz` to verify status payload (buildId,
   environment, timestamp).

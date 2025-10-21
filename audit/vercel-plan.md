# Vercel Deployment Plan

## Overview
- **Project**: ibimina web app
- **Framework**: Next.js 15 (App Router)
- **Package Manager**: pnpm (`pnpm-lock.yaml` authoritative)
- **Preferred Node Version**: 18.x (align with Vercel default and package `engines`)

## Deployable Apps

### Web (Next.js)
- **Root Directory**: `.`
- **Install Command**: `pnpm install --frozen-lockfile`
- **Build Command**: `pnpm run build`
- **Output Directory**: `.next`
- **Development Command**: `pnpm run dev`
- **Preview/Production Regions**: `fra1`
- **Environment Strategy**:
  - Use `vercel env pull` → `.env.local` during CI and local builds.
  - Required runtime secrets validated via `src/env.server.ts` (throws on startup/build when missing).
  - Public runtime config limited to `NEXT_PUBLIC_*` variables to avoid leaking secrets to the browser bundle.
- **Build Artifacts**:
  - Enable `output: 'standalone'` in `next.config.ts` for lighter lambdas and deterministic deployment packages.
  - `next-pwa` runs only when available; `DISABLE_PWA=1` disables SW bundling for emergency rollbacks.

## Global Vercel Configuration
- Extend the existing `vercel.json` to declare the framework (`nextjs`), custom install/build commands, and immutable caching headers.
- Keep deployment region pinned to `fra1` for Supabase latency affinity.
- Add explicit health-check route mapping when Supabase automation hits `/api/healthz`.

## Additional Actions
- Ship `.nvmrc` with Node 18.20.x to sync local and CI environments with Vercel.
- Create GitHub Action (`.github/workflows/vercel-preview-build.yml`) that runs `vercel pull` + `vercel build` using Node 18.
- Add `scripts/vercel-preflight.mjs` to wrap `vercel pull`/`vercel build` and enforce env completeness before pushing.

## Testing Plan
1. `pnpm install --frozen-lockfile`
2. `pnpm run lint && pnpm run typecheck`
3. `npx vercel pull --yes --environment=preview`
4. `npx vercel build`
5. Deploy via Vercel UI/CLI using generated output.


# Ibimina Staff Console — Next.js App Router

A staff-only Progressive Web App for Umurenge SACCO ibimina operations. The UI foundation now matches the Rwanda-inspired liquid-glass spec: Next.js 15 App Router, mobile-first gradients, Framer Motion transitions, and Supabase-backed semantic SACCO search.

## Tech stack

- Next.js 15 (App Router, typed routes)
- TypeScript + Tailwind design tokens (`styles/tokens.css`)
- Framer Motion for page transitions
- Supabase (`@supabase/ssr`) for auth and data
- PWA manifest & service worker ready for Lovable Cloud deploys

## Getting started

```bash
npm install
npm run dev
```

Set the required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key
```

Copy `.env.example` to `.env` and fill in the secrets you already use in Lovable Cloud.

## Running Supabase migrations

The Umurenge SACCO master list is seeded by the latest SQL migration:

```
supabase/migrations/20251008120000_enrich_saccos_with_umurenge_master.sql
```

Run this migration inside Lovable Cloud’s SQL console (or through your preferred Supabase admin workflow) to apply the schema updates, semantic search function, and the 416 BNR records captured in `supabase/data/umurenge_saccos.json`.

## Project layout

```
app/                     # App Router routes
  (auth)/                # Auth shell + login
  (main)/                # Dashboard, Ikimina, Recon, Reports, Admin
components/              # Shared UI building blocks
lib/supabase/            # Supabase client + typed schema
providers/               # Motion + theme + profile contexts
styles/                  # Global design tokens
supabase/                # Config, migrations, seed data
```

## Supabase integration

- `lib/supabase/server.ts` exposes a server-side client that reads the session cookie (no project linking required in Lovable Cloud).
- `lib/auth.ts` centralises user/session lookups and guards the `(main)` route group.
- Dashboard, Ikimina, Recon, Reports, and Admin pages now query Supabase directly in server components.

## Recent polish

- Revamped the AppShell with bilingual navigation, skip links, quick actions, and a global search palette that exposes semantic SACCO lookup.
- Extended global search to surface ikimina, members, and recent payments with bilingual microcopy baked into the palette.
- Expanded client-side search across Ikimina directories while keeping upload wizards and RPC-powered SACCO picking in sync with Supabase.
- Rounded out accessibility with consistent focus treatments, bilingual microcopy, and a `viewport` export that advertises the active theme colour.

## Scripts

- `npm run dev` – start the dev server
- `npm run lint` – lint the project
- `npm run build` – production build

Deployments continue through Lovable Cloud; push changes or publish from the Lovable dashboard when ready.

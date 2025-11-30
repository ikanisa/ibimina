# Project Structure and Dependency Graph

**Version**: 3.0  
**Last Updated**: 2025-11-29

The ibimina monorepo hosts the Staff Admin applications for the Umurenge SACCO
platform: the staff console PWA, desktop application, shared packages,
infrastructure as code, and Supabase migrations. Everything is wired together
through a pnpm workspace so upgrades propagate consistently.

## 📁 Repository Overview

```
ibimina/
├── apps/                    # Deployable applications
│   ├── pwa/
│   │   └── staff-admin/     # Staff Admin PWA (Next.js 15)
│   └── desktop/
│       └── staff-admin/     # Staff Admin Desktop (Tauri)
├── packages/                # Shared packages reused across apps
├── infra/                   # Observability and operations tooling
├── supabase/                # Database schema, tests, functions, cron jobs
├── docs/                    # Architecture, operations, and runbooks
├── scripts/                 # Automation utilities (validation, tooling)
└── config files             # ESLint, tsconfig, Tailwind, etc.
```

## 🏗️ High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│ Frontend Surfaces                                                  │
│  • Staff Admin PWA (Next.js 15) ─────────┐                         │
│  • Staff Admin Desktop (Tauri) ──────────┤──▶ Supabase (Postgres, │
│                                          │    Auth, Storage,      │
│                                          │    Edge Functions)     │
└──────────────────────────────────────────┴─────────────────────────┘
                 ▲                          │
                 │ Shared packages (@ibimina/config, ui, lib…)
                 └──────────────────────────┘
```

Every surface shares generated Supabase types, runtime configuration, and UI
building blocks so product changes stay aligned across platforms.

## 📦 Applications (`apps/`)

### 1. Staff Admin PWA — `apps/pwa/staff-admin`

- **Package**: `@ibimina/staff-admin-pwa`
- **Framework**: Next.js 15 App Router with Node runtime (PWA enabled)
- **Primary capabilities**:
  - Auth flows including trusted devices and session management
  - SACCO operations dashboards, reconciliation, Ikimina management, and
    reporting
  - Installable PWA with custom manifest, service worker, and offline fallback
- **Key directories**:
  - `app/` — Next.js app directory with routes
  - `components/` — shared UI (Glass cards, gradient headers, data tables)
  - `lib/` — auth guards, Supabase clients, logging, auditing utilities
  - `providers/` — analytics, feature flags, and error boundaries
  - `tests/` — unit, RLS, Playwright E2E, and observability checks

### 2. Staff Admin Desktop — `apps/desktop/staff-admin`

- **Package**: `@ibimina/staff-admin-desktop`
- **Framework**: Tauri + Vite + React
- **Primary capabilities**:
  - Full admin capabilities with native desktop integration
  - Offline-capable workflows
- **Platforms**: Windows, macOS, Linux

## 🧩 Shared Packages (`packages/`)

Shared packages provide consistent primitives across surfaces:

| Package                     | Purpose                                      |
| --------------------------- | -------------------------------------------- |
| `@ibimina/admin-core`       | Admin core business logic                    |
| `@ibimina/config`           | Runtime configuration, environment schema    |
| `@ibimina/flags`            | Feature flag management                      |
| `@ibimina/lib`              | Shared utilities (HMAC, encryption, logging) |
| `@ibimina/locales`          | i18n catalogs (EN/Kinyarwanda/French)        |
| `@ibimina/supabase-schemas` | Database type definitions                    |
| `@ibimina/ui`               | Design system and React components           |

Packages are published locally via pnpm workspaces; each app lists them as
`workspace:*` dependencies to ensure a single source of truth.

## 🗄️ Data & Backend (`supabase/`)

- **Migrations**: SQL migrations in `supabase/migrations` define Postgres
  schema, RLS policies, triggers, cron schedules, and metrics views. Apply them
  with `supabase migration up --linked --include-all` as part of bootstrap.
- **Edge Functions**: The `supabase/functions/` directory houses Deno functions
  for anomaly detection, reconciliation, SMS parsing, and webhook dispatch.
- **Testing**: RLS and API contracts validated through
  `apps/pwa/staff-admin/tests/rls` and `supabase/tests` to guarantee permissions
  coverage.

## 🔄 Automation & Tooling

- Root scripts (`pnpm run check:deploy`, `pnpm run release`) orchestrate
  linting, type checking, multi-surface tests, bundle verification, and
  production deploys using the shared Makefile wrappers.
- Git hooks via Husky enforce formatting and linting on staged files before
  commits land.
- CI workflows mirror the same commands so local runs match pipeline behavior.

Use this document as the canonical map when planning changes: it links each
business capability to the Next.js routes or desktop features that implement it.

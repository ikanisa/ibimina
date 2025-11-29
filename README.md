# Ibimina — Staff Admin Applications

Ibimina is a SACCO management platform for Rwanda's Umurenge SACCOs. This
repository contains the Staff/Admin applications built on Next.js 15 and Tauri.

## Applications

- **Staff Admin PWA** (`apps/pwa/staff-admin`): Next.js 15 PWA for staff
  operations, onboarding, reconciliation, and reporting with device-aware MFA.
- **Staff Admin Desktop** (`apps/desktop/staff-admin`): Tauri + Vite + React
  desktop application for offline-capable staff workflows.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.9, Tailwind CSS
- **Desktop**: Tauri, Vite, React
- **Backend**: Supabase (PostgreSQL with RLS, Edge Functions on Deno runtime)
- **Tooling**: pnpm workspaces, ESLint/Prettier, Playwright, Husky + lint-staged

## Project Structure

```
ibimina/
├── apps/
│   ├── pwa/
│   │   └── staff-admin/      # Staff Admin PWA (Next.js 15)
│   └── desktop/
│       └── staff-admin/      # Staff Admin Desktop (Tauri)
├── packages/
│   ├── admin-core/           # Admin core logic
│   ├── config/               # Environment configuration
│   ├── flags/                # Feature flags
│   ├── lib/                  # Shared utilities
│   ├── locales/              # i18n translations
│   ├── supabase-schemas/     # Database type definitions
│   └── ui/                   # Shared UI components
├── supabase/                 # Backend (migrations, functions, tests)
├── docs/                     # Documentation
└── infra/                    # Infrastructure configs
```

## Quick Start

```bash
# 1. Install dependencies
nvm use 20
npm install -g pnpm@10.19.0
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Run the Staff Admin PWA
pnpm dev
# or
pnpm --filter @ibimina/staff-admin-pwa dev
```

The staff console will be available at `http://localhost:3100`.

## Required Environment Variables

| Variable                        | Purpose                           |
| ------------------------------- | --------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS enforced)    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key (server-only)    |
| `KMS_DATA_KEY_BASE64`           | Base64 32-byte encryption key     |
| `BACKUP_PEPPER`                 | Hex pepper for backup code hashing|
| `MFA_SESSION_SECRET`            | Hex secret for MFA session cookies|
| `TRUSTED_COOKIE_SECRET`         | Hex secret for trusted device cookies|
| `HMAC_SHARED_SECRET`            | Hex secret for webhook verification|

Generate secrets with:

```bash
openssl rand -base64 32  # For KMS_DATA_KEY_BASE64
openssl rand -hex 32     # For BACKUP_PEPPER, MFA_SESSION_SECRET, etc.
```

## Development Commands

```bash
# Development
pnpm dev                    # Start Staff Admin PWA (port 3100)
pnpm dev:desktop            # Start Staff Admin Desktop

# Building
pnpm build                  # Build all packages and admin PWA
pnpm build:admin            # Build Staff Admin PWA only
pnpm build:desktop          # Build Staff Admin Desktop

# Code Quality
pnpm lint                   # Lint all packages
pnpm format                 # Format code with Prettier
pnpm typecheck              # TypeScript type checking

# Testing
pnpm test                   # Run all tests
pnpm test:unit              # Run unit tests
pnpm test:e2e               # Run E2E tests (Playwright)
pnpm test:rls               # Run RLS policy tests

# Deployment
pnpm check:deploy           # Full deployment readiness check
make ready                  # Alias for check:deploy
```

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development setup guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview
- [docs/](docs/) - Additional documentation

## Branching Model

- `main` - Production-ready, deployment branch
- `work` - Integration branch for active development

## License

Private repository - All rights reserved.

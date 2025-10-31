# Project Structure and Dependency Graph

**Version**: 1.0  
**Last Updated**: 2025-10-29

This document provides a comprehensive overview of the ibimina monorepo
structure, including all services, packages, and their dependencies.

## 📁 Repository Overview

The ibimina monorepo is a TypeScript/Next.js based microservices platform for
SACCO management, organized as a pnpm workspace with multiple applications and
shared packages.

```
ibimina/
├── apps/                    # Application services
├── packages/                # Shared workspace packages
├── infra/                   # Infrastructure and deployment
├── supabase/               # Database migrations and functions
├── docs/                   # Documentation
├── scripts/                # Automation scripts
└── config files            # Root configuration
```

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Applications                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Admin     │  │    Client    │  │ Platform API │     │
│  │   (Next.js)  │  │   (Next.js)  │  │   (Next.js)  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
└─────────┼─────────────────┼──────────────────┼──────────────┘
          │                 │                  │
          └─────────────────┴──────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │       Shared Packages             │
          │  @ibimina/config, core, lib, ui   │
          └─────────────────┬─────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │         Supabase Backend          │
          │  ┌──────────┐    ┌──────────┐    │
          │  │ Postgres │    │   Edge   │    │
          │  │    RLS   │    │ Functions│    │
          │  └──────────┘    └──────────┘    │
          └───────────────────────────────────┘
```

## 📦 Applications (`apps/`)

### 1. Admin Application (`apps/admin/`)

**Purpose**: Staff-facing web application for SACCO administration

**Technology Stack**:

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Supabase client

**Key Features**:

- Member management
- Loan processing
- Transaction monitoring
- Reporting and analytics
- User administration
- Multi-factor authentication (MFA)
- Progressive Web App (PWA) support

**Dependencies**:

```json
{
  "internal": [
    "@ibimina/config",
    "@ibimina/core",
    "@ibimina/lib",
    "@ibimina/ui"
  ],
  "external": ["next", "react", "supabase", "zod", "react-hook-form"]
}
```

**Build Output**: `.next/` directory **Entry Point**:
`apps/admin/src/app/page.tsx`

**Key Directories**:

```
apps/admin/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
├── scripts/             # Build and deployment scripts
└── tests/               # Test files
```

### 2. Client Application (`apps/client/`)

**Purpose**: Member-facing mobile/web application

**Technology Stack**:

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- PWA with service worker

**Key Features**:

- Account balance viewing
- Transaction history
- Loan applications
- Savings deposits
- Mobile money integration
- Offline support (PWA)

**Dependencies**:

```json
{
  "internal": [
    "@ibimina/config",
    "@ibimina/core",
    "@ibimina/lib",
    "@ibimina/ui"
  ],
  "external": ["next", "react", "supabase"]
}
```

**Security Notes**:

- Must NOT use `SUPABASE_SERVICE_ROLE_KEY`
- All data access via RLS-protected queries
- Anon key only

### 3. Platform API (`apps/platform-api/`)

**Purpose**: Backend API for external integrations and mobile money

**Technology Stack**:

- Next.js API routes
- TypeScript
- Supabase server client

**Key Features**:

- Mobile money webhooks (MTN, Airtel)
- SMS gateway integration
- External API endpoints
- Batch processing
- Scheduled jobs

**Dependencies**:

```json
{
  "internal": ["@ibimina/config", "@ibimina/core", "@ibimina/lib"],
  "external": ["next", "supabase"]
}
```

## 📚 Shared Packages (`packages/`)

### 1. Config Package (`@ibimina/config`)

**Purpose**: Environment configuration and validation

**Exports**:

```typescript
// packages/config/src/index.ts
export { env } from "./env";
export type { EnvConfig } from "./env";
```

**Key Features**:

- Zod-based environment validation
- Type-safe environment access
- Server/client variable separation
- Required vs optional variables

**Usage**:

```typescript
import { env } from "@ibimina/config";

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY; // Server-only
```

**Dependencies**:

- `zod` for validation

### 2. Core Package (`@ibimina/core`)

**Purpose**: Core business logic and domain models

**Exports**:

```typescript
// packages/core/src/index.ts
export * from "./types";
export * from "./models";
```

**Key Features**:

- Shared TypeScript types
- Domain models
- Business logic utilities
- Constants and enums

**Dependencies**: None (pure TypeScript)

### 3. Lib Package (`@ibimina/lib`)

**Purpose**: Shared utility functions and helpers

**Exports**:

```typescript
// packages/lib/src/index.ts
export * from "./security";
export { logger } from "./logger";
export { maskPII } from "./pii";
```

**Key Features**:

- Security utilities (HMAC, encryption)
- PII masking functions
- Logging utilities
- Date/time helpers
- String formatting

**Key Modules**:

- `security/`: Webhook signature verification, encryption
- `logger`: Structured logging with PII masking
- `pii`: PII detection and masking

### 4. UI Package (`@ibimina/ui`)

**Purpose**: Shared React components and design system

**Exports**:

```typescript
// packages/ui/src/index.ts
export { Button } from "./components/Button";
export { Input } from "./components/Input";
export { Card } from "./components/Card";
// ... more components
```

**Key Features**:

- Reusable React components
- Consistent styling (Tailwind)
- Accessible components (ARIA)
- Form components
- Layout components

**Dependencies**:

- `react`
- `tailwindcss`

### 5. Testing Package (`@ibimina/testing`)

**Purpose**: Shared testing utilities and helpers

**Exports**:

```typescript
// packages/testing/src/index.ts
export { createMockUser } from "./mocks";
export { setupTestDb } from "./db";
```

**Key Features**:

- Test fixtures
- Mock factories
- Test utilities
- Database setup helpers

## 🏗️ Infrastructure (`infra/`)

### 1. SMS Gateway (`infra/sms-gateway/`)

**Purpose**: SMS forwarding service

**Structure**:

```
infra/sms-gateway/
├── forwarder/           # SMS forwarding service
│   ├── src/
│   └── package.json
└── docker-compose.yml   # Local development
```

### 2. Metrics (`infra/metrics/`)

**Purpose**: Prometheus and Grafana monitoring setup

**Components**:

- Prometheus configuration
- Grafana dashboards
- Alert rules

### 3. Infrastructure Scripts (`infra/scripts/`)

**Purpose**: Deployment and infrastructure automation scripts

### 4. Other Infrastructure

- `caddy/`: Reverse proxy configuration
- `cloudflared/`: Cloudflare tunnel setup
- `docker/`: Docker configurations
- `terraform/`: Infrastructure as code
- `twa/`: Trusted Web Activity (Android) configuration

## 🗄️ Database and Functions (`supabase/`)

### Migrations (`supabase/migrations/`)

Database schema migrations in chronological order. Each migration file:

- Uses `BEGIN` and `COMMIT` transactions
- Includes rollback instructions (comments)
- Tests RLS policies

**Key Migrations**:

- `20251010220000_seed_admin_user.sql`: Initial admin user
- `20251015000000_client_app.sql`: Client app tables
- `20251110100000_multitenancy.sql`: Multi-tenancy support

### Edge Functions (`supabase/functions/`)

Serverless functions deployed to Supabase Edge Runtime.

**Key Functions**:

- Authentication helpers
- Webhook handlers
- Scheduled jobs
- Background processing

**Environment**:

- Deno runtime
- TypeScript
- Environment variables via Supabase secrets

### Tests (`supabase/tests/`)

Database and RLS policy tests using pgTAP.

## 📄 Scripts (`scripts/`)

Automation and validation scripts:

- `validate-production-readiness.sh`: Pre-deployment validation
- `check-feature-flags.mjs`: Feature flag verification
- `assert-lighthouse.mjs`: Performance budget enforcement

## 🔧 Configuration Files (Root)

### TypeScript Configuration

**`tsconfig.base.json`**: Base TypeScript configuration

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@ibimina/config": ["packages/config/src/index.ts"],
      "@ibimina/core": ["packages/core/src/index.ts"],
      "@ibimina/lib": ["packages/lib/src/index.ts"],
      "@ibimina/testing": ["packages/testing/src/index.ts"],
      "@ibimina/ui": ["packages/ui/src/index.ts"]
    }
  }
}
```

**Service-level `tsconfig.json`**: Extends base config

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Package Management

**`pnpm-workspace.yaml`**: Workspace definition

```yaml
packages:
  - apps/*
  - packages/*
```

**`package.json`**: Root package with workspace scripts

- `pnpm run build`: Build all packages
- `pnpm run test`: Run all tests
- `pnpm run lint`: Lint all code

### Linting and Formatting

- `eslint.config.mjs`: ESLint configuration
- `.prettierrc.json`: Prettier formatting rules
- `.editorconfig`: Editor configuration

### Git and CI/CD

- `.github/workflows/`: GitHub Actions workflows
- `.husky/`: Git hooks for pre-commit checks
- `commitlint.config.mjs`: Commit message linting

## 📊 Dependency Graph

### Build Order

Packages must be built in dependency order:

```
1. @ibimina/core       (no dependencies)
   ↓
2. @ibimina/config     (depends on: core)
   ↓
3. @ibimina/lib        (depends on: core, config)
   ↓
4. @ibimina/ui         (depends on: core)
   ↓
5. @ibimina/testing    (depends on: all above)
   ↓
6. Applications        (depend on: all packages)
   - apps/admin
   - apps/client
   - apps/platform-api
```

### Inter-Package Dependencies

```
apps/admin
  ├── @ibimina/config
  ├── @ibimina/core
  ├── @ibimina/lib
  └── @ibimina/ui

apps/client
  ├── @ibimina/config
  ├── @ibimina/core
  ├── @ibimina/lib
  └── @ibimina/ui

apps/platform-api
  ├── @ibimina/config
  ├── @ibimina/core
  └── @ibimina/lib

@ibimina/lib
  ├── @ibimina/config
  └── @ibimina/core

@ibimina/ui
  └── @ibimina/core

@ibimina/config
  └── @ibimina/core

@ibimina/testing
  ├── @ibimina/config
  ├── @ibimina/core
  ├── @ibimina/lib
  └── @ibimina/ui
```

## 🚀 Build and Deployment Flow

### Development

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared packages
pnpm --filter @ibimina/core run build
pnpm --filter @ibimina/config run build
pnpm --filter @ibimina/lib run build
pnpm --filter @ibimina/ui run build

# 3. Start development server
pnpm --filter @ibimina/admin run dev
```

### Production Build

```bash
# Build all packages in correct order
pnpm -r run build

# This internally runs:
# 1. packages/core build
# 2. packages/config build
# 3. packages/lib build
# 4. packages/ui build
# 5. packages/testing build
# 6. apps/admin build
# 7. apps/client build
# 8. apps/platform-api build
```

### Deployment

1. Build artifacts: `.next/` directories in each app
2. Static assets: `public/` directories
3. Server: Node.js runtime (Next.js server)
4. Database: Supabase (PostgreSQL + Edge Functions)

## 📝 File Naming Conventions

### TypeScript Files

- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `types.ts` or `ComponentName.types.ts`
- Tests: `ComponentName.test.tsx` or `util.test.ts`

### Directories

- Components: `components/`
- Hooks: `hooks/`
- Utilities: `lib/` or `utils/`
- Types: `types/`
- Tests: `tests/` or `__tests__/`

## 🔍 Finding Code

### By Feature

- **Authentication**: `apps/admin/src/app/(auth)/`
- **Dashboard**: `apps/admin/src/app/(dashboard)/`
- **API Routes**: `apps/*/src/app/api/`
- **Components**: `apps/*/src/components/` or `packages/ui/src/components/`

### By Concern

- **Security**: `packages/lib/src/security/`
- **Database**: `supabase/migrations/`
- **Configuration**: `packages/config/src/env.ts`
- **Monitoring**: `infra/metrics/`

## 📊 Statistics

**Monorepo Composition**:

- **3** Applications
- **5** Shared Packages
- **32** Supabase Edge Functions
- **50+** Database Migrations
- **1000+** Dependencies (via pnpm)

**Lines of Code** (approximate):

- TypeScript: ~50,000 lines
- SQL: ~5,000 lines
- Configuration: ~2,000 lines

## 🔗 Related Documentation

- [Ground Rules](GROUND_RULES.md) - Mandatory best practices
- [Quick Reference](QUICK_REFERENCE.md) - Common commands
- [CI Workflows](CI_WORKFLOWS.md) - CI/CD documentation
- [Database Guide](DB_GUIDE.md) - Database procedures

## 🤝 Contributing

When adding new packages or services:

1. Update `pnpm-workspace.yaml` if needed
2. Add TypeScript path mapping to `tsconfig.base.json`
3. Document dependencies in this file
4. Update build order if dependencies change
5. Add to CI/CD workflows if needed

---

**Last Updated**: 2025-10-29  
**Maintainers**: Development Team  
**Questions?** Open an issue or discussion.

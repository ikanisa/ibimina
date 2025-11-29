# Apps Directory Structure

This directory contains the Staff/Admin applications in the Ibimina monorepo.

## Directory Layout

```
apps/
├── pwa/              # Progressive Web Applications
│   └── staff-admin/  # Staff/admin console PWA
└── desktop/          # Desktop Applications
    └── staff-admin/  # Staff/admin desktop app (Tauri)
```

## Applications

### PWA (Progressive Web Applications)

Located in `apps/pwa/`:

#### Staff Admin (`apps/pwa/staff-admin`)

- **Package**: `@ibimina/staff-admin-pwa`
- **Purpose**: Staff console for SACCO management
- **Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Features**: Admin dashboard, group management, member management,
  reconciliation
- **Mobile Build**: Android APK/AAB via Capacitor
- **Port**: 3100 (dev)

### Desktop Applications

Located in `apps/desktop/`:

#### Staff Admin Desktop (`apps/desktop/staff-admin`)

- **Package**: `@ibimina/staff-admin-desktop`
- **Purpose**: Desktop version of staff console for offline workflows
- **Tech Stack**: Tauri, Vite, React, TypeScript
- **Features**: Full admin capabilities with native desktop integration
- **Platforms**: Windows, macOS, Linux

## Development Commands

### Start Development Server

```bash
# Staff admin PWA
pnpm --filter @ibimina/staff-admin-pwa dev

# Staff admin Desktop
pnpm --filter @ibimina/staff-admin-desktop dev

# Or use shortcuts
pnpm dev              # Runs staff-admin-pwa
pnpm dev:desktop      # Runs desktop app
```

### Build Applications

```bash
# Build all PWAs
pnpm --filter './apps/pwa/*' build

# Build specific app
pnpm --filter @ibimina/staff-admin-pwa build
pnpm --filter @ibimina/staff-admin-desktop build

# Or use shortcuts
pnpm build:admin      # Builds staff-admin-pwa
pnpm build:desktop    # Builds desktop app
```

### Mobile Builds (Staff Admin PWA)

```bash
# Android (from PWA app)
cd apps/pwa/staff-admin && npx cap sync android
cd android && ./gradlew assembleRelease
```

## Dependencies Between Apps

```
apps/pwa/staff-admin        apps/desktop/staff-admin
      ↓                            ↓
   packages/ui              packages/admin-core
      ↓                            ↓
   packages/lib             packages/ui
      ↓                            ↓
   packages/config          packages/lib
      ↓
   packages/locales
```

## Testing

Each application has its own test suites:

```bash
# Unit tests
pnpm --filter @ibimina/staff-admin-pwa test:unit

# E2E tests
pnpm --filter @ibimina/staff-admin-pwa test:e2e

# Integration tests
pnpm --filter @ibimina/staff-admin-pwa test:auth
```

## Environment Variables

See the main README.md for environment variable configuration. Both apps share
the same Supabase backend configuration.

## Deployment

### Staff Admin PWA

- **Platform**: Vercel / Cloudflare Pages / Docker
- **Target**: `apps/pwa/staff-admin`
- **Build Command**: `pnpm build:admin`
- **Output**: `.next` (standalone)

### Staff Admin Desktop

- **Platforms**: Windows, macOS, Linux
- **Build**: Tauri bundler
- **Distribution**: Direct download / enterprise deployment

## Related Documentation

- [PWA README](./pwa/README.md) - PWA applications details
- [Packages README](../packages/README.md) - Shared packages

---

**Last Updated**: 2025-11-29
**Maintainers**: Development Team

# Apps Directory Structure

This directory contains all applications in the Ibimina monorepo.

## Directory Layout

```
apps/
├── pwa/              # Progressive Web Applications
│   ├── staff-admin/  # Staff/admin console PWA
│   └── client/       # Client-facing PWA
├── mobile/           # Native mobile applications (future)
└── website/          # Marketing website
```

## Applications

### PWA (Progressive Web Applications)

Located in `apps/pwa/`:

#### Staff Admin (`apps/pwa/staff-admin`)
- **Package**: `@ibimina/staff-admin-pwa`
- **Purpose**: Staff console for SACCO management
- **Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Features**: Admin dashboard, group management, member management, reconciliation
- **Mobile Build**: Android APK/AAB via Capacitor
- **Port**: 3100 (dev)

#### Client (`apps/pwa/client`)
- **Package**: `@ibimina/client`
- **Purpose**: Client-facing app for members and group leaders
- **Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Features**: Group savings, payment references, statements, AI chat
- **Mobile Build**: Android/iOS via Capacitor
- **Port**: 5000 (dev)

### Mobile (Native Applications)

Located in `apps/mobile/`:

Currently, this directory is a placeholder for future native mobile applications. Current mobile apps are built from PWA applications using Capacitor.

When native apps are added:
- React Native applications
- Flutter applications (if needed)
- Platform-specific implementations

### Website (Marketing)

Located in `apps/website/`:

- **Package**: `@ibimina/website`
- **Purpose**: Public-facing marketing website
- **Tech Stack**: Next.js 15 (static export)
- **Features**: Product information, documentation, contact
- **Port**: 5000 (dev)

## Development Commands

### Start Development Server

```bash
# Staff admin PWA
pnpm --filter @ibimina/staff-admin-pwa dev

# Client PWA
pnpm --filter @ibimina/client dev

# Website
pnpm --filter @ibimina/website dev

# Or use shortcuts
pnpm dev              # Runs staff-admin-pwa
pnpm dev:client       # Runs client
pnpm dev:website      # Runs website
```

### Build Applications

```bash
# Build all PWAs
pnpm --filter './apps/pwa/*' build

# Build specific app
pnpm --filter @ibimina/staff-admin-pwa build
pnpm --filter @ibimina/client build
pnpm --filter @ibimina/website build

# Or use shortcuts
pnpm build:admin      # Builds staff-admin-pwa
pnpm build:client     # Builds client
```

### Mobile Builds

```bash
# Android (from PWA apps)
cd apps/pwa/staff-admin && ./gradlew assembleRelease
cd apps/pwa/client && ./gradlew assembleRelease

# iOS (from PWA apps)
cd apps/pwa/staff-admin/ios && xcodebuild ...
cd apps/pwa/client/ios && xcodebuild ...
```

## Architecture Decisions

### Why PWA + Capacitor?

1. **Code Reuse**: Single codebase for web and mobile
2. **Web-First**: Progressive enhancement from web to mobile
3. **Offline Support**: Service workers + Capacitor native features
4. **Fast Iteration**: Hot reload, web debugging tools
5. **Cost Effective**: Smaller team, single stack

### When to Use Native Mobile?

Consider moving to `apps/mobile/` with React Native when:
- Performance requirements exceed PWA capabilities
- Need deep native platform integrations
- App store restrictions require native builds
- User experience demands native feel

### Separation of Staff and Client

- **Staff Admin**: Internal tool, desktop-first, admin workflows
- **Client**: Public-facing, mobile-first, member experience
- Different users, different needs, different UX patterns

## Dependencies Between Apps

```
apps/pwa/staff-admin     apps/pwa/client     apps/website
      ↓                        ↓                  ↓
   packages/ui           packages/ui         (minimal deps)
      ↓                        ↓
   packages/lib           packages/lib
      ↓                        ↓
   packages/config       packages/config
      ↓                        ↓
   packages/locales      packages/locales
```

## Testing

Each application has its own test suites:

```bash
# Unit tests
pnpm --filter @ibimina/staff-admin-pwa test:unit
pnpm --filter @ibimina/client test:unit

# E2E tests
pnpm --filter @ibimina/staff-admin-pwa test:e2e
pnpm --filter @ibimina/client test:e2e

# Integration tests
pnpm --filter @ibimina/staff-admin-pwa test:auth
```

## Environment Variables

Each app requires its own environment variables. See:
- `apps/pwa/staff-admin/.env.example`
- `apps/pwa/client/.env.example`
- `apps/website/.env.example`

Common variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

## Deployment

### Staff Admin PWA
- **Platform**: Vercel / Cloudflare Pages
- **Target**: `apps/pwa/staff-admin`
- **Build Command**: `pnpm build:admin`
- **Output**: `.next` (standalone)

### Client PWA
- **Platform**: Vercel / Cloudflare Pages
- **Target**: `apps/pwa/client`
- **Build Command**: `pnpm build:client`
- **Output**: `.next` (standalone)

### Website
- **Platform**: Vercel / Netlify / GitHub Pages
- **Target**: `apps/website`
- **Build Command**: `pnpm --filter @ibimina/website build`
- **Output**: `out` (static export)

### Mobile Apps
- **Staff Admin Android**: Google Play Store (internal)
- **Client Android**: Google Play Store (public)
- **Client iOS**: App Store (public)

## Related Documentation

- [PWA README](./pwa/README.md) - PWA applications details
- [Mobile README](./mobile/README.md) - Mobile apps placeholder
- [Packages README](../packages/README.md) - Shared packages
- [REFACTORING_SUMMARY.md](../REFACTORING_SUMMARY.md) - Recent structure changes

---

**Last Updated**: 2025-11-11  
**Maintainers**: Development Team

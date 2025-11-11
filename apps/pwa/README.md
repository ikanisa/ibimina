# PWA Applications

This directory contains Progressive Web Applications (PWAs) for the Ibimina platform.

## Applications

- **staff-admin**: Staff/admin console PWA for SACCO management
- **client**: Client-facing PWA for members and group leaders

## Structure

Each PWA application is a standalone Next.js application with:
- PWA capabilities (offline-first, installable)
- Responsive design for mobile and desktop
- Integration with Supabase backend
- Capacitor for native mobile builds (Android/iOS)

## Development

To develop a specific PWA:

```bash
# Staff admin PWA
pnpm --filter @ibimina/staff-admin-pwa dev

# Client PWA
pnpm --filter @ibimina/client dev
```

## Building

```bash
# Build all PWAs
pnpm --filter './apps/pwa/*' build

# Build specific PWA
pnpm --filter @ibimina/staff-admin-pwa build
```

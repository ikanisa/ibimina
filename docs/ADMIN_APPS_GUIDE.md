# Staff Admin Apps Guide

This document clarifies the staff/admin applications in the monorepo.

## Overview

There are **two** staff/admin applications in the repository:

| App                  | Location                     | Tech            | Port | Status            | Purpose                                  |
| -------------------- | ---------------------------- | --------------- | ---- | ----------------- | ---------------------------------------- |
| **Staff Admin PWA**  | `apps/pwa/staff-admin/`      | Next.js 15      | 3100 | ✅ **PRODUCTION** | Main staff console for SACCO management  |
| Staff Admin Desktop  | `apps/desktop/staff-admin/`  | Tauri + React   | N/A  | ✅ **PRODUCTION** | Offline-capable desktop application      |

## For Development: Use Staff Admin PWA

The **`apps/pwa/staff-admin/`** app is the **main production staff console**. This is what
you should use for:

- Production deployments
- Development work
- Testing
- Documentation references

**Start it with:**

```bash
# From repository root
pnpm dev

# Or explicitly
pnpm --filter @ibimina/staff-admin-pwa dev
```

**Access at:** http://localhost:3100

### Features of Staff Admin PWA:

- ✅ Next.js 15 with App Router
- ✅ Full Supabase integration
- ✅ TapMoMo NFC payment system
- ✅ SMS reconciliation
- ✅ Device authentication with passkeys
- ✅ PWA with offline support
- ✅ Android build via Capacitor

## For Desktop: Use Staff Admin Desktop

The **`apps/desktop/staff-admin/`** app is a **Tauri-based desktop application**
for offline-capable workflows.

**Start it with:**

```bash
pnpm dev:desktop
```

### Features of Staff Admin Desktop:

- ✅ Native desktop application (Windows, macOS, Linux)
- ✅ Offline-first architecture
- ✅ Native file system access
- ✅ Secure local storage

## Quick Reference

```bash
# Start Staff Admin PWA
pnpm dev                                    # Port 3100

# Start Staff Admin Desktop
pnpm dev:desktop                            # Native window

# Build Staff Admin PWA
pnpm build:admin

# Build Staff Admin Desktop
pnpm build:desktop
```

## Shared Packages

Both apps depend on shared packages:

- `@ibimina/ui` - Shared React components
- `@ibimina/lib` - Shared utilities
- `@ibimina/config` - Environment configuration
- `@ibimina/flags` - Feature flags
- `@ibimina/locales` - i18n translations
- `@ibimina/supabase-schemas` - Database types
- `@ibimina/admin-core` - Admin core business logic

## Related Documentation

- [Development Guide](../DEVELOPMENT.md)
- [README](../README.md)
- [Architecture](../ARCHITECTURE.md)

## Questions?

If you're unsure which app to use for development, **default to Staff Admin PWA
(`apps/pwa/staff-admin/`)** - it's the primary production application.

For desktop workflows requiring offline capabilities, use the Staff Admin
Desktop (`apps/desktop/staff-admin/`).

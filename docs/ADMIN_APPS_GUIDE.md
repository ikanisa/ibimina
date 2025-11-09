# Admin/Staff Apps Guide

This document clarifies the different admin/staff applications in the monorepo
and when to use each.

## Overview

There are **three** staff/admin applications in the repository:

| App             | Location                | Tech         | Port                | Status            | Purpose                                 |
| --------------- | ----------------------- | ------------ | ------------------- | ----------------- | --------------------------------------- |
| **Admin PWA**   | `apps/admin/`           | Next.js 15   | 3100                | ✅ **PRODUCTION** | Main staff console for SACCO management |
| Staff App       | `apps/staff/`           | Next.js 16   | 5300                | 🟡 Alternative    | Secondary staff interface               |
| Staff Admin PWA | `apps/staff-admin-pwa/` | Vite + React | 5173 (configurable) | 🔵 Prototype      | Vite-based alternative/prototype        |

## Which App Should I Use?

### For Production: Use `apps/admin/` ✅

The **`apps/admin/`** app is the **main production staff console**. This is what
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
pnpm dev:admin

# Or from the app directory
cd apps/admin && pnpm dev
```

**Access at:** http://localhost:3100

### Features of `apps/admin/`:

- ✅ Next.js 15 with App Router
- ✅ Full Supabase integration
- ✅ TapMoMo NFC payment system
- ✅ SMS reconciliation
- ✅ Device authentication with passkeys
- ✅ PWA with offline support
- ✅ Android mobile app via Capacitor
- ✅ Comprehensive test suite

### Other Apps

#### `apps/staff/` - Alternative Staff App

- Next.js 16 based staff interface
- Runs on port 5300
- May be for specific use cases or under development
- **Start:** `pnpm dev:staff`

#### `apps/staff-admin-pwa/` - Vite Prototype

- Vite + React 18 + Material UI
- **Default dev port:** 5173 (configurable via `vite.config.ts`)
- Appears to be a prototype or alternative implementation
- **Start:** `pnpm dev:staff-admin-pwa`

⚠️ **Port Coordination:** `apps/admin/` now uses port 3100 by default. Ensure
`apps/staff-admin-pwa/` runs on a different port (its Vite default is 5173) or
override via `PORT=xxxx pnpm dev:staff-admin-pwa` when needed.

## Port Configuration Summary

| Command                    | App                     | Port                |
| -------------------------- | ----------------------- | ------------------- |
| `pnpm dev`                 | `apps/admin/`           | 3100                |
| `pnpm dev:admin`           | `apps/admin/`           | 3100                |
| `pnpm dev:staff`           | `apps/staff/`           | 5300                |
| `pnpm dev:staff-admin-pwa` | `apps/staff-admin-pwa/` | 5173 (configurable) |

## Development Workflow

### Standard Development

```bash
# Clone and install
git clone <repository-url>
cd ibimina
pnpm install --frozen-lockfile

# Start main admin app (production)
pnpm dev

# Visit http://localhost:3100
```

### Testing Staff Admin PWA

```bash
# Make sure apps/admin is NOT running on the same port
# (staff-admin-pwa uses the Vite port in vite.config.ts)

# Start Vite-based app
pnpm dev:staff-admin-pwa

# Visit the port defined in apps/staff-admin-pwa/vite.config.ts (default http://localhost:5173)
```

### Testing Alternative Staff App

```bash
# Can run alongside apps/admin (different port)
pnpm dev:staff

# Visit http://localhost:5300
```

## Recommendations

### Short Term

1. **Use `apps/admin/` for all production work** ✅
2. Avoid running `apps/staff-admin-pwa/` unless specifically testing it
3. Document the purpose/status of `apps/staff/` if unclear

### Long Term Considerations

1. **Consolidate or Archive:** Consider whether `apps/staff-admin-pwa/` should
   be:
   - Merged into `apps/admin/` if it has unique features
   - Archived/removed if it's an old prototype
   - Changed to a different port (e.g., 3001) to avoid conflicts

2. **Clarify `apps/staff/`:** Document the specific use case for this app or
   consolidate with `apps/admin/`

3. **Single Source of Truth:** Having multiple admin apps can lead to:
   - Confusion about which to use
   - Duplicate maintenance effort
   - Inconsistent features across apps

## Related Documentation

- [Development Guide](../DEVELOPMENT.md)
- [Quick Start](../QUICK-START.md)
- [Apps Setup Guide](../APPS_SETUP_GUIDE.md)
- [Android Build Guide](../apps/admin/ANDROID_BUILD_GUIDE.md)

## Questions?

If you're unsure which app to use, **default to `apps/admin/`** - it's the
production application with full feature parity.

For specific questions about app architecture or consolidation plans, please
refer to the project maintainers or architectural decision records (ADRs).

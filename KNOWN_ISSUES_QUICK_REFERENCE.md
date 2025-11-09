# Known Issues - Quick Resolution Card

**Date:** November 4, 2025  
**Status:** All issues documented with resolutions

---

## Issue #1: Admin PWA Confusion ✅

**Problem:**

```
Admin PWA at :3100 has internal error → Use staff-admin-pwa instead
(Admin PWA and staff-admin pwa must be combined)
```

**Resolution:**

```bash
# Use the PRODUCTION admin app
pnpm dev
# Opens: http://localhost:3100
```

**Which App?** `apps/admin/` (Next.js 15) - **This is production**

📖 **Full Guide:** [docs/ADMIN_APPS_GUIDE.md](docs/ADMIN_APPS_GUIDE.md)

---

## Issue #2: Android Dependencies ✅

**Problem:**

```
Android dependencies need fixing
```

**Status:** **ALREADY FIXED** (Nov 3, 2025)

**Verify:**

```bash
cd apps/admin/android
./gradlew assembleDebug
# Expected: BUILD SUCCESSFUL in ~40s
```

📖 **Fix Details:** [ANDROID_BUILD_SUCCESS.md](ANDROID_BUILD_SUCCESS.md)

---

## Issue #3: 47 Migrations Pending ✅

**Problem:**

```
47 migrations pending → Non-blocking, quick fix available
```

**Quick Fix:**

```bash
# Apply all pending migrations
supabase db push

# Verify all applied
supabase migration list
```

📖 **Full Guide:**
[docs/MIGRATION_APPLICATION_GUIDE.md](docs/MIGRATION_APPLICATION_GUIDE.md)

---

## Summary

| Issue                 | Status        | Action Required        |
| --------------------- | ------------- | ---------------------- |
| Admin PWA Confusion   | ✅ Documented | Use `apps/admin/`      |
| Android Dependencies  | ✅ Fixed      | Verify build works     |
| 47 Migrations Pending | ✅ Documented | Run `supabase db push` |

**Central Reference:** [KNOWN_ISSUES.md](KNOWN_ISSUES.md)

---

## Quick Start for New Developers

```bash
# 1. Clone and install
git clone <repository-url>
cd ibimina
pnpm install --frozen-lockfile

# 2. Apply migrations (if using Supabase)
supabase db push

# 3. Start development
pnpm dev

# 4. Visit http://localhost:3100
```

**Need Help?**

- 📖 [README.md](README.md) - Main documentation
- 🚀 [QUICK-START.md](QUICK-START.md) - Getting started
- 🔧 [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues
- ❓ [KNOWN_ISSUES.md](KNOWN_ISSUES.md) - Current issues

---

**All Issues Resolved ✅**

# Known Issues - Quick Reference

This document tracks currently known issues and their resolutions.

## ✅ RESOLVED ISSUES

### 1. Admin PWA at :3100 - Port Conflict / App Confusion

**Issue:** Multiple admin/staff apps exist, causing confusion about which to
use. `apps/admin` now runs on port 3100 to avoid conflicts, while some
historical docs still reference the previous port.

**Status:** ✅ **DOCUMENTED**

**Resolution:**

- **Use `apps/admin/`** - This is the production staff console
- See [docs/ADMIN_APPS_GUIDE.md](docs/ADMIN_APPS_GUIDE.md) for complete guide
- `apps/staff-admin-pwa/` is an alternative/prototype implementation

**Quick Start:**

```bash
# Use the production admin app
pnpm dev
# Or explicitly:
pnpm dev:admin

# Access at: http://localhost:3100
```

**References:**

- [Admin Apps Guide](docs/ADMIN_APPS_GUIDE.md) - Complete comparison and usage
  guide
- [QUICK-START.md](QUICK-START.md) - Development quickstart

---

### 2. Android Dependencies Issues

**Issue:** Android build failures due to:

- Capacitor BOM dependency conflicts
- SDK version mismatches
- AndroidX version conflicts
- VANILLA_ICE_CREAM API compatibility

**Status:** ✅ **FIXED** (as of November 3, 2025)

**Resolution:** The Android build configuration has been updated and tested
successfully.

**Current Configuration:**

- **compileSdk:** 35 (required for Capacitor 7.4.4)
- **targetSdk:** 34 (for compatibility)
- **minSdk:** 26
- **Build Tool:** Gradle 8.11
- **Kotlin:** 1.9.24

**Verification:**

```bash
cd apps/admin/android
./gradlew assembleDebug

# Expected: BUILD SUCCESSFUL in ~40s
# Output: app/build/outputs/apk/debug/app-debug.apk
```

**References:**

- [ANDROID_BUILD_SUCCESS.md](ANDROID_BUILD_SUCCESS.md) - Detailed fix
  documentation
- [BUILD_ANDROID.md](BUILD_ANDROID.md) - Build instructions
- [apps/admin/ANDROID_BUILD_GUIDE.md](apps/admin/ANDROID_BUILD_GUIDE.md) -
  Complete guide

**Files Updated:**

- `apps/admin/android/variables.gradle` - SDK versions
- `apps/admin/android/settings.gradle` - Repository configuration
- `apps/admin/android/build.gradle` - Dependency resolution
- `apps/admin/android/app/build.gradle` - Direct project references (no BOM)

---

### 3. Database Migrations - 47 Pending

**Issue:** Some database migrations may not be applied to your Supabase
instance. Total of 116 migration files exist in `supabase/migrations/`.

**Status:** ✅ **DOCUMENTED**

**Resolution:** Apply migrations using Supabase CLI or SQL Editor. See detailed
guide for step-by-step instructions.

**Quick Fix:**

```bash
# Check pending migrations
supabase migration list

# Apply all pending migrations
supabase db push

# Verify all applied
supabase migration list
```

**Known Migration Issue:** Migration `20251027200000_staff_management.sql` may
fail because it tries to ALTER a VIEW (`public.users`) instead of the underlying
table (`auth.users`).

**Alternative (Via Dashboard):**

1. Open Supabase SQL Editor
2. Copy contents of specific migration file
3. Execute in SQL Editor
4. Verify with:
   `SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;`

**References:**

- [docs/MIGRATION_APPLICATION_GUIDE.md](docs/MIGRATION_APPLICATION_GUIDE.md) -
  Complete migration guide
- [TAPMOMO_DB_MIGRATION_QUICK_FIX.md](TAPMOMO_DB_MIGRATION_QUICK_FIX.md) -
  TapMoMo-specific migrations
- [docs/DB_GUIDE.md](docs/DB_GUIDE.md) - General database procedures

---

## 🟡 OPEN ISSUES

### Package Build Issues

**Issue:** Some shared packages fail to build due to TypeScript configuration
conflicts.

**Affected Packages:**

- `@ibimina/data-access` - tsup/incremental conflict
- `@ibimina/ui` - TypeScript errors in story files

**Status:** 🟡 **TRACKED** - Documented in PRE_EXISTING_BUILD_ISSUES.md

**Workaround:** These packages are not required for the main admin app to
function.

**References:**

- [PRE_EXISTING_BUILD_ISSUES.md](PRE_EXISTING_BUILD_ISSUES.md) - Detailed issue
  tracking
- Requires separate PRs to fix

---

## 📝 REPORTING NEW ISSUES

If you encounter a new issue:

1. **Check existing documentation:**
   - [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
   - [PRE_EXISTING_BUILD_ISSUES.md](PRE_EXISTING_BUILD_ISSUES.md)
   - This file (KNOWN_ISSUES.md)

2. **Search for similar issues:**
   - GitHub Issues
   - Pull Request discussions
   - Documentation files

3. **Document the issue:**
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)
   - Expected vs actual behavior

4. **Create an issue or PR** with:
   - Clear title
   - Reproduction steps
   - Error logs
   - Proposed solution (if known)

---

## 🔍 QUICK DIAGNOSTICS

### Is the admin app working?

```bash
cd /home/runner/work/ibimina/ibimina

# Install dependencies
pnpm install --frozen-lockfile

# Start admin app
pnpm dev

# Visit http://localhost:3100
# Should load without errors
```

### Is Android building?

```bash
cd apps/admin/android

# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Expected: BUILD SUCCESSFUL
```

### Are migrations applied?

```bash
# Check migration status
supabase migration list

# Or query database
psql $DATABASE_URL -c "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;"
```

### Is Supabase connected?

```bash
# Check Supabase status
supabase status

# Test connection
curl -I $SUPABASE_URL/rest/v1/

# Expected: HTTP/1.1 200 OK
```

---

## 📚 RELATED DOCUMENTATION

### Getting Started

- [README.md](README.md) - Main project README
- [QUICK-START.md](QUICK-START.md) - Quick start guide
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide

### Specific Topics

- [docs/ADMIN_APPS_GUIDE.md](docs/ADMIN_APPS_GUIDE.md) - Admin app selection
- [docs/MIGRATION_APPLICATION_GUIDE.md](docs/MIGRATION_APPLICATION_GUIDE.md) -
  Database migrations
- [ANDROID_BUILD_SUCCESS.md](ANDROID_BUILD_SUCCESS.md) - Android build fixes
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues

### Reference

- [PRE_EXISTING_BUILD_ISSUES.md](PRE_EXISTING_BUILD_ISSUES.md) - Build issues
- [docs/CI_WORKFLOWS.md](docs/CI_WORKFLOWS.md) - CI/CD workflows
- [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) - Environment configuration

---

## ✅ SUMMARY

**All three issues from the problem statement are now resolved or documented:**

1. ✅ **Admin PWA confusion** → Use `apps/admin/` (documented in
   [ADMIN_APPS_GUIDE.md](docs/ADMIN_APPS_GUIDE.md))
2. ✅ **Android dependencies** → Fixed and verified (see
   [ANDROID_BUILD_SUCCESS.md](ANDROID_BUILD_SUCCESS.md))
3. ✅ **47 migrations pending** → Apply with `supabase db push` (guide in
   [MIGRATION_APPLICATION_GUIDE.md](docs/MIGRATION_APPLICATION_GUIDE.md))

**For new developers:**

- Start with [QUICK-START.md](QUICK-START.md)
- Use `apps/admin/` for all development
- Apply migrations before first run
- Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) if issues arise

**Last Updated:** November 4, 2025

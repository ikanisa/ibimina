# KEEPLIST - Intentionally Preserved Items

**Date**: 2025-11-05  
**Branch**: refactor/ibimina-deep-clean  
**Purpose**: Document why certain items were kept despite low/no static references

---

## 🏗️ ACTIVE APPS (Kept)

### apps/admin
**Status**: ✅ **PRODUCTION - KEEP**  
**Evidence**: 
- 1,507 modified files (most active)
- Version 0.1.2 (highest version)
- Has .next build output (Next.js)
- Has Android build configured
- 69 pages, 121 components
- Main staff/admin console

**Dependencies**: 44 prod, 14 dev

### apps/client
**Status**: ✅ **PRODUCTION - KEEP**  
**Evidence**:
- 359 modified files
- Version 0.1.0
- Has .next build output
- Has Android + iOS configured (Capacitor)
- Client-facing PWA and mobile apps
- Active development

**Dependencies**: 44 prod, 17 dev

### apps/website
**Status**: ✅ **ACTIVE - KEEP**  
**Evidence**:
- 114 modified files
- Version 0.1.0
- Has .next build output
- Marketing/landing site
- Public-facing

**Dependencies**: Not analyzed (assumed needed)

---

## 📦 ACTIVE PACKAGES (Kept)

### @ibimina/ui
**Imports**: 67 (most used!)  
**Used by**: apps/admin (36), apps/client (29), apps/website (2)  
**Status**: ✅ **CORE - KEEP**  
**Reason**: Shared UI component library

### @ibimina/lib
**Imports**: 22  
**Used by**: apps/admin (10), apps/client (10), apps/website (2)  
**Status**: ✅ **CORE - KEEP**  
**Reason**: Shared utility functions

### @ibimina/config
**Imports**: 13  
**Used by**: apps/admin (6), apps/client (3), apps/website (4)  
**Status**: ✅ **CORE - KEEP**  
**Reason**: Configuration management

### @ibimina/locales
**Imports**: 11  
**Used by**: apps/admin (3), apps/client (4), apps/website (4)  
**Status**: ✅ **CORE - KEEP**  
**Reason**: i18n translations (English/Kinyarwanda)

### @ibimina/data-access
**Imports**: 5  
**Used by**: apps/client (5)  
**Status**: ✅ **KEEP**  
**Reason**: Data access layer

### @ibimina/flags
**Imports**: 4  
**Used by**: apps/admin (4)  
**Status**: ✅ **KEEP**  
**Reason**: Feature flags

### @ibimina/ai-agent
**Imports**: 2  
**Used by**: apps/admin (2)  
**Status**: ✅ **KEEP**  
**Reason**: AI assistant integration (used, not @ibimina/agent)

### @ibimina/tapmomo-proto
**Imports**: 0 (static analysis)  
**Status**: ✅ **KEEP - CONVENTION-BASED**  
**Reason**: 
- Used by Android/iOS NFC implementations
- Kotlin/Swift protobuf definitions
- May be loaded via platform-specific code
- Critical for TapMoMo NFC payments

---

## 🗄️ ARCHIVED ITEMS (Moved to archive/)

### Apps Archived (9 total)

**Rationale**: Duplicates of active apps or experimental/stub code

1. **archive/apps/client-mobile** (1.6M)
   - Duplicate of apps/client
   - React Native variant (apps/client uses Capacitor)
   - 119 modified files vs 359 in apps/client
   - Less active

2. **archive/apps/mobile** (564K)
   - Another mobile variant (Expo)
   - 110 modified files
   - Only Android build
   - Superseded by apps/client

3. **archive/apps/sacco-plus-client** (436K)
   - Minimal activity (15 files)
   - No build outputs
   - Version 1.0.0 suggests old/abandoned

4. **archive/apps/staff** (108K)
   - Duplicate of apps/admin
   - 21 modified files vs 1,507 in apps/admin
   - No build outputs
   - Superseded

5. **archive/apps/staff-admin-pwa** (1.2M)
   - Another admin variant (Capacitor PWA)
   - 110 modified files
   - No build outputs
   - apps/admin already has Android builds

6. **archive/apps/android-auth** (72K)
   - Experimental auth module
   - 17 modified files
   - No builds
   - Functionality likely integrated into apps/admin/android

7. **archive/apps/ios** (136K)
   - Platform-specific stub
   - 28 modified files
   - No builds
   - iOS support now in apps/client/ios

8. **archive/apps/staff-mobile-android** (64K)
   - 11 modified files
   - No builds
   - Superseded by apps/admin/android

9. **archive/apps/platform-api** (268K)
   - Version 0.0.0 (stub)
   - 33 modified files
   - No builds
   - Future/planned feature, not implemented

**Total Archived**: ~4.5MB source code

### Packages Archived (9 total)

**Rationale**: 0 imports in active apps (admin, client, website)

1. **archive/packages/agent** (312K)
   - 0 imports
   - Superseded by @ibimina/ai-agent (which has 2 imports)
   - 4 TS files vs 20 in ai-agent

2. **archive/packages/api** (80K)
   - 0 imports
   - Potentially duplicate of api-client
   - 4 TS files

3. **archive/packages/api-client** (60K)
   - 0 imports
   - Not used by any active app
   - 4 TS files

4. **archive/packages/core** (116K)
   - 0 imports
   - Likely never completed
   - Functionality moved to @ibimina/lib

5. **archive/packages/providers** (184K)
   - 0 imports
   - React context providers now co-located

6. **archive/packages/sms-parser** (52K)
   - 0 imports in apps
   - May be used in Supabase Edge Functions (check later)
   - Archiving for now (safe to restore)

7. **archive/packages/testing** (80K)
   - 0 imports
   - Test utilities not centralized
   - Tests use per-app utilities

8. **archive/packages/types** (72K)
   - 0 imports
   - Types now co-located with implementations
   - Modern TS approach

9. **archive/packages/eslint-plugin-ibimina** (16K)
   - 0 imports
   - Custom ESLint rules not used
   - Standard ESLint config sufficient

**Total Archived**: ~972K

---

## 🔒 SUPABASE ARTIFACTS (Kept All)

**Location**: `supabase/`

**Status**: ✅ **ALL KEPT - NO CHANGES**

**Reason**: 
- Migrations must remain sequential
- RLS policies may be referenced dynamically
- Edge Functions may use archived packages (sms-parser)
- Too risky to modify without deep Supabase knowledge
- Require separate audit with database access

**Files**:
- `supabase/migrations/*.sql` - All kept
- `supabase/functions/*` - All kept
- `supabase/config.toml` - Kept
- `supabase/seed.sql` - Kept

---

## 📝 NEXT.JS CONVENTION FILES (Kept All)

**Locations**: 
- `apps/admin/app/**/*.tsx`
- `apps/client/**/*.tsx`
- `apps/website/app/**/*.tsx`

**Status**: ✅ **ALL KEPT - NO CHANGES**

**Convention Files**:
- `page.tsx`, `page.ts` - Route pages
- `layout.tsx` - Layouts
- `route.ts` - API routes
- `loading.tsx` - Loading states
- `error.tsx` - Error boundaries
- `not-found.tsx` - 404 pages
- `middleware.ts` - Middleware

**Reason**: 
- Next.js App Router requires these naming conventions
- May be loaded dynamically
- Required for routing to work
- Too risky to remove without runtime testing

---

## 🎨 ASSETS (Kept All)

**Status**: ✅ **ALL KEPT - NO CHANGES IN THIS PASS**

**Locations**:
- `apps/*/public/**/*`
- `apps/*/assets/**/*`
- `packages/ui/assets/**/*`

**Reason**:
- Asset analysis requires more time
- May be referenced via dynamic paths
- May be used in archived apps (preserve for potential restoration)
- Low priority (total size manageable)

**Follow-up**: Run dedicated asset cleanup later

---

## ⚙️ CONFIGURATION FILES (Kept)

**Status**: ✅ **ALL KEPT - MINIMAL CHANGES**

**Rationale**: Configuration affects builds, may break CI

**Kept**:
- Root: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`
- Per-app: `tsconfig.json`, `next.config.ts`, etc.
- Build configs: `.eslintrc`, `.prettierrc`, `tailwind.config.ts`

**Modified**:
- None (changes would require testing)

---

## 🚫 NEVER DELETE (Guidelines)

These items must NEVER be deleted without explicit verification:

1. **Next.js Convention Files**: page.tsx, layout.tsx, route.ts, etc.
2. **Supabase Artifacts**: Migrations, functions, RLS policies
3. **@ibimina/* Packages with imports**: Even 1 import = keep
4. **Build Output Directories**: .next, dist, build (in .gitignore anyway)
5. **node_modules**: Managed by pnpm
6. **Environment Files**: .env.* (in .gitignore, user-specific)
7. **Git Files**: .git/, .gitignore, .gitattributes
8. **CI/CD**: .github/workflows/*

---

## 📊 ARCHIVE RESTORATION INSTRUCTIONS

If any archived item is needed:

```bash
# Restore an app
git mv archive/apps/<app-name> apps/<app-name>

# Restore a package
git mv archive/packages/<package-name> packages/<package-name>

# Then update pnpm-workspace.yaml if needed
# Then run: pnpm install
```

**Expiry Policy**: 
- Review archived items in 6 months (2025-05-05)
- If still unused, consider permanent deletion
- Document decision in commit message

---

## 📈 IMPACT SUMMARY

**Before Cleanup**:
- Apps: 12 (including duplicates)
- Packages: 18 (including unused)
- Total workspaces: ~26

**After Cleanup**:
- Apps: 3 (admin, client, website)
- Packages: 8 (actively used)
- Archived: 18 (9 apps + 9 packages)
- Total active workspaces: ~12

**Reduction**: ~50% of workspaces moved to archive

**Estimated Savings**: 
- ~5MB source code
- Faster builds (fewer workspaces)
- Clearer codebase structure
- Easier maintenance

---

**Last Updated**: 2025-11-05  
**Review Date**: 2025-05-05 (6 months)

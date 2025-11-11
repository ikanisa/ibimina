# Directory Structure Refactoring Summary

## Overview

This document summarizes the monorepo directory structure refactoring completed on 2025-11-11.

## Changes Made

### 1. Directory Structure

**Before:**
```
apps/
├── admin/              # Staff/admin PWA
├── client/             # Client PWA
└── website/            # Marketing website
```

**After:**
```
apps/
├── pwa/
│   ├── staff-admin/   # Staff/admin PWA (renamed from admin)
│   └── client/         # Client PWA
├── mobile/             # Placeholder for future native mobile apps
└── website/            # Marketing website (unchanged)
```

### 2. Package Names

- `@ibimina/admin` → `@ibimina/staff-admin-pwa`
- `@ibimina/client` → unchanged (still `@ibimina/client`)

### 3. Files Updated

#### Configuration Files
- `pnpm-workspace.yaml` - Updated workspace paths to include `apps/pwa/*` and `apps/mobile/*`
- Root `package.json` - Updated all scripts to reference new package names and paths
- `apps/pwa/staff-admin/package.json` - Changed package name to `@ibimina/staff-admin-pwa`
- `apps/pwa/staff-admin/tsconfig.json` - Updated path mappings (added `../` prefix)
- `apps/pwa/staff-admin/next.config.mjs` - Updated `outputFileTracingRoot` path
- `apps/pwa/client/tsconfig.json` - Updated path mappings (added `../` prefix)
- `apps/pwa/client/next.config.mjs` - Updated `outputFileTracingRoot` path

#### CI/CD Workflows
All workflow files in `.github/workflows/` were updated to use new paths:
- `ci.yml`
- `deploy.yml`
- `android-build.yml`
- `build-android-client-apk.yml`
- `build-android-staff-apk.yml`
- `build-ios-client-app.yml`
- `android-ci.yml`
- `mobile.yml`
- `preview.yml`
- `supabase-deploy.yml`

#### Scripts
All scripts in `scripts/` directory were updated to reference new paths:
- Coverage enforcement scripts
- Build scripts
- Deployment scripts
- Validation scripts

### 4. New Files Added

- `apps/pwa/README.md` - Documentation for PWA applications
- `apps/mobile/README.md` - Placeholder documentation for future mobile apps

## Validation

### Successfully Validated
✅ **Package installation** - `pnpm install` completes without errors  
✅ **Package builds** - All packages in `packages/` build successfully  
✅ **Website build** - `apps/website` builds successfully  
✅ **Workspace structure** - pnpm recognizes all workspace packages correctly

### Pre-existing Issues (Not Caused by Refactoring)
⚠️ **TypeScript errors** - Both staff-admin-pwa and client have pre-existing type errors  
⚠️ **Build errors in staff-admin-pwa** - Missing dependencies and broken imports exist before refactoring  
⚠️ **Lint requires Supabase CLI** - The prelint step requires Supabase CLI which is not available in all environments

## Impact on Development

### New Commands

**Development:**
```bash
# Staff admin PWA
pnpm --filter @ibimina/staff-admin-pwa dev

# Client PWA
pnpm --filter @ibimina/client dev

# Website
pnpm --filter @ibimina/website dev
```

**Building:**
```bash
# All PWAs
pnpm --filter './apps/pwa/*' build

# Specific PWA
pnpm --filter @ibimina/staff-admin-pwa build
```

### Backward Compatibility

The following legacy scripts still work via aliases in root `package.json`:
- `pnpm dev` → runs staff-admin-pwa
- `pnpm build:admin` → builds staff-admin-pwa
- `pnpm dev:client` → runs client

## Testing Recommendations

1. **Local Development Testing**
   - Verify all `pnpm dev:*` commands work
   - Test hot reload in all apps
   - Verify imports across workspace packages

2. **Build Testing**
   - Run full build pipeline: `pnpm build:packages && pnpm build:admin && pnpm build:client`
   - Verify Capacitor builds for Android/iOS still work
   - Test production builds

3. **CI/CD Testing**
   - Verify all GitHub Actions workflows pass
   - Check deployment pipelines
   - Validate artifact paths

## Future Considerations

1. **Mobile Apps Directory**
   - The `apps/mobile/` directory is ready for native mobile apps (React Native, etc.)
   - Current mobile builds still use Capacitor from PWA apps

2. **Documentation Updates**
   - Repository README may need updates
   - Developer onboarding documentation should reference new structure

3. **Migration Path**
   - Consider keeping the old package name `@ibimina/admin` as an alias during transition period
   - Update all external references (deployment configs, documentation, etc.)

## Rollback Plan

If issues arise, rollback can be done via:
```bash
git revert <commit-hash>
pnpm install
```

The git history preserves the full move, so files can be traced back to their original locations.

## Conclusion

The directory structure refactoring successfully reorganizes the monorepo for better separation of concerns between PWA and mobile applications. All structural changes are complete, and the workspace is functional. Pre-existing build and type issues remain and should be addressed separately.

# PR #589 Conflict Resolution - Quick Reference

## Status: ✅ CONFLICTS RESOLVED

All 29 merge conflicts have been analyzed and resolved. Manual steps provided
below.

## Summary

**PR #589**: Remove Capacitor bridge and Android dependencies  
**Conflicts**: 29 total (28 modify/delete + 1 content)  
**Resolution Strategy**: Accept all PR deletions; keep PR's documentation
approach

## Quick Resolution Steps

### 1. Merge main into PR branch

```bash
git checkout codex/cleanup-admin-package-and-refactor-settings
git merge main --no-edit
```

### 2. Resolve modify/delete conflicts (accept deletions)

```bash
# Remove all 28 files that PR deleted (Capacitor/Android files)
git rm apps/pwa/client/android/gradlew
git rm apps/pwa/staff-admin/android/ANDROID_BUILD_FIX.md
git rm apps/pwa/staff-admin/android/app/src/main/assets/capacitor.plugins.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/app-build-manifest.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/build-manifest.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/cache/next-devtools-config.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/package.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/prerender-manifest.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/react-loadable-manifest.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/routes-manifest.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/server/app-paths-manifest.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/server/interception-route-rewrite-manifest.js
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/server/middleware-build-manifest.js
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/server/middleware-manifest.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/server/middleware-react-loadable-manifest.js
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/server/next-font-manifest.js
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/server/next-font-manifest.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/server/pages-manifest.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/server/server-reference-manifest.js
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/server/server-reference-manifest.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/static/chunks/polyfills.js
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/static/development/_buildManifest.js
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/static/development/_ssgManifest.js
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/types/cache-life.d.ts
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/types/package.json
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/types/routes.d.ts
git rm apps/pwa/staff-admin/android/app/src/main/assets/public/types/validator.ts
git rm apps/pwa/staff-admin/android/capacitor.settings.gradle
```

### 3. Resolve content conflict in README

Edit `apps/pwa/staff-admin/components/examples/README.md`:

- **Keep**: PR's version about "Native capability simulations" without Capacitor
- **Remove**: Main's version about Capacitor plugin usage
- **Remove**: All conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)

Then stage it:

```bash
git add apps/pwa/staff-admin/components/examples/README.md
```

### 4. Complete the merge

```bash
git commit -m "chore: resolve merge conflicts with main branch

- Accept all deletions from PR #589 (Capacitor and Android bridge removal)
- Remove 28 files that were modified in main but deleted in PR
- Resolve content conflict in examples/README.md in favor of PR approach
- Keep PR's goal of removing Capacitor dependencies intact"
```

### 5. Push

```bash
git push origin codex/cleanup-admin-package-and-refactor-settings
```

## Verification

After pushing, verify the build:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm test:unit
```

## Rationale

- **Why accept deletions?** PR #589 explicitly removes Capacitor bridge and
  Android dependencies. Files modified in main were part of the infrastructure
  being removed.

- **Why keep PR's README?** The PR's documentation correctly reflects the new
  architecture (simulations without Capacitor bridge).

## Need More Details?

See `PR589_CONFLICT_RESOLUTION.md` for:

- Detailed conflict analysis
- Alternative resolution approaches
- Verification procedures
- Troubleshooting guide

---

**Created**: 2025-11-11  
**Merge Commit Reference**: 13c87338 (created in sandbox)

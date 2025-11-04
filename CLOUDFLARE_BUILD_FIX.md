# Cloudflare Build Fix: Workspace Package Pre-build

## Problem Statement

The Cloudflare Pages build was failing with "Module not found" errors for
workspace packages:

```
Module not found: Can't resolve '@ibimina/lib'
Module not found: Can't resolve '@ibimina/flags'
Module not found: Can't resolve '@ibimina/ui'
```

## Root Cause

When Cloudflare Pages runs `pnpm dlx @cloudflare/next-on-pages@latest`, it
internally executes `pnpm dlx vercel build`. Vercel's build process looks for a
`vercel-build` script in the root `package.json`, and if not found, runs the
default build command.

For a monorepo with workspace dependencies, this meant:

1. Vercel would try to build the admin app directly
2. The workspace packages (@ibimina/config, @ibimina/flags, @ibimina/lib,
   @ibimina/ui) had not been built yet
3. Their `dist/` directories didn't exist
4. Next.js webpack couldn't resolve the imports

## Solution

Added a `vercel-build` script to the root `package.json` that:

1. Builds workspace dependencies first (using `build:admin-deps`)
2. Then builds the admin app

### Changes Made

#### 1. Root package.json

```json
{
  "scripts": {
    "build:admin-deps": "pnpm --filter '@ibimina/config' build && pnpm --filter '@ibimina/flags' build && pnpm --filter '@ibimina/lib' build && pnpm --filter '@ibimina/ui' build",
    "vercel-build": "pnpm run build:admin-deps && pnpm --filter @ibimina/admin run build"
  }
}
```

The `vercel-build` script is automatically detected by Vercel and used instead
of the default build command.

#### 2. Fixed Package Build Scripts

Both `@ibimina/config` and `@ibimina/ui` had incorrect build scripts that
referenced `tsconfig.json` which had `noEmit: true` inherited from the base
config. Changed to use `tsconfig.build.json` instead:

**packages/config/package.json:**

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json" // was: tsconfig.json
  }
}
```

**packages/ui/package.json:**

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json" // was: tsconfig.json
  }
}
```

## Verification

The fix successfully resolves the original "Module not found" errors:

**Before:** Build failed immediately with workspace package resolution errors
**After:** Build progresses past package resolution and into Next.js webpack
compilation

## Build Order

The correct build order for admin app dependencies:

1. `@ibimina/config` (no dependencies on other @ibimina packages)
2. `@ibimina/flags` (depends on @ibimina/config)
3. `@ibimina/lib` (no dependencies on other @ibimina packages)
4. `@ibimina/ui` (no dependencies on other @ibimina packages)
5. `@ibimina/admin` (depends on all of the above)

## Alternative Approaches Considered

1. **Using `postinstall` hook**: Would run on every install, not just builds
2. **Modifying Cloudflare Pages build command**: Requires manual configuration
   in dashboard
3. **Pre-building in CI**: Adds complexity and doesn't work for Cloudflare's
   build environment

The `vercel-build` script approach is the cleanest as it:

- Works automatically without dashboard configuration
- Only runs during builds, not installs
- Is idiomatic for Vercel/Next.js projects
- Works in both Cloudflare Pages and local development

## Testing Locally

To test the fix locally:

```bash
# Clean all built packages
rm -rf packages/*/dist apps/admin/.next

# Run the vercel-build script
pnpm run vercel-build
```

The workspace packages should build first, followed by the admin app.

## Notes

- The `@ibimina/locales` package does not need to be built as it has no build
  script
- The `@ibimina/flags` and `@ibimina/lib` packages use `tsup` for bundling,
  which works correctly
- This fix is necessary for Cloudflare Pages, Vercel, and any other platform
  that uses `vercel build`

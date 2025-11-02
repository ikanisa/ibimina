# Pre-existing Build Issues

This document tracks pre-existing build issues in the monorepo that were not
caused by recent changes and should be addressed in separate PRs.

## Issue 1: @ibimina/data-access - tsup/incremental Conflict

### Status

🔴 Build Failing

### Description

The `@ibimina/data-access` package fails to build during the DTS (TypeScript
declaration) generation phase due to a conflict between TypeScript's
`incremental` compilation option and tsup's build process.

### Error Message

```
error TS5074: Option '--incremental' can only be specified using tsconfig,
emitting to single file or when option '--tsBuildInfoFile' is specified.

error TS6307: File '...' is not listed within the file list of project ''.
Projects must list all files or use an 'include' pattern.
```

### Root Cause

- The base `tsconfig.base.json` has `"incremental": true` (line 15)
- The package's `tsconfig.json` has `"composite": true` (line 9)
- When tsup runs TypeScript for DTS generation, the incremental option conflicts
  with how tsup invokes the compiler
- The composite mode expects explicit file lists but tsup uses a different
  approach

### Location

- Package: `packages/data-access/`
- Config: `packages/data-access/tsconfig.json`
- Base config: `tsconfig.base.json`
- Build script: `packages/data-access/package.json` (line 16)

### Impact

- Cannot build the `@ibimina/data-access` package
- Blocks production builds that depend on this package
- DTS files are not generated, preventing TypeScript type checking in consuming
  packages

### Recommended Fix Options

#### Option 1: Override incremental in package tsconfig (Recommended)

Add `"incremental": false` to `packages/data-access/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationDir": "dist",
    "composite": false,
    "incremental": false
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

#### Option 2: Use tsBuildInfoFile

Specify a build info file location:

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

#### Option 3: Remove composite mode

If not needed for project references:

```json
{
  "compilerOptions": {
    "composite": false
  }
}
```

### Testing the Fix

```bash
cd packages/data-access
pnpm clean
pnpm build
# Should complete without errors
```

---

## Issue 2: @ibimina/ui - TypeScript Errors in Story Files

### Status

🔴 Build Failing

### Description

The `@ibimina/ui` package fails to build due to TypeScript errors in the
Storybook story file `AccessibilityAudits.stories.tsx`. The errors are related
to missing JSX type constraints and namespace declarations.

### Error Messages

```
src/stories/AccessibilityAudits.stories.tsx:14:33 - error TS2344:
Type 'T' does not satisfy the constraint 'JSXElementConstructor<any> | keyof IntrinsicElements'.

src/stories/AccessibilityAudits.stories.tsx:16:18 - error TS2503:
Cannot find namespace 'JSX'.
```

### Root Cause

- The `StoryObj<T>` type uses `ComponentProps<T>` without proper type
  constraints
- The `JSX.Element` type is used without importing React types properly
- The story file doesn't have proper JSX namespace declarations for TypeScript

### Location

- Package: `packages/ui/`
- File: `packages/ui/src/stories/AccessibilityAudits.stories.tsx`
- Lines affected: 13-16

### Impact

- Cannot build the `@ibimina/ui` package
- TypeScript compilation fails
- Story files cannot be used for component documentation/testing

### Recommended Fix Options

#### Option 1: Add proper type constraints (Recommended)

Update the type definitions in the story file:

```typescript
import type { ComponentProps, JSXElementConstructor } from "react";

type StoryObj<
  T extends JSXElementConstructor<any> | keyof JSX.IntrinsicElements,
> = {
  args?: Partial<ComponentProps<T>>;
  parameters?: Record<string, unknown>;
  render?: () => React.JSX.Element;
};
```

#### Option 2: Use React.ReactElement instead of JSX.Element

```typescript
import type { ComponentProps, ReactElement } from "react";

type StoryObj<T> = {
  args?: T extends keyof JSX.IntrinsicElements
    ? Partial<ComponentProps<T>>
    : Partial<ComponentProps<T>>;
  parameters?: Record<string, unknown>;
  render?: () => ReactElement;
};
```

#### Option 3: Exclude story files from build

Update `packages/ui/tsconfig.json`:

```json
{
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "src/stories/**/*"]
}
```

Note: This option would prevent story files from being type-checked, which may
not be desirable.

### Testing the Fix

```bash
cd packages/ui
pnpm typecheck
pnpm build
# Should complete without errors
```

---

## Resolution Timeline

Both issues should be addressed in separate PRs:

1. **PR for @ibimina/data-access**: Fix tsup/incremental conflict
   - Estimated effort: 15-30 minutes
   - Priority: High (blocks builds)
   - Dependencies: None

2. **PR for @ibimina/ui**: Fix TypeScript errors in story files
   - Estimated effort: 30-45 minutes
   - Priority: High (blocks builds)
   - Dependencies: None

## Additional Notes

- Both packages were working previously, suggesting these issues may have been
  introduced by:
  - TypeScript version updates
  - Dependencies updates (tsup, React types)
  - Changes to base tsconfig.json
- These issues are not related to recent feature development
- Both packages are currently preventing successful full monorepo builds
- Consider adding build checks in CI/CD for all packages to catch these issues
  earlier

## Related Files

- `packages/data-access/package.json`
- `packages/data-access/tsconfig.json`
- `packages/ui/package.json`
- `packages/ui/tsconfig.json`
- `packages/ui/src/stories/AccessibilityAudits.stories.tsx`
- `tsconfig.base.json`

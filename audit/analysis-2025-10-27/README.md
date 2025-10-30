# Codebase Analysis Artifacts - 2025-10-27

This directory contains the raw outputs from automated analysis tools run during
the codebase analysis phase.

## Files

### 1. `lint-output.txt`

ESLint output from `pnpm run lint` across all workspace packages.

**Key Findings:**

- 3 errors in apps/admin
- Several packages have placeholder linting scripts

### 2. `typecheck-output.txt`

TypeScript type checking output from `pnpm run typecheck`.

**Key Findings:**

- 4 type errors in apps/client
- All other packages pass type checking

### 3. `audit-output.txt`

Security audit results from `pnpm audit`.

**Result:** No known vulnerabilities found ✅

### 4. `outdated-output.txt`

Outdated dependency report from `pnpm outdated`.

**Key Findings:**

- 3 packages with newer versions available
- All are minor/patch updates

### 5. `depcheck-output.txt`

Unused and missing dependency analysis from `depcheck`.

**Key Findings:**

- 1 unused dev dependency
- 1 missing dependency in Supabase functions

### 6. `unit-test-output.txt`

Unit test results from `pnpm run test:unit`.

**Result:** 65 tests passing across 17 test suites ✅

## Usage

These raw outputs provide detailed technical information to supplement the main
analysis report (`CODEBASE_ANALYSIS.md` in the repository root).

## Commands Run

```bash
# Linting
pnpm run lint

# Type checking
pnpm run typecheck

# Security audit
pnpm audit --audit-level=moderate

# Outdated dependencies
pnpm outdated

# Unused dependencies
npx depcheck --ignores="@types/*,eslint-*,typescript,tsx,ts-node"

# Unit tests
pnpm run test:unit
```

## Next Steps

Review the main `CODEBASE_ANALYSIS.md` document for recommendations and action
items based on these findings.

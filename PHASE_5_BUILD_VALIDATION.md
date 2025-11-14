# Phase 5: Build Validation & Testing

## Step 1: Clean install from scratch

```bash
# Remove all node_modules and lock files
rm -rf node_modules pnpm-lock.yaml
find . -name "node_modules" -type d -prune -exec rm -rf {} +
find . -name ".next" -type d -prune -exec rm -rf {} +

# Fresh install
pnpm install
```

## Step 2: Build all packages in order

```bash
# Build shared packages first
pnpm --filter './packages/**' build

# Build apps
pnpm --filter @ibimina/staff-admin-pwa build
pnpm --filter @ibimina/website build
```

## Step 3: Run test suites

```bash
pnpm test:unit
pnpm test:auth
```

## Step 4: Dev server test

```bash
pnpm dev
# Check http://localhost:3100
```

## Current Status

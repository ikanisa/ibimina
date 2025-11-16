# Systematic Codebase Cleanup & Fix Plan

## EXECUTION STRATEGY

**Approach:** Bottom-up, dependencies first, then apps **Timeline:** 4-6 hours
systematic work **Validation:** Test after each phase

---

## PHASE 1: CLEANUP (30 min)

### 1.1 Remove Legacy/Duplicate Directories

```bash
# Backup first
git branch backup-before-cleanup

# Remove duplicates
rm -rf apps/admin  # Legacy, superseded by apps/pwa/staff-admin
rm -rf apps/client # Legacy, superseded by apps/pwa/client

# Remove build artifacts
find . -name ".next" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null
find . -name "dist" -path "*/packages/*/dist" -exec rm -rf {} +
```

### 1.2 Remove Unnecessary Documentation (keep essential only)

```bash
# Archive old docs
mkdir -p archive/old-docs
mv *SUMMARY*.md *STATUS*.md *REPORT*.md archive/old-docs/ 2>/dev/null
```

---

## PHASE 2: TAILWIND CSS FIX (45 min)

### 2.1 Understand Tailwind v4

**Key Changes in v4:**

- CSS-first configuration (via `@theme` in CSS)
- No more `tailwind.config.js` for basic setup
- `@import "tailwindcss"` syntax
- PostCSS plugin: `@tailwindcss/postcss`

### 2.2 Fix Strategy

**Option A: Full v4 Migration** (Recommended)

- Remove `tailwind.config.ts` files
- Move theme to CSS using `@theme`
- Update all CSS files to use `@import "tailwindcss"`

**Option B: Downgrade to v3** (Safer short-term)

- Change all packages to use Tailwind v3
- Keep existing configs
- Standard `@tailwind` directives

**DECISION:** Go with Option B for stability

### 2.3 Implementation

```bash
# apps/pwa/staff-admin/package.json
"tailwindcss": "^3.4.0"
"@tailwindcss/postcss": remove (v3 doesn't use this)

# apps/pwa/staff-admin/postcss.config.mjs
{
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}

# apps/pwa/staff-admin/app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## PHASE 3: TYPESCRIPT CONSOLIDATION (30 min)

### 3.1 Audit TypeScript Configs

```bash
find . -name "tsconfig*.json" -not -path "*/node_modules/*"
```

### 3.2 Consolidate Rules

- Single `tsconfig.base.json` at root
- Apps extend base with minimal overrides
- Packages use consistent settings

---

## PHASE 4: DEPENDENCY CLEANUP (45 min)

### 4.1 Remove Unused Packages

```bash
npx depcheck apps/pwa/staff-admin
npx depcheck apps/website
```

### 4.2 Version Alignment

- Ensure React 19 everywhere
- Next.js 15.x consistent
- Node 20.x in engines

---

## PHASE 5: BUILD VALIDATION (60 min)

### 5.1 Clean Install

```bash
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/*/node_modules apps/*/*/node_modules
rm -rf packages/*/node_modules
pnpm install --frozen-lockfile=false
```

### 5.2 Build Each Package

```bash
pnpm --filter './packages/**' build
pnpm --filter @ibimina/staff-admin-pwa build
pnpm --filter @ibimina/website build
```

### 5.3 Test Suite

```bash
pnpm test:unit
pnpm test:auth
```

---

## PHASE 6: DEV SERVER FIX (30 min)

### 6.1 Environment Setup

- Create `.env.local` template
- Document all required variables
- Test with minimal config

### 6.2 Validate

```bash
pnpm dev
# Should start without errors
# / should redirect to /dashboard
# /dashboard should load
```

---

## PHASE 7: DOCUMENTATION (30 min)

### 7.1 Update README

- Quick start guide
- Environment setup
- Build commands
- Deploy checklist

### 7.2 Create ARCHITECTURE.md

- Monorepo structure
- Package purposes
- App responsibilities

---

## SUCCESS CRITERIA

- [ ] `pnpm install` completes without errors
- [ ] `pnpm build` builds all packages
- [ ] `pnpm dev` starts without crashes
- [ ] Browser loads http://localhost:3100 without 500
- [ ] No console errors on page load
- [ ] CSS styles apply correctly
- [ ] Tests pass

---

**READY TO EXECUTE?**

# ibimina Deep Cleanup - Execution Plan

**Branch**: `refactor/ibimina-deep-clean`  
**Date**: 2025-11-05  
**Status**: Ready to Execute

---

## 📊 BASELINE METRICS (Captured)

- **Repository Size**: 7.3GB
- **node_modules**: 3.6GB
- **Lines of Code**: 161,517 (TypeScript/JavaScript)
- **Total Files**: 5,061
- **Workspaces**: apps/_, packages/_

---

## 🎯 EXECUTION PHASES

### Phase 0: Tool Installation ✅

```bash
cd /Users/jeanbosco/workspace/ibimina
pnpm add -D -w knip ts-prune depcheck madge dependency-cruiser rimraf
```

**Status**: ✅ Complete

---

### Phase 1: Workspace Inventory & Mapping

#### 1.1 List All Workspaces

```bash
# Create evidence directory
mkdir -p USAGE_EVIDENCE

# List all packages
echo "# Workspace Inventory" > USAGE_EVIDENCE/workspaces.txt
echo "" >> USAGE_EVIDENCE/workspaces.txt

for dir in apps/* packages/*; do
  if [ -f "$dir/package.json" ]; then
    echo "## $dir" >> USAGE_EVIDENCE/workspaces.txt
    jq '{name, version, scripts: .scripts | keys}' "$dir/package.json" >> USAGE_EVIDENCE/workspaces.txt
    echo "" >> USAGE_EVIDENCE/workspaces.txt
  fi
done

cat USAGE_EVIDENCE/workspaces.txt
```

#### 1.2 Build Dependency Graph

```bash
# Generate visual dependency graph
npx madge --image dep-graph.svg --extensions ts,tsx,js,jsx --exclude 'node_modules|\.next|dist|build' apps packages

# Generate JSON for analysis
npx madge --json --extensions ts,tsx,js,jsx --exclude 'node_modules|\.next|dist|build' apps packages > USAGE_EVIDENCE/dep-graph.json
```

---

### Phase 2: Dead Code Detection

#### 2.1 Run knip (Unused Files/Exports)

```bash
# Run knip analysis
npx knip --reporter json > USAGE_EVIDENCE/knip-report.json 2>&1 || true
npx knip --reporter compact > USAGE_EVIDENCE/knip-compact.txt 2>&1 || true

# Show summary
cat USAGE_EVIDENCE/knip-compact.txt | head -50
```

#### 2.2 Run ts-prune (Unused Exports)

```bash
# Scan for unused exports
npx ts-prune --project tsconfig.json > USAGE_EVIDENCE/ts-prune.txt 2>&1 || true
npx ts-prune --project apps/admin/tsconfig.json >> USAGE_EVIDENCE/ts-prune.txt 2>&1 || true
npx ts-prune --project apps/client/tsconfig.json >> USAGE_EVIDENCE/ts-prune.txt 2>&1 || true

# Show summary (first 100 lines)
cat USAGE_EVIDENCE/ts-prune.txt | head -100
```

#### 2.3 Run depcheck (Unused Dependencies)

```bash
# Check root
npx depcheck --json > USAGE_EVIDENCE/depcheck-root.json 2>&1 || true

# Check each workspace
for dir in apps/* packages/*; do
  if [ -f "$dir/package.json" ]; then
    echo "Checking $dir..."
    npx depcheck "$dir" --json > "USAGE_EVIDENCE/depcheck-$(basename $dir).json" 2>&1 || true
  fi
done

# Summary
echo "# Depcheck Summary" > USAGE_EVIDENCE/depcheck-summary.txt
for f in USAGE_EVIDENCE/depcheck-*.json; do
  echo "## $f" >> USAGE_EVIDENCE/depcheck-summary.txt
  cat "$f" | jq '{dependencies: .dependencies, devDependencies: .devDependencies}' >> USAGE_EVIDENCE/depcheck-summary.txt 2>&1 || true
done

cat USAGE_EVIDENCE/depcheck-summary.txt
```

---

### Phase 3: Asset Analysis

#### 3.1 Find Unreferenced Images

```bash
# List all images
find . -name "node_modules" -prune -o -name ".next" -prune -o \
  \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" -o -name "*.gif" -o -name "*.webp" \) \
  -type f -print > USAGE_EVIDENCE/all-images.txt

# Check which are referenced in code
echo "# Potentially Unused Images" > USAGE_EVIDENCE/unused-images.txt
while IFS= read -r img; do
  basename=$(basename "$img")
  # Search for references
  if ! rg -l "$basename" --type-add 'web:*.{ts,tsx,js,jsx,css,scss,html}' -t web . > /dev/null 2>&1; then
    echo "$img" >> USAGE_EVIDENCE/unused-images.txt
  fi
done < USAGE_EVIDENCE/all-images.txt

echo "Found $(wc -l < USAGE_EVIDENCE/all-images.txt) total images"
echo "Found $(wc -l < USAGE_EVIDENCE/unused-images.txt) potentially unused images"
```

#### 3.2 Find Orphaned CSS/SCSS

```bash
# List all style files
find . -name "node_modules" -prune -o -name ".next" -prune -o \
  \( -name "*.css" -o -name "*.scss" \) \
  -type f -print > USAGE_EVIDENCE/all-styles.txt

# Check for imports
echo "# Potentially Unused Styles" > USAGE_EVIDENCE/unused-styles.txt
while IFS= read -r style; do
  basename=$(basename "$style")
  if ! rg -l "import.*$basename|require.*$basename" --type-add 'web:*.{ts,tsx,js,jsx}' -t web . > /dev/null 2>&1; then
    echo "$style" >> USAGE_EVIDENCE/unused-styles.txt
  fi
done < USAGE_EVIDENCE/all-styles.txt

echo "Found $(wc -l < USAGE_EVIDENCE/all-styles.txt) total style files"
echo "Found $(wc -l < USAGE_EVIDENCE/unused-styles.txt) potentially unused style files"
```

---

### Phase 4: Next.js Convention Check

#### 4.1 Verify Next.js Routes

```bash
# Find all Next.js route files
echo "# Next.js Routes" > USAGE_EVIDENCE/nextjs-routes.txt

# App Router (apps/admin)
if [ -d "apps/admin/app" ]; then
  echo "## apps/admin (App Router)" >> USAGE_EVIDENCE/nextjs-routes.txt
  find apps/admin/app -name "page.tsx" -o -name "page.ts" -o -name "route.ts" -o -name "layout.tsx" -o -name "loading.tsx" -o -name "error.tsx" -o -name "not-found.tsx" >> USAGE_EVIDENCE/nextjs-routes.txt
fi

# Other apps
for app in apps/client apps/website; do
  if [ -d "$app" ]; then
    echo "## $app" >> USAGE_EVIDENCE/nextjs-routes.txt
    find "$app" -name "page.tsx" -o -name "page.ts" -o -name "route.ts" 2>/dev/null >> USAGE_EVIDENCE/nextjs-routes.txt || true
  fi
done

cat USAGE_EVIDENCE/nextjs-routes.txt | wc -l
echo "route files found"
```

#### 4.2 Check Dynamic Imports

```bash
# Find all dynamic imports
echo "# Dynamic Imports" > USAGE_EVIDENCE/dynamic-imports.txt
rg "dynamic\(|import\(" --type typescript --type javascript . 2>&1 | grep -v node_modules > USAGE_EVIDENCE/dynamic-imports.txt || true

cat USAGE_EVIDENCE/dynamic-imports.txt | wc -l
echo "dynamic import statements found"
```

---

### Phase 5: Supabase Cross-Reference

#### 5.1 Inventory Supabase Artifacts

```bash
echo "# Supabase Inventory" > USAGE_EVIDENCE/supabase-inventory.txt

# Migrations
echo "## Migrations" >> USAGE_EVIDENCE/supabase-inventory.txt
ls -1 supabase/migrations/*.sql 2>/dev/null >> USAGE_EVIDENCE/supabase-inventory.txt || echo "None" >> USAGE_EVIDENCE/supabase-inventory.txt

# Edge Functions
echo "" >> USAGE_EVIDENCE/supabase-inventory.txt
echo "## Edge Functions" >> USAGE_EVIDENCE/supabase-inventory.txt
ls -1d supabase/functions/*/ 2>/dev/null >> USAGE_EVIDENCE/supabase-inventory.txt || echo "None" >> USAGE_EVIDENCE/supabase-inventory.txt

# Storage Buckets (from migrations)
echo "" >> USAGE_EVIDENCE/supabase-inventory.txt
echo "## Storage Buckets (from migrations)" >> USAGE_EVIDENCE/supabase-inventory.txt
rg "insert into storage.buckets" supabase/migrations/ 2>/dev/null >> USAGE_EVIDENCE/supabase-inventory.txt || echo "None" >> USAGE_EVIDENCE/supabase-inventory.txt

cat USAGE_EVIDENCE/supabase-inventory.txt
```

#### 5.2 Find RPC Usage

```bash
# Find all RPC calls in code
echo "# Supabase RPC Calls in Code" > USAGE_EVIDENCE/supabase-rpc-usage.txt
rg "\.rpc\(" --type typescript --type javascript apps/ 2>&1 | grep -v node_modules > USAGE_EVIDENCE/supabase-rpc-usage.txt || true

# Find all function definitions in Supabase
echo "" >> USAGE_EVIDENCE/supabase-rpc-usage.txt
echo "## Functions Defined in Supabase" >> USAGE_EVIDENCE/supabase-rpc-usage.txt
rg "create or replace function" supabase/migrations/ 2>/dev/null >> USAGE_EVIDENCE/supabase-rpc-usage.txt || echo "None" >> USAGE_EVIDENCE/supabase-rpc-usage.txt

cat USAGE_EVIDENCE/supabase-rpc-usage.txt
```

---

### Phase 6: Build Verification

#### 6.1 TypeCheck All Workspaces

```bash
echo "# TypeCheck Results" > USAGE_EVIDENCE/typecheck.txt

# Root
pnpm tsc --noEmit 2>&1 | tee -a USAGE_EVIDENCE/typecheck.txt

# Each workspace
for dir in apps/* packages/*; do
  if [ -f "$dir/tsconfig.json" ]; then
    echo "" >> USAGE_EVIDENCE/typecheck.txt
    echo "## $dir" >> USAGE_EVIDENCE/typecheck.txt
    (cd "$dir" && pnpm tsc --noEmit 2>&1) | tee -a USAGE_EVIDENCE/typecheck.txt || true
  fi
done

# Count errors
grep -c "error TS" USAGE_EVIDENCE/typecheck.txt || echo "0 TypeScript errors"
```

#### 6.2 Lint Check

```bash
echo "# Lint Results" > USAGE_EVIDENCE/lint.txt
pnpm lint 2>&1 | tee USAGE_EVIDENCE/lint.txt || true

# Count warnings/errors
grep -c "warning" USAGE_EVIDENCE/lint.txt || echo "0 warnings"
grep -c "error" USAGE_EVIDENCE/lint.txt || echo "0 errors"
```

---

### Phase 7: Analysis & Reporting

After running all the above commands, analyze the collected evidence:

```bash
# Create master analysis script
cat > /tmp/analyze-evidence.sh << 'ANALYSIS'
#!/bin/bash

echo "# ANALYSIS RESULTS" > ANALYSIS.md
echo "==================" >> ANALYSIS.md
echo "" >> ANALYSIS.md

# Knip summary
echo "## Dead Code (knip)" >> ANALYSIS.md
if [ -f "USAGE_EVIDENCE/knip-compact.txt" ]; then
  cat USAGE_EVIDENCE/knip-compact.txt | head -20 >> ANALYSIS.md
fi

# Depcheck summary
echo "" >> ANALYSIS.md
echo "## Unused Dependencies (depcheck)" >> ANALYSIS.md
for f in USAGE_EVIDENCE/depcheck-*.json; do
  pkg=$(basename "$f" .json | sed 's/depcheck-//')
  unused=$(cat "$f" | jq -r '.dependencies[]' 2>/dev/null | wc -l)
  if [ "$unused" -gt 0 ]; then
    echo "- $pkg: $unused unused dependencies" >> ANALYSIS.md
  fi
done

# Asset summary
echo "" >> ANALYSIS.md
echo "## Unused Assets" >> ANALYSIS.md
echo "- Images: $(wc -l < USAGE_EVIDENCE/unused-images.txt 2>/dev/null || echo 0)" >> ANALYSIS.md
echo "- Styles: $(wc -l < USAGE_EVIDENCE/unused-styles.txt 2>/dev/null || echo 0)" >> ANALYSIS.md

# TypeScript errors
echo "" >> ANALYSIS.md
echo "## TypeScript Issues" >> ANALYSIS.md
echo "- Errors: $(grep -c 'error TS' USAGE_EVIDENCE/typecheck.txt 2>/dev/null || echo 0)" >> ANALYSIS.md

cat ANALYSIS.md
ANALYSIS

chmod +x /tmp/analyze-evidence.sh
/tmp/analyze-evidence.sh
```

---

## 🗑️ DELETION STRATEGY (After Analysis)

### Safe Deletions (High Confidence)

1. **Unused Dependencies**: Items appearing in depcheck with no references
2. **Orphaned Assets**: Images/styles with no code references
3. **Dead Exports**: Confirmed by both knip AND ts-prune
4. **Duplicate Configs**: Multiple eslintrc, prettierrc in same scope

### Conservative Approach (Archive First)

1. **Maybe-Unused Modules**: Only 1 tool flags it
2. **Convention Files**: Could be dynamic (move to `archive/`)
3. **Supabase Artifacts**: Unless 100% certain unused

### Never Delete Without Verification

1. **Next.js Convention Files**: page.tsx, layout.tsx, route.ts, middleware.ts
2. **Supabase RLS Helpers**: has_role, etc. (even if grep doesn't find them)
3. **Dynamic Imports**: Loaded via string concatenation
4. **@ibimina/\* Packages**: Fix wiring instead of deleting

---

## 🔍 VERIFICATION GATES

Before committing any deletions:

```bash
# Gate 1: Build
pnpm -w build

# Gate 2: Tests
pnpm -w test --if-present

# Gate 3: TypeCheck
pnpm -w check:types || pnpm tsc --noEmit

# Gate 4: Lint
pnpm lint

# All must pass ✅
```

---

## 📋 DELIVERABLES CHECKLIST

- [ ] REPORT.md (executive summary)
- [ ] DELETION_LOG.md (every deleted item with evidence)
- [ ] KEEPLIST.md (intentionally kept items)
- [ ] DEPENDENCY_GRAPH.md + dep-graph.svg
- [ ] USAGE_EVIDENCE/ directory with all tool outputs
- [ ] Before/after bundle size comparison
- [ ] Before/after LOC/file count comparison
- [ ] Passing CI on PR

---

## 🚀 EXECUTION COMMANDS

Run phases sequentially:

```bash
# Phase 1
./scripts/cleanup/01-workspace-inventory.sh

# Phase 2
./scripts/cleanup/02-dead-code-detection.sh

# Phase 3
./scripts/cleanup/03-asset-analysis.sh

# Phase 4
./scripts/cleanup/04-nextjs-conventions.sh

# Phase 5
./scripts/cleanup/05-supabase-crossref.sh

# Phase 6
./scripts/cleanup/06-build-verification.sh

# Phase 7
./scripts/cleanup/07-analysis-reporting.sh

# Phase 8 (manual review)
# Review all evidence, create deletion plan

# Phase 9 (execute deletions)
# Make targeted deletions with git commits

# Phase 10 (verify)
# Run all verification gates

# Phase 11 (document)
# Create final reports

# Phase 12 (PR)
git add -A
git commit -m "ibimina: Deep Repo Review & Safe Cleanup"
git push origin refactor/ibimina-deep-clean
```

---

## ⚠️ NOTES

- **Disk Space**: Free up ~10GB before starting (current: 7.3GB repo + 3.6GB
  node_modules)
- **Time Estimate**: Full analysis ~2-3 hours, review ~2-4 hours, cleanup ~4-6
  hours
- **Backup**: Branch is backed up, changes are reversible via git
- **Risk Level**: Low (strict verification gates)

---

**Status**: Ready for execution. Start with Phase 1.

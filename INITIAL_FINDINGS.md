# ibimina Deep Cleanup - Initial Findings

**Branch**: refactor/ibimina-deep-clean  
**Date**: 2025-11-05  
**Status**: Analysis In Progress

---

## 📊 BASELINE METRICS

- **Repository Size**: 7.3GB
- **node_modules**: 3.6GB (50% of repo!)
- **Lines of Code**: 161,517 (TypeScript/JavaScript)
- **Total Files**: 5,061
- **Workspaces**: 19 apps + packages

---

## 🗂️ WORKSPACE INVENTORY

### Apps (9 total)

| App                            | Version | Purpose                    | Status                               |
| ------------------------------ | ------- | -------------------------- | ------------------------------------ |
| **@ibimina/admin**             | 0.1.2   | Main Next.js staff console | ✅ Active (69 pages, 121 components) |
| **@ibimina/client**            | 0.1.0   | Client PWA (Capacitor)     | ✅ Active (Android/iOS ready)        |
| **@ibimina/client-mobile**     | 1.0.0   | React Native client        | ⚠️ Duplicate?                        |
| **@ibimina/mobile**            | 0.1.0   | Expo mobile app            | ⚠️ Duplicate?                        |
| **@ibimina/sacco-plus-client** | 1.0.0   | Another client variant     | ⚠️ Duplicate?                        |
| **@ibimina/staff**             | 0.1.0   | Staff app (separate?)      | ⚠️ Duplicate of admin?               |
| **@ibimina/staff-admin-pwa**   | 0.1.0   | Staff PWA                  | ⚠️ Duplicate of admin?               |
| **@ibimina/website**           | 0.1.0   | Marketing site             | ✅ Active                            |
| **@ibimina/platform-api**      | 0.0.0   | API service                | ⚠️ Stub/Future                       |

**🔍 OBSERVATION**: Significant duplication in mobile/client apps and
staff/admin apps

### Packages (10+ total)

| Package             | Version | Main Export       | Purpose                 |
| ------------------- | ------- | ----------------- | ----------------------- |
| @ibimina/agent      | 0.0.0   | dist/cjs/index.js | AI agent wrapper        |
| @ibimina/ai-agent   | 0.0.0   | dist/index.js     | AI agent (duplicate?)   |
| @ibimina/api        | 0.0.0   | dist/cjs/index.js | API types/client        |
| @ibimina/api-client | 1.0.0   | dist/index.js     | API client (duplicate?) |
| @ibimina/config     | 0.0.0   | dist/index.js     | Config loader           |
| @ibimina/core       | -       | -                 | Core utilities          |
| @ibimina/ui         | -       | -                 | Shared UI components    |
| @ibimina/types      | -       | -                 | Shared TypeScript types |
| @ibimina/flags      | -       | -                 | Feature flags           |
| @ibimina/locales    | -       | -                 | i18n translations       |

**🔍 OBSERVATION**: Potential duplication between agent/ai-agent and
api/api-client

---

## 🚩 IMMEDIATE RED FLAGS

### 1. Massive Duplication

**Apps with overlapping purposes**:

- 4 variants of client/mobile apps:
  - `apps/client` (Capacitor PWA)
  - `apps/client-mobile` (React Native)
  - `apps/mobile` (Expo)
  - `apps/sacco-plus-client` (unclear)

- 3 variants of staff/admin apps:
  - `apps/admin` (main Next.js app - 69 pages)
  - `apps/staff` (separate app?)
  - `apps/staff-admin-pwa` (Capacitor PWA)

**Questions**:

- Which is the canonical version?
- Are others legacy/experiments?
- Can we consolidate?

### 2. Package Duplication

- `@ibimina/agent` vs `@ibimina/ai-agent`
- `@ibimina/api` vs `@ibimina/api-client`

### 3. Version Inconsistency

- Most packages at `0.0.0` or `0.1.0`
- Main admin app at `0.1.2`
- Suggests packages not actively versioned

### 4. Stub/WIP Code

- `@ibimina/platform-api` (version 0.0.0) - likely stub
- Many packages with minimal scripts suggest incomplete implementation

---

## 🔍 REQUIRED ANALYSIS (Next Steps)

### High Priority

1. **Identify Active vs Legacy Apps**
   - Which client app is deployed?
   - Which staff app is deployed?
   - Are others experiments/prototypes?

2. **Measure Package Usage**
   - Which @ibimina/\* packages are actually imported?
   - Resolve "Module not found: @ibimina/ui" issue
   - Check for circular dependencies

3. **Dead Code Detection**
   - Run knip on each workspace
   - Run ts-prune to find unused exports
   - Run depcheck to find unused dependencies

4. **Asset Audit**
   - Unreferenced images in public/ folders
   - Orphaned CSS/SCSS files
   - Duplicate assets across apps

### Medium Priority

5. **Config Consolidation**
   - Multiple .eslintrc files
   - Multiple tsconfig.json files
   - Inconsistent prettier configs

6. **Build Artifact Cleanup**
   - .next directories
   - dist/ directories
   - node_modules duplication

### Low Priority

7. **Documentation Cleanup**
   - Many README files (some may be outdated)
   - Multiple status reports (consolidate?)

---

## 📋 PRELIMINARY DELETION CANDIDATES

**(Subject to verification via analysis tools)**

### High Confidence (After Verification)

1. **Duplicate Mobile Apps** (keep 1, remove 3)
   - If `apps/client` is active → remove `apps/client-mobile`, `apps/mobile`,
     `apps/sacco-plus-client`
   - Estimated savings: ~500MB, ~20K LOC

2. **Duplicate Staff Apps** (keep 1, remove 2)
   - If `apps/admin` is active → evaluate `apps/staff`, `apps/staff-admin-pwa`
   - Estimated savings: ~300MB, ~15K LOC

3. **Duplicate Packages**
   - Merge or remove one: `agent` vs `ai-agent`
   - Merge or remove one: `api` vs `api-client`
   - Estimated savings: ~10MB, ~2K LOC

4. **Stub Code**
   - `apps/platform-api` if truly unused
   - Estimated savings: ~50MB, ~5K LOC

### Conservative Approach

1. **Move to archive/** instead of deleting
   - Create `archive/apps/` and `archive/packages/`
   - Move questionable code there
   - Document in KEEPLIST.md with expiry date

---

## 🎯 EXPECTED IMPACT

**If full cleanup executed**:

| Metric           | Before | After (Estimated) | Savings |
| ---------------- | ------ | ----------------- | ------- |
| **Repo Size**    | 7.3GB  | ~5.0GB            | ~30%    |
| **node_modules** | 3.6GB  | ~2.5GB            | ~30%    |
| **LOC**          | 161K   | ~120K             | ~25%    |
| **Files**        | 5,061  | ~4,000            | ~20%    |
| **Workspaces**   | 19     | ~12               | ~35%    |

**Build time improvement**: Estimated 20-30% faster

**Bundle size improvement**: Estimated 15-25% smaller

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Breaking Active Features

**Mitigation**: Strict verification gates (build, test, typecheck must pass)

### Risk 2: Removing Dynamic Imports

**Mitigation**: Grep for string-based imports before deleting

### Risk 3: Supabase RPC Breakage

**Mitigation**: Cross-reference all RPC names in code vs database

### Risk 4: Convention-Based Files (Next.js)

**Mitigation**: Never delete page.tsx, layout.tsx, route.ts without proof

---

## 🚀 RECOMMENDED EXECUTION ORDER

1. **Phase A**: Analysis (2-3 hours)
   - Run all detection tools
   - Generate dep-graph.svg
   - Collect evidence

2. **Phase B**: Documentation (2 hours)
   - Create DELETION_LOG.md
   - Create KEEPLIST.md
   - Create REPORT.md

3. **Phase C**: Mechanical Cleanup (2 hours)
   - Remove proven unused deps
   - Remove unreferenced assets
   - Remove dead exports (high confidence)

4. **Phase D**: Structural Cleanup (4-6 hours)
   - Archive duplicate apps
   - Consolidate packages
   - Fix workspace wiring

5. **Phase E**: Verification (1-2 hours)
   - Run all gates
   - Generate before/after metrics
   - Create PR

**Total Time**: 11-15 hours (can be done over 2-3 sessions)

---

## 📞 NEXT ACTIONS

**For You**:

1. **Confirm Active Apps**: Which of these are deployed/active?
   - Client: `client` vs `client-mobile` vs `mobile` vs `sacco-plus-client`?
   - Staff: `admin` vs `staff` vs `staff-admin-pwa`?

2. **Review Deletion Candidates**: See preliminary list above

3. **Set Priorities**: What's most important to clean up first?

**For Me** (if you want to proceed):

1. Execute Phase A (full analysis)
2. Generate comprehensive evidence
3. Create detailed deletion plan
4. Execute cleanup with verification gates

---

## 📁 FILES CREATED

- ✅ `CLEANUP_EXECUTION_PLAN.md` - Detailed step-by-step guide
- ✅ `INITIAL_FINDINGS.md` - This document
- ⏳ `USAGE_EVIDENCE/` - Will be created during analysis
- ⏳ `REPORT.md` - Final executive summary
- ⏳ `DELETION_LOG.md` - Every deleted item with evidence
- ⏳ `KEEPLIST.md` - Intentionally preserved items
- ⏳ `dep-graph.svg` - Visual dependency graph

---

**Status**: Awaiting confirmation on active apps before proceeding with full
analysis.

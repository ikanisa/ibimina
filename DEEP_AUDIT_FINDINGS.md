# Deep Codebase Audit - Critical Findings

## PHASE 1: INITIAL DISCOVERY

### Repository Stats

- **913 TypeScript files**
- **18 CSS files**
- **13 workspace packages**
- **2 main apps** (pwa/staff-admin, website)
- **Build outputs detected** (need cleanup)

### Critical Issues Identified

#### 1. TAILWIND CSS VERSION CONFLICT ⚠️ CRITICAL

**Problem:** Mix of Tailwind v3 and v4 syntax

- `package.json` specifies v4: `"tailwindcss": "^4"`
- `tailwind.config.ts` uses v3 config format
- `globals.css` tries v4 import syntax
- PostCSS config inconsistent

**Impact:** CSS compilation fails, dev server crashes **Priority:** P0 - MUST
FIX FIRST

#### 2. MULTIPLE APP DIRECTORIES

**Found:** Duplicate app structures

- `apps/admin` (legacy?)
- `apps/pwa/staff-admin` (current)
- `apps/client` (legacy?)
- `apps/pwa/client` (current)

**Action Required:** Remove duplicate directories

#### 3. PACKAGE DEPENDENCY ANALYSIS

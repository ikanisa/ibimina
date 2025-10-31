# Refactoring Roadmap - Based on Codebase Analysis

**Date:** October 27, 2025  
**Source:** Phase 1 Codebase Analysis  
**Status:** Ready for Implementation

---

## Overview

This roadmap provides a prioritized, actionable plan based on the comprehensive
codebase analysis conducted in Phase 1 of the refactoring initiative. Each task
includes specific actions, expected outcomes, and acceptance criteria.

---

## Phase 1: Critical Fixes (Week 1)

### 1.1 Fix ESLint Errors

**Priority:** 🔴 CRITICAL  
**Effort:** 2-4 hours  
**Owner:** TBD

#### Tasks:

- [ ] Fix React purity violation in reconciliation page (line 142)
  - Replace `const now = Date.now()` with
    `const now = useMemo(() => Date.now(), [])`
  - Test that reconciliation page renders correctly
  - Verify no behavioral changes

- [ ] Replace `any` types with proper types (lines 130, 135)
  - Define proper interfaces for the data structures
  - Update type annotations
  - Verify TypeScript compilation

**Files to Modify:**

- `apps/admin/app/(main)/admin/(panel)/reconciliation/page.tsx`

**Acceptance Criteria:**

- [ ] `pnpm lint` passes with zero errors
- [ ] All existing tests pass
- [ ] Manual testing of reconciliation page shows no regressions

### 1.2 Fix TypeScript Type Errors

**Priority:** 🔴 CRITICAL  
**Effort:** 4-6 hours  
**Owner:** TBD

#### Tasks:

- [ ] Regenerate Supabase types from database schema
  - Run: `supabase gen types typescript --local > lib/supabase/types.ts`
  - Update imports in affected files
  - Verify type compatibility

- [ ] Fix type mismatches in saccos API
  - Update `apps/client/lib/api/saccos.ts` to use correct types
  - Add proper error handling with type guards
  - Remove type casting where possible

**Files to Modify:**

- `apps/client/lib/api/saccos.ts`
- `lib/supabase/types.ts` (regenerate)

**Acceptance Criteria:**

- [ ] `pnpm typecheck` passes with zero errors
- [ ] Client app builds successfully
- [ ] API calls work as expected

---

## Phase 2: Dependency Updates (Week 1-2)

### 2.1 Update Minor Dependencies

**Priority:** 🟡 HIGH  
**Effort:** 1-2 hours  
**Owner:** TBD

#### Tasks:

- [ ] Update eslint-plugin-react-hooks (7.0.0 → 7.0.1)
- [ ] Update eslint (9.37.0 → 9.38.0)
- [ ] Test that linting still works correctly

**Commands:**

```bash
pnpm update eslint-plugin-react-hooks eslint
pnpm lint
pnpm test
```

**Acceptance Criteria:**

- [ ] Dependencies updated successfully
- [ ] No breaking changes introduced
- [ ] All tests pass

### 2.2 Evaluate Major @types/node Update

**Priority:** 🟢 MEDIUM  
**Effort:** 4-6 hours  
**Owner:** TBD

#### Tasks:

- [ ] Review @types/node v24 changelog
- [ ] Test compatibility with Node.js 18+
- [ ] Create a branch for testing the update
- [ ] Update if compatible, document if not

**Decision Point:**

- If compatible: Update to v24
- If not compatible: Document reasons and revisit later

---

## Phase 3: Test Coverage Expansion (Week 2-4)

### 3.1 Add Tests to apps/client

**Priority:** 🔴 CRITICAL  
**Effort:** 2-3 weeks  
**Owner:** TBD

#### Tasks:

- [ ] Set up test infrastructure (tsx + Node test runner)
- [ ] Add unit tests for API functions (lib/api/\*)
- [ ] Add unit tests for utility functions
- [ ] Add E2E tests for critical user flows
- [ ] Aim for 60%+ coverage

**New Files:**

```
apps/client/tests/
  ├── unit/
  │   ├── api-saccos.test.ts
  │   └── utils.test.ts
  └── e2e/
      └── member-flows.spec.ts
```

**Acceptance Criteria:**

- [ ] At least 60% code coverage
- [ ] All critical paths tested
- [ ] Tests run in CI

### 3.2 Add Test Coverage Reporting

**Priority:** 🟡 HIGH  
**Effort:** 4-8 hours  
**Owner:** TBD

#### Tasks:

- [ ] Install c8 coverage tool: `pnpm add -D c8`
- [ ] Configure coverage thresholds
- [ ] Add coverage scripts to package.json
- [ ] Integrate with CI pipeline
- [ ] Generate HTML coverage reports

**Configuration:**

```json
{
  "c8": {
    "all": true,
    "lines": 60,
    "functions": 60,
    "branches": 50,
    "statements": 60,
    "exclude": ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"]
  }
}
```

**Acceptance Criteria:**

- [ ] Coverage reports generated on each test run
- [ ] CI fails if coverage drops below thresholds
- [ ] HTML reports accessible for review

### 3.3 Add Tests to Shared Packages

**Priority:** �� HIGH  
**Effort:** 2-3 weeks  
**Owner:** TBD

#### Focus Areas:

1. **packages/core** (HIGHEST priority)
   - Test database helpers
   - Test domain logic
   - Test utility functions

2. **packages/ui** (HIGH priority)
   - Test component rendering
   - Test component interactions
   - Test accessibility features

3. **packages/config** (MEDIUM priority)
   - Test config loading
   - Test validation

**Acceptance Criteria:**

- [ ] packages/core: 70%+ coverage
- [ ] packages/ui: 60%+ coverage
- [ ] packages/config: 80%+ coverage

---

## Phase 4: Linting Standardization (Week 3-4)

### 4.1 Add ESLint to All Packages

**Priority:** 🟡 HIGH  
**Effort:** 1-2 weeks  
**Owner:** TBD

#### Tasks:

- [ ] Create shared ESLint config in workspace root
- [ ] Add ESLint to packages/config
- [ ] Add ESLint to packages/core
- [ ] Add ESLint to packages/testing
- [ ] Add ESLint to packages/ui
- [ ] Add ESLint to apps/platform-api

**Shared Config Example:**

```javascript
// eslint.config.shared.mjs
export default {
  extends: ["eslint:recommended", "@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
  },
};
```

**Acceptance Criteria:**

- [ ] All packages have consistent linting
- [ ] `pnpm lint` runs successfully for all packages
- [ ] No new ESLint errors introduced

### 4.2 Set Up Pre-commit Hooks

**Priority:** 🟢 MEDIUM  
**Effort:** 2-4 hours  
**Owner:** TBD

#### Tasks:

- [ ] Install husky: `pnpm add -D husky`
- [ ] Configure pre-commit hook
- [ ] Add lint-staged for efficient linting
- [ ] Document in README

**Configuration:**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "git add"]
  }
}
```

**Acceptance Criteria:**

- [ ] Pre-commit hook runs on every commit
- [ ] Only staged files are linted
- [ ] Documentation updated

---

## Phase 5: Package Completion (Week 5-8)

### 5.1 Complete packages/core

**Priority:** 🟡 HIGH  
**Effort:** 3-4 weeks  
**Owner:** TBD

#### Tasks:

- [ ] Document API and purpose
- [ ] Implement core domain logic
- [ ] Add comprehensive tests
- [ ] Add TypeScript strict mode
- [ ] Export public API

**Target Structure:**

```
packages/core/
  ├── src/
  │   ├── domain/
  │   ├── supabase/
  │   └── utils/
  ├── tests/
  └── README.md
```

**Acceptance Criteria:**

- [ ] Clear README with usage examples
- [ ] 70%+ test coverage
- [ ] Zero linting errors
- [ ] Used by at least one app

### 5.2 Complete packages/ui

**Priority:** 🟡 HIGH  
**Effort:** 3-4 weeks  
**Owner:** TBD

#### Tasks:

- [ ] Document component library
- [ ] Implement core components
- [ ] Add Storybook (optional)
- [ ] Add accessibility tests
- [ ] Ensure mobile responsiveness

**Target Components:**

- Button, Input, Select
- Card, Modal, Dialog
- Table, DataGrid
- Form components

**Acceptance Criteria:**

- [ ] Component documentation exists
- [ ] 60%+ test coverage
- [ ] Accessibility audit passes
- [ ] Used in both apps

### 5.3 Complete packages/config

**Priority:** 🟢 MEDIUM  
**Effort:** 1-2 weeks  
**Owner:** TBD

#### Tasks:

- [ ] Implement config loader
- [ ] Add environment validation
- [ ] Add type-safe config access
- [ ] Document configuration options

**Acceptance Criteria:**

- [ ] Type-safe config access
- [ ] Runtime validation
- [ ] 80%+ test coverage
- [ ] Used by apps

---

## Phase 6: Automation & CI/CD (Week 6-8)

### 6.1 Set Up Automated Dependency Updates

**Priority:** 🟢 MEDIUM  
**Effort:** 4-8 hours  
**Owner:** TBD

#### Options:

1. **Dependabot** (GitHub native)
2. **Renovate** (more configurable)

#### Tasks:

- [ ] Choose tool (recommend Renovate)
- [ ] Configure update schedules
- [ ] Set up auto-merge rules
- [ ] Configure grouping strategies

**Example Config (.github/renovate.json):**

```json
{
  "extends": ["config:base"],
  "schedule": ["after 10pm every weekday"],
  "automerge": true,
  "automergeType": "pr",
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "automerge": true
    }
  ]
}
```

**Acceptance Criteria:**

- [ ] Automated PRs for dependency updates
- [ ] Patch updates auto-merge
- [ ] Major updates require review

### 6.2 Enhance CI Pipeline

**Priority:** 🟡 HIGH  
**Effort:** 1-2 weeks  
**Owner:** TBD

#### Tasks:

- [ ] Add coverage thresholds to CI
- [ ] Add bundle size monitoring
- [ ] Add performance budgets
- [ ] Parallelize test execution
- [ ] Cache dependencies effectively

**CI Stages:**

1. Lint → TypeCheck → Test → Build
2. E2E Tests (parallel)
3. Coverage Check
4. Security Scan

**Acceptance Criteria:**

- [ ] CI runs < 10 minutes
- [ ] Coverage enforced
- [ ] Security checks automated

---

## Phase 7: Integration & Performance Testing (Week 8-10)

### 7.1 Add Integration Test Suite

**Priority:** 🟢 MEDIUM  
**Effort:** 2-3 weeks  
**Owner:** TBD

#### Tasks:

- [ ] Set up test database
- [ ] Create API integration tests
- [ ] Test cross-service scenarios
- [ ] Test error conditions

**Scope:**

- Authentication flows
- Database operations
- Edge function calls
- External API integrations

**Acceptance Criteria:**

- [ ] 20+ integration tests
- [ ] All critical paths covered
- [ ] Tests run in CI

### 7.2 Add Performance Testing

**Priority:** 🟢 MEDIUM  
**Effort:** 1-2 weeks  
**Owner:** TBD

#### Tasks:

- [ ] Set up k6 for load testing
- [ ] Define performance budgets
- [ ] Create load test scenarios
- [ ] Monitor in production

**Key Metrics:**

- Response time p95 < 500ms
- Error rate < 1%
- Throughput > 100 req/s

**Acceptance Criteria:**

- [ ] Load tests defined
- [ ] Baseline metrics established
- [ ] Performance regression detection

---

## Phase 8: Documentation & Knowledge Sharing (Ongoing)

### 8.1 Package Documentation

**Priority:** 🟡 HIGH  
**Effort:** Ongoing  
**Owner:** Each package maintainer

#### Tasks:

- [ ] Add README.md to each package
- [ ] Document public APIs
- [ ] Add code examples
- [ ] Document architecture decisions

**Template:**

```markdown
# Package Name

## Purpose

Brief description

## Installation

npm install commands

## Usage

Code examples

## API

Public API documentation

## Development

Setup and testing instructions
```

### 8.2 Contribution Guidelines

**Priority:** 🟢 MEDIUM  
**Effort:** 1 week  
**Owner:** TBD

#### Tasks:

- [ ] Create CONTRIBUTING.md
- [ ] Document development workflow
- [ ] Define code review process
- [ ] Create PR template

---

## Success Metrics

### Code Quality Metrics

- [ ] Zero ESLint errors across all packages
- [ ] Zero TypeScript errors
- [ ] 60%+ overall test coverage
- [ ] 80%+ coverage for critical paths

### Process Metrics

- [ ] All packages have tests
- [ ] All packages have linting
- [ ] All packages have documentation
- [ ] Automated dependency updates active

### Performance Metrics

- [ ] CI pipeline < 10 minutes
- [ ] Build time < 5 minutes
- [ ] Test execution < 3 minutes

---

## Risk Management

### Identified Risks

1. **Scope Creep**
   - Mitigation: Strict prioritization, defer non-critical items

2. **Resource Availability**
   - Mitigation: Clear ownership, reasonable timelines

3. **Breaking Changes**
   - Mitigation: Comprehensive testing, gradual rollout

4. **Technical Debt**
   - Mitigation: Don't introduce new debt while fixing old

---

## Timeline Summary

| Phase                   | Duration  | Dependencies |
| ----------------------- | --------- | ------------ |
| Phase 1: Critical Fixes | Week 1    | None         |
| Phase 2: Dependencies   | Week 1-2  | None         |
| Phase 3: Test Coverage  | Week 2-4  | Phase 1      |
| Phase 4: Linting        | Week 3-4  | Phase 1      |
| Phase 5: Packages       | Week 5-8  | Phase 3, 4   |
| Phase 6: Automation     | Week 6-8  | Phase 3      |
| Phase 7: Integration    | Week 8-10 | Phase 5      |
| Phase 8: Documentation  | Ongoing   | All          |

**Total Duration:** 10-12 weeks

---

## Review Points

### Week 2 Review

- [ ] Critical fixes completed
- [ ] Dependencies updated
- [ ] Test coverage plan approved

### Week 4 Review

- [ ] Test coverage improving
- [ ] Linting standardized
- [ ] No regressions introduced

### Week 8 Review

- [ ] Packages completed
- [ ] Automation in place
- [ ] Documentation updated

### Week 10 Review (Final)

- [ ] All phases completed
- [ ] Metrics achieved
- [ ] Lessons learned documented

---

_This roadmap is a living document. Update as priorities change or new issues
are discovered._

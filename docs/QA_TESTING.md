# QA Testing Guide

## Overview

This document provides comprehensive guidance on testing procedures, test structure, available test commands, and quality assurance processes for the Ibimina project.

---

## Table of Contents

- [Test Infrastructure](#test-infrastructure)
- [Available Test Commands](#available-test-commands)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Coverage Requirements](#coverage-requirements)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

---

## Test Infrastructure

### Testing Frameworks

The Ibimina project uses multiple testing frameworks depending on the component:

#### Admin App (apps/pwa/staff-admin)
- **Vitest** - Unit and component tests
- **React Testing Library** - React component testing
- **Playwright** - End-to-end testing
- **Testing Library User Event** - User interaction simulation

#### Supabase Backend
- **psql** - RLS (Row-Level Security) policy tests
- **Deno Test** - Edge Function tests

#### Integration Tests
- **Custom scripts** - Auth security tests
- **PostgreSQL** - Database integration tests

---

## Available Test Commands

### Root Level Commands

```bash
# Run all tests (currently runs RLS tests only)
pnpm test

# Run unit tests across all packages
pnpm test:unit

# Run authentication security tests
pnpm test:auth

# Run Row-Level Security policy tests
pnpm test:rls

# Run end-to-end tests
pnpm test:e2e

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Full deployment readiness check (5-10 minutes)
pnpm check:deploy
```

### Admin App Commands

```bash
cd apps/pwa/staff-admin

# Run unit tests
pnpm test

# Run unit tests with coverage
pnpm test:coverage

# Run unit tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui

# Run specific test file
pnpm test tests/components/Button.test.tsx

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

---

## Test Structure

### Unit Tests

Location: `apps/pwa/staff-admin/tests/`

```
tests/
├── components/          # Component tests
│   ├── Button.test.tsx
│   ├── Card.test.tsx
│   └── ...
├── accessibility/       # A11y tests
│   ├── keyboard-nav.test.tsx
│   └── screen-reader.test.tsx
├── setup/              # Test configuration
│   └── vitest-setup.ts
└── mocks/              # Mock data and utilities
```

**Example Component Test:**
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

Location: `apps/pwa/staff-admin/tests/integration/`

```
tests/integration/
├── auth.test.ts        # Authentication flows
├── payment.test.ts     # Payment processing
└── sms.test.ts         # SMS ingestion
```

### End-to-End Tests

Location: `apps/pwa/staff-admin/tests/e2e/`

```
tests/e2e/
├── auth.spec.ts        # Login/logout flows
├── dashboard.spec.ts   # Dashboard navigation
├── groups.spec.ts      # Group management
└── payments.spec.ts    # Payment workflows
```

**Example E2E Test:**
```typescript
import { test, expect } from '@playwright/test';

test('user can login and view dashboard', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[name="email"]', 'staff@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### RLS Policy Tests

Location: `supabase/tests/rls/`

```
supabase/tests/rls/
├── auth.test.sql           # Auth table policies
├── groups.test.sql         # Group policies
├── members.test.sql        # Member policies
├── payments.test.sql       # Payment policies
└── run-rls-tests.sh       # Test runner
```

**Example RLS Test:**
```sql
-- Test: Staff can only see groups in their SACCO
BEGIN;
  SELECT plan(2);
  
  -- Setup test data
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "user-123", "org_id": "sacco-1"}';
  
  -- Test query
  SELECT results_eq(
    'SELECT id FROM groups',
    ARRAY['group-1', 'group-2']::uuid[],
    'Staff sees only their SACCO groups'
  );
  
  SELECT finish();
ROLLBACK;
```

---

## Running Tests

### Quick Test Commands

```bash
# Fastest: Run only changed files
pnpm test --changed

# Run specific test suite
pnpm test:unit           # Unit tests only
pnpm test:auth          # Auth security tests
pnpm test:rls           # RLS policy tests

# Run with coverage
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

### Test Environment Setup

#### For Unit/Integration Tests

```bash
# Install dependencies
pnpm install --frozen-lockfile

# No additional setup needed
pnpm test:unit
```

#### For RLS Tests

```bash
# Requires PostgreSQL running
# Default: postgresql://postgres:postgres@localhost:6543/ibimina_test

# Set custom database URL if needed
export RLS_TEST_DATABASE_URL=postgresql://user:pass@host:port/database

# Run tests
pnpm test:rls
```

#### For E2E Tests

```bash
# Install Playwright browsers (one-time)
pnpm exec playwright install --with-deps

# Build the app first
pnpm build

# Run E2E tests
pnpm test:e2e

# Run in UI mode for debugging
pnpm test:e2e:ui
```

---

## Coverage Requirements

### Coverage Thresholds

The project enforces minimum coverage thresholds:

```typescript
// apps/pwa/staff-admin/vitest.config.mts
coverage: {
  thresholds: {
    lines: 70,        // 70% line coverage
    branches: 65,     // 65% branch coverage
    functions: 70,    // 70% function coverage
    statements: 70,   // 70% statement coverage
  }
}
```

### Generating Coverage Reports

```bash
cd apps/pwa/staff-admin

# Generate coverage report
pnpm test:coverage

# Coverage reports generated at:
# - coverage/index.html (HTML report)
# - coverage/lcov.info (LCOV format)
# - Terminal output (text summary)
```

### Coverage Exclusions

The following are excluded from coverage:

- `node_modules/**`
- `tests/**` (test files themselves)
- `**/*.d.ts` (TypeScript declarations)
- `**/*.config.*` (configuration files)
- `**/types/**` (type definitions)

### Viewing Coverage Reports

```bash
# Open HTML coverage report in browser
open apps/pwa/staff-admin/coverage/index.html

# Or use a simple HTTP server
cd apps/pwa/staff-admin/coverage
python3 -m http.server 8080
# Visit http://localhost:8080
```

---

## Writing Tests

### Test Naming Conventions

```typescript
// Component tests
describe('ComponentName', () => {
  it('renders correctly', () => {});
  it('handles user interaction', () => {});
  it('displays error state', () => {});
});

// Integration tests
describe('Feature: Payment Processing', () => {
  it('processes cash payment successfully', () => {});
  it('handles invalid payment gracefully', () => {});
});

// E2E tests
test('user can complete payment workflow', async ({ page }) => {});
test('validation prevents invalid data submission', async ({ page }) => {});
```

### Test Organization

**Follow AAA Pattern:**
- **Arrange**: Set up test data and conditions
- **Act**: Perform the action being tested
- **Assert**: Verify the expected outcome

```typescript
it('calculates total correctly', () => {
  // Arrange
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(250);
});
```

### Mocking Best Practices

```typescript
// Mock external dependencies
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));

// Mock user interactions
const mockOnClick = vi.fn();
render(<Button onClick={mockOnClick}>Click</Button>);
await userEvent.click(screen.getByRole('button'));
expect(mockOnClick).toHaveBeenCalled();
```

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Push to `main` branch
- All pull requests
- Manual workflow dispatch

**Test Sequence in CI:**
```yaml
1. Feature flag validation
2. Lint all packages
3. Type check all packages
4. Run unit tests
5. Run auth security tests
6. Run RLS policy tests
7. Check for vulnerabilities
8. Verify i18n keys
9. Build with bundle analysis
10. Run E2E smoke tests
11. Run Lighthouse performance tests
```

### CI Environment

```yaml
# .github/workflows/ci.yml
env:
  CI: true
  HUSKY: 0  # Disable git hooks in CI
  
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: postgres
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
    ports:
      - 6543:5432
```

### Required Environment Variables for CI

```bash
# Supabase (for feature flag checks)
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

# For builds
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
BACKUP_PEPPER
MFA_SESSION_SECRET
TRUSTED_COOKIE_SECRET
OPENAI_API_KEY
HMAC_SHARED_SECRET
KMS_DATA_KEY_BASE64
```

---

## Best Practices

### General Testing Principles

1. **Test Behavior, Not Implementation**
   - Test what the component does, not how it does it
   - Avoid testing internal state or private methods

2. **Keep Tests Independent**
   - Each test should run in isolation
   - Don't rely on test execution order
   - Clean up after each test

3. **Use Descriptive Names**
   - Test names should describe the scenario
   - Should be readable as documentation

4. **Test Edge Cases**
   - Empty states
   - Error conditions
   - Boundary values
   - Loading states

5. **Avoid Test Duplication**
   - Don't test framework functionality
   - Don't test third-party libraries
   - Focus on your application logic

### Performance Testing

```typescript
// Measure render performance
it('renders large list efficiently', () => {
  const { container } = render(<LargeList items={1000} />);
  
  // Should render in under 100ms
  const startTime = performance.now();
  container.querySelector('.list-item');
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(100);
});
```

### Debugging Tests

```bash
# Run tests in debug mode
pnpm test --inspect-brk

# Run specific test with verbose output
pnpm test --reporter=verbose MyComponent.test.tsx

# Update snapshots
pnpm test -- -u

# Run tests matching pattern
pnpm test --grep "payment"
```

---

## Test Data Management

### Test Fixtures

Create reusable test data:

```typescript
// tests/fixtures/groups.ts
export const mockGroup = {
  id: 'group-123',
  name: 'Test Group',
  amount: 5000,
  frequency: 'weekly',
  members: []
};

// Use in tests
import { mockGroup } from '../fixtures/groups';
```

### Database Seeding for RLS Tests

```sql
-- supabase/tests/rls/seed-test-data.sql
INSERT INTO organizations (id, name, type) VALUES
  ('org-1', 'Test SACCO', 'SACCO');

INSERT INTO groups (id, org_id, name) VALUES
  ('group-1', 'org-1', 'Test Group');
```

---

## Troubleshooting

### Common Issues

**Tests fail with "Cannot find module"**
```bash
# Ensure dependencies installed
pnpm install --frozen-lockfile

# Clear cache
rm -rf node_modules/.cache
```

**RLS tests fail with connection error**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 6543

# Set correct database URL
export RLS_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:6543/ibimina_test
```

**E2E tests fail with "Browser not found"**
```bash
# Install Playwright browsers
pnpm exec playwright install --with-deps
```

**Coverage thresholds not met**
```bash
# Check coverage report
pnpm test:coverage

# Open HTML report to see uncovered lines
open apps/pwa/staff-admin/coverage/index.html
```

---

## Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)

### Internal Guides
- [UAT Checklist](apps/pwa/staff-admin/docs/UAT_CHECKLIST.md)
- [Testing Coverage Guide](docs/TESTING_COVERAGE_GUIDE.md)
- [CI Workflows](docs/CI_WORKFLOWS.md)

---

## Continuous Improvement

### Adding New Tests

When adding a new feature:
1. Write tests first (TDD approach recommended)
2. Ensure coverage thresholds met
3. Add E2E test for critical user flows
4. Update this documentation if needed

### Test Maintenance

- Review and update tests when refactoring
- Remove obsolete tests
- Keep test data realistic
- Monitor test execution time
- Investigate and fix flaky tests immediately

---

**Last Updated:** December 2024  
**Maintained by:** Ibimina QA Team  
**Version:** 1.0

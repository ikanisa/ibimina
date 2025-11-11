# Testing Strategy & Coverage - Ibimina Platform

This document provides a comprehensive overview of the testing strategy, current coverage, and test execution guidelines for the Ibimina SACCO Management Platform.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types](#test-types)
3. [Current Test Coverage](#current-test-coverage)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Test Infrastructure](#test-infrastructure)
8. [Known Gaps](#known-gaps)

## Testing Philosophy

### Testing Pyramid

```
              ┌─────────────────┐
              │   E2E Tests     │  <- Few, critical user journeys
              │   (Playwright)  │     Slow, expensive
              └─────────────────┘
                    ▲
                    │
         ┌──────────────────────┐
         │  Integration Tests   │  <- Some, key interactions
         │  (API + Database)    │     Medium speed
         └──────────────────────┘
                    ▲
                    │
      ┌─────────────────────────────┐
      │      Unit Tests              │  <- Many, fast
      │  (Business Logic, Utils)     │     Fast, isolated
      └─────────────────────────────────┘
```

### Testing Principles

1. **Test behavior, not implementation**: Focus on what the code does, not how
2. **Write readable tests**: Tests are documentation
3. **Keep tests fast**: Unit tests should run in milliseconds
4. **Isolate tests**: Each test should be independent
5. **Test the happy path and edge cases**: Cover normal flow + errors
6. **Mock external dependencies**: Don't call real APIs in unit tests

## Test Types

### 1. Unit Tests

**Location**: `apps/{app}/tests/unit/*.test.ts`

**Purpose**: Test individual functions and components in isolation

**Tools**:
- **Test Runner**: tsx (TypeScript execution)
- **Assertions**: Node.js built-in `assert`
- **Coverage**: c8 (Istanbul-based)

**Example**:
```typescript
// apps/admin/tests/unit/utils.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fmtCurrency } from '@/utils/format';

describe('fmtCurrency', () => {
  it('formats RWF correctly', () => {
    assert.strictEqual(fmtCurrency(1000, 'RWF'), 'RWF 1,000');
  });

  it('handles zero', () => {
    assert.strictEqual(fmtCurrency(0, 'RWF'), 'RWF 0');
  });

  it('handles negative numbers', () => {
    assert.strictEqual(fmtCurrency(-500, 'RWF'), 'RWF -500');
  });
});
```

### 2. Integration Tests

**Location**: `apps/{app}/tests/integration/*.test.ts`

**Purpose**: Test API routes, database operations, and service interactions

**Tools**:
- **Test Runner**: tsx
- **Database**: PostgreSQL test instance
- **Mocking**: Supabase test client

**Example**:
```typescript
// apps/admin/tests/integration/api.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { POST } from '@/app/api/groups/route';

describe('POST /api/groups', () => {
  it('creates a new group', async () => {
    const request = new Request('http://localhost/api/groups', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Group',
        sacco_id: 'test-sacco-id'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    assert.strictEqual(response.status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.group.id);
  });

  it('validates required fields', async () => {
    const request = new Request('http://localhost/api/groups', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    assert.strictEqual(response.status, 400);
    assert.strictEqual(data.success, false);
  });
});
```

### 3. Authentication Security Tests

**Location**: `apps/admin/tests/auth/*.test.ts`

**Purpose**: Validate authentication flows, session management, and MFA

**Coverage**:
- WhatsApp OTP generation and verification
- Passkey registration and authentication
- Session cookie security
- Device trust mechanisms
- MFA enforcement

**Example**:
```typescript
// apps/admin/tests/auth/otp.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateOTP, verifyOTP } from '@/lib/auth/otp';

describe('OTP Generation and Verification', () => {
  it('generates 6-digit code', () => {
    const otp = generateOTP();
    assert.strictEqual(otp.length, 6);
    assert.match(otp, /^\d{6}$/);
  });

  it('verifies correct OTP', () => {
    const otp = '123456';
    const hash = hashOTP(otp, 'test-pepper');
    assert.strictEqual(verifyOTP('123456', hash, 'test-pepper'), true);
  });

  it('rejects incorrect OTP', () => {
    const otp = '123456';
    const hash = hashOTP(otp, 'test-pepper');
    assert.strictEqual(verifyOTP('654321', hash, 'test-pepper'), false);
  });
});
```

### 4. Row-Level Security (RLS) Tests

**Location**: `supabase/tests/rls/*.test.sql`

**Purpose**: Verify database security policies

**Tools**:
- **psql**: PostgreSQL command-line client
- **Test Runner**: Custom bash script

**Example**:
```sql
-- supabase/tests/rls/members.test.sql
BEGIN;

-- Create test user
SELECT tests.create_supabase_user('test-member-1');
SET LOCAL jwt.claims.sub = 'test-member-1';

-- Test: Member can read own data
SELECT is(
  (SELECT count(*) FROM members WHERE user_id = 'test-member-1'),
  1::bigint,
  'Member can read own data'
);

-- Test: Member cannot read other members
SELECT is(
  (SELECT count(*) FROM members WHERE user_id != 'test-member-1'),
  0::bigint,
  'Member cannot read other members data'
);

ROLLBACK;
```

### 5. End-to-End (E2E) Tests

**Location**: `apps/{app}/tests/e2e/*.spec.ts`

**Purpose**: Test complete user workflows in a browser

**Tools**:
- **Test Runner**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Assertions**: Playwright expect

**Example**:
```typescript
// apps/admin/tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('successful login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('shows error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('[role="alert"]')).toContainText('Invalid credentials');
  });
});
```

### 6. Performance Tests

**Location**: `apps/platform-api/tests/performance/*.test.ts`

**Purpose**: Verify API performance under load

**Tools**:
- **Artillery**: Load testing
- **Custom benchmarks**: For specific operations

**Example**:
```yaml
# apps/platform-api/tests/performance/api-load.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Sustained load

scenarios:
  - name: "Get groups list"
    flow:
      - get:
          url: "/api/groups"
          headers:
            Authorization: "Bearer {{ token }}"
```

## Current Test Coverage

### Apps Coverage

| App | Unit Tests | Integration Tests | E2E Tests | Coverage |
|-----|-----------|-------------------|-----------|----------|
| **Admin** | ✅ Partial | ✅ Partial | ✅ Smoke tests | ~60% |
| **Client** | ✅ Partial | ⚠️ Limited | ⚠️ Limited | ~45% |
| **Platform API** | ✅ Yes | ✅ Yes | N/A | ~70% |

### Component Coverage

| Component | Status | Notes |
|-----------|--------|-------|
| Authentication | ✅ Good | Auth tests comprehensive |
| Payment Processing | ⚠️ Partial | Core logic tested, edge cases pending |
| Group Management | ⚠️ Partial | CRUD operations tested |
| SMS Parsing | ✅ Good | Multiple provider formats covered |
| Reconciliation | ⚠️ Limited | Complex flows need more coverage |
| Reports | ❌ Minimal | Report generation needs tests |
| RLS Policies | ✅ Good | Comprehensive SQL tests |

### Edge Functions Coverage

| Function | Tests | Status |
|----------|-------|--------|
| whatsapp-send-otp | ✅ | Unit + integration |
| whatsapp-verify-otp | ✅ | Unit + integration |
| parse-sms | ✅ | Unit tests |
| reconcile | ⚠️ | Limited coverage |
| analytics-forecast | ❌ | No tests |
| send-push-notification | ⚠️ | Basic tests only |

## Running Tests

### Quick Start

```bash
# From repository root

# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run auth security tests
pnpm test:auth

# Run RLS policy tests (requires PostgreSQL)
pnpm test:rls

# Run E2E tests
pnpm test:e2e
```

### Per-App Testing

#### Admin App

```bash
cd apps/admin

# Unit tests
pnpm test:unit

# Auth tests
pnpm test:auth

# Integration tests (includes RLS)
pnpm test:rls

# E2E tests (requires built app)
pnpm build
pnpm test:e2e

# E2E tests with UI
pnpm test:e2e:ui

# Coverage report
pnpm test:unit --coverage
```

#### Client App

```bash
cd apps/client

# Unit tests
pnpm test:unit

# E2E tests
pnpm build
pnpm test:e2e
```

### RLS Tests

```bash
# Prerequisites:
# 1. PostgreSQL running on localhost:6543
# 2. Database: ibimina_test
# 3. Connection string in RLS_TEST_DATABASE_URL

export RLS_TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:6543/ibimina_test"

# Run all RLS tests
pnpm test:rls

# Or manually:
cd apps/admin
bash scripts/db-reset.sh
for file in ../../supabase/tests/rls/*.test.sql; do
  psql $RLS_TEST_DATABASE_URL -f "$file"
done
```

### CI Pipeline Tests

```bash
# Run the full CI test suite locally
pnpm check:deploy

# This runs:
# 1. Feature flag validation
# 2. Linting
# 3. Type checking
# 4. Unit tests
# 5. Auth security tests
# 6. RLS policy tests
# 7. Build
# 8. E2E tests
# 9. Lighthouse performance checks
```

## Writing Tests

### Unit Test Template

```typescript
// tests/unit/myFunction.test.ts
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { myFunction } from '@/lib/myFunction';

describe('myFunction', () => {
  before(() => {
    // Setup before all tests
  });

  after(() => {
    // Cleanup after all tests
  });

  it('does something correctly', () => {
    const result = myFunction('input');
    assert.strictEqual(result, 'expected');
  });

  it('handles edge case', () => {
    assert.throws(() => {
      myFunction(null);
    }, /Expected error message/);
  });
});
```

### Integration Test Template

```typescript
// tests/integration/api.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createMockRequest } from '@/tests/helpers';

describe('API Integration', () => {
  it('returns expected response', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: '/api/endpoint'
    });

    const response = await handler(request);
    const data = await response.json();

    assert.strictEqual(response.status, 200);
    assert.ok(data.success);
  });
});
```

### E2E Test Template

```typescript
// tests/e2e/feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup for each test
    await page.goto('/');
  });

  test('user can complete action', async ({ page }) => {
    // Arrange
    await page.goto('/feature');

    // Act
    await page.click('button[data-testid="action"]');

    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Best Practices

1. **Use descriptive test names**
   ```typescript
   // ❌ Bad
   it('works', () => { ... });

   // ✅ Good
   it('validates phone number format', () => { ... });
   ```

2. **Arrange-Act-Assert pattern**
   ```typescript
   it('creates a new member', () => {
     // Arrange
     const data = { name: 'John', phone: '+250...' };

     // Act
     const result = createMember(data);

     // Assert
     assert.ok(result.id);
   });
   ```

3. **Test edge cases**
   ```typescript
   describe('divide', () => {
     it('divides two numbers', () => {
       assert.strictEqual(divide(10, 2), 5);
     });

     it('throws on division by zero', () => {
       assert.throws(() => divide(10, 0), /Cannot divide by zero/);
     });

     it('handles negative numbers', () => {
       assert.strictEqual(divide(-10, 2), -5);
     });
   });
   ```

4. **Mock external dependencies**
   ```typescript
   import { mock } from 'node:test';

   it('sends notification', async () => {
     const sendEmail = mock.fn(() => Promise.resolve({ success: true }));
     
     await notifyUser('user@example.com', sendEmail);
     
     assert.strictEqual(sendEmail.mock.calls.length, 1);
   });
   ```

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Every push to `main` branch
- All pull requests
- Manual workflow dispatch

**Workflow**: `.github/workflows/ci.yml`

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        ports:
          - 6543:5432
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ibimina_test

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm@10.19.0
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run lint
        run: pnpm lint
      
      - name: Run type check
        run: pnpm typecheck
      
      - name: Run unit tests
        run: pnpm test:unit
      
      - name: Run auth tests
        run: pnpm test:auth
      
      - name: Run RLS tests
        env:
          RLS_TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:6543/ibimina_test
        run: pnpm test:rls
      
      - name: Build apps
        run: pnpm build
      
      - name: Run E2E tests
        run: pnpm test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Test Failures

When tests fail in CI:

1. **Check the logs**: Click on the failed step in GitHub Actions
2. **Reproduce locally**: Use the same commands from CI
3. **Fix the issue**: Update code or tests
4. **Re-run**: Push changes to trigger new CI run

## Test Infrastructure

### Test Database

RLS tests require a PostgreSQL test database:

```bash
# Using Docker
docker run -d \
  --name ibimina-test-db \
  -p 6543:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ibimina_test \
  postgres:15

# Connection string
export RLS_TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:6543/ibimina_test"
```

### Test Helpers

Common test utilities:

```typescript
// tests/helpers.ts
export function createMockRequest(options: {
  method: string;
  url: string;
  body?: unknown;
}): Request {
  return new Request(options.url, {
    method: options.method,
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createTestUser() {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString()
  };
}
```

### Coverage Reports

Generate coverage reports:

```bash
# Unit test coverage
cd apps/admin
pnpm test:unit

# View coverage report
open coverage/unit/lcov-report/index.html
```

Coverage thresholds:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## Known Gaps

### Areas Needing Tests

1. **Report Generation**
   - PDF generation logic
   - CSV export formatting
   - Email delivery

2. **Complex Reconciliation Flows**
   - Multi-SACCO reconciliation
   - Exception handling
   - Manual review workflows

3. **Edge Functions**
   - Analytics forecasting
   - Scheduled jobs
   - Webhook handlers

4. **Mobile Apps**
   - Native functionality (NFC, biometrics)
   - Offline sync
   - Deep linking

5. **Performance**
   - Load testing for high traffic
   - Database query optimization
   - Bundle size monitoring

### Improvement Roadmap

**Q1 2026:**
- Increase unit test coverage to 80%
- Add integration tests for all API routes
- Implement load testing suite

**Q2 2026:**
- Add visual regression testing
- Implement mutation testing
- Set up continuous performance monitoring

**Q3 2026:**
- Add chaos engineering tests
- Implement security scanning automation
- Complete mobile app test coverage

## Resources

- [Node.js Test Runner Docs](https://nodejs.org/docs/latest/api/test.html)
- [Playwright Documentation](https://playwright.dev/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For testing questions:

- Review existing tests in `tests/` directories
- Check test documentation in README files
- Ask in GitHub Discussions
- Reference this guide for patterns and practices

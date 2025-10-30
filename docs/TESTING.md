# Testing Guide

This document describes the testing approach, conventions, and infrastructure
for the Ibimina monorepo.

## Overview

The project uses a comprehensive testing strategy covering:

- **Unit tests**: Testing individual functions and modules in isolation
- **Integration tests**: Testing interactions between components and services
- **End-to-end (E2E) tests**: Testing complete user workflows (admin app only)

## Test Infrastructure

### Test Runner

We use Node.js's built-in test runner (`node:test`) with TypeScript support via
`tsx`:

- Fast and lightweight
- No additional dependencies beyond tsx
- Native TypeScript support
- Familiar Jest-like API

### Running Tests

```bash
# Run all tests across the monorepo
pnpm test

# Run only unit tests
pnpm test:unit

# Run tests in a specific package
pnpm --filter @ibimina/admin run test:unit
pnpm --filter @ibimina/platform-api run test:unit
pnpm --filter @ibimina/client run test:unit
pnpm --filter @ibimina/ui run test:unit

# Note: @ibimina/core and @ibimina/testing packages don't have tests yet

# Run integration tests (platform-api)
pnpm --filter @ibimina/platform-api run test:integration

# Run E2E tests (admin only)
pnpm --filter @ibimina/admin run test:e2e

# Run security tests (admin only)
pnpm test:auth    # Authentication security tests
pnpm test:rls     # Row-level security policy tests
```

## Test Organization

### Directory Structure

```
apps/
  admin/
    tests/
      unit/           # Unit tests for utilities and services
      integration/    # Integration tests (auth, API)
      e2e/           # Playwright E2E tests
  platform-api/
    tests/
      unit/           # Unit tests for utilities
      integration/    # Integration tests for workers
  client/
    tests/
      unit/           # Unit tests for API wrappers

packages/
  ui/
    tests/
      unit/           # Unit tests for utility functions
```

### Naming Convention

- Unit test files: `*.test.ts`
- E2E test files: `*.spec.ts`
- Test files should be placed in a `tests/` directory parallel to `src/`

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions in isolation by mocking
dependencies.

**Example: Testing a utility function**

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cn } from "../../src/utils/cn.js";

describe("cn utility", () => {
  it("joins valid class names with spaces", () => {
    const result = cn("foo", "bar", "baz");
    assert.equal(result, "foo bar baz");
  });

  it("filters out falsy values", () => {
    const result = cn("foo", false, null, "bar");
    assert.equal(result, "foo bar");
  });
});
```

**Example: Testing with mocked fetch**

```typescript
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { invokeEdge } from "../../src/lib/edgeClient.js";

describe("invokeEdge", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("makes a POST request when body is provided", async () => {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ data: "created" }), {
        status: 201,
      });
    };

    const result = await invokeEdge("create-resource", {
      body: { name: "test" },
    });

    assert.deepEqual(result, { data: "created" });
  });
});
```

### Integration Tests

Integration tests validate interactions between multiple components with minimal
mocking.

**Example: Worker integration test**

```typescript
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

describe("MoMo poller worker integration", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      HMAC_SHARED_SECRET: "test-secret",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it("invokes edge function and queries polling status", async () => {
    const { runMomoPoller } = await import("../../src/workers/momo-poller.js");

    globalThis.fetch = async (input, init) => {
      if (input.toString().includes("momo-statement-poller")) {
        return new Response(JSON.stringify({ success: true }));
      }
      return new Response("[]");
    };

    await runMomoPoller();
    // Test completes without throwing
  });
});
```

### End-to-End Tests

E2E tests use Playwright to test complete user workflows in the admin app.

**Example: E2E test**

```typescript
import { test, expect } from "@playwright/test";

test("user can login", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");
});
```

## Best Practices

### General

1. **Test behavior, not implementation**: Focus on what the code does, not how
   it does it
2. **One assertion per test**: Keep tests focused and easy to debug
3. **Descriptive test names**: Use clear, descriptive names that explain what is
   being tested
4. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and
   verification phases

### Mocking

1. **Mock external dependencies**: Mock fetch, database calls, and external APIs
2. **Reset mocks after each test**: Use `afterEach` to clean up global state
3. **Minimal mocking in integration tests**: Only mock truly external
   dependencies

### Test Data

1. **Use realistic test data**: Use data that resembles production data
2. **Avoid hardcoded IDs**: Use meaningful identifiers in tests
3. **Clean up test data**: Reset state between tests

### Performance

1. **Keep unit tests fast**: Unit tests should run in milliseconds
2. **Parallelize when possible**: Tests should be independent and parallelizable
3. **Use timeouts appropriately**: Set reasonable timeouts for async operations

## CI/CD Integration

Tests are automatically run in CI/CD pipelines on every push and pull request.
The CI workflow (`.github/workflows/ci.yml`) includes:

```yaml
- name: Unit tests
  run: pnpm run test:unit

- name: Auth security tests
  run: pnpm run test:auth

- name: RLS policy tests
  run: pnpm run test:rls

- name: Playwright smoke tests
  run: pnpm run test:e2e
```

See `.github/workflows/ci.yml` for the complete CI configuration.

## Test Coverage

### Current Coverage (as of this PR)

| Package      | Unit Tests | Integration Tests | E2E Tests | Total    |
| ------------ | ---------- | ----------------- | --------- | -------- |
| admin        | 65         | Yes (auth, RLS)   | 6 specs   | 65+      |
| platform-api | 10         | 5                 | -         | 15       |
| client       | 8          | -                 | -         | 8        |
| ui           | 14         | -                 | -         | 14       |
| **Total**    | **97**     | **5+**            | **6**     | **102+** |

_Note: These are actual test counts as implemented. The "+" indicates additional
tests in integration/e2e suites that aren't counted individually._

### Coverage Goals

- **Unit tests**: Aim for >80% coverage of utility functions and business logic
- **Integration tests**: Cover critical workflows and service interactions
- **E2E tests**: Cover main user journeys and critical paths

## Troubleshooting

### Common Issues

**Tests fail with module resolution errors**

- Ensure `tsx` is installed: `pnpm add -D tsx`
- Check that `tsconfig.json` has correct `moduleResolution` settings
- Use `.js` extensions in imports for ES modules

**Tests timeout**

- Increase timeout in async tests: `{ timeout: 5000 }`
- Check for unhandled promises
- Ensure mocks are properly configured

**State leaks between tests**

- Use `beforeEach`/`afterEach` to reset global state
- Don't rely on test execution order
- Clear environment variables and mocks

## Additional Resources

- [Node.js Test Runner Documentation](https://nodejs.org/api/test.html)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure tests pass locally before committing
3. Add integration tests for new API endpoints or workflows
4. Update this documentation if adding new testing patterns

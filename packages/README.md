# Shared Packages

This directory contains shared packages used across multiple applications in the
ibimina monorepo.

## 📦 Package Overview

| Package              | Purpose                                  | Dependencies                   |
| -------------------- | ---------------------------------------- | ------------------------------ |
| **@ibimina/config**  | Environment configuration and validation | @ibimina/core, zod             |
| **@ibimina/core**    | Core business logic and domain models    | None                           |
| **@ibimina/lib**     | Utility functions and helpers            | @ibimina/config, @ibimina/core |
| **@ibimina/testing** | Testing utilities and helpers            | All packages                   |
| **@ibimina/ui**      | Shared React components                  | @ibimina/core, react           |

## 🔨 Build Order

Packages must be built in dependency order:

```
1. @ibimina/core       (no dependencies)
   ↓
2. @ibimina/config     (depends on: core)
   ↓
3. @ibimina/lib        (depends on: core, config)
   ↓
4. @ibimina/ui         (depends on: core)
   ↓
5. @ibimina/testing    (depends on: all above)
```

### Build All Packages

```bash
# Build in correct order (pnpm handles this automatically)
pnpm -r run build

# Or build specific packages in order
pnpm --filter @ibimina/core run build
pnpm --filter @ibimina/config run build
pnpm --filter @ibimina/lib run build
pnpm --filter @ibimina/ui run build
pnpm --filter @ibimina/testing run build
```

## 📚 Package Details

### @ibimina/config

**Purpose**: Environment configuration and validation

**Key Features**:

- Zod-based environment validation
- Type-safe environment access
- Server/client variable separation
- Required vs optional variables

**Usage**:

```typescript
import { env } from "@ibimina/config";

// Access validated environment variables
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY; // Server-only
```

**Build Output**: `dist/index.js`, `dist/index.d.ts`

**Important Files**:

- `src/env.ts`: Environment schema and validation
- `src/index.ts`: Package exports

### @ibimina/core

**Purpose**: Core business logic and domain models

**Key Features**:

- Shared TypeScript types
- Domain models
- Business constants
- Enums and interfaces

**Usage**:

```typescript
import type { User, Transaction } from "@ibimina/core";

// Use shared types
const user: User = {
  id: "123",
  name: "John Doe",
};
```

**Build Output**: `dist/index.js`, `dist/index.d.ts`

**Important Files**:

- `src/index.ts`: Core type definitions

### @ibimina/lib

**Purpose**: Shared utility functions and helpers

**Key Features**:

- Security utilities (HMAC, encryption)
- PII masking functions
- Structured logging
- Date/time helpers
- String formatting

**Usage**:

```typescript
import { maskPII, verifyWebhookSignature } from "@ibimina/lib";

// Mask PII in logs
const masked = maskPII("user@example.com", "email");
// Returns: 'us...@example.com'

// Verify webhook signatures
const isValid = await verifyWebhookSignature(payload, signature, secret);
```

**Build Output**: `dist/index.js`, `dist/index.d.ts`

**Important Files**:

- `src/security/`: Security utilities
- `src/index.ts`: Package exports

**Dependencies**:

- `@ibimina/config`: For environment access
- `@ibimina/core`: For type definitions

### @ibimina/ui

**Purpose**: Shared React components and design system

**Key Features**:

- Reusable React components
- Consistent styling (Tailwind CSS)
- Accessible components (ARIA)
- Form components
- Layout components

**Usage**:

```typescript
import { Button, Card } from '@ibimina/ui'

function MyComponent() {
  return (
    <Card>
      <Button onClick={() => console.log('clicked')}>
        Click Me
      </Button>
    </Card>
  )
}
```

**Build Output**: `dist/index.js`, `dist/index.d.ts`

**Important Files**:

- `src/components/`: React components
- `src/utils/`: Utility functions for UI
- `src/index.ts`: Component exports

**Dependencies**:

- `@ibimina/core`: For type definitions
- `react`: React library
- `tailwindcss`: Styling

### @ibimina/testing

**Purpose**: Shared testing utilities and helpers

**Key Features**:

- Test fixtures
- Mock factories
- Test utilities
- Database setup helpers

**Usage**:

```typescript
import { createMockUser, setupTestDb } from "@ibimina/testing";

describe("User tests", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  it("should create user", () => {
    const user = createMockUser();
    expect(user).toBeDefined();
  });
});
```

**Build Output**: `dist/index.js`, `dist/index.d.ts`

**Dependencies**: All other packages

## 🔧 Development Workflow

### Adding a New Package

1. **Create package directory**:

```bash
mkdir -p packages/new-package/src
cd packages/new-package
```

2. **Create package.json**:

```json
{
  "name": "@ibimina/new-package",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "eslint src/",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "@types/node": "20.19.21"
  }
}
```

3. **Create tsconfig.json**:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

4. **Create src/index.ts**:

```typescript
export * from "./your-exports";
```

5. **Update tsconfig.base.json** (root):

```json
{
  "paths": {
    "@ibimina/new-package": ["packages/new-package/src/index.ts"]
  }
}
```

6. **Update pnpm-workspace.yaml** (if not using wildcard):

```yaml
packages:
  - apps/*
  - packages/*
```

7. **Build and test**:

```bash
cd packages/new-package
pnpm run build
pnpm run test
```

### Modifying an Existing Package

1. **Make changes** to source files in `src/`

2. **Rebuild the package**:

```bash
pnpm --filter @ibimina/package-name run build
```

3. **Test changes**:

```bash
pnpm --filter @ibimina/package-name run test
```

4. **Rebuild dependent apps**:

```bash
pnpm --filter @ibimina/admin run build
```

### Common Commands

```bash
# Build all packages
pnpm -r run build

# Build specific package
pnpm --filter @ibimina/config run build

# Lint all packages
pnpm -r run lint

# Type check all packages
pnpm -r run typecheck

# Test all packages
pnpm -r run test

# Clean build artifacts
rm -rf packages/*/dist
```

## 🔒 Security Ground Rules (MANDATORY)

### 1. No Service Role Keys in Client Packages

**Rule**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-accessible code.

**Enforcement**:

- Prebuild hooks scan for service role keys
- CI pipelines fail if violations detected

**Allowed**:

```typescript
// ✅ Server-side package (@ibimina/lib)
import { createClient } from "@supabase/supabase-js";

export function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // OK in server packages
  );
}
```

**Forbidden**:

```typescript
// ❌ Client-accessible package (@ibimina/ui)
export function SomeComponent() {
  const client = createClient(
    url,
    process.env.SUPABASE_SERVICE_ROLE_KEY // FORBIDDEN!
  );
}
```

### 2. PII Masking Required

All packages that handle user data must use PII masking utilities from
`@ibimina/lib`:

```typescript
import { maskPII } from "@ibimina/lib";

// Mask before logging
console.log("User email:", maskPII(user.email, "email"));
console.log("User phone:", maskPII(user.phone, "phone"));
```

### 3. Type Safety

All packages must:

- Use TypeScript (no JavaScript)
- Export proper type definitions
- Enable strict mode
- Avoid `any` types

## 📝 Best Practices

### Package Structure

```
packages/package-name/
├── src/
│   ├── index.ts           # Main entry point
│   ├── types.ts           # Type definitions
│   └── [feature]/         # Feature modules
├── dist/                  # Build output (git-ignored)
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript config
└── README.md             # Package documentation
```

### Export Patterns

**Named exports (preferred)**:

```typescript
// src/index.ts
export { functionA } from "./moduleA";
export { functionB } from "./moduleB";
export type { TypeA } from "./types";
```

**Avoid barrel exports for large packages**:

```typescript
// ❌ Can cause circular dependencies
export * from "./module1";
export * from "./module2";

// ✅ Be explicit
export { specificExport1 } from "./module1";
export { specificExport2 } from "./module2";
```

### Dependencies

**Internal dependencies**:

- Use workspace protocol: `"@ibimina/core": "workspace:*"`
- Follow dependency order (core → config → lib → ui)

**External dependencies**:

- Place common deps in root `package.json`
- Package-specific deps in package `package.json`
- Use exact versions for critical deps

### Testing

Each package should have tests:

```
packages/package-name/
├── src/
│   ├── function.ts
│   └── function.test.ts    # Co-located tests
└── tests/
    └── integration.test.ts # Integration tests
```

Run tests:

```bash
pnpm --filter @ibimina/package-name run test
```

### Documentation

Each package should have:

- README.md with usage examples
- TSDoc comments for public APIs
- Type definitions for all exports

Example:

````typescript
/**
 * Masks personally identifiable information for logging.
 *
 * @param value - The PII value to mask
 * @param type - Type of PII (email, phone, etc.)
 * @returns Masked value safe for logging
 *
 * @example
 * ```typescript
 * maskPII('user@example.com', 'email')
 * // Returns: 'us...@example.com'
 * ```
 */
export function maskPII(value: string, type: PIIType): string {
  // Implementation
}
````

## 🚨 Common Issues

### Issue: Package Not Found

**Error**: `Cannot find module '@ibimina/package-name'`

**Solution**: Build the package first

```bash
pnpm --filter @ibimina/package-name run build
```

### Issue: Circular Dependencies

**Error**: Circular dependency warnings

**Solution**:

1. Review dependency graph
2. Move shared code to lower-level package (core)
3. Use dependency injection
4. Split into smaller packages

### Issue: Type Definitions Not Found

**Error**: Type definitions missing

**Solution**:

1. Ensure `types` field in package.json points to correct file
2. Rebuild package: `pnpm run build`
3. Check tsconfig compilerOptions include `"declaration": true`

### Issue: Build Fails

**Error**: Build errors in packages

**Solution**:

1. Check build order (dependencies first)
2. Clean and rebuild: `rm -rf dist && pnpm run build`
3. Verify tsconfig.json is correct
4. Check for TypeScript errors: `pnpm run typecheck`

## 🔗 Related Documentation

- [Ground Rules](../docs/GROUND_RULES.md) - Mandatory standards
- [Project Structure](../docs/PROJECT_STRUCTURE.md) - Overall structure
- [Troubleshooting](../docs/TROUBLESHOOTING.md) - Common issues
- [TypeScript Config](../tsconfig.base.json) - Base TS configuration

## 📞 Questions?

If you have questions about packages:

1. Check this README
2. Review package-specific README (if exists)
3. Ask in team chat
4. Open a discussion on GitHub

---

**Last Updated**: 2025-10-29  
**Maintainers**: Development Team

# Shared Packages

This directory contains shared packages used by the Staff Admin applications in
the ibimina monorepo.

## 📦 Package Overview

| Package                  | Purpose                                   | Dependencies                   |
| ------------------------ | ----------------------------------------- | ------------------------------ |
| **@ibimina/admin-core**  | Admin core business logic                 | @ibimina/config                |
| **@ibimina/config**      | Environment configuration and validation  | zod                            |
| **@ibimina/flags**       | Feature flag management                   | @ibimina/config                |
| **@ibimina/lib**         | Utility functions and helpers             | @ibimina/config                |
| **@ibimina/locales**     | Internationalization (i18n) messages      | None                           |
| **@ibimina/supabase-schemas** | Database type definitions            | None                           |
| **@ibimina/ui**          | Shared React components                   | @ibimina/lib, react            |

## 🔨 Build Order

Packages must be built in dependency order:

```
1. @ibimina/config       (no dependencies)
   @ibimina/locales      (no dependencies)
   @ibimina/supabase-schemas (no dependencies)
   ↓
2. @ibimina/flags        (depends on: config)
   @ibimina/lib          (depends on: config)
   @ibimina/admin-core   (depends on: config)
   ↓
3. @ibimina/ui           (depends on: lib)
```

### Build All Packages

```bash
# Build in correct order (pnpm handles this automatically)
pnpm build:packages

# Or build specific packages
pnpm --filter @ibimina/config build
pnpm --filter @ibimina/lib build
pnpm --filter @ibimina/ui build
```

## 📚 Package Details

### @ibimina/config

**Purpose**: Environment configuration and validation

**Key Features**:

- Zod-based environment validation
- Type-safe environment access
- Server/client variable separation

**Usage**:

```typescript
import { env } from "@ibimina/config";

// Access validated environment variables
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY; // Server-only
```

### @ibimina/lib

**Purpose**: Shared utility functions and helpers

**Key Features**:

- Security utilities (HMAC, encryption)
- PII masking functions
- Structured logging
- Date/time helpers

**Usage**:

```typescript
import { maskPII, verifyWebhookSignature } from "@ibimina/lib";

// Mask PII in logs
const masked = maskPII("user@example.com", "email");

// Verify webhook signatures
const isValid = await verifyWebhookSignature(payload, signature, secret);
```

### @ibimina/ui

**Purpose**: Shared React components and design system

**Key Features**:

- Reusable React components
- Consistent styling (Tailwind CSS)
- Accessible components (ARIA)

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

### @ibimina/locales

**Purpose**: Internationalization messages

**Key Features**:

- English translations
- Kinyarwanda translations
- French translations

### @ibimina/flags

**Purpose**: Feature flag management

**Key Features**:

- Feature flag definitions
- Runtime flag evaluation

### @ibimina/admin-core

**Purpose**: Admin core business logic

**Key Features**:

- Admin-specific domain logic
- Shared business rules

### @ibimina/supabase-schemas

**Purpose**: Database type definitions

**Key Features**:

- Generated TypeScript types from Supabase schema
- Type-safe database operations

## 🔧 Development Workflow

### Common Commands

```bash
# Build all packages
pnpm build:packages

# Build specific package
pnpm --filter @ibimina/config build

# Lint all packages
pnpm -r run lint

# Type check all packages
pnpm -r run typecheck

# Test all packages
pnpm -r run test
```

## 🔒 Security Ground Rules

### 1. No Service Role Keys in Client Packages

**Rule**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-accessible code.

### 2. PII Masking Required

All packages that handle user data must use PII masking:

```typescript
import { maskPII } from "@ibimina/lib";

console.log("User email:", maskPII(user.email, "email"));
```

### 3. Type Safety

All packages must:

- Use TypeScript (no JavaScript)
- Export proper type definitions
- Enable strict mode
- Avoid `any` types

## 🚨 Common Issues

### Issue: Package Not Found

**Error**: `Cannot find module '@ibimina/package-name'`

**Solution**: Build the package first

```bash
pnpm --filter @ibimina/package-name build
```

### Issue: Build Fails

**Error**: Build errors in packages

**Solution**:

1. Check build order (dependencies first)
2. Clean and rebuild: `rm -rf dist && pnpm build`
3. Run typecheck: `pnpm typecheck`

## 🔗 Related Documentation

- [Apps INDEX](../apps/INDEX.md) - Applications that use these packages
- [Packages INDEX](./INDEX.md) - Quick package reference

---

**Last Updated**: 2025-11-29
**Maintainers**: Development Team

# Packages Directory Index

This directory contains shared packages used across the Staff Admin applications
in the Ibimina monorepo.

## Package Overview

| Package                                      | Version | Purpose                           | Status    |
| -------------------------------------------- | ------- | --------------------------------- | --------- |
| [@ibimina/admin-core](./admin-core)          | 0.0.0   | Admin core business logic         | ✅ Active |
| [@ibimina/config](./config)                  | 0.0.0   | Environment configuration         | ✅ Active |
| [@ibimina/flags](./flags)                    | 0.1.0   | Feature flag management           | ✅ Active |
| [@ibimina/lib](./lib)                        | 0.0.0   | Shared utility functions          | ✅ Active |
| [@ibimina/locales](./locales)                | 0.0.0   | Internationalization (i18n)       | ✅ Active |
| [@ibimina/supabase-schemas](./supabase-schemas) | 0.0.0 | Database type definitions        | ✅ Active |
| [@ibimina/ui](./ui)                          | 0.0.0   | Shared React component library    | ✅ Active |

## Package Categories

### 🔧 Infrastructure Packages

**@ibimina/config**

- Environment variable validation
- Configuration management
- Type-safe environment access

**@ibimina/flags**

- Feature flag definitions
- Runtime flag evaluation

**@ibimina/supabase-schemas**

- Database type definitions
- Generated TypeScript types from Supabase

### 🛠️ Utility Packages

**@ibimina/lib**

- Security utilities (HMAC, encryption, PII masking)
- USSD template management
- Date/time helpers
- Logging utilities
- String formatting

**@ibimina/admin-core**

- Admin-specific business logic
- Domain models for staff operations

### 🌍 Localization

**@ibimina/locales**

- English translations
- Kinyarwanda translations
- French translations
- Translation helpers

### 🎨 UI Packages

**@ibimina/ui**

- React component library
- Design system components
- Tailwind CSS styling
- Accessible components

## Build Order

Packages must be built in dependency order:

```
1. @ibimina/config (no dependencies)
   @ibimina/locales (no dependencies)
   @ibimina/supabase-schemas (no dependencies)
   ↓
2. @ibimina/flags (depends on: config)
   @ibimina/lib (depends on: config)
   @ibimina/admin-core (depends on: config)
   ↓
3. @ibimina/ui (depends on: lib, locales)
```

**Build all packages** (pnpm handles order automatically):

```bash
pnpm build:packages
# or
pnpm --filter './packages/**' build
```

## Package Dependencies

### Internal Dependencies (workspace:\*)

```
@ibimina/ui
  ↓ depends on
  @ibimina/lib, @ibimina/locales

@ibimina/lib
  ↓ depends on
  @ibimina/config

@ibimina/flags
  ↓ depends on
  @ibimina/config

@ibimina/admin-core
  ↓ depends on
  @ibimina/config
```

### External Dependencies (Notable)

- `@supabase/supabase-js` - Database client
- `zod` - Schema validation
- `react` - UI library (for @ibimina/ui)
- `tailwindcss` - Styling (for @ibimina/ui)

## Usage in Applications

### Importing Packages

```typescript
// In staff-admin apps
import { env } from "@ibimina/config";
import { maskPII, verifyHMAC } from "@ibimina/lib";
import { Button, Card } from "@ibimina/ui";
import { useTranslations } from "@ibimina/locales";
import { getFeatureFlag } from "@ibimina/flags";
```

## Development Workflow

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Packages

```bash
# Build all packages
pnpm build:packages

# Build specific package
pnpm --filter @ibimina/lib build
```

### 3. Testing

```bash
# Test all packages
pnpm --filter './packages/**' test

# Test specific package
pnpm --filter @ibimina/lib test
```

### 4. Linting

```bash
# Lint all packages
pnpm --filter './packages/**' lint

# Lint specific package
pnpm --filter @ibimina/lib lint
```

## Package Standards

### Must Have

- ✅ TypeScript (no JavaScript files)
- ✅ Type definitions exported
- ✅ README.md with usage examples
- ✅ Build script in package.json

### Must Not Have

- ❌ Service role keys exposed
- ❌ PII in logs (use maskPII)
- ❌ `any` types (use proper typing)
- ❌ Circular dependencies

## Related Documentation

- [Full Packages README](./README.md) - Detailed package documentation
- [Apps INDEX](../apps/INDEX.md) - Applications that use these packages

---

**Last Updated**: 2025-11-29
**Maintainers**: Development Team

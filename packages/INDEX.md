# Packages Directory Index

This directory contains shared packages used across all applications in the Ibimina monorepo.

## Package Overview

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| [@ibimina/config](./config) | 0.0.0 | Environment configuration and validation | ✅ Active |
| [@ibimina/data-access](./data-access) | 0.1.0 | Database access layer and Supabase client utilities | ✅ Active |
| [@ibimina/flags](./flags) | 0.1.0 | Feature flag management | ✅ Active |
| [@ibimina/lib](./lib) | 0.0.0 | Shared utility functions and helpers | ✅ Active |
| [@ibimina/locales](./locales) | 0.0.0 | Internationalization (i18n) messages | ✅ Active |
| [@ibimina/tapmomo-proto](./tapmomo-proto) | 0.1.0 | TapMoMo NFC payment protocol | ✅ Active |
| [@ibimina/ui](./ui) | 0.0.0 | Shared React component library | ✅ Active |
| [eslint-plugin-ibimina](./eslint-plugin-ibimina) | 0.0.0 | Custom ESLint rules | ✅ Active |

## Package Categories

### 🔧 Infrastructure Packages

**@ibimina/config**
- Environment variable validation
- Configuration management
- Type-safe environment access

**@ibimina/data-access**
- Supabase client setup
- Database type definitions
- Query helpers

**@ibimina/flags**
- Feature flag definitions
- Runtime flag evaluation
- A/B testing support

### 🛠️ Utility Packages

**@ibimina/lib**
- Security utilities (HMAC, encryption, PII masking)
- USSD template management
- Date/time helpers
- Logging utilities
- String formatting

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

### 💳 Payment Protocols

**@ibimina/tapmomo-proto**
- TapMoMo NFC protocol implementation
- Payment payload encoding/decoding
- Security and validation

### 📋 Development Tools

**eslint-plugin-ibimina**
- Custom ESLint rules
- Code quality enforcement
- Best practices

## Build Order

Packages must be built in dependency order:

```
1. @ibimina/config (no dependencies)
   @ibimina/locales (no dependencies)
   eslint-plugin-ibimina (no dependencies)
   ↓
2. @ibimina/flags (depends on: config)
   @ibimina/lib (depends on: config)
   @ibimina/data-access (depends on: config)
   ↓
3. @ibimina/tapmomo-proto (depends on: lib)
   @ibimina/ui (depends on: lib, locales)
```

**Build all packages** (pnpm handles order automatically):
```bash
pnpm build:packages
# or
pnpm --filter './packages/**' build
```

## Package Dependencies

### Internal Dependencies (workspace:*)

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

@ibimina/data-access
  ↓ depends on
  @ibimina/config

@ibimina/tapmomo-proto
  ↓ depends on
  @ibimina/lib
```

### External Dependencies (Notable)

- `@supabase/supabase-js` - Database client
- `zod` - Schema validation
- `react` - UI library (for @ibimina/ui)
- `tailwindcss` - Styling (for @ibimina/ui)

## Usage in Applications

### Importing Packages

```typescript
// In any app (apps/pwa/staff-admin, apps/pwa/client, etc.)
import { env } from '@ibimina/config'
import { maskPII, verifyHMAC } from '@ibimina/lib'
import { Button, Card } from '@ibimina/ui'
import { useTranslations } from '@ibimina/locales'
import { getFeatureFlag } from '@ibimina/flags'
```

### TypeScript Path Mapping

Path mappings are defined in root `tsconfig.base.json`:

```json
{
  "paths": {
    "@ibimina/config": ["packages/config/src/index.ts"],
    "@ibimina/lib": ["packages/lib/src/index.ts"],
    "@ibimina/ui": ["packages/ui/src/index.ts"],
    "@ibimina/locales": ["packages/locales/src/index.ts"],
    "@ibimina/flags": ["packages/flags/src/index.ts"],
    "@ibimina/data-access": ["packages/data-access/src/index.ts"],
    "@ibimina/tapmomo-proto": ["packages/tapmomo-proto/src/index.ts"]
  }
}
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

### 3. Watch Mode (Development)

Most packages support watch mode for rapid development:

```bash
# In package directory
pnpm run dev
# or
pnpm run build --watch
```

### 4. Testing

```bash
# Test all packages
pnpm --filter './packages/**' test

# Test specific package
pnpm --filter @ibimina/lib test
```

### 5. Linting

```bash
# Lint all packages
pnpm --filter './packages/**' lint

# Lint specific package
pnpm --filter @ibimina/lib lint
```

## Adding a New Package

1. **Create package directory**:
   ```bash
   mkdir -p packages/new-package/src
   ```

2. **Create package.json**:
   ```json
   {
     "name": "@ibimina/new-package",
     "version": "0.0.0",
     "private": true,
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "scripts": {
       "build": "tsc",
       "dev": "tsc --watch",
       "lint": "eslint src/",
       "typecheck": "tsc --noEmit"
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
     "include": ["src/**/*"]
   }
   ```

4. **Add to tsconfig.base.json** (root):
   ```json
   {
     "paths": {
       "@ibimina/new-package": ["packages/new-package/src/index.ts"]
     }
   }
   ```

5. **Create src/index.ts** and start coding!

## Package Standards

### Must Have
- ✅ TypeScript (no JavaScript files)
- ✅ Type definitions exported
- ✅ README.md with usage examples
- ✅ Build script in package.json
- ✅ Tests (for utility packages)

### Should Have
- 📝 JSDoc comments for public APIs
- 🧪 Unit tests with good coverage
- 📚 Usage examples in README
- 🔒 Security considerations documented

### Must Not Have
- ❌ Service role keys exposed
- ❌ PII in logs (use maskPII)
- ❌ `any` types (use proper typing)
- ❌ Circular dependencies

## Security Rules

1. **Never expose service role keys** in client-accessible packages (@ibimina/ui)
2. **Always mask PII** when logging (use `maskPII` from @ibimina/lib)
3. **Use type-safe environment access** (use `env` from @ibimina/config)
4. **Validate external inputs** (use zod schemas)

## Troubleshooting

### "Cannot find module '@ibimina/package-name'"

**Solution**: Build the package first
```bash
pnpm --filter @ibimina/package-name build
```

### "Type definitions not found"

**Solution**: 
1. Check `types` field in package.json
2. Rebuild: `pnpm --filter @ibimina/package-name build`
3. Ensure tsconfig has `"declaration": true`

### "Circular dependency detected"

**Solution**:
1. Review dependency graph
2. Move shared code to lower-level package
3. Use dependency injection
4. Consider splitting into smaller packages

### Build fails in packages

**Solution**:
1. Check build order (dependencies first)
2. Clean and rebuild: `rm -rf dist && pnpm build`
3. Run typecheck: `pnpm typecheck`

## Related Documentation

- [Full Packages README](./README.md) - Detailed package documentation
- [Apps INDEX](../apps/INDEX.md) - Applications that use these packages
- [Ground Rules](../docs/GROUND_RULES.md) - Mandatory standards
- [REFACTORING_SUMMARY](../REFACTORING_SUMMARY.md) - Recent structure changes

---

**Last Updated**: 2025-11-11  
**Maintainers**: Development Team

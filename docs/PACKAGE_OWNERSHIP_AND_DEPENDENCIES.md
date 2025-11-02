# Package Ownership and Dependencies

**Version**: 1.0  
**Last Updated**: 2025-11-02  
**Status**: ✅ Complete - All packages mapped

This document provides a comprehensive overview of package ownership,
boundaries, and dependencies within the ibimina monorepo.

## 📦 Package Inventory

The ibimina monorepo contains **11 shared packages** and **6 applications**.

### Packages by Category

**Core Infrastructure** (no dependencies):

- `@ibimina/core` - Domain models and business logic

**Configuration & Environment**:

- `@ibimina/config` - Environment configuration and feature flags

**Utilities**:

- `@ibimina/lib` - Security utilities, PII masking, logging

**User Interface**:

- `@ibimina/ui` - Shared React components and design system

**Data & API**:

- `@ibimina/api` - API client utilities
- `@ibimina/data-access` - Database queries and schemas
- `@ibimina/providers` - Provider adapters and registry

**Localization**:

- `@ibimina/locales` - Internationalization and translations

**Integration**:

- `@ibimina/tapmomo-proto` - TapMomo payment protocol definitions

**AI & Automation**:

- `@ibimina/ai-agent` - AI agent orchestration

**Testing**:

- `@ibimina/testing` - Test utilities and fixtures

## 🔗 Package Dependency Matrix

| Package                  | Depends On                     | Used By Apps  |
| ------------------------ | ------------------------------ | ------------- |
| `@ibimina/core`          | None                           | admin, client |
| `@ibimina/config`        | (external: zod)                | All apps      |
| `@ibimina/lib`           | @ibimina/config, @ibimina/core | client        |
| `@ibimina/ui`            | @ibimina/core, react           | admin, client |
| `@ibimina/api`           | (source-only, no build)        | -             |
| `@ibimina/data-access`   | (external: various)            | -             |
| `@ibimina/providers`     | (source-only, no build)        | -             |
| `@ibimina/locales`       | (source-only, no build)        | All apps      |
| `@ibimina/tapmomo-proto` | (external: protobuf)           | -             |
| `@ibimina/ai-agent`      | (external: AI SDKs)            | -             |
| `@ibimina/testing`       | All packages (dev dependency)  | -             |

## 🏢 Application-to-Package Mapping

### Admin App (`apps/admin`)

**Dependencies**:

- `@ibimina/config` - Environment and feature flags
- `@ibimina/locales` - Translation strings
- `@ibimina/ui` - Shared UI components

**Path Aliases** (apps/admin/tsconfig.json):

```json
{
  "@/*": ["./*"],
  "@ibimina/config": ["../../packages/config/src/index.ts"],
  "@ibimina/core": ["../../packages/core/src/index.ts"],
  "@ibimina/locales": ["../../packages/locales/src/index.ts"],
  "@ibimina/testing": ["../../packages/testing/src/index.ts"],
  "@ibimina/ui": ["../../packages/ui/src/index.ts"]
}
```

**Notes**:

- Primary staff-facing application
- Uses core and testing for development
- Heaviest consumer of shared packages

### Client App (`apps/client`)

**Dependencies**:

- `@ibimina/config` - Environment configuration
- `@ibimina/locales` - i18n support
- `@ibimina/lib` - Utility functions
- `@ibimina/ui` - UI components

**Path Aliases** (apps/client/tsconfig.json):

```json
{
  "@/*": ["./*"],
  "@/utils/*": ["./src/utils/*"],
  "@ibimina/config": ["../../packages/config/src/index.ts"],
  "@ibimina/core": ["../../packages/core/src/index.ts"],
  "@ibimina/lib": ["../../packages/lib/src/index.ts"],
  "@ibimina/locales": ["../../packages/locales/src/index.ts"],
  "@ibimina/testing": ["../../packages/testing/src/index.ts"],
  "@ibimina/ui": ["../../packages/ui/src/index.ts"]
}
```

**Notes**:

- Member-facing application
- Includes lib for security and PII handling

### Website App (`apps/website`)

**Dependencies**:

- `@ibimina/config` - Environment configuration
- `@ibimina/locales` - Translations

**Path Aliases** (apps/website/tsconfig.json):

```json
{
  "@/*": ["./*"],
  "@ibimina/config": ["../../packages/config/src/index.ts"],
  "@ibimina/locales": ["../../packages/locales/src/index.ts"]
}
```

**Notes**:

- Marketing/public website
- Minimal dependencies by design

### Mobile App (`apps/mobile`)

**Dependencies**:

- `@ibimina/config` - Environment configuration
- `@ibimina/locales` - Translations

**Path Aliases** (apps/mobile/tsconfig.json):

```json
{
  "@/*": ["./src/*"],
  "@ibimina/config": ["../../packages/config/src/index.ts"],
  "@ibimina/locales": ["../../packages/locales/src/index.ts"]
}
```

**Notes**:

- React Native mobile application
- Minimal shared package usage

### Platform API (`apps/platform-api`)

**Dependencies**:

- `@ibimina/config` - Environment configuration

**Path Aliases** (apps/platform-api/tsconfig.json):

```json
{
  "@ibimina/config": ["../../packages/config/src/index.ts"]
}
```

**Notes**:

- API service layer (stub/future use)
- Intentionally minimal dependencies

## 📐 Package Build Architecture

### Packages with Build Steps

These packages compile TypeScript to JavaScript with type declarations:

1. **@ibimina/config**
   - Build: `tsc -p tsconfig.json`
   - Output: `dist/index.js`, `dist/index.d.ts`
   - Build time: ~2s

2. **@ibimina/core**
   - Build: `tsc -p tsconfig.json`
   - Output: `dist/` with declaration files
   - Build time: ~2s

3. **@ibimina/ai-agent**
   - Build: `tsc -p tsconfig.json`
   - Output: `dist/` with declarations
   - Build time: ~2s

4. **@ibimina/tapmomo-proto**
   - Build: `tsc -p tsconfig.json`
   - Output: `dist/` with type definitions
   - Build time: ~1s

5. **@ibimina/testing**
   - Build: `tsc -p tsconfig.json`
   - Output: `dist/` with test utilities
   - Build time: ~1s

6. **@ibimina/data-access** ⚠️
   - Build: `tsup src/index.ts --format cjs,esm --dts`
   - Output: ESM and CJS bundles
   - Note: Currently has build issues (tsup/incremental conflict)

7. **@ibimina/ui** ⚠️
   - Build: `tsc -p tsconfig.json`
   - Note: Currently has TypeScript errors in story files

### Source-Only Packages

These packages are consumed directly from source (no build step):

1. **@ibimina/api**
   - No build script
   - Imported directly from `src/index.ts`
   - Type-check only: `tsc --noEmit`

2. **@ibimina/lib**
   - No build script
   - Imported directly from `src/index.ts`
   - Type-check only: `tsc --noEmit`

3. **@ibimina/locales**
   - No build script
   - Imported directly from `src/index.ts`
   - Type-check only: `tsc --noEmit`

4. **@ibimina/providers**
   - No build script
   - Imported directly from `src/index.ts`
   - Type-check only: `tsc --noEmit`

## 🎯 Package Ownership Boundaries

### Core Package (`@ibimina/core`)

**Owner**: Platform Team  
**Purpose**: Domain models, business logic, shared types  
**Boundary Rules**:

- ✅ Pure TypeScript only (no external dependencies)
- ✅ Domain models and types
- ✅ Business constants and enums
- ❌ No framework-specific code
- ❌ No environment dependencies
- ❌ No side effects or I/O

**Example**:

```typescript
// ✅ Good: Pure type definitions
export interface User {
  id: string;
  name: string;
}

// ❌ Bad: Environment dependency
export const apiUrl = process.env.API_URL;
```

### Config Package (`@ibimina/config`)

**Owner**: Platform Team  
**Purpose**: Environment configuration, feature flags  
**Boundary Rules**:

- ✅ Environment variable validation (Zod)
- ✅ Feature flag definitions
- ✅ Configuration schemas
- ❌ No business logic
- ❌ No UI components
- ❌ No data access

**Example**:

```typescript
// ✅ Good: Configuration validation
export const env = envSchema.parse(process.env);

// ❌ Bad: Business logic
export function calculateLoanInterest(amount: number) { ... }
```

### Lib Package (`@ibimina/lib`)

**Owner**: Platform Team  
**Purpose**: Shared utilities, security, logging  
**Boundary Rules**:

- ✅ Pure utility functions
- ✅ Security utilities (HMAC, encryption)
- ✅ PII masking and logging
- ✅ Date/string helpers
- ❌ No UI components
- ❌ No direct database access
- ❌ No business-specific logic

**Example**:

```typescript
// ✅ Good: General utility
export function maskPII(value: string, type: PIIType): string {
  // ...
}

// ❌ Bad: Business-specific
export function calculateSACCOInterest(amount: number) {
  // ...
}
```

### UI Package (`@ibimina/ui`)

**Owner**: Design System Team  
**Purpose**: Shared React components  
**Boundary Rules**:

- ✅ Reusable React components
- ✅ Design system primitives
- ✅ Accessible components (ARIA)
- ✅ Styling (Tailwind CSS)
- ❌ No business logic
- ❌ No API calls
- ❌ No direct Supabase access

**Example**:

```typescript
// ✅ Good: Reusable component
export function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}

// ❌ Bad: API call in component
export function UserButton() {
  const user = await supabase.from("users").select();
  return <button>{user.name}</button>;
}
```

### Locales Package (`@ibimina/locales`)

**Owner**: i18n Team  
**Purpose**: Translation strings and i18n utilities  
**Boundary Rules**:

- ✅ Translation key definitions
- ✅ Translation strings (JSON/TS)
- ✅ i18n helper functions
- ❌ No UI components
- ❌ No business logic
- ❌ No environment dependencies

### Data Access Package (`@ibimina/data-access`)

**Owner**: Data Team  
**Purpose**: Database query abstractions  
**Boundary Rules**:

- ✅ Supabase query builders
- ✅ Database schemas (Zod)
- ✅ Type-safe queries
- ❌ No UI components
- ❌ No direct environment access (use config)
- ❌ No business logic (queries only)

### API Package (`@ibimina/api`)

**Owner**: Backend Team  
**Purpose**: API client utilities  
**Boundary Rules**:

- ✅ HTTP client wrappers
- ✅ API type definitions
- ✅ Request/response utilities
- ❌ No UI components
- ❌ No direct business logic
- ❌ No environment access (use config)

### Providers Package (`@ibimina/providers`)

**Owner**: Integration Team  
**Purpose**: Third-party provider adapters  
**Boundary Rules**:

- ✅ Provider adapters
- ✅ Provider registry
- ✅ Provider type definitions
- ❌ No UI components
- ❌ No direct environment access (use config)
- ❌ No business logic (adapters only)

### TapMomo Proto Package (`@ibimina/tapmomo-proto`)

**Owner**: Integration Team  
**Purpose**: TapMomo payment protocol definitions  
**Boundary Rules**:

- ✅ Protocol buffer definitions
- ✅ Message type definitions
- ✅ Protocol utilities
- ❌ No UI components
- ❌ No business logic
- ❌ No environment dependencies

### AI Agent Package (`@ibimina/ai-agent`)

**Owner**: AI Team  
**Purpose**: AI agent orchestration and tooling  
**Boundary Rules**:

- ✅ AI agent definitions
- ✅ Agent orchestration
- ✅ Tool definitions
- ❌ No UI components (except agent-specific)
- ❌ No direct business logic
- ❌ No direct database access

### Testing Package (`@ibimina/testing`)

**Owner**: Platform Team  
**Purpose**: Shared test utilities and fixtures  
**Boundary Rules**:

- ✅ Test fixtures and mocks
- ✅ Test database utilities
- ✅ Test helpers
- ✅ Can depend on all other packages
- ❌ Only used in dev/test environments
- ❌ Never imported in production code

## 🔄 Dependency Flow

### Build Order (for packages with build steps)

```
1. @ibimina/core       (no dependencies)
   ↓
2. @ibimina/config     (depends on: external only)
   ↓
3. @ibimina/lib        (depends on: core, config)
   ↓
4. @ibimina/ui         (depends on: core)
   ↓
5. @ibimina/testing    (depends on: all above)
```

**Note**: Packages without build steps (api, locales, providers, lib) can be
used immediately without building.

### Import Flow

```
Apps (admin, client, website, mobile, platform-api)
  ↓
Shared Packages (@ibimina/*)
  ↓
External Dependencies (react, zod, etc.)
```

## 🚨 Anti-Patterns to Avoid

### 1. Circular Dependencies

❌ **Bad**:

```typescript
// packages/config/src/index.ts
import { User } from "@ibimina/core";

// packages/core/src/index.ts
import { env } from "@ibimina/config";
```

✅ **Good**: Move shared code to lower-level package

### 2. Business Logic in UI

❌ **Bad**:

```typescript
// packages/ui/src/Button.tsx
export function LoanButton() {
  const interest = calculateLoanInterest(); // Business logic!
  return <button>Apply</button>;
}
```

✅ **Good**: Keep UI pure, pass data as props

### 3. Direct Environment Access

❌ **Bad**:

```typescript
// packages/lib/src/security.ts
const secret = process.env.HMAC_SECRET; // Direct access!
```

✅ **Good**: Use config package

```typescript
import { env } from "@ibimina/config";
const secret = env.HMAC_SHARED_SECRET;
```

### 4. Cross-App Imports

❌ **Bad**:

```typescript
// apps/client/src/page.tsx
import { AdminHeader } from "../../../admin/components/Header";
```

✅ **Good**: Extract to shared package

```typescript
// packages/ui/src/components/Header.tsx
export function Header() { ... }

// apps/client/src/page.tsx
import { Header } from "@ibimina/ui";
```

## 📊 Package Maintenance

### Adding a New Package

1. Create directory: `packages/new-package/`
2. Add `package.json` with name `@ibimina/new-package`
3. Add `tsconfig.json` extending `../../tsconfig.base.json`
4. Add `src/index.ts` with exports
5. Update `tsconfig.base.json` paths:
   ```json
   {
     "@ibimina/new-package": ["packages/new-package/src/index.ts"]
   }
   ```
6. Update this document with ownership and boundaries

### Removing a Package

1. Remove all imports from apps and other packages
2. Remove from `tsconfig.base.json` paths
3. Remove directory from `packages/`
4. Update this document

### Changing Package Dependencies

1. Update `package.json` in the package
2. Update app-level `tsconfig.json` files if needed
3. Run `pnpm install`
4. Update this document with new dependency

## 🔍 Audit Checklist

Use this checklist to verify package integrity:

- [ ] All packages listed in `tsconfig.base.json` paths
- [ ] All app `tsconfig.json` files include dependencies from `package.json`
- [ ] No circular dependencies between packages
- [ ] Build order is correct (core → config → lib → ui → testing)
- [ ] Source-only packages have no build script
- [ ] Build packages have working build scripts
- [ ] No cross-app imports
- [ ] Ownership boundaries are clear and documented
- [ ] pnpm-workspace.yaml includes all apps and packages

## 📚 Related Documentation

- [packages/README.md](../packages/README.md) - Package development guide
- [docs/PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Overall structure
- [tsconfig.base.json](../tsconfig.base.json) - Base TypeScript config
- [pnpm-workspace.yaml](../pnpm-workspace.yaml) - Workspace definition

---

**Maintainers**: Platform Team  
**Last Audit**: 2025-11-02  
**Next Review**: Quarterly or when packages change

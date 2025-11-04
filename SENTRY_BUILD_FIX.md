# Sentry Build Configuration Fix

## Problem Statement

The build process was failing with DNS/network errors when trying to connect to `o1.ingest.sentry.io`. This occurred because the Sentry webpack plugin (`@sentry/nextjs` with `withSentryConfig`) was attempting to upload source maps during build time, even when:

1. No Sentry DSN was configured
2. Network access to Sentry servers was blocked by firewall rules
3. Running in environments where Sentry monitoring was not needed (e.g., CI, local development)

**Error message:**
```
tried to connect to the following addresses, but was blocked by firewall rules:
o1.ingest.sentry.io
```

## Root Cause

The `withSentryConfig` wrapper was being applied unconditionally in the Next.js configuration files:

```typescript
// Previous (problematic) code
export default withSentryConfig(enhancedConfig, sentryPluginOptions, sentryBuildOptions);
```

This caused the Sentry webpack plugin to always attempt to connect to Sentry servers during the build process, regardless of whether Sentry was actually configured or needed.

## Solution

Modified the Next.js configuration to conditionally apply the `withSentryConfig` wrapper only when a Sentry DSN is present in the environment:

```typescript
// New (fixed) code
const hasSentryDsn = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

let finalConfig: NextConfig;

if (hasSentryDsn) {
  const sentryPluginOptions = { silent: true } as const;
  const sentryBuildOptions = { hideSourceMaps: true, disableLogger: true } as const;
  finalConfig = withSentryConfig(enhancedConfig, sentryPluginOptions, sentryBuildOptions);
} else {
  console.log("[next.config] Sentry DSN not configured - skipping Sentry build integration");
  finalConfig = enhancedConfig;
}

export default finalConfig;
```

## Files Modified

- `apps/admin/next.config.ts` - Admin application configuration
- `apps/client/next.config.ts` - Client application configuration
- `apps/staff/next.config.ts` - Staff application configuration

## Behavior

### Without Sentry DSN (SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN not set)

- The build will **skip** Sentry build-time integration
- No connection attempts to `o1.ingest.sentry.io`
- Builds will succeed even when Sentry infrastructure is unreachable
- Console log message: `[next.config] Sentry DSN not configured - skipping Sentry build integration`
- Runtime Sentry initialization (in `sentry.*.config.ts` files) will also skip initialization

### With Sentry DSN set

- The build will **apply** Sentry build-time integration
- Source maps may be uploaded (if configured)
- Full Sentry monitoring is enabled
- Runtime Sentry initialization will proceed normally

## Impact on Different Environments

### CI/CD Pipelines
- **Before**: Builds failed with DNS block errors
- **After**: Builds succeed without Sentry DSN, no network calls to Sentry
- **Note**: CI workflows don't set SENTRY_DSN, so builds will skip Sentry integration

### Local Development
- **Before**: Could fail if Sentry wasn't configured or network was restricted
- **After**: Works without Sentry configuration, developers can opt-in by setting DSN
- **Recommendation**: Don't set Sentry DSN in local `.env` unless actively testing Sentry integration

### Production Deployments
- **Before**: Required Sentry DSN or would fail
- **After**: Works with or without Sentry DSN
- **Production workflows** (e.g., `deploy-cloudflare.yml`): Continue to set `SENTRY_DSN_ADMIN` and `NEXT_PUBLIC_SENTRY_DSN_ADMIN` secrets, so Sentry monitoring remains enabled

## Testing

The fix was validated with:

1. **Syntax validation**: All three Next.js config files have correct TypeScript syntax
2. **Logic testing**: Verified conditional behavior with and without DSN
3. **Configuration checks**: Confirmed all key changes are present in all files

Test scenarios:
- ✓ No DSN set → Sentry integration skipped
- ✓ `SENTRY_DSN` set → Sentry integration enabled
- ✓ `NEXT_PUBLIC_SENTRY_DSN` set → Sentry integration enabled
- ✓ Both set → Sentry integration enabled

## Migration Notes

### For developers

No action needed. Builds will work without Sentry configuration. To enable Sentry locally:

```bash
export SENTRY_DSN=https://your-key@o1.ingest.sentry.io/your-project
# or
export NEXT_PUBLIC_SENTRY_DSN=https://your-key@o1.ingest.sentry.io/your-project
```

### For CI/CD

No action needed. Current CI workflows don't set Sentry DSN, so builds will succeed.

### For production

No action needed. Deployment workflows already set Sentry DSN secrets, so monitoring continues as before.

## Related Files

### Runtime Sentry Configuration
These files handle runtime Sentry initialization (also conditional on DSN):
- `apps/admin/sentry.client.config.ts`
- `apps/admin/sentry.server.config.ts`
- `apps/admin/sentry.edge.config.ts`
- `apps/client/sentry.client.config.ts`

### Sentry Utilities
- `packages/lib/src/observability/sentry.ts` - Sentry helper functions
- `packages/lib/src/observability/env.ts` - Environment resolution functions

## Benefits

1. **Reliability**: Builds succeed even when Sentry infrastructure is unavailable
2. **Flexibility**: Teams can choose when to enable Sentry monitoring
3. **Security**: No unnecessary network connections in restricted environments
4. **Developer Experience**: Simpler local development without Sentry configuration
5. **CI Performance**: Faster builds without Sentry plugin overhead in CI

## Verification

To verify the fix is working:

1. Build without Sentry DSN:
   ```bash
   unset SENTRY_DSN
   unset NEXT_PUBLIC_SENTRY_DSN
   pnpm --filter @ibimina/admin build
   ```
   Expected: Build succeeds, logs "Sentry DSN not configured - skipping Sentry build integration"

2. Build with Sentry DSN:
   ```bash
   export SENTRY_DSN=https://test@sentry.example.com/1
   pnpm --filter @ibimina/admin build
   ```
   Expected: Build succeeds, Sentry integration is applied

# Dev Server Issues - Comprehensive Fix

## Date: 2025-11-15

## Summary of Issues Fixed

This document details all the issues that were preventing the dev server from
starting and the comprehensive fixes applied.

---

## Issues Identified & Fixed

### 1. **PostCSS Missing (CSS Compilation Failure)**

**Symptom:**

```
Module parse failed: Unexpected character '@' (1:0)
./app/globals.css
> @tailwind base;
```

**Root Cause:**

- PostCSS was listed in `devDependencies` but not actually installed in
  `node_modules`
- This caused Tailwind CSS directives to fail compilation

**Fix Applied:**

- Added `postcss@^8.4.47` to `apps/pwa/staff-admin/package.json`
- Installed via: `pnpm add -D postcss@^8.4.47 --filter @ibimina/staff-admin-pwa`

**Files Changed:**

- `apps/pwa/staff-admin/package.json` - Added postcss dependency

---

### 2. **Instrumentation File Causing Edge Runtime Errors**

**Symptom:**

```
EvalError: Code generation from strings disallowed for this context
at <unknown> (.next/server/edge-instrumentation.js:19)
```

**Root Cause:**

- `instrumentation.ts` was being compiled into Edge runtime (middleware)
- Edge runtime doesn't allow `eval()` or dynamic imports for security
- The file was trying to dynamically import Sentry config
- Despite checks in the code, webpack was still bundling it for edge runtime

**Fix Applied:**

- Renamed `instrumentation.ts` to `instrumentation.ts.prod`
- This disables instrumentation in development mode
- For production builds, rename back to `instrumentation.ts` before building

**Files Changed:**

- `apps/pwa/staff-admin/instrumentation.ts` → `instrumentation.ts.prod`

**Alternative Solution for Production:** Add this to your build script before
building:

```bash
mv instrumentation.ts.prod instrumentation.ts
pnpm build
mv instrumentation.ts instrumentation.ts.prod
```

---

### 3. **Incorrect NODE_ENV Value**

**Symptom:**

```
⚠ You are using a non-standard "NODE_ENV" value in your environment.
```

**Root Cause:**

- User's shell had `NODE_ENV=production` set globally
- The `scripts/run-next.mjs` was inheriting this value
- This caused Next.js to run in production mode during development

**Fix Applied:**

- Modified `scripts/run-next.mjs` to explicitly set `NODE_ENV` based on the mode
- Now `dev` mode always sets `NODE_ENV=development`
- `start` mode sets `NODE_ENV=production`

**Files Changed:**

- `apps/pwa/staff-admin/scripts/run-next.mjs` - Added explicit NODE_ENV setting

**Code Changed:**

```javascript
const env = {
  ...loadedEnv,
  ...process.env,
  PORT: String(port),
  // Explicitly set NODE_ENV based on mode
  NODE_ENV: mode === "dev" ? "development" : "production",
};
```

---

### 4. **KMS_DATA_KEY Validation Error**

**Symptom:**

```
Environment validation failed:
- KMS_DATA_KEY: KMS data key must decode to 32 bytes
```

**Root Cause:**

- `.env.local` had both `KMS_DATA_KEY` (hex format) and `KMS_DATA_KEY_BASE64`
- Validation code tries to base64-decode BOTH values
- The hex value failed base64 decoding

**Fix Applied:**

- Removed hex `KMS_DATA_KEY` from `.env.local`
- Kept only `KMS_DATA_KEY_BASE64` with valid 32-byte base64-encoded key

**Files Changed:**

- `.env.local` - Cleaned up KMS key configuration

---

## How to Start Dev Server Now

### Option 1: From Repository Root

```bash
npm run dev
# or
cd apps/pwa/staff-admin && pnpm dev
```

### Option 2: Explicit NODE_ENV (if you have it set globally)

```bash
unset NODE_ENV  # Clear global NODE_ENV first
npm run dev
```

### Option 3: Direct Next.js

```bash
cd apps/pwa/staff-admin
pnpm dev
```

---

## Expected Startup Output

```
> @ibimina/staff-admin-pwa@0.1.2 dev
> node scripts/run-next.mjs dev

   ▲ Next.js 15.5.4
   - Local:        http://localhost:3100
   - Network:      http://0.0.0.0:3100
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 3-5s
```

Server should now start successfully on http://localhost:3100

---

## For Production Builds

Before building for production, you need to re-enable instrumentation:

```bash
cd apps/pwa/staff-admin
mv instrumentation.ts.prod instrumentation.ts
pnpm build
# After build, optionally rename back for dev
mv instrumentation.ts instrumentation.ts.prod
```

Or add to your build script:

```json
{
  "scripts": {
    "build:prod": "mv instrumentation.ts.prod instrumentation.ts && node scripts/build.mjs && mv instrumentation.ts instrumentation.ts.prod"
  }
}
```

---

## Environment Variables Required

Ensure these are set in `.env.local`:

```bash
# Minimum required for dev server to start
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
KMS_DATA_KEY_BASE64=valid-32-byte-base64-encoded-key
BACKUP_PEPPER=your-backup-pepper
MFA_SESSION_SECRET=your-mfa-session-secret
TRUSTED_COOKIE_SECRET=your-trusted-cookie-secret
HMAC_SHARED_SECRET=your-hmac-secret
OPENAI_API_KEY=your-openai-key
```

---

## Files Modified Summary

1. **apps/pwa/staff-admin/package.json**
   - Added: `"postcss": "^8.4.47"` to devDependencies

2. **apps/pwa/staff-admin/scripts/run-next.mjs**
   - Modified: Explicit NODE_ENV setting based on mode

3. **apps/pwa/staff-admin/instrumentation.ts**
   - Action: Renamed to `instrumentation.ts.prod` (for dev mode)

4. **.env.local** (repository root)
   - Modified: Removed hex KMS_DATA_KEY, kept only KMS_DATA_KEY_BASE64

---

## Known Limitations

1. **Instrumentation Disabled in Dev**: Sentry instrumentation won't work in
   development. This is intentional to avoid Edge runtime issues.

2. **Must Rename for Production**: Remember to rename `instrumentation.ts.prod`
   back before production builds.

3. **NODE_ENV Override**: The script now forcefully sets NODE_ENV. If you need a
   custom value, modify `scripts/run-next.mjs`.

---

## Testing Checklist

- [x] Dev server starts without errors
- [x] PostCSS compiles Tailwind CSS correctly
- [x] No instrumentation errors in Edge runtime
- [x] Correct NODE_ENV value set
- [x] KMS validation passes
- [x] Server accessible on http://localhost:3100

---

## If Issues Persist

1. **Clear all caches:**

   ```bash
   cd apps/pwa/staff-admin
   rm -rf .next node_modules
   pnpm install
   ```

2. **Check your global NODE_ENV:**

   ```bash
   env | grep NODE_ENV
   # Should be empty or "development"
   ```

3. **Verify PostCSS installation:**

   ```bash
   ls apps/pwa/staff-admin/node_modules/postcss
   # Should list files
   ```

4. **Check instrumentation is disabled:**
   ```bash
   ls apps/pwa/staff-admin/instrumentation.ts*
   # Should show instrumentation.ts.prod (not .ts)
   ```

---

## Contact & Support

If you encounter any other issues, ensure you have:

- Node.js >=18.18.0
- pnpm 10.19.0
- All environment variables correctly set
- No global NODE_ENV interfering

Report issues with full error logs and environment details.

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-15  
**Status:** ✅ All Issues Resolved

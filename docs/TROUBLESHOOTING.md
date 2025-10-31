# Troubleshooting Guide

**Version**: 1.0  
**Last Updated**: 2025-10-29

This document provides solutions to common issues encountered in the ibimina
project.

## 📋 Quick Reference

| Symptom                           | Section                                         | Quick Fix                   |
| --------------------------------- | ----------------------------------------------- | --------------------------- |
| Cannot find module '@ibimina/...' | [Build Issues](#build-issues)                   | Build shared packages first |
| RLS policy error                  | [Database Issues](#database-issues)             | Check RLS policies          |
| Type errors                       | [TypeScript Issues](#typescript-issues)         | Run `pnpm typecheck`        |
| Login fails                       | [Authentication Issues](#authentication-issues) | Check MFA config            |
| Build hangs                       | [Performance Issues](#performance-issues)       | Clear cache                 |
| Tests fail                        | [Testing Issues](#testing-issues)               | Check test database         |

## 🏗️ Build Issues

### Issue: Cannot Find Module '@ibimina/...'

#### Symptoms

```
Error: Cannot find module '@ibimina/config'
Module not found: Can't resolve '@ibimina/lib'
```

#### Causes

- Shared packages not built
- Incorrect tsconfig path mappings
- Missing package dependencies

#### Solutions

**1. Build shared packages in order**

```bash
# Build packages in dependency order
pnpm --filter @ibimina/core run build
pnpm --filter @ibimina/config run build
pnpm --filter @ibimina/lib run build
pnpm --filter @ibimina/ui run build
pnpm --filter @ibimina/testing run build

# Or build all packages
pnpm -r run build
```

**2. Verify tsconfig paths**

```bash
cat tsconfig.base.json
```

Ensure paths match actual structure:

```json
{
  "paths": {
    "@ibimina/config": ["packages/config/src/index.ts"],
    "@ibimina/core": ["packages/core/src/index.ts"],
    "@ibimina/lib": ["packages/lib/src/index.ts"],
    "@ibimina/testing": ["packages/testing/src/index.ts"],
    "@ibimina/ui": ["packages/ui/src/index.ts"]
  }
}
```

**3. Check package exports**

```bash
# Verify package.json exports
cat packages/config/package.json | grep -A 5 "main"
```

**4. Clean and rebuild**

```bash
# Clean build artifacts
pnpm clean  # if defined
rm -rf packages/*/dist
rm -rf apps/*/.next

# Rebuild
pnpm install
pnpm -r run build
```

### Issue: pnpm Install Fails

#### Symptoms

```
ERR_PNPM_NO_MATCHING_VERSION
ERR_PNPM_LOCKFILE_CONFLICT
```

#### Solutions

**1. Clear pnpm cache**

```bash
pnpm store prune
pnpm install
```

**2. Delete node_modules and reinstall**

```bash
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf apps/*/node_modules
pnpm install
```

**3. Update lockfile**

```bash
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

### Issue: Build Hangs or Times Out

#### Symptoms

- Build process never completes
- CPU at 100% for extended time
- Out of memory errors

#### Solutions

**1. Increase memory**

```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run build
```

**2. Clear caches**

```bash
# Clear Next.js cache
rm -rf apps/*/.next
rm -rf .next

# Clear TypeScript cache
rm -rf packages/*/tsconfig.tsbuildinfo
rm -rf apps/*/tsconfig.tsbuildinfo
```

**3. Build with verbose output**

```bash
pnpm run build --verbose
```

## 🔒 Authentication Issues

### Issue: Login Fails

#### Symptoms

- "Invalid credentials" error
- Redirect loop after login
- MFA code doesn't work

#### Solutions

**1. Check MFA configuration**

```bash
# Verify MFA environment variables
echo $MFA_RP_ID
echo $MFA_ORIGIN
echo $MFA_SESSION_SECRET
```

Must match domain:

- `MFA_RP_ID`: Just domain (e.g., `ibimina.rw`)
- `MFA_ORIGIN`: Full URL (e.g., `https://app.ibimina.rw`)

**2. Check Supabase connection**

```bash
# Test Supabase connection
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

**3. Verify user exists**

```sql
-- In Supabase SQL Editor
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'user@example.com';
```

**4. Check RLS policies**

```bash
pnpm run test:rls
```

### Issue: Passkey Registration Fails

#### Symptoms

- "Passkey not supported" error
- Registration modal doesn't appear
- Browser doesn't prompt for passkey

#### Solutions

**1. Verify HTTPS** Passkeys require HTTPS (except localhost):

```bash
# Check URL
echo $MFA_ORIGIN
# Must be https:// or http://localhost
```

**2. Check RP ID matches domain**

```bash
# RP ID should be domain without protocol
echo $MFA_RP_ID
# Should be: ibimina.rw (not app.ibimina.rw if subdomain)
```

**3. Test browser support**

```javascript
// In browser console
if (window.PublicKeyCredential) {
  console.log("Passkeys supported");
} else {
  console.log("Passkeys not supported");
}
```

### Issue: Session Expires Immediately

#### Symptoms

- User logged out immediately after login
- Session invalid errors

#### Solutions

**1. Check session secret**

```bash
# Verify MFA_SESSION_SECRET is set and valid
echo $MFA_SESSION_SECRET | wc -c
# Should be 64+ characters
```

**2. Check TTL settings**

```bash
echo $MFA_SESSION_TTL_SECONDS
# Default: 43200 (12 hours)
```

**3. Verify cookie settings**

- Check browser allows cookies
- Check Secure flag matches HTTPS
- Check SameSite settings

## 🗄️ Database Issues

### Issue: RLS Policy Error

#### Symptoms

```
Error: new row violates row-level security policy
Error: permission denied for table
```

#### Solutions

**1. Test RLS policies**

```bash
pnpm run test:rls
```

**2. Check user context**

```sql
-- In Supabase SQL Editor, test as user
SELECT auth.uid();  -- Should return user UUID
```

**3. Review policies**

```sql
-- List policies for table
\d+ table_name

-- Or in SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'table_name';
```

**4. Verify RLS is enabled**

```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'your_table';
```

**5. Test policy manually**

```sql
-- Set user context
SET request.jwt.claims = '{"sub": "user-uuid"}';

-- Try query
SELECT * FROM your_table;
```

### Issue: Migration Fails

#### Symptoms

```
Error: relation "table" already exists
Error: migration already applied
```

#### Solutions

**1. Make migrations idempotent**

```sql
-- Use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS my_table (...);
ALTER TABLE my_table ADD COLUMN IF NOT EXISTS new_col TEXT;
```

**2. Check migration status**

```bash
supabase migration list
```

**3. Rollback if needed**

```bash
# Rollback last migration
supabase migration down

# Or to specific version
supabase migration down --to-version 20251029120000
```

**4. Reset local database**

```bash
supabase db reset
```

### Issue: Slow Queries

#### Symptoms

- Queries taking > 1 second
- Database timeouts
- High CPU on database

#### Solutions

**1. Check for missing indexes**

```sql
-- Find tables without indexes
SELECT
  schemaname,
  tablename,
  attname
FROM pg_attribute
WHERE attrelid IN (
  SELECT oid FROM pg_class
  WHERE relkind = 'r'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
AND attname NOT IN (
  SELECT attname FROM pg_index
);
```

**2. Analyze query**

```sql
EXPLAIN ANALYZE
SELECT * FROM your_table WHERE condition;
```

**3. Add indexes**

```sql
CREATE INDEX idx_table_column ON your_table(column);
```

**4. Check connection pool**

```bash
# Monitor active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🧪 Testing Issues

### Issue: Tests Fail

#### Symptoms

- Unit tests fail unexpectedly
- E2E tests timeout
- RLS tests fail

#### Solutions

**1. Run tests with verbose output**

```bash
pnpm run test:unit -- --verbose
```

**2. Run specific test**

```bash
pnpm run test:unit -- path/to/test.test.ts
```

**3. Check test database**

```bash
# For RLS tests
echo $RLS_TEST_DATABASE_URL

# Verify connection
psql $RLS_TEST_DATABASE_URL -c "SELECT 1;"
```

**4. Clear test artifacts**

```bash
rm -rf apps/admin/test-results
rm -rf apps/admin/.reports
```

### Issue: E2E Tests Flaky

#### Symptoms

- Tests pass sometimes, fail other times
- Timeout errors
- Element not found errors

#### Solutions

**1. Add explicit waits**

```typescript
// Wait for element to be visible
await page.waitForSelector('[data-testid="element"]', {
  state: "visible",
  timeout: 10000,
});
```

**2. Use stable selectors**

```typescript
// ✅ Good: data-testid
await page.click('[data-testid="submit-button"]');

// ❌ Bad: class or text
await page.click(".btn-primary");
```

**3. Increase timeouts**

```typescript
// In playwright.config.ts
timeout: 30000; // 30 seconds
```

**4. Run in debug mode**

```bash
pnpm run test:e2e --debug
```

## 📊 Performance Issues

### Issue: Slow Page Load

#### Symptoms

- Pages take > 3 seconds to load
- Lighthouse score < 90
- Bundle size warnings

#### Solutions

**1. Analyze bundle**

```bash
ANALYZE_BUNDLE=1 pnpm run build
```

**2. Check bundle budgets**

```bash
pnpm run assert:bundle
```

**3. Optimize images**

- Use next/image component
- Convert to WebP
- Add width/height attributes

**4. Code splitting**

```typescript
// Use dynamic imports
const Component = dynamic(() => import('./Component'), {
  loading: () => <div>Loading...</div>
});
```

### Issue: High Memory Usage

#### Symptoms

- Node.js out of memory errors
- Browser tabs crash
- Server restarts frequently

#### Solutions

**1. Increase Node memory**

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

**2. Check for memory leaks**

```bash
# Profile memory usage
node --inspect your-script.js
```

**3. Clear caches**

```bash
# Clear build caches
rm -rf .next
rm -rf node_modules/.cache
```

## 🔧 Development Issues

### Issue: Hot Reload Not Working

#### Symptoms

- Changes not reflected in browser
- Need to restart dev server
- Page doesn't refresh

#### Solutions

**1. Check file watchers**

```bash
# Increase file watcher limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**2. Restart dev server**

```bash
# Stop server (Ctrl+C)
# Clear cache
rm -rf .next

# Restart
pnpm dev
```

**3. Check Fast Refresh**

```typescript
// Ensure components are exported properly
export default function MyComponent() {
  return <div>Hello</div>;
}
```

### Issue: TypeScript Errors

#### Symptoms

```
Type 'X' is not assignable to type 'Y'
Property 'prop' does not exist on type
```

#### Solutions

**1. Run type checker**

```bash
pnpm run typecheck
```

**2. Restart TypeScript server**

- VSCode: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

**3. Check tsconfig**

```bash
cat tsconfig.json
cat tsconfig.base.json
```

**4. Clear TypeScript cache**

```bash
rm -rf **/*.tsbuildinfo
```

## 🚀 Deployment Issues

### Issue: Deployment Fails

#### Symptoms

- Build fails in production
- Environment variables missing
- Service won't start

#### Solutions

**1. Validate production readiness**

```bash
pnpm run validate:production
```

**2. Check environment variables**

```bash
# Verify all required vars set
cat .env.example
# Compare with production config
```

**3. Test production build locally**

```bash
NODE_ENV=production pnpm run build
NODE_ENV=production pnpm start
```

**4. Check logs**

```bash
# PM2
pm2 logs

# Docker
docker-compose logs

# Systemd
journalctl -u ibimina-admin -n 100
```

### Issue: Edge Functions Fail

#### Symptoms

- Edge function errors
- Timeout errors
- Deployment fails

#### Solutions

**1. Test function locally**

```bash
supabase functions serve function-name
```

**2. Check function logs**

```bash
supabase functions logs function-name
```

**3. Verify secrets**

```bash
supabase secrets list
```

**4. Deploy with verbose output**

```bash
supabase functions deploy function-name --debug
```

## 🌐 Network Issues

### Issue: CORS Errors

#### Symptoms

```
Access to XMLHttpRequest blocked by CORS policy
No 'Access-Control-Allow-Origin' header
```

#### Solutions

**1. Check Supabase CORS settings**

- Supabase Dashboard → Settings → API
- Add allowed origins

**2. Verify request headers**

```javascript
fetch(url, {
  headers: {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
});
```

**3. Use proxy for development**

```typescript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.example.com/:path*",
      },
    ];
  },
};
```

### Issue: Rate Limited

#### Symptoms

```
429 Too Many Requests
Rate limit exceeded
```

#### Solutions

**1. Check rate limit config**

```bash
echo $RATE_LIMIT_MAX
echo $RATE_LIMIT_WINDOW_SECONDS
```

**2. Implement exponential backoff**

```typescript
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}
```

**3. Use rate limit bypass token**

```bash
# If configured
curl -H "Authorization: Bearer $RATE_LIMIT_TOKEN" $URL
```

## 🔍 Debugging Tips

### Enable Debug Logging

```bash
# Enable debug logs
DEBUG=* pnpm dev

# Or specific namespace
DEBUG=ibimina:* pnpm dev
```

### Check System Resources

```bash
# CPU usage
top

# Memory usage
free -h

# Disk space
df -h

# Open files
lsof | wc -l
```

### Browser DevTools

- **Console**: Check for JavaScript errors
- **Network**: Inspect API requests
- **Application**: Check localStorage, cookies
- **Performance**: Profile slow operations

### Database Debugging

```sql
-- Check active queries
SELECT pid, query, state, wait_event_type
FROM pg_stat_activity
WHERE state != 'idle';

-- Kill slow query
SELECT pg_terminate_backend(pid);

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 📞 Getting Help

If issues persist:

1. **Search existing issues**: Check GitHub issues for similar problems
2. **Check documentation**: Review relevant docs in `docs/`
3. **Ask the team**: Post in team chat with:
   - Error messages
   - Steps to reproduce
   - What you've tried
   - System info (OS, Node version)
4. **Create an issue**: If it's a bug, open a GitHub issue with:
   - Minimal reproduction
   - Expected vs actual behavior
   - Environment details
   - Logs/screenshots

## 🔗 Related Documentation

- [Ground Rules](GROUND_RULES.md) - Best practices
- [CI Workflows](CI_WORKFLOWS.md) - CI troubleshooting
- [Database Guide](DB_GUIDE.md) - Database issues
- [Quick Reference](QUICK_REFERENCE.md) - Common commands

---

**Last Updated**: 2025-10-29  
**Maintainers**: Development Team  
**Need Help?** Contact: team@ibimina.rw

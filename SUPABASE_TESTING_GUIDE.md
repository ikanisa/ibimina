# Supabase Backend Testing Guide

This guide provides instructions for testing and validating the Supabase backend.

## Quick Start

### Run Full Validation
```bash
bash scripts/validate-supabase-backend.sh
```

This automated script checks:
- Migration file integrity
- Table definitions and RLS coverage
- Function and trigger counts
- Index coverage
- Edge function presence
- Test file coverage

## Manual Testing Procedures

### 1. Apply New Migrations

**Local Development:**
```bash
supabase db reset
```

**Production:**
```bash
supabase db push --db-url $PRODUCTION_DB_URL
```

### 2. Run RLS Tests

**Prerequisites:**
- PostgreSQL must be running
- Test database configured

**Command:**
```bash
pnpm test:rls
```

**Expected Results:**
- All RLS policies should allow/deny access correctly
- Multi-tenancy isolation verified
- Role-based access working

### 3. Test Edge Functions

**Lint Edge Functions:**
```bash
cd supabase/functions
deno lint
```

**Type Check Edge Functions:**
```bash
cd supabase/functions
deno check **/*.ts
```

**Test Individual Function:**
```bash
cd supabase/functions
deno test function-name/
```

## Testing Checklist

Before deploying to production, verify:

- [ ] All migrations applied successfully
- [ ] Validation script passes all tests
- [ ] RLS test suite passes
- [ ] Edge functions lint without errors
- [ ] Edge functions type-check successfully
- [ ] No orphaned function references
- [ ] All tables have RLS policies
- [ ] Foreign keys properly defined
- [ ] Indexes cover critical queries

## Common Issues and Solutions

### Issue: RLS test fails with connection error
**Solution:** Ensure PostgreSQL is running and `RLS_TEST_DATABASE_URL` is set correctly.

### Issue: Edge function import errors
**Solution:** Check that `supabase/functions/_shared/` exists and contains all required utilities.

### Issue: Migration order conflicts
**Solution:** Migrations are timestamp-based. Ensure new migrations have later timestamps than existing ones.

### Issue: Function not found errors
**Solution:** Run validation script to check for missing function definitions. May need to create alias functions.

## Continuous Integration

The validation script can be integrated into CI/CD:

```yaml
- name: Validate Supabase Backend
  run: bash scripts/validate-supabase-backend.sh
```

## Monitoring Production

After deployment, monitor:

1. **Query Performance:**
   - Check slow query logs
   - Verify indexes are being used
   - Monitor query execution times

2. **RLS Policy Performance:**
   - Watch for policy-related slowdowns
   - Check for excessive policy evaluations
   - Monitor access denied errors

3. **Edge Function Health:**
   - Monitor function execution times
   - Check error rates
   - Review function logs

## Testing New Features

When adding new tables or functions:

1. **Add Migration:**
   ```bash
   supabase migration new feature_name
   ```

2. **Include RLS Policies:**
   - Always add RLS policies in the same migration
   - Test with different user roles
   - Verify multi-tenancy isolation

3. **Add Indexes:**
   - Index all foreign keys
   - Index frequently queried columns
   - Consider composite indexes for common queries

4. **Update Tests:**
   - Add RLS tests for new tables
   - Test edge cases
   - Verify access control

5. **Run Validation:**
   ```bash
   bash scripts/validate-supabase-backend.sh
   ```

## Debugging Tips

### Check Migration Status
```bash
supabase migration list
```

### View Applied Migrations
```bash
supabase db diff --schema public,app,app_helpers
```

### Test RLS Policy Directly
```sql
-- Set role to test user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "test-user-id"}';

-- Try query
SELECT * FROM your_table;
```

### Check Function Dependencies
```bash
# Find all function calls
grep -r "PERFORM\|SELECT.*FROM.*(" supabase/migrations/

# Check if function exists
grep "CREATE.*FUNCTION.*function_name" supabase/migrations/
```

## Performance Testing

### Test Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM your_table
WHERE condition;
```

### Check Index Usage
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname IN ('public', 'app', 'app_helpers')
ORDER BY idx_scan ASC;
```

### Monitor RLS Overhead
```sql
-- Disable RLS temporarily to compare
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
-- Run queries and compare performance
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Deno Documentation](https://deno.land/manual)

## Getting Help

If validation fails or you encounter issues:

1. Review the test report: `SUPABASE_BACKEND_TEST_REPORT.md`
2. Check migration files for syntax errors
3. Verify RLS policies are correctly scoped
4. Test edge functions individually
5. Review PostgreSQL logs for errors

---

**Last Updated:** 2025-11-04  
**Validation Script Version:** 1.0

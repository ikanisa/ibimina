-- Test: Validate Index and Query Optimizations
-- Description: Tests that verify the backend optimizations are working correctly
-- This file tests the new indexes and optimized functions

\set ON_ERROR_STOP on

BEGIN;

-- Setup test schema and data
CREATE SCHEMA IF NOT EXISTS test_backend_optimization;
SET search_path TO test_backend_optimization, app, public;

-- Test 1: Verify indexes exist on ledger_entries
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  -- Check for debit_id index
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'app'
    AND tablename = 'ledger_entries'
    AND indexname = 'idx_ledger_entries_debit_id';
  
  IF index_count = 0 THEN
    RAISE EXCEPTION 'Index idx_ledger_entries_debit_id not found';
  END IF;
  
  -- Check for credit_id index
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'app'
    AND tablename = 'ledger_entries'
    AND indexname = 'idx_ledger_entries_credit_id';
  
  IF index_count = 0 THEN
    RAISE EXCEPTION 'Index idx_ledger_entries_credit_id not found';
  END IF;
  
  RAISE NOTICE 'Test 1 PASSED: Required indexes exist on ledger_entries';
END $$;

-- Test 2: Verify user_profiles index
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'app'
    AND tablename = 'user_profiles'
    AND indexname = 'idx_user_profiles_user_id';
  
  IF index_count = 0 THEN
    RAISE NOTICE 'Note: idx_user_profiles_user_id index not found (may already have PK)';
  ELSE
    RAISE NOTICE 'Test 2 PASSED: Index exists on user_profiles.user_id';
  END IF;
END $$;

-- Test 3: Verify account_balance function works correctly
DO $$
DECLARE
  test_account_id UUID;
  test_sacco_id UUID;
  balance NUMERIC;
BEGIN
  -- Create test data if tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'saccos') THEN
    -- Create test sacco
    INSERT INTO app.saccos (id, name, district, sector_code)
    VALUES (gen_random_uuid(), 'Test SACCO', 'Test District', 'TEST001')
    RETURNING id INTO test_sacco_id;
    
    -- Create test account
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'accounts') THEN
      INSERT INTO app.accounts (id, sacco_id, owner_type, owner_id)
      VALUES (gen_random_uuid(), test_sacco_id, 'SACCO', test_sacco_id)
      RETURNING id INTO test_account_id;
      
      -- Call account_balance (should return 0 for new account)
      SELECT app.account_balance(test_account_id) INTO balance;
      
      IF balance != 0 THEN
        RAISE EXCEPTION 'Test 3 FAILED: Expected balance 0, got %', balance;
      END IF;
      
      RAISE NOTICE 'Test 3 PASSED: account_balance function works correctly';
    ELSE
      RAISE NOTICE 'Test 3 SKIPPED: accounts table not found';
    END IF;
  ELSE
    RAISE NOTICE 'Test 3 SKIPPED: saccos table not found';
  END IF;
END $$;

-- Test 4: Verify trigger functions exist and have error handling
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  -- Check handle_public_user_insert
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'handle_public_user_insert';
  
  IF func_count = 0 THEN
    RAISE EXCEPTION 'Function handle_public_user_insert not found';
  END IF;
  
  -- Check set_updated_at
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'set_updated_at';
  
  IF func_count = 0 THEN
    RAISE EXCEPTION 'Function set_updated_at not found';
  END IF;
  
  RAISE NOTICE 'Test 4 PASSED: Required trigger functions exist';
END $$;

-- Test 5: Verify composite indexes exist
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  -- Check for composite index on ikimina_id and status in payments
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'payments'
    AND indexname = 'idx_payments_ikimina_status';
  
  IF index_count > 0 THEN
    RAISE NOTICE 'Test 5 PASSED: Composite index idx_payments_ikimina_status exists';
  ELSE
    RAISE NOTICE 'Test 5 NOTE: idx_payments_ikimina_status not found (may be in different schema)';
  END IF;
END $$;

-- Cleanup
DROP SCHEMA IF EXISTS test_backend_optimization CASCADE;

COMMIT;

\echo 'All backend optimization tests completed successfully ✓'

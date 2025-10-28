-- Test multi-tenancy RLS policies: Verify no cross-tenant data leakage
-- This test ensures that users can only see data within their organization scope

-- Setup: Grant necessary permissions for testing
GRANT USAGE ON SCHEMA app TO app_authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_authenticator;
GRANT USAGE ON SCHEMA public TO app_authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_authenticator;

-- Load seed data first (assumes seed_multitenancy.sql has been run)
\echo '==================== Running Multi-Tenancy RLS Tests ===================='

-- Test 1: System Admin can see all data
\echo ''
\echo 'Test 1: System Admin Access (should see all organizations and members)'
SET ROLE app_authenticator;
SELECT set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000001', FALSE);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '70000000-0000-0000-0000-000000000001', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  FALSE
);

DO $$
DECLARE
  org_count INTEGER;
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM public.organizations WHERE name LIKE 'Seed%';
  SELECT COUNT(*) INTO member_count FROM app.members WHERE full_name LIKE 'Seed Member%';
  
  IF org_count < 4 THEN
    RAISE EXCEPTION 'System Admin should see all 4 organizations, got %', org_count;
  END IF;
  
  IF member_count < 8 THEN
    RAISE EXCEPTION 'System Admin should see all 8 members, got %', member_count;
  END IF;
  
  RAISE NOTICE '✓ System Admin can see all data: % orgs, % members', org_count, member_count;
END $$;

-- Reset
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', FALSE);
SELECT set_config('request.jwt.claims', '', FALSE);

-- Test 2: District Manager can see all child SACCOs/MFIs within district
\echo ''
\echo 'Test 2: District Manager Access (should see all SACCOs in district)'
SET ROLE app_authenticator;
SELECT set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000002', FALSE);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '70000000-0000-0000-0000-000000000002', 'app_metadata', json_build_object('role', 'DISTRICT_MANAGER'))::text,
  FALSE
);

DO $$
DECLARE
  sacco_count INTEGER;
  member_count INTEGER;
  alpha_members INTEGER;
  beta_members INTEGER;
BEGIN
  SELECT COUNT(*) INTO sacco_count FROM app.saccos WHERE name LIKE 'Seed%';
  SELECT COUNT(*) INTO member_count FROM app.members WHERE full_name LIKE 'Seed Member%';
  
  -- District manager should see both SACCOs
  IF sacco_count < 2 THEN
    RAISE EXCEPTION 'District Manager should see 2 SACCOs, got %', sacco_count;
  END IF;
  
  -- District manager should see all members in both SACCOs
  IF member_count < 8 THEN
    RAISE EXCEPTION 'District Manager should see 8 members across both SACCOs, got %', member_count;
  END IF;
  
  -- Verify can see members from both SACCOs
  SELECT COUNT(*) INTO alpha_members 
  FROM app.members 
  WHERE org_id = '20000000-0000-0000-0000-000000000001';
  
  SELECT COUNT(*) INTO beta_members 
  FROM app.members 
  WHERE org_id = '20000000-0000-0000-0000-000000000002';
  
  IF alpha_members < 5 THEN
    RAISE EXCEPTION 'District Manager should see 5 Alpha members, got %', alpha_members;
  END IF;
  
  IF beta_members < 3 THEN
    RAISE EXCEPTION 'District Manager should see 3 Beta members, got %', beta_members;
  END IF;
  
  RAISE NOTICE '✓ District Manager can see all child org data: % SACCOs, % members', sacco_count, member_count;
END $$;

-- Reset
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', FALSE);
SELECT set_config('request.jwt.claims', '', FALSE);

-- Test 3: SACCO Alpha Staff - limited to Alpha only (NO CROSS-TENANT LEAKAGE)
\echo ''
\echo 'Test 3: SACCO Alpha Staff (should ONLY see Alpha data, NO Beta data)'
SET ROLE app_authenticator;
SELECT set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000004', FALSE);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '70000000-0000-0000-0000-000000000004', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  FALSE
);

DO $$
DECLARE
  member_count INTEGER;
  alpha_members INTEGER;
  beta_members INTEGER;
  sacco_count INTEGER;
BEGIN
  -- Should see only Alpha members
  SELECT COUNT(*) INTO member_count FROM app.members WHERE full_name LIKE 'Seed Member%';
  
  SELECT COUNT(*) INTO alpha_members 
  FROM app.members 
  WHERE org_id = '20000000-0000-0000-0000-000000000001';
  
  SELECT COUNT(*) INTO beta_members 
  FROM app.members 
  WHERE org_id = '20000000-0000-0000-0000-000000000002';
  
  -- CRITICAL: No cross-tenant leakage
  IF beta_members > 0 THEN
    RAISE EXCEPTION '❌ CROSS-TENANT LEAKAGE: Alpha staff saw % Beta members (should be 0)', beta_members;
  END IF;
  
  IF alpha_members <> 5 THEN
    RAISE EXCEPTION 'Alpha staff should see exactly 5 Alpha members, got %', alpha_members;
  END IF;
  
  IF member_count <> 5 THEN
    RAISE EXCEPTION 'Alpha staff should see exactly 5 total members, got %', member_count;
  END IF;
  
  -- Should see only their SACCO
  SELECT COUNT(*) INTO sacco_count FROM app.saccos WHERE name LIKE 'Seed%';
  IF sacco_count <> 1 THEN
    RAISE EXCEPTION 'Alpha staff should see exactly 1 SACCO, got %', sacco_count;
  END IF;
  
  RAISE NOTICE '✓ No cross-tenant leakage: Alpha staff sees only Alpha data (% members)', alpha_members;
END $$;

-- Reset
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', FALSE);
SELECT set_config('request.jwt.claims', '', FALSE);

-- Test 4: SACCO Beta Manager - limited to Beta only (NO CROSS-TENANT LEAKAGE)
\echo ''
\echo 'Test 4: SACCO Beta Manager (should ONLY see Beta data, NO Alpha data)'
SET ROLE app_authenticator;
SELECT set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000005', FALSE);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '70000000-0000-0000-0000-000000000005', 'app_metadata', json_build_object('role', 'SACCO_MANAGER'))::text,
  FALSE
);

DO $$
DECLARE
  member_count INTEGER;
  alpha_members INTEGER;
  beta_members INTEGER;
  ikimina_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count FROM app.members WHERE full_name LIKE 'Seed Member%';
  
  SELECT COUNT(*) INTO alpha_members 
  FROM app.members 
  WHERE org_id = '20000000-0000-0000-0000-000000000001';
  
  SELECT COUNT(*) INTO beta_members 
  FROM app.members 
  WHERE org_id = '20000000-0000-0000-0000-000000000002';
  
  -- CRITICAL: No cross-tenant leakage
  IF alpha_members > 0 THEN
    RAISE EXCEPTION '❌ CROSS-TENANT LEAKAGE: Beta manager saw % Alpha members (should be 0)', alpha_members;
  END IF;
  
  IF beta_members <> 3 THEN
    RAISE EXCEPTION 'Beta manager should see exactly 3 Beta members, got %', beta_members;
  END IF;
  
  IF member_count <> 3 THEN
    RAISE EXCEPTION 'Beta manager should see exactly 3 total members, got %', member_count;
  END IF;
  
  -- Should see only Beta groups
  SELECT COUNT(*) INTO ikimina_count FROM app.ikimina WHERE name LIKE 'Seed%';
  IF ikimina_count <> 1 THEN
    RAISE EXCEPTION 'Beta manager should see exactly 1 group, got %', ikimina_count;
  END IF;
  
  RAISE NOTICE '✓ No cross-tenant leakage: Beta manager sees only Beta data (% members)', beta_members;
END $$;

-- Reset
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', FALSE);
SELECT set_config('request.jwt.claims', '', FALSE);

-- Test 5: MFI Staff - should not see SACCO data
\echo ''
\echo 'Test 5: MFI Staff (should NOT see SACCO member data)'
SET ROLE app_authenticator;
SELECT set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000007', FALSE);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '70000000-0000-0000-0000-000000000007', 'app_metadata', json_build_object('role', 'MFI_STAFF'))::text,
  FALSE
);

DO $$
DECLARE
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count FROM app.members WHERE full_name LIKE 'Seed Member%';
  
  -- MFI staff should not see SACCO members (they're in different org)
  IF member_count > 0 THEN
    RAISE EXCEPTION '❌ CROSS-TENANT LEAKAGE: MFI staff saw % SACCO members (should be 0)', member_count;
  END IF;
  
  RAISE NOTICE '✓ No cross-tenant leakage: MFI staff sees no SACCO members';
END $$;

-- Reset
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', FALSE);
SELECT set_config('request.jwt.claims', '', FALSE);

-- Test 6: Verify Alpha staff CANNOT insert into Beta
\echo ''
\echo 'Test 6: Cross-tenant write prevention (Alpha staff cannot insert Beta member)'
SET ROLE app_authenticator;
SELECT set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000004', FALSE);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '70000000-0000-0000-0000-000000000004', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  FALSE
);

DO $$
DECLARE
  insert_blocked BOOLEAN := FALSE;
BEGIN
  BEGIN
    -- Try to insert into Beta (should fail)
    INSERT INTO app.members (ikimina_id, sacco_id, member_code, full_name, msisdn, org_id)
    VALUES (
      '50000000-0000-0000-0000-000000000003',
      '40000000-0000-0000-0000-000000000002',
      'HACK-001',
      'Unauthorized Member',
      '250700000000',
      '20000000-0000-0000-0000-000000000002'
    );
  EXCEPTION
    WHEN OTHERS THEN
      insert_blocked := TRUE;
  END;
  
  IF NOT insert_blocked THEN
    RAISE EXCEPTION '❌ SECURITY BREACH: Alpha staff inserted into Beta SACCO';
  END IF;
  
  RAISE NOTICE '✓ Cross-tenant write blocked: Alpha staff cannot insert into Beta';
END $$;

-- Reset
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', FALSE);
SELECT set_config('request.jwt.claims', '', FALSE);

-- Test 7: Verify payments isolation
\echo ''
\echo 'Test 7: Payment data isolation (create test payments)'

-- Insert test payments as admin
INSERT INTO app.payments (sacco_id, msisdn, amount, txn_id, occurred_at, org_id, status)
VALUES 
  ('40000000-0000-0000-0000-000000000001', '250788111001', 5000, 'TXN-ALPHA-001', now(), '20000000-0000-0000-0000-000000000001', 'COMPLETED'),
  ('40000000-0000-0000-0000-000000000002', '250788222001', 3000, 'TXN-BETA-001', now(), '20000000-0000-0000-0000-000000000002', 'COMPLETED');

-- Test Alpha staff can only see Alpha payments
SET ROLE app_authenticator;
SELECT set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000004', FALSE);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '70000000-0000-0000-0000-000000000004', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  FALSE
);

DO $$
DECLARE
  payment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO payment_count 
  FROM app.payments 
  WHERE txn_id IN ('TXN-ALPHA-001', 'TXN-BETA-001');
  
  IF payment_count <> 1 THEN
    RAISE EXCEPTION 'Alpha staff should see exactly 1 payment (their own), got %', payment_count;
  END IF;
  
  RAISE NOTICE '✓ Payment isolation verified: Staff sees only own org payments';
END $$;

-- Reset
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', FALSE);
SELECT set_config('request.jwt.claims', '', FALSE);

-- Cleanup test payments
DELETE FROM app.payments WHERE txn_id IN ('TXN-ALPHA-001', 'TXN-BETA-001');

\echo ''
\echo '==================== All Multi-Tenancy RLS Tests Passed ✓ ===================='
\echo ''

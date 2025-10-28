-- Seed data for multi-tenant organizations, SACCOs, MFIs, groups and members
-- This seed creates a sample organizational hierarchy for testing

-- Clean up existing seed data (idempotent)
DELETE FROM public.org_memberships WHERE org_id IN (
  SELECT id FROM public.organizations WHERE name LIKE 'Seed%'
);
DELETE FROM app.members WHERE sacco_id IN (
  SELECT id FROM app.saccos WHERE name LIKE 'Seed%'
);
DELETE FROM app.ikimina WHERE sacco_id IN (
  SELECT id FROM app.saccos WHERE name LIKE 'Seed%'
);
DELETE FROM app.saccos WHERE name LIKE 'Seed%';
DELETE FROM public.organizations WHERE name LIKE 'Seed%';

-- 1. Create District Organization
INSERT INTO public.organizations (id, type, name, district_code, parent_id)
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'DISTRICT', 'Seed District - Gasabo', 'GASABO', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  district_code = EXCLUDED.district_code;

-- 2. Create SACCO Organizations (children of district)
INSERT INTO public.organizations (id, type, name, district_code, parent_id)
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'SACCO', 'Seed SACCO Alpha', NULL, '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'SACCO', 'Seed SACCO Beta', NULL, '10000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id;

-- 3. Create MFI Organization (child of district)
INSERT INTO public.organizations (id, type, name, district_code, parent_id)
VALUES 
  ('30000000-0000-0000-0000-000000000001', 'MFI', 'Seed MFI Capital', NULL, '10000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id;

-- 4. Create SACCO records linked to organizations
INSERT INTO app.saccos (id, name, district, sector_code, merchant_code, org_id, status)
VALUES 
  ('40000000-0000-0000-0000-000000000001', 'Seed SACCO Alpha', 'Gasabo', 'S001', 'MC-ALPHA', '20000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('40000000-0000-0000-0000-000000000002', 'Seed SACCO Beta', 'Gasabo', 'S002', 'MC-BETA', '20000000-0000-0000-0000-000000000002', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  org_id = EXCLUDED.org_id;

-- 5. Create sample Ikimina (groups) for each SACCO
INSERT INTO app.ikimina (id, sacco_id, code, name, type, org_id, status)
VALUES 
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'IK-ALPHA-01', 'Seed Alpha Savings Group 1', 'ASCA', '20000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'IK-ALPHA-02', 'Seed Alpha Investment Group', 'ROSCA', '20000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'IK-BETA-01', 'Seed Beta Community Group', 'ASCA', '20000000-0000-0000-0000-000000000002', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sacco_id = EXCLUDED.sacco_id,
  org_id = EXCLUDED.org_id;

-- 6. Create sample members
INSERT INTO app.members (id, ikimina_id, sacco_id, member_code, full_name, msisdn, org_id, status)
VALUES 
  -- Members in SACCO Alpha, Group 1
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'MA-001', 'Seed Member Alice Mukamana', '250788111001', '20000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'MA-002', 'Seed Member Bob Ntwari', '250788111002', '20000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'MA-003', 'Seed Member Claire Uwase', '250788111003', '20000000-0000-0000-0000-000000000001', 'ACTIVE'),
  
  -- Members in SACCO Alpha, Group 2
  ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'MA-004', 'Seed Member David Habimana', '250788111004', '20000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'MA-005', 'Seed Member Eva Ingabire', '250788111005', '20000000-0000-0000-0000-000000000001', 'ACTIVE'),
  
  -- Members in SACCO Beta, Group 1
  ('60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'MB-001', 'Seed Member Frank Mugisha', '250788222001', '20000000-0000-0000-0000-000000000002', 'ACTIVE'),
  ('60000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'MB-002', 'Seed Member Grace Umutoni', '250788222002', '20000000-0000-0000-0000-000000000002', 'ACTIVE'),
  ('60000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'MB-003', 'Seed Member Henry Kalisa', '250788222003', '20000000-0000-0000-0000-000000000002', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  org_id = EXCLUDED.org_id;

-- 7. Create test users for different roles
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
  -- System Admin
  ('70000000-0000-0000-0000-000000000001', 'seed.admin@test.ibimina.rw', crypt('password123', gen_salt('bf')), now(), 
   '{"role": "SYSTEM_ADMIN"}'::jsonb, '{"name": "Seed System Admin"}'::jsonb, now(), now()),
  
  -- District Manager
  ('70000000-0000-0000-0000-000000000002', 'seed.district@test.ibimina.rw', crypt('password123', gen_salt('bf')), now(),
   '{"role": "DISTRICT_MANAGER"}'::jsonb, '{"name": "Seed District Manager"}'::jsonb, now(), now()),
  
  -- SACCO Alpha Manager
  ('70000000-0000-0000-0000-000000000003', 'seed.sacco.alpha.manager@test.ibimina.rw', crypt('password123', gen_salt('bf')), now(),
   '{"role": "SACCO_MANAGER"}'::jsonb, '{"name": "Seed SACCO Alpha Manager"}'::jsonb, now(), now()),
  
  -- SACCO Alpha Staff
  ('70000000-0000-0000-0000-000000000004', 'seed.sacco.alpha.staff@test.ibimina.rw', crypt('password123', gen_salt('bf')), now(),
   '{"role": "SACCO_STAFF"}'::jsonb, '{"name": "Seed SACCO Alpha Staff"}'::jsonb, now(), now()),
  
  -- SACCO Beta Manager
  ('70000000-0000-0000-0000-000000000005', 'seed.sacco.beta.manager@test.ibimina.rw', crypt('password123', gen_salt('bf')), now(),
   '{"role": "SACCO_MANAGER"}'::jsonb, '{"name": "Seed SACCO Beta Manager"}'::jsonb, now(), now()),
  
  -- MFI Manager
  ('70000000-0000-0000-0000-000000000006', 'seed.mfi.manager@test.ibimina.rw', crypt('password123', gen_salt('bf')), now(),
   '{"role": "MFI_MANAGER"}'::jsonb, '{"name": "Seed MFI Manager"}'::jsonb, now(), now()),
  
  -- MFI Staff
  ('70000000-0000-0000-0000-000000000007', 'seed.mfi.staff@test.ibimina.rw', crypt('password123', gen_salt('bf')), now(),
   '{"role": "MFI_STAFF"}'::jsonb, '{"name": "Seed MFI Staff"}'::jsonb, now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- 8. Create organization memberships
INSERT INTO public.org_memberships (user_id, org_id, role)
VALUES 
  -- System Admin - no org membership needed (admin bypass)
  
  -- District Manager - member of district
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'DISTRICT_MANAGER'),
  
  -- SACCO Alpha Manager and Staff
  ('70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'SACCO_MANAGER'),
  ('70000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'SACCO_STAFF'),
  
  -- SACCO Beta Manager
  ('70000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'SACCO_MANAGER'),
  
  -- MFI Manager and Staff
  ('70000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', 'MFI_MANAGER'),
  ('70000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', 'MFI_STAFF')
ON CONFLICT (user_id, org_id) DO UPDATE SET
  role = EXCLUDED.role;

-- 9. Create user profiles for app.user_profiles (backwards compatibility)
INSERT INTO app.user_profiles (user_id, role, sacco_id)
VALUES 
  ('70000000-0000-0000-0000-000000000001', 'SYSTEM_ADMIN', NULL),
  ('70000000-0000-0000-0000-000000000002', 'DISTRICT_MANAGER', NULL),
  ('70000000-0000-0000-0000-000000000003', 'SACCO_MANAGER', '40000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000004', 'SACCO_STAFF', '40000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000005', 'SACCO_MANAGER', '40000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000006', 'MFI_MANAGER', NULL),
  ('70000000-0000-0000-0000-000000000007', 'MFI_STAFF', NULL)
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  sacco_id = EXCLUDED.sacco_id;

-- 10. Summary output
DO $$
DECLARE
  org_count INTEGER;
  sacco_count INTEGER;
  group_count INTEGER;
  member_count INTEGER;
  user_count INTEGER;
  membership_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM public.organizations WHERE name LIKE 'Seed%';
  SELECT COUNT(*) INTO sacco_count FROM app.saccos WHERE name LIKE 'Seed%';
  SELECT COUNT(*) INTO group_count FROM app.ikimina WHERE name LIKE 'Seed%';
  SELECT COUNT(*) INTO member_count FROM app.members WHERE full_name LIKE 'Seed Member%';
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE email LIKE 'seed.%@test.ibimina.rw';
  SELECT COUNT(*) INTO membership_count FROM public.org_memberships WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'seed.%@test.ibimina.rw'
  );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Multi-tenancy Seed Data Summary';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Organizations created: %', org_count;
  RAISE NOTICE '  - 1 District (Gasabo)';
  RAISE NOTICE '  - 2 SACCOs (Alpha, Beta)';
  RAISE NOTICE '  - 1 MFI (Capital)';
  RAISE NOTICE 'SACCO records created: %', sacco_count;
  RAISE NOTICE 'Groups (Ikimina) created: %', group_count;
  RAISE NOTICE 'Members created: %', member_count;
  RAISE NOTICE 'Test users created: %', user_count;
  RAISE NOTICE 'Organization memberships: %', membership_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test user credentials (password: password123):';
  RAISE NOTICE '  - seed.admin@test.ibimina.rw (SYSTEM_ADMIN)';
  RAISE NOTICE '  - seed.district@test.ibimina.rw (DISTRICT_MANAGER)';
  RAISE NOTICE '  - seed.sacco.alpha.manager@test.ibimina.rw (SACCO_MANAGER)';
  RAISE NOTICE '  - seed.sacco.alpha.staff@test.ibimina.rw (SACCO_STAFF)';
  RAISE NOTICE '  - seed.sacco.beta.manager@test.ibimina.rw (SACCO_MANAGER)';
  RAISE NOTICE '  - seed.mfi.manager@test.ibimina.rw (MFI_MANAGER)';
  RAISE NOTICE '  - seed.mfi.staff@test.ibimina.rw (MFI_STAFF)';
  RAISE NOTICE '========================================';
END $$;

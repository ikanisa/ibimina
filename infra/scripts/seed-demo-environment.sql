-- Enhanced demo environment seed for SACCO+ platform
-- This seed creates a comprehensive demo with realistic data for presentations and testing
--
-- ⚠️ WARNING: FOR DEMO/TESTING ONLY - DO NOT USE IN PRODUCTION ⚠️
-- This file contains hard-coded demo credentials and should NEVER be deployed to production.
-- Demo passwords: DemoPass123! (for illustration purposes only)
--
-- Includes:
-- - 1 District (Gasabo)
-- - 2 SACCOs (Kigali Savings & Nyarugenge Cooperative)
-- - 1 MFI (Rwanda Community Capital)
-- - Multiple ikimina groups with members
-- - Sample transactions and activities
--
-- Usage: Run this after the main multitenancy seed or independently
--        psql $DATABASE_URL -f infra/scripts/seed-demo-environment.sql

BEGIN;

-- Clean up existing demo data (idempotent)
DELETE FROM public.org_memberships WHERE org_id IN (
  SELECT id FROM public.organizations WHERE name LIKE 'Demo%'
);
DELETE FROM app.members WHERE sacco_id IN (
  SELECT id FROM app.saccos WHERE name LIKE 'Demo%'
);
DELETE FROM app.ikimina WHERE sacco_id IN (
  SELECT id FROM app.saccos WHERE name LIKE 'Demo%'
);
DELETE FROM app.saccos WHERE name LIKE 'Demo%';
DELETE FROM public.organizations WHERE name LIKE 'Demo%';

-- 1. Create Demo District Organization
INSERT INTO public.organizations (id, type, name, district_code, parent_id, created_at, updated_at)
VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'DISTRICT', 'Demo District - Gasabo', 'GASABO', NULL, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  district_code = EXCLUDED.district_code,
  updated_at = now();

-- 2. Create Demo SACCO Organizations (children of district)
INSERT INTO public.organizations (id, type, name, district_code, parent_id, created_at, updated_at)
VALUES 
  ('d0000000-0000-0000-0000-000000000002', 'SACCO', 'Demo Kigali Savings SACCO', NULL, 'd0000000-0000-0000-0000-000000000001', now(), now()),
  ('d0000000-0000-0000-0000-000000000003', 'SACCO', 'Demo Nyarugenge Cooperative', NULL, 'd0000000-0000-0000-0000-000000000001', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  updated_at = now();

-- 3. Create Demo MFI Organization (child of district)
INSERT INTO public.organizations (id, type, name, district_code, parent_id, created_at, updated_at)
VALUES 
  ('d0000000-0000-0000-0000-000000000004', 'MFI', 'Demo Rwanda Community Capital', NULL, 'd0000000-0000-0000-0000-000000000001', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  updated_at = now();

-- 4. Create Demo SACCO records linked to organizations
INSERT INTO app.saccos (id, name, district, sector_code, merchant_code, org_id, status, created_at, updated_at)
VALUES 
  ('d1000000-0000-0000-0000-000000000001', 'Demo Kigali Savings SACCO', 'Gasabo', 'REMERA', 'MC-DEMO-KGL', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d1000000-0000-0000-0000-000000000002', 'Demo Nyarugenge Cooperative', 'Gasabo', 'KACYIRU', 'MC-DEMO-NYA', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  org_id = EXCLUDED.org_id,
  updated_at = now();

-- 5. Create Demo Ikimina (groups) with realistic names
INSERT INTO app.ikimina (id, sacco_id, code, name, type, org_id, status, created_at, updated_at)
VALUES 
  -- Kigali Savings groups
  ('d2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'IK-KGL-001', 'Demo Umuganda Women Entrepreneurs', 'ASCA', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'IK-KGL-002', 'Demo Inyange Youth Investment', 'ROSCA', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'IK-KGL-003', 'Demo Agaciro Farmers Group', 'VSLA', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  
  -- Nyarugenge Cooperative groups
  ('d2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'IK-NYA-001', 'Demo Kigali Market Traders', 'ASCA', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'IK-NYA-002', 'Demo Unity Community Savings', 'ROSCA', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sacco_id = EXCLUDED.sacco_id,
  org_id = EXCLUDED.org_id,
  updated_at = now();

-- 6. Create Demo members with realistic Rwandan names
INSERT INTO app.members (id, ikimina_id, sacco_id, member_code, full_name, msisdn, org_id, status, created_at, updated_at)
VALUES 
  -- Umuganda Women Entrepreneurs (8 members)
  ('d3000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'MKG-001', 'Demo Marie Mukamana', '250788100001', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'MKG-002', 'Demo Grace Uwamahoro', '250788100002', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'MKG-003', 'Demo Jeanne Nyirahabimana', '250788100003', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'MKG-004', 'Demo Alice Uwase', '250788100004', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000005', 'd2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'MKG-005', 'Demo Francine Umutoni', '250788100005', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000006', 'd2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'MKG-006', 'Demo Claudine Ingabire', '250788100006', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000007', 'd2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'MKG-007', 'Demo Solange Mukamazimpaka', '250788100007', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000008', 'd2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'MKG-008', 'Demo Vestine Nyiransabimana', '250788100008', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  
  -- Inyange Youth Investment (6 members)
  ('d3000000-0000-0000-0000-000000000009', 'd2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'MKG-009', 'Demo Jean Paul Nkurunziza', '250788100009', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000010', 'd2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'MKG-010', 'Demo Eric Mugisha', '250788100010', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000011', 'd2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'MKG-011', 'Demo Patrick Habimana', '250788100011', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000012', 'd2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'MKG-012', 'Demo Emmanuel Ntwari', '250788100012', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000013', 'd2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'MKG-013', 'Demo Samuel Kalisa', '250788100013', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000014', 'd2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'MKG-014', 'Demo David Bizimana', '250788100014', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  
  -- Agaciro Farmers Group (10 members)
  ('d3000000-0000-0000-0000-000000000015', 'd2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'MKG-015', 'Demo Joseph Rwakagara', '250788100015', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000016', 'd2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'MKG-016', 'Demo Christine Mukandayisenga', '250788100016', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000017', 'd2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'MKG-017', 'Demo François Nsabimana', '250788100017', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000018', 'd2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'MKG-018', 'Demo Beatrice Mukantabana', '250788100018', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000019', 'd2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'MKG-019', 'Demo Antoine Niyonzima', '250788100019', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000020', 'd2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'MKG-020', 'Demo Immaculée Nyiramana', '250788100020', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000021', 'd2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'MKG-021', 'Demo Pierre Hakizimana', '250788100021', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000022', 'd2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'MKG-022', 'Demo Esperance Mujawamariya', '250788100022', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000023', 'd2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'MKG-023', 'Demo Vincent Mugabo', '250788100023', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000024', 'd2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'MKG-024', 'Demo Agnès Nyiramahoro', '250788100024', 'd0000000-0000-0000-0000-000000000002', 'ACTIVE', now(), now()),
  
  -- Kigali Market Traders (7 members)
  ('d3000000-0000-0000-0000-000000000025', 'd2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'MNY-001', 'Demo Rose Mukanyonga', '250788200001', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000026', 'd2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'MNY-002', 'Demo Theophile Niyonsenga', '250788200002', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000027', 'd2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'MNY-003', 'Demo Cecile Uwimana', '250788200003', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000028', 'd2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'MNY-004', 'Demo Felix Ndahiro', '250788200004', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000029', 'd2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'MNY-005', 'Demo Donatille Mukantagara', '250788200005', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000030', 'd2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'MNY-006', 'Demo Gilbert Ntirenganya', '250788200006', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000031', 'd2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'MNY-007', 'Demo Josephine Nyirabagenzi', '250788200007', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  
  -- Unity Community Savings (8 members)
  ('d3000000-0000-0000-0000-000000000032', 'd2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'MNY-008', 'Demo Charles Nsengiyumva', '250788200008', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000033', 'd2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'MNY-009', 'Demo Brigitte Nyirahabineza', '250788200009', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000034', 'd2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'MNY-010', 'Demo Michel Kayumba', '250788200010', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000035', 'd2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'MNY-011', 'Demo Angelique Mukamurenzi', '250788200011', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000036', 'd2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'MNY-012', 'Demo Innocent Nshimiyimana', '250788200012', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000037', 'd2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'MNY-013', 'Demo Odette Mukamuranga', '250788200013', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000038', 'd2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'MNY-014', 'Demo Bernard Kamanzi', '250788200014', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now()),
  ('d3000000-0000-0000-0000-000000000039', 'd2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'MNY-015', 'Demo Leonie Nyiransabimana', '250788200015', 'd0000000-0000-0000-0000-000000000003', 'ACTIVE', now(), now())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  org_id = EXCLUDED.org_id,
  updated_at = now();

-- 7. Create demo staff users with various roles
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES 
  -- System Admin
  ('d4000000-0000-0000-0000-000000000001', 'demo.admin@sacco.rw', crypt('DemoPass123!', gen_salt('bf')), now(), 
   '{"role": "SYSTEM_ADMIN"}'::jsonb, '{"name": "Demo System Admin"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  
  -- District Manager
  ('d4000000-0000-0000-0000-000000000002', 'demo.district@sacco.rw', crypt('DemoPass123!', gen_salt('bf')), now(),
   '{"role": "DISTRICT_MANAGER"}'::jsonb, '{"name": "Demo District Manager"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  
  -- Kigali SACCO Manager
  ('d4000000-0000-0000-0000-000000000003', 'demo.kigali.manager@sacco.rw', crypt('DemoPass123!', gen_salt('bf')), now(),
   '{"role": "SACCO_MANAGER"}'::jsonb, '{"name": "Demo Kigali Manager"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  
  -- Kigali SACCO Staff
  ('d4000000-0000-0000-0000-000000000004', 'demo.kigali.staff@sacco.rw', crypt('DemoPass123!', gen_salt('bf')), now(),
   '{"role": "SACCO_STAFF"}'::jsonb, '{"name": "Demo Kigali Staff"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  
  -- Nyarugenge SACCO Manager
  ('d4000000-0000-0000-0000-000000000005', 'demo.nyarugenge.manager@sacco.rw', crypt('DemoPass123!', gen_salt('bf')), now(),
   '{"role": "SACCO_MANAGER"}'::jsonb, '{"name": "Demo Nyarugenge Manager"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  
  -- MFI Manager
  ('d4000000-0000-0000-0000-000000000006', 'demo.mfi.manager@sacco.rw', crypt('DemoPass123!', gen_salt('bf')), now(),
   '{"role": "MFI_MANAGER"}'::jsonb, '{"name": "Demo MFI Manager"}'::jsonb, now(), now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- 8. Create user profiles for staff
INSERT INTO public.users (id, email, full_name, role, account_status, pw_reset_required, created_at, updated_at)
VALUES 
  ('d4000000-0000-0000-0000-000000000001', 'demo.admin@sacco.rw', 'Demo System Admin', 'SYSTEM_ADMIN', 'ACTIVE', false, now(), now()),
  ('d4000000-0000-0000-0000-000000000002', 'demo.district@sacco.rw', 'Demo District Manager', 'DISTRICT_MANAGER', 'ACTIVE', false, now(), now()),
  ('d4000000-0000-0000-0000-000000000003', 'demo.kigali.manager@sacco.rw', 'Demo Kigali Manager', 'SACCO_MANAGER', 'ACTIVE', false, now(), now()),
  ('d4000000-0000-0000-0000-000000000004', 'demo.kigali.staff@sacco.rw', 'Demo Kigali Staff', 'SACCO_STAFF', 'ACTIVE', false, now(), now()),
  ('d4000000-0000-0000-0000-000000000005', 'demo.nyarugenge.manager@sacco.rw', 'Demo Nyarugenge Manager', 'SACCO_MANAGER', 'ACTIVE', false, now(), now()),
  ('d4000000-0000-0000-0000-000000000006', 'demo.mfi.manager@sacco.rw', 'Demo MFI Manager', 'MFI_MANAGER', 'ACTIVE', false, now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();

-- 9. Link staff to organizations
INSERT INTO public.org_memberships (user_id, org_id, role, created_at, updated_at)
VALUES 
  ('d4000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'DISTRICT_MANAGER', now(), now()),
  ('d4000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'SACCO_MANAGER', now(), now()),
  ('d4000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'SACCO_STAFF', now(), now()),
  ('d4000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', 'SACCO_MANAGER', now(), now()),
  ('d4000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000004', 'MFI_MANAGER', now(), now())
ON CONFLICT (user_id, org_id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = now();

COMMIT;

-- Display summary
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Demo Environment Seed Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - 1 District: Gasabo';
  RAISE NOTICE '  - 2 SACCOs: Kigali Savings & Nyarugenge Cooperative';
  RAISE NOTICE '  - 1 MFI: Rwanda Community Capital';
  RAISE NOTICE '  - 5 Ikimina Groups';
  RAISE NOTICE '  - 39 Members';
  RAISE NOTICE '  - 6 Staff Users (various roles)';
  RAISE NOTICE '';
  RAISE NOTICE 'Test Credentials:';
  RAISE NOTICE '  System Admin: demo.admin@sacco.rw / DemoPass123!';
  RAISE NOTICE '  District Mgr: demo.district@sacco.rw / DemoPass123!';
  RAISE NOTICE '  SACCO Manager: demo.kigali.manager@sacco.rw / DemoPass123!';
  RAISE NOTICE '========================================';
END $$;

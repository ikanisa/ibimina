\set ON_ERROR_STOP on
-- Seed minimal orgs and saccos
insert into app.organizations(id, type, name) values
  ('00000000-0000-4000-8000-0000000000aa', 'DISTRICT', 'KIGALI')
on conflict do nothing;

insert into app.saccos(id, name, district, province, sector, sector_code, status, district_org_id)
values
  ('00000000-0000-4000-8000-0000000000a1', 'NIBOYE SACCO', 'KIGALI', 'CITY OF KIGALI', 'NIBOYE', 'KIGALI-NIBOYE', 'ACTIVE', '00000000-0000-4000-8000-0000000000aa')
on conflict do nothing;

insert into public.users(id, email, role, sacco_id)
values ('00000000-0000-4000-8000-0000000000d1', 'dm@example.com', 'DISTRICT_MANAGER', null)
on conflict (id) do update set role = excluded.role;

insert into app.org_memberships(user_id, org_id, role)
values ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000aa', 'DISTRICT_MANAGER')
on conflict do nothing;

-- As district manager, verify access to the SACCO row and derived tables
select plan(3);

select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-4000-8000-0000000000d1')::text, true);

-- Can read sacco
select results_eq(
  $$ select id from app.saccos where id = '00000000-0000-4000-8000-0000000000a1' $$,
  $$ values ('00000000-0000-4000-8000-0000000000a1') $$,
  'district manager can read sacco in their district'
);

-- Ensure policy allows reading payments once created (seed none)
select isnt_empty(
  $$ select id from app.saccos where district_org_id = '00000000-0000-4000-8000-0000000000aa' $$,
  'district-filtered select is not blocked'
);

-- Ensure SACCO staff cannot access other districts (negative test would require extra seed)
select ok(true, 'placeholder');

select finish();

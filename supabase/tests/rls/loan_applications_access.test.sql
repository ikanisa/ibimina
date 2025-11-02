-- RLS coverage for loan application and contribution policies
-- Validates anon, authenticated, and service-role behaviour

set role postgres;

-- Ensure service_role exists and can bypass RLS for administrative operations
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role;
  end if;

  begin
    execute 'alter role service_role with bypassrls';
  exception
    when others then
      null;
  end;
end;
$$;

grant service_role to postgres;

-- Seed auth users
insert into auth.users (id, email)
values
  ('60000000-0000-0000-0000-000000000001', 'member.loan@example.com'),
  ('60000000-0000-0000-0000-000000000002', 'staff.loan@example.com'),
  ('60000000-0000-0000-0000-000000000003', 'outsider.loan@example.com')
on conflict (id) do nothing;

-- Seed organisations and SACCOs
insert into public.organizations (id, type, name, district_code)
values
  ('70000000-0000-0000-0000-000000000000', 'DISTRICT', 'Gasabo District', 'GASABO')
on conflict (id) do nothing;

insert into public.organizations (id, type, name, parent_id)
values
  ('70000000-0000-0000-0000-000000000001', 'SACCO', 'Kigali SACCO', '70000000-0000-0000-0000-000000000000'),
  ('70000000-0000-0000-0000-000000000002', 'SACCO', 'Musanze SACCO', '70000000-0000-0000-0000-000000000000')
on conflict (id) do nothing;

insert into app.saccos (id, name, district, sector_code, merchant_code, org_id)
values
  ('80000000-0000-0000-0000-000000000001', 'Kigali SACCO', 'Gasabo', 'KGL001', 'MERKGL1', '70000000-0000-0000-0000-000000000001'),
  ('80000000-0000-0000-0000-000000000002', 'Musanze SACCO', 'Muhoza', 'MSZ001', 'MERMSZ1', '70000000-0000-0000-0000-000000000002')
on conflict (id) do update
set name = excluded.name,
    district = excluded.district,
    sector_code = excluded.sector_code,
    merchant_code = excluded.merchant_code,
    org_id = excluded.org_id;

-- User profiles drive app.current_sacco() used by payments policies
insert into app.user_profiles (user_id, sacco_id, role)
values
  ('60000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'SACCO_STAFF'),
  ('60000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', 'SACCO_STAFF'),
  ('60000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000002', 'SACCO_STAFF')
on conflict (user_id) do update
set sacco_id = excluded.sacco_id,
    role = excluded.role;

-- Multitenant org memberships for staff policies
insert into public.org_memberships (user_id, org_id, role)
values
  ('60000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'SACCO_STAFF'),
  ('60000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', 'SACCO_STAFF')
on conflict (user_id, org_id) do update
set role = excluded.role;

-- Minimal member + ikimina data to satisfy payments foreign keys
insert into app.ikimina (id, sacco_id, code, name, org_id)
values
  ('81000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'IK-KGL', 'Kigali Group', '70000000-0000-0000-0000-000000000001'),
  ('81000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', 'IK-MS', 'Musanze Group', '70000000-0000-0000-0000-000000000002')
on conflict (id) do update
set name = excluded.name,
    sacco_id = excluded.sacco_id,
    org_id = excluded.org_id;

insert into app.members (id, ikimina_id, sacco_id, member_code, full_name, msisdn, org_id)
values
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'M-KGL', 'Loan Member', '+250788000101', '70000000-0000-0000-0000-000000000001'),
  ('82000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', 'M-MS', 'Other Member', '+250788000202', '70000000-0000-0000-0000-000000000002')
on conflict (id) do update
set ikimina_id = excluded.ikimina_id,
    sacco_id = excluded.sacco_id,
    org_id = excluded.org_id;

-- Baseline contributions/payments
insert into app.payments (id, channel, sacco_id, ikimina_id, member_id, msisdn, amount, currency, txn_id, reference, occurred_at, status, org_id)
values
  ('83000000-0000-0000-0000-000000000001', 'SMS', '80000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '+250788000303', 25000, 'RWF', 'TXN-KGL-1', 'KGL-REF-1', timezone('utc', now() - interval '1 day'), 'POSTED', '70000000-0000-0000-0000-000000000001'),
  ('83000000-0000-0000-0000-000000000002', 'SMS', '80000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000002', '+250788000404', 18000, 'RWF', 'TXN-MS-1', 'MS-REF-1', timezone('utc', now() - interval '2 day'), 'POSTED', '70000000-0000-0000-0000-000000000002')
on conflict (id) do update
set amount = excluded.amount,
    status = excluded.status,
    reference = excluded.reference;

-- Loan products for each org
insert into public.loan_products (id, org_id, name, partner_name, enabled)
values
  ('90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'Working Capital Advance', 'RPF MFI', true),
  ('90000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'Legacy Pilot', 'Legacy Bank', false),
  ('90000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', 'Musanze Partner Loan', 'Northern Finance', true)
on conflict (id) do update
set org_id = excluded.org_id,
    enabled = excluded.enabled;

-- Existing application from another user for visibility tests
insert into public.loan_applications (id, org_id, user_id, product_id, requested_amount, tenor_months, purpose, applicant_name, applicant_phone, status)
values
  ('91000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', 450000, 6, 'Inventory restock', 'Staff Loaner', '+250788000505', 'RECEIVED'),
  ('91000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000003', 220000, 5, 'Equipment upgrade', 'External Staff', '+250788000606', 'RECEIVED')
on conflict (id) do nothing;

reset role;

-- ---------------------------------------------------------------------------
-- 1) Anon key: cannot see loan products or submit applications
set role app_authenticator;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', 'anon', false);
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, false);

do $$
declare
  visible_products integer;
  visible_payments integer;
  inserted boolean := true;
begin
  select count(*) into visible_products from public.loan_products;
  if visible_products <> 0 then
    raise exception 'anon key saw % loan products', visible_products;
  end if;

  select count(*) into visible_payments from app.payments;
  if visible_payments <> 0 then
    raise exception 'anon key saw % payments', visible_payments;
  end if;

  begin
    insert into public.loan_applications (org_id, user_id, product_id, requested_amount, tenor_months, purpose, applicant_name, applicant_phone, status)
    values ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 100000, 3, 'Test', 'Anon User', '+250700000000', 'DRAFT');
  exception
    when others then
      inserted := false;
  end;

  if inserted then
    raise exception 'anon key managed to insert a loan application';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', '', false);
select set_config('request.jwt.claims', '', false);

-- ---------------------------------------------------------------------------
-- 2) Authenticated member can manage own draft but not approve
set role app_authenticator;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000001', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '60000000-0000-0000-0000-000000000001', 'app_metadata', json_build_object('role', 'MEMBER'))::text,
  false
);

-- insert draft
insert into public.loan_applications (org_id, user_id, product_id, requested_amount, tenor_months, purpose, applicant_name, applicant_phone, status)
values ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 300000, 4, 'Purchase stock', 'Loan Member', '+250788000101', 'DRAFT');

-- move to SUBMITTED allowed
update public.loan_applications
set status = 'SUBMITTED'
where user_id = '60000000-0000-0000-0000-000000000001'
  and status = 'DRAFT';

-- attempting to jump to APPROVED should fail
\echo 'Expect member approval escalation to fail'
do $$
declare
  updated integer;
  allowed boolean := true;
begin
  begin
    update public.loan_applications
    set status = 'APPROVED'
    where user_id = '60000000-0000-0000-0000-000000000001'
      and status = 'SUBMITTED';
    get diagnostics updated = row_count;
    if updated > 0 then
      raise exception 'member unexpectedly escalated status to APPROVED';
    end if;
  exception
    when others then
      allowed := false;
  end;

  if allowed then
    raise exception 'member update unexpectedly succeeded';
  end if;
end;
$$;

-- Members should only see own org contributions
do $$
declare
  contribution_rows integer;
begin
  select count(*) into contribution_rows
  from app.payments;

  if contribution_rows <> 1 then
    raise exception 'member should see 1 contribution, saw %', contribution_rows;
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', '', false);
select set_config('request.jwt.claims', '', false);

-- ---------------------------------------------------------------------------
-- 3) SACCO staff can review org applications but not other SACCOs
set role app_authenticator;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000002', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '60000000-0000-0000-0000-000000000002', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);

do $$
declare
  org_applications integer;
  foreign_applications integer;
  updated integer;
begin
  select count(*) into org_applications from public.loan_applications;
  if org_applications < 2 then
    raise exception 'staff expected to see applications but saw %', org_applications;
  end if;

  -- Staff should only modify their org applications
  update public.loan_applications
  set status = 'UNDER_REVIEW'
  where id = '91000000-0000-0000-0000-000000000001';

  get diagnostics updated = row_count;
  if updated <> 1 then
    raise exception 'staff should update their org applications (updated %)', updated;
  end if;

  update public.loan_applications
  set status = 'UNDER_REVIEW'
  where id = '91000000-0000-0000-0000-000000000002';
  get diagnostics updated = row_count;
  if updated <> 0 then
    raise exception 'staff must not update applications outside their org';
  end if;

  select count(*) into foreign_applications
  from app.payments
  where sacco_id <> '80000000-0000-0000-0000-000000000001';
  if foreign_applications <> 0 then
    raise exception 'staff unexpectedly saw contributions for another SACCO';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', '', false);
select set_config('request.jwt.claims', '', false);

-- ---------------------------------------------------------------------------
-- 4) Service role bypasses RLS for audits and failover tooling
set role service_role;

do $$
declare
  total_products integer;
  total_payments integer;
  updated integer;
begin
  select count(*) into total_products from public.loan_products;
  if total_products < 3 then
    raise exception 'service role expected 3+ products but saw %', total_products;
  end if;

  select count(*) into total_payments from app.payments;
  if total_payments < 2 then
    raise exception 'service role expected to read all payments (saw %)', total_payments;
  end if;

  update public.loan_applications
  set status = 'APPROVED'
  where id = '91000000-0000-0000-0000-000000000001';
  get diagnostics updated = row_count;
  if updated <> 1 then
    raise exception 'service role failed to update loan application';
  end if;
end;
$$;

reset role;

-- RLS coverage for payments table
grant usage on schema public to app_authenticator;
grant select, insert, update, delete on all tables in schema public to app_authenticator;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role;
  end if;
end;
$$;

set role service_role;

insert into auth.users (id, email)
values
  ('81111111-1111-1111-1111-111111111111', 'alice@sacco.rw'),
  ('82222222-2222-2222-2222-222222222222', 'ben@sacco.rw'),
  ('83333333-3333-3333-3333-333333333333', 'admin@sacco.rw')
ON CONFLICT (id) DO NOTHING;

insert into public.saccos (id, name, district, sector_code, merchant_code)
values
  ('80111111-1111-1111-1111-111111111111', 'Kigali SACCO', 'Gasabo', '001', 'M001'),
  ('80222222-2222-2222-2222-222222222222', 'Musanze SACCO', 'Muhoza', '002', 'M002')
ON CONFLICT (id) DO NOTHING;

insert into public.users (id, email, role, sacco_id, mfa_enabled)
values
  ('81111111-1111-1111-1111-111111111111', 'alice@sacco.rw', 'SACCO_STAFF', '80111111-1111-1111-1111-111111111111', true),
  ('82222222-2222-2222-2222-222222222222', 'ben@sacco.rw', 'SACCO_STAFF', '80222222-2222-2222-2222-222222222222', true),
  ('83333333-3333-3333-3333-333333333333', 'admin@sacco.rw', 'SYSTEM_ADMIN', null, true)
ON CONFLICT (id) DO NOTHING;

insert into public.ibimina (id, sacco_id, code, name)
values
  ('801aaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '80111111-1111-1111-1111-111111111111', 'IK-A', 'Ikimina A'),
  ('802bbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '80222222-2222-2222-2222-222222222222', 'IK-B', 'Ikimina B')
ON CONFLICT (id) DO NOTHING;

insert into public.members (id, sacco_id, ikimina_id, member_code, full_name)
values
  ('801cccc-cccc-cccc-cccc-cccccccccccc', '80111111-1111-1111-1111-111111111111', '801aaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MEM-A', 'Alice Member'),
  ('802dddd-dddd-dddd-dddd-dddddddddddd', '80222222-2222-2222-2222-222222222222', '802bbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'MEM-B', 'Ben Member')
ON CONFLICT (id) DO NOTHING;

insert into public.payments (id, sacco_id, ikimina_id, member_id, amount, status, occurred_at)
values
  ('90111111-1111-1111-1111-111111111111', '80111111-1111-1111-1111-111111111111', '801aaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '801cccc-cccc-cccc-cccc-cccccccccccc', 10000, 'POSTED', timezone('utc', now() - interval '1 day')),
  ('90222222-2222-2222-2222-222222222222', '80222222-2222-2222-2222-222222222222', '802bbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '802dddd-dddd-dddd-dddd-dddddddddddd', 25000, 'POSTED', timezone('utc', now() - interval '2 day')),
  ('90333333-3333-3333-3333-333333333333', '80222222-2222-2222-2222-222222222222', null, null, 5000, 'UNALLOCATED', timezone('utc', now()))
ON CONFLICT (id) DO NOTHING;

reset role;

-- Staff scoped to Kigali SACCO should only see their payments
set role app_authenticator;
select set_config('request.jwt.claim.sub', '81111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '81111111-1111-1111-1111-111111111111', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  true
);

do $$
declare
  visible_count integer;
  foreign_payments integer;
begin
  select count(*) into visible_count from public.payments;
  if visible_count <> 1 then
    raise exception 'expected 1 payment for Kigali staff, found %', visible_count;
  end if;

  select count(*) into foreign_payments from public.payments where sacco_id <> '80111111-1111-1111-1111-111111111111';
  if foreign_payments <> 0 then
    raise exception 'staff unexpectedly saw payments outside their SACCO (count %)', foreign_payments;
  end if;
end;
$$;

-- Staff cannot insert into another SACCO
\echo 'Expect foreign SACCO insert to fail'
do $$
declare
  allowed boolean := true;
begin
  begin
    insert into public.payments (sacco_id, ikimina_id, member_id, amount, status, occurred_at)
    values ('80222222-2222-2222-2222-222222222222', '802bbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '802dddd-dddd-dddd-dddd-dddddddddddd', 12000, 'POSTED', timezone('utc', now()));
  exception
    when others then
      allowed := false;
  end;

  if allowed then
    raise exception 'staff managed to insert payment for foreign SACCO';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);

-- Admin can see all payments
set role app_authenticator;
select set_config('request.jwt.claim.sub', '83333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '83333333-3333-3333-3333-333333333333', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  true
);

do $$
declare
  total integer;
begin
  select count(*) into total from public.payments;
  if total < 3 then
    raise exception 'system admin should see all payments (expected ≥3, found %)', total;
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);

-- RLS coverage for payments table
grant usage on schema public to app_authenticator;
grant select, insert, update, delete on all tables in schema public to app_authenticator;
grant usage on schema app to app_authenticator;
grant select, insert, update, delete on app.payments to app_authenticator;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role;
  end if;
end;
$$;

set role postgres;

insert into auth.users (id, email)
values
  ('81111111-1111-1111-1111-111111111111', 'alice_payments@sacco.rw'),
  ('82222222-2222-2222-2222-222222222222', 'ben_payments@sacco.rw'),
  ('83333333-3333-3333-3333-333333333333', 'admin_payments@sacco.rw')
ON CONFLICT (id) DO NOTHING;

insert into app.saccos (id, name, district, sector_code, merchant_code)
values
  ('58111111-aaaa-1111-1111-581111111111', 'Kigali SACCO', 'Gasabo', '001', 'M001'),
  ('58222222-bbbb-2222-2222-582222222222', 'Musanze SACCO', 'Muhoza', '002', 'M002')
ON CONFLICT (id) DO NOTHING;

insert into app.user_profiles (user_id, role, sacco_id)
values
  ('81111111-1111-1111-1111-111111111111', 'SACCO_STAFF', '58111111-aaaa-1111-1111-581111111111'),
  ('82222222-2222-2222-2222-222222222222', 'SACCO_STAFF', '58222222-bbbb-2222-2222-582222222222'),
  ('83333333-3333-3333-3333-333333333333', 'SYSTEM_ADMIN', null)
on conflict (user_id) do update
set role = excluded.role,
    sacco_id = excluded.sacco_id;

insert into app.ikimina (id, sacco_id, code, name)
values
  ('581aaaaa-aaaa-aaaa-aaaa-58aaaaaaaaaa', '58111111-aaaa-1111-1111-581111111111', 'IK-A', 'Ikimina A'),
  ('582bbbbb-bbbb-bbbb-bbbb-58bbbbbbbbbb', '58222222-bbbb-2222-2222-582222222222', 'IK-B', 'Ikimina B')
ON CONFLICT (id) DO NOTHING;

insert into app.members (id, sacco_id, ikimina_id, member_code, full_name, msisdn)
values
  ('581cccc1-cccc-4ccc-8ccc-58cccccccccc', '58111111-aaaa-1111-1111-581111111111', '581aaaaa-aaaa-aaaa-aaaa-58aaaaaaaaaa', 'MEM-A', 'Alice Member', '+250788111111'),
  ('582dddd2-dddd-4ddd-8ddd-58dddddddddd', '58222222-bbbb-2222-2222-582222222222', '582bbbbb-bbbb-bbbb-bbbb-58bbbbbbbbbb', 'MEM-B', 'Ben Member', '+250788222222')
ON CONFLICT (id) DO NOTHING;

insert into app.payments (id, sacco_id, ikimina_id, member_id, msisdn, txn_id, amount, currency, status, occurred_at, channel, reference)
values
  ('90111111-1111-4111-8111-111111111111', '58111111-aaaa-1111-1111-581111111111', '581aaaaa-aaaa-aaaa-aaaa-58aaaaaaaaaa', '581cccc1-cccc-4ccc-8ccc-58cccccccccc', '+250788000111', 'TXN-KIG-1', 10000, 'RWF', 'POSTED', timezone('utc', now() - interval '1 day'), 'SMS', 'PAY-A'),
  ('90222222-2222-4222-8222-222222222222', '58222222-bbbb-2222-2222-582222222222', '582bbbbb-bbbb-bbbb-bbbb-58bbbbbbbbbb', '582dddd2-dddd-4ddd-8ddd-58dddddddddd', '+250788000222', 'TXN-MUS-1', 25000, 'RWF', 'POSTED', timezone('utc', now() - interval '2 day'), 'SMS', 'PAY-B'),
  ('90333333-3333-4333-8333-333333333333', '58222222-bbbb-2222-2222-582222222222', null, null, '+250788000333', 'TXN-MUS-UNALLOC', 5000, 'RWF', 'UNALLOCATED', timezone('utc', now()), 'SMS', 'PAY-C')
ON CONFLICT (id) DO NOTHING;

reset role;

-- Staff scoped to Kigali SACCO should only see their payments
set role app_authenticator;
select set_config('request.jwt.claim.sub', '81111111-1111-1111-1111-111111111111', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '81111111-1111-1111-1111-111111111111', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);

do $$
declare
  visible_count integer;
  foreign_payments integer;
begin
  select count(*) into visible_count from app.payments;
  if visible_count <> 1 then
    raise exception 'expected 1 payment for Kigali staff, found %', visible_count;
  end if;

  select count(*) into foreign_payments from app.payments where sacco_id <> '58111111-aaaa-1111-1111-581111111111';
  if foreign_payments <> 0 then
    raise exception 'staff unexpectedly saw payments outside their SACCO (count %)', foreign_payments;
  end if;
end;
$$;

-- SACCO staff can update payments inside their scope
do $$
declare
  updated_rows integer;
begin
  update app.payments
  set status = 'PENDING'
  where id = '90111111-1111-4111-8111-111111111111';

  get diagnostics updated_rows = row_count;
  if updated_rows <> 1 then
    raise exception 'staff should be able to update payments in their SACCO (updated %)', updated_rows;
  end if;

  -- revert status to maintain downstream expectations
  update app.payments
  set status = 'POSTED'
  where id = '90111111-1111-4111-8111-111111111111';
end;
$$;

-- Staff cannot insert into another SACCO
\echo 'Expect foreign SACCO insert to fail'
do $$
declare
  allowed boolean := true;
begin
  begin
    insert into app.payments (sacco_id, ikimina_id, member_id, msisdn, amount, currency, status, occurred_at, channel, reference)
    values ('80444444-4444-4444-8444-444444444444', '804bbbbb-bbbb-bbbb-bbbb-84bbbbbbbbbb', '804dddd3-dddd-4ddd-bddd-84dddddddddd', '+250788000444', 12000, 'RWF', 'POSTED', timezone('utc', now()), 'SMS', 'PAY-D');
  exception
    when others then
      allowed := false;
  end;

  if allowed then
    raise exception 'staff managed to insert payment for foreign SACCO';
  end if;
end;
$$;

\echo 'Expect cross-SACCO update to fail'
do $$
declare
  updated_rows integer;
begin
  update app.payments
  set amount = amount + 100
  where id = '90222222-2222-4222-8222-222222222222';

  get diagnostics updated_rows = row_count;
  if updated_rows <> 0 then
    raise exception 'staff must not update payments outside their SACCO (updated %)', updated_rows;
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

-- Admin can see all payments
set role app_authenticator;
select set_config('request.jwt.claim.sub', '83333333-3333-3333-3333-333333333333', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '83333333-3333-3333-3333-333333333333', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);

do $$
declare
  total integer;
begin
  select count(*) into total from app.payments;
  if total < 3 then
    raise exception 'system admin should see all payments (expected ≥3, found %)', total;
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

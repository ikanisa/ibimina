-- RLS coverage for reconciliation exceptions
grant usage on schema public to app_authenticator;
grant select, insert, update, delete on all tables in schema public to app_authenticator;
grant usage on schema app to app_authenticator;
grant select, update on app.recon_exceptions to app_authenticator;

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
  ('91111111-1111-1111-1111-111111111111', 'alice_recon@sacco.rw'),
  ('92222222-2222-2222-2222-222222222222', 'ben_recon@sacco.rw'),
  ('93333333-3333-3333-3333-333333333333', 'admin_recon@sacco.rw')
ON CONFLICT (id) DO NOTHING;

insert into app.saccos (id, name, district, sector_code, merchant_code)
values
  ('69111111-1111-1111-1111-691111111111', 'Kigali SACCO', 'Gasabo', '001', 'M001'),
  ('69222222-2222-2222-2222-692222222222', 'Musanze SACCO', 'Muhoza', '002', 'M002')
ON CONFLICT (id) DO NOTHING;

insert into app.user_profiles (user_id, role, sacco_id)
values
  ('91111111-1111-1111-1111-111111111111', 'SACCO_STAFF', '69111111-1111-1111-1111-691111111111'),
  ('92222222-2222-2222-2222-222222222222', 'SACCO_STAFF', '69222222-2222-2222-2222-692222222222'),
  ('93333333-3333-3333-3333-333333333333', 'SYSTEM_ADMIN', null)
on conflict (user_id) do update
set role = excluded.role,
    sacco_id = excluded.sacco_id;

insert into app.payments (id, sacco_id, ikimina_id, member_id, msisdn, txn_id, amount, currency, status, occurred_at, channel, reference)
values
  ('a0111111-1111-4111-8111-111111111111', '69111111-1111-1111-1111-691111111111', null, null, '+250788001111', 'TXN-RECON-A', 5000, 'RWF', 'UNALLOCATED', timezone('utc', now() - interval '3 day'), 'SMS', 'RECON-A'),
  ('a0222222-2222-4222-8222-222222222222', '69222222-2222-2222-2222-692222222222', null, null, '+250788001122', 'TXN-RECON-B', 7000, 'RWF', 'UNALLOCATED', timezone('utc', now() - interval '2 day'), 'SMS', 'RECON-B')
ON CONFLICT (id) DO NOTHING;

insert into app.recon_exceptions (id, payment_id, status, reason)
values
  ('b0111111-1111-1111-1111-111111111111', 'a0111111-1111-4111-8111-111111111111', 'OPEN', 'missing member'),
  ('b0222222-2222-2222-2222-222222222222', 'a0222222-2222-4222-8222-222222222222', 'OPEN', 'unmatched sacco')
ON CONFLICT (id) DO NOTHING;

reset role;

-- SACCO staff should only see exceptions within their SACCO
set role app_authenticator;
select set_config('request.jwt.claim.sub', '91111111-1111-1111-1111-111111111111', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '91111111-1111-1111-1111-111111111111', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);

do $$
declare
  visible integer;
  foreign_scope integer;
begin
  select count(*) into visible from app.recon_exceptions;
  if visible <> 1 then
    raise exception 'staff expected to see 1 recon exception, found %', visible;
  end if;
end;
$$;

-- SACCO staff can resolve exceptions in their SACCO
do $$
declare
  updated_rows integer;
begin
  update app.recon_exceptions
  set status = 'RESOLVED'
  where id = 'b0111111-1111-1111-1111-111111111111';

  get diagnostics updated_rows = row_count;
  if updated_rows <> 1 then
    raise exception 'staff should be able to resolve recon exceptions in their SACCO (updated %)', updated_rows;
  end if;

  update app.recon_exceptions
  set status = 'OPEN'
  where id = 'b0111111-1111-1111-1111-111111111111';
end;
$$;

-- Attempt to update an exception from another SACCO should fail
\echo 'Expect cross-SACCO update to fail'
do $$
declare
  updated_count integer;
begin
  update app.recon_exceptions
  set status = 'RESOLVED'
  where id = 'b0222222-2222-2222-2222-222222222222';

  get diagnostics updated_count = row_count;

  if updated_count <> 0 then
    raise exception 'staff unexpectedly updated recon exception in another SACCO';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

-- Admin should see all exceptions
set role app_authenticator;
select set_config('request.jwt.claim.sub', '93333333-3333-3333-3333-333333333333', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '93333333-3333-3333-3333-333333333333', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);

do $$
declare
  total integer;
begin
  select count(*) into total from app.recon_exceptions;
  if total < 2 then
    raise exception 'system admin should see all recon exceptions (expected 2+, found %)', total;
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

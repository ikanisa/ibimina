-- RLS coverage for reconciliation exceptions
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
  ('91111111-1111-1111-1111-111111111111', 'alice@sacco.rw'),
  ('92222222-2222-2222-2222-222222222222', 'ben@sacco.rw'),
  ('93333333-3333-3333-3333-333333333333', 'admin@sacco.rw')
ON CONFLICT (id) DO NOTHING;

insert into public.saccos (id, name, district, sector_code, merchant_code)
values
  ('90111111-1111-1111-1111-111111111111', 'Kigali SACCO', 'Gasabo', '001', 'M001'),
  ('90222222-2222-2222-2222-222222222222', 'Musanze SACCO', 'Muhoza', '002', 'M002')
ON CONFLICT (id) DO NOTHING;

insert into public.users (id, email, role, sacco_id, mfa_enabled)
values
  ('91111111-1111-1111-1111-111111111111', 'alice@sacco.rw', 'SACCO_STAFF', '90111111-1111-1111-1111-111111111111', true),
  ('92222222-2222-2222-2222-222222222222', 'ben@sacco.rw', 'SACCO_STAFF', '90222222-2222-2222-2222-222222222222', true),
  ('93333333-3333-3333-3333-333333333333', 'admin@sacco.rw', 'SYSTEM_ADMIN', null, true)
ON CONFLICT (id) DO NOTHING;

insert into public.payments (id, sacco_id, amount, status, occurred_at)
values
  ('a0111111-1111-1111-1111-111111111111', '90111111-1111-1111-1111-111111111111', 5000, 'UNALLOCATED', timezone('utc', now() - interval '3 day')),
  ('a0222222-2222-2222-2222-222222222222', '90222222-2222-2222-2222-222222222222', 7000, 'UNALLOCATED', timezone('utc', now() - interval '2 day'))
ON CONFLICT (id) DO NOTHING;

insert into public.recon_exceptions (id, payment_id, sacco_id, status, reason)
values
  ('b0111111-1111-1111-1111-111111111111', 'a0111111-1111-1111-1111-111111111111', '90111111-1111-1111-1111-111111111111', 'OPEN', 'missing member'),
  ('b0222222-2222-2222-2222-222222222222', 'a0222222-2222-2222-2222-222222222222', '90222222-2222-2222-2222-222222222222', 'OPEN', 'unmatched sacco')
ON CONFLICT (id) DO NOTHING;

reset role;

-- SACCO staff should only see exceptions within their SACCO
set role app_authenticator;
select set_config('request.jwt.claim.sub', '91111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '91111111-1111-1111-1111-111111111111', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  true
);

do $$
declare
  visible integer;
  foreign_scope integer;
begin
  select count(*) into visible from public.recon_exceptions;
  if visible <> 1 then
    raise exception 'staff expected to see 1 recon exception, found %', visible;
  end if;

  select count(*) into foreign_scope from public.recon_exceptions where sacco_id <> '90111111-1111-1111-1111-111111111111';
  if foreign_scope <> 0 then
    raise exception 'staff should not see exceptions outside their SACCO (found %)', foreign_scope;
  end if;
end;
$$;

-- Attempt to update an exception from another SACCO should fail
\echo 'Expect cross-SACCO update to fail'
do $$
declare
  allowed boolean := true;
begin
  begin
    update public.recon_exceptions set status = 'RESOLVED'
    where id = 'b0222222-2222-2222-2222-222222222222';
  exception
    when others then
      allowed := false;
  end;

  if allowed then
    raise exception 'staff unexpectedly updated recon exception in another SACCO';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);

-- Admin should see all exceptions
set role app_authenticator;
select set_config('request.jwt.claim.sub', '93333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '93333333-3333-3333-3333-333333333333', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  true
);

do $$
declare
  total integer;
begin
  select count(*) into total from public.recon_exceptions;
  if total < 2 then
    raise exception 'system admin should see all recon exceptions (expected 2+, found %)', total;
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);

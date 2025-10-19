-- RLS coverage for reconciliation exceptions

grant usage on schema app to app_authenticator;
grant select, update on table app.recon_exceptions to app_authenticator;

set role postgres;

delete from app.recon_exceptions
where id in (
  'b0111111-1111-4111-9111-dddddddddddd',
  'b0222222-2222-4222-9222-eeeeeeeeeeee'
);

delete from public.payments
where id in (
  'a0111111-1111-4111-9111-dddddddddddd',
  'a0222222-2222-4222-9222-eeeeeeeeeeee'
);

delete from public.users
where id in (
  '91111111-1111-4111-9111-dddddddddddd',
  '92222222-2222-4222-9222-eeeeeeeeeeee',
  '93333333-3333-4333-9333-ffffffffffff'
);

delete from auth.users
where id in (
  '91111111-1111-4111-9111-dddddddddddd',
  '92222222-2222-4222-9222-eeeeeeeeeeee',
  '93333333-3333-4333-9333-ffffffffffff'
);

delete from app.saccos
where id in (
  '69111111-1111-4111-9111-dddddddddddd',
  '69222222-2222-4222-9222-eeeeeeeeeeee'
);

insert into auth.users (id, email)
values
  ('91111111-1111-4111-9111-dddddddddddd', 'alice_recon@sacco.rw'),
  ('92222222-2222-4222-9222-eeeeeeeeeeee', 'ben_recon@sacco.rw'),
  ('93333333-3333-4333-9333-ffffffffffff', 'admin_recon@sacco.rw')
on conflict do nothing;

insert into public.users (id, email, role, sacco_id, mfa_enabled)
values
  ('91111111-1111-4111-9111-dddddddddddd', 'alice_recon@sacco.rw', 'SACCO_STAFF', null, false),
  ('92222222-2222-4222-9222-eeeeeeeeeeee', 'ben_recon@sacco.rw', 'SACCO_STAFF', null, false),
  ('93333333-3333-4333-9333-ffffffffffff', 'admin_recon@sacco.rw', 'SYSTEM_ADMIN', null, false)
on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      sacco_id = excluded.sacco_id,
      mfa_enabled = excluded.mfa_enabled;

insert into app.saccos (id, name, district, sector_code, merchant_code)
values
  ('69111111-1111-4111-9111-dddddddddddd', 'Kigali SACCO', 'Gasabo', 'KGL', 'M100'),
  ('69222222-2222-4222-9222-eeeeeeeeeeee', 'Musanze SACCO', 'Muhoza', 'MSZ', 'M200')
on conflict (id) do update
  set name = excluded.name,
      district = excluded.district,
      sector_code = excluded.sector_code,
      merchant_code = excluded.merchant_code;

insert into app.user_profiles (user_id, sacco_id, role)
values
  ('91111111-1111-4111-9111-dddddddddddd', '69111111-1111-4111-9111-dddddddddddd', 'SACCO_STAFF'),
  ('92222222-2222-4222-9222-eeeeeeeeeeee', '69222222-2222-4222-9222-eeeeeeeeeeee', 'SACCO_STAFF'),
  ('93333333-3333-4333-9333-ffffffffffff', null, 'SYSTEM_ADMIN')
on conflict (user_id) do update
  set sacco_id = excluded.sacco_id,
      role = excluded.role;

insert into public.payments (
  id,
  sacco_id,
  amount,
  status,
  occurred_at,
  msisdn,
  msisdn_encrypted,
  msisdn_hash,
  msisdn_masked,
  channel,
  txn_id,
  reference
)
values
  (
    'a0111111-1111-4111-9111-dddddddddddd',
    '69111111-1111-4111-9111-dddddddddddd',
    5000,
    'UNALLOCATED',
    timezone('utc', now() - interval '3 day'),
    '+250788000011',
    'enc-11',
    'hash-11',
    '***0011',
    'SMS',
    'RECON-TXN-001',
    'RECON-REF-001'
  ),
  (
    'a0222222-2222-4222-9222-eeeeeeeeeeee',
    '69222222-2222-4222-9222-eeeeeeeeeeee',
    7000,
    'UNALLOCATED',
    timezone('utc', now() - interval '2 day'),
    '+250788000022',
    'enc-22',
    'hash-22',
    '***0022',
    'SMS',
    'RECON-TXN-002',
    'RECON-REF-002'
  )
on conflict (id) do update
  set sacco_id = excluded.sacco_id,
      amount = excluded.amount,
      status = excluded.status,
      occurred_at = excluded.occurred_at,
      msisdn = excluded.msisdn,
      msisdn_encrypted = excluded.msisdn_encrypted,
      msisdn_hash = excluded.msisdn_hash,
      msisdn_masked = excluded.msisdn_masked,
      channel = excluded.channel,
      txn_id = excluded.txn_id,
      reference = excluded.reference;

insert into app.recon_exceptions (id, payment_id, status, reason)
values
  ('b0111111-1111-4111-9111-dddddddddddd', 'a0111111-1111-4111-9111-dddddddddddd', 'OPEN', 'missing member'),
  ('b0222222-2222-4222-9222-eeeeeeeeeeee', 'a0222222-2222-4222-9222-eeeeeeeeeeee', 'OPEN', 'unmatched sacco')
on conflict (id) do update
  set payment_id = excluded.payment_id,
      status = excluded.status,
      reason = excluded.reason;

set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', '91111111-1111-4111-9111-dddddddddddd', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '91111111-1111-4111-9111-dddddddddddd', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  visible integer;
  foreign_scope integer;
begin
  select count(*) into visible from app.recon_exceptions;
  if visible <> 1 then
    raise exception 'staff expected to see 1 recon exception, found %', visible;
  end if;

  select count(*) into foreign_scope
  from app.recon_exceptions re
  join app.payments p on p.id = re.payment_id
  where p.sacco_id <> '69111111-1111-4111-9111-dddddddddddd';

  if foreign_scope <> 0 then
    raise exception 'staff should not see exceptions outside their SACCO (found %)', foreign_scope;
  end if;
end;
$$;

\echo 'Expect cross-SACCO update to change zero rows'
do $$
declare
  updated integer;
begin
  update app.recon_exceptions
  set status = 'RESOLVED'
  where id = 'b0222222-2222-4222-9222-eeeeeeeeeeee';
  get diagnostics updated = row_count;

  if updated <> 0 then
    raise exception 'staff unexpectedly updated recon exception in another SACCO (% rows)', updated;
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', '93333333-3333-4333-9333-ffffffffffff', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '93333333-3333-4333-9333-ffffffffffff', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  total integer;
begin
  select count(*) into total from app.recon_exceptions;
  if total < 2 then
    raise exception 'system admin should see all recon exceptions (expected ≥2, found %)', total;
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;

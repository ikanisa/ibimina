-- RLS coverage for payments table

set role postgres;

delete from app.payments
where id in (
  '90111111-1111-4111-9111-aaaaaaaaaaaa',
  '90222222-2222-4222-9222-bbbbbbbbbbbb',
  '90333333-3333-4333-9333-cccccccccccc'
);

delete from app.members
where id in (
  '5a111111-aaaa-4aaa-9aaa-aaaaaaaaaaaa',
  '5b222222-bbbb-4bbb-9bbb-bbbbbbbbbbbb'
);

delete from app.ikimina
where id in (
  '59111111-aaaa-4aaa-9aaa-aaaaaaaaaaaa',
  '59222222-bbbb-4bbb-9bbb-bbbbbbbbbbbb'
);

delete from app.saccos
where id in (
  '58111111-1111-4111-9111-111111111111',
  '58222222-2222-4222-9222-222222222222'
);

delete from public.users
where id in (
  '81111111-1111-4111-9111-aaaaaaaaaaaa',
  '82222222-2222-4222-9222-bbbbbbbbbbbb',
  '83333333-3333-4333-9333-cccccccccccc'
);

delete from auth.users
where id in (
  '81111111-1111-4111-9111-aaaaaaaaaaaa',
  '82222222-2222-4222-9222-bbbbbbbbbbbb',
  '83333333-3333-4333-9333-cccccccccccc'
);

insert into auth.users (id, email)
values
  ('81111111-1111-4111-9111-aaaaaaaaaaaa', 'alice_payments@sacco.rw'),
  ('82222222-2222-4222-9222-bbbbbbbbbbbb', 'ben_payments@sacco.rw'),
  ('83333333-3333-4333-9333-cccccccccccc', 'admin_payments@sacco.rw')
on conflict do nothing;

insert into public.users (id, email, role, sacco_id, mfa_enabled)
values
  ('81111111-1111-4111-9111-aaaaaaaaaaaa', 'alice_payments@sacco.rw', 'SACCO_STAFF', null, false),
  ('82222222-2222-4222-9222-bbbbbbbbbbbb', 'ben_payments@sacco.rw', 'SACCO_STAFF', null, false),
  ('83333333-3333-4333-9333-cccccccccccc', 'admin_payments@sacco.rw', 'SYSTEM_ADMIN', null, false)
on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      sacco_id = excluded.sacco_id,
      mfa_enabled = excluded.mfa_enabled;

insert into app.saccos (id, name, district, sector_code, merchant_code)
values
  ('58111111-1111-4111-9111-111111111111', 'Kigali SACCO', 'Gasabo', 'KGL', 'M001'),
  ('58222222-2222-4222-9222-222222222222', 'Musanze SACCO', 'Muhoza', 'MSZ', 'M002')
on conflict (id) do update
  set name = excluded.name,
      district = excluded.district,
      sector_code = excluded.sector_code,
      merchant_code = excluded.merchant_code;

insert into app.user_profiles (user_id, sacco_id, role)
values
  ('81111111-1111-4111-9111-aaaaaaaaaaaa', '58111111-1111-4111-9111-111111111111', 'SACCO_STAFF'),
  ('82222222-2222-4222-9222-bbbbbbbbbbbb', '58222222-2222-4222-9222-222222222222', 'SACCO_STAFF'),
  ('83333333-3333-4333-9333-cccccccccccc', null, 'SYSTEM_ADMIN')
on conflict (user_id) do update
  set sacco_id = excluded.sacco_id,
      role = excluded.role;

insert into app.ikimina (id, sacco_id, code, name)
values
  ('59111111-aaaa-4aaa-9aaa-aaaaaaaaaaaa', '58111111-1111-4111-9111-111111111111', 'TEST-IK-A', 'Ikimina A'),
  ('59222222-bbbb-4bbb-9bbb-bbbbbbbbbbbb', '58222222-2222-4222-9222-222222222222', 'TEST-IK-B', 'Ikimina B')
on conflict (id) do update
  set sacco_id = excluded.sacco_id,
      code = excluded.code,
      name = excluded.name;

insert into app.members (id, sacco_id, ikimina_id, member_code, full_name, msisdn)
values
  ('5a111111-aaaa-4aaa-9aaa-aaaaaaaaaaaa', '58111111-1111-4111-9111-111111111111', '59111111-aaaa-4aaa-9aaa-aaaaaaaaaaaa', 'MEM-A', 'Alice Member', '+250788000001'),
  ('5b222222-bbbb-4bbb-9bbb-bbbbbbbbbbbb', '58222222-2222-4222-9222-222222222222', '59222222-bbbb-4bbb-9bbb-bbbbbbbbbbbb', 'MEM-B', 'Ben Member', '+250788000002')
on conflict (id) do update
  set sacco_id = excluded.sacco_id,
      ikimina_id = excluded.ikimina_id,
      member_code = excluded.member_code,
      full_name = excluded.full_name,
      msisdn = excluded.msisdn;

insert into app.payments (
  id,
  sacco_id,
  ikimina_id,
  member_id,
  msisdn,
  msisdn_encrypted,
  msisdn_hash,
  msisdn_masked,
  amount,
  currency,
  status,
  occurred_at,
  txn_id,
  reference,
  channel
)
values
  (
    '90111111-1111-4111-9111-aaaaaaaaaaaa',
    '58111111-1111-4111-9111-111111111111',
    '59111111-aaaa-4aaa-9aaa-aaaaaaaaaaaa',
    '5a111111-aaaa-4aaa-9aaa-aaaaaaaaaaaa',
    '+250788000001',
    'enc-1',
    'hash-1',
    '***0001',
    10000,
    'RWF',
    'POSTED',
    timezone('utc', now() - interval '1 day'),
    'TXN-001',
    'REF-001',
    'SMS'
  ),
  (
    '90222222-2222-4222-9222-bbbbbbbbbbbb',
    '58222222-2222-4222-9222-222222222222',
    '59222222-bbbb-4bbb-9bbb-bbbbbbbbbbbb',
    '5b222222-bbbb-4bbb-9bbb-bbbbbbbbbbbb',
    '+250788000002',
    'enc-2',
    'hash-2',
    '***0002',
    25000,
    'RWF',
    'POSTED',
    timezone('utc', now() - interval '2 day'),
    'TXN-002',
    'REF-002',
    'SMS'
  ),
  (
    '90333333-3333-4333-9333-cccccccccccc',
    '58222222-2222-4222-9222-222222222222',
    null,
    null,
    '+250788000003',
    'enc-3',
    'hash-3',
    '***0003',
    5000,
    'RWF',
    'UNALLOCATED',
    timezone('utc', now()),
    'TXN-003',
    'REF-003',
    'SMS'
  )
on conflict (id) do update
  set sacco_id = excluded.sacco_id,
      ikimina_id = excluded.ikimina_id,
      member_id = excluded.member_id,
      msisdn = excluded.msisdn,
      msisdn_encrypted = excluded.msisdn_encrypted,
      msisdn_hash = excluded.msisdn_hash,
      msisdn_masked = excluded.msisdn_masked,
      amount = excluded.amount,
      currency = excluded.currency,
      status = excluded.status,
      occurred_at = excluded.occurred_at,
      txn_id = excluded.txn_id,
      reference = excluded.reference,
      channel = excluded.channel;

set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', '81111111-1111-4111-9111-aaaaaaaaaaaa', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '81111111-1111-4111-9111-aaaaaaaaaaaa', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  visible_count integer;
  foreign_payments integer;
begin
  select count(*) into visible_count from app.payments;
  if visible_count <> 1 then
    raise exception 'expected 1 payment for Kigali staff, found %', visible_count;
  end if;

  select count(*) into foreign_payments
  from app.payments
  where sacco_id <> '58111111-1111-4111-9111-111111111111';

  if foreign_payments <> 0 then
    raise exception 'staff unexpectedly saw payments outside their SACCO (count %)', foreign_payments;
  end if;
end;
$$;

\echo 'Expect foreign SACCO insert to fail'
do $$
declare
  allowed boolean := true;
begin
  begin
    insert into app.payments (
      sacco_id,
      ikimina_id,
      member_id,
      msisdn,
      msisdn_encrypted,
      msisdn_hash,
      msisdn_masked,
      amount,
      currency,
      status,
      occurred_at,
      txn_id,
      reference,
      channel
    )
    values (
      '58222222-2222-4222-9222-222222222222',
      '59222222-bbbb-4bbb-9bbb-bbbbbbbbbbbb',
      '5b222222-bbbb-4bbb-9bbb-bbbbbbbbbbbb',
      '+250788000004',
      'enc-4',
      'hash-4',
      '***0004',
      12000,
      'RWF',
      'POSTED',
      timezone('utc', now()),
      'TXN-004',
      'REF-004',
      'SMS'
    );
  exception
    when others then
      allowed := false;
  end;

  if allowed then
    raise exception 'staff managed to insert payment for foreign SACCO';
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
select set_config('request.jwt.claim.sub', '83333333-3333-4333-9333-cccccccccccc', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '83333333-3333-4333-9333-cccccccccccc', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

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

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;

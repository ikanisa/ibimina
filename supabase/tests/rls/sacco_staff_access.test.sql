-- RLS coverage for member visibility across SACCOs

set role postgres;

delete from app.members
where id in (
  '35111111-1111-4111-9111-aaaaaaaaaaaa',
  '35222222-2222-4222-9222-bbbbbbbbbbbb',
  '35333333-3333-4333-9333-cccccccccccc'
);
delete from app.members
where member_code in ('M-A1', 'M-B1', 'M-A2');

delete from app.payments
where sacco_id in (
  '31111111-1111-4111-9111-aaaaaaaaaaaa',
  '32222222-2222-4222-9222-bbbbbbbbbbbb'
)
   or ikimina_id in (
     '33111111-1111-4111-9111-aaaaaaaaaaaa',
     '33222222-2222-4222-9222-bbbbbbbbbbbb',
     '59111111-aaaa-4aaa-9aaa-aaaaaaaaaaaa',
     '59222222-bbbb-4bbb-9bbb-bbbbbbbbbbbb'
   );

delete from app.ikimina
where id in (
  '33111111-1111-4111-9111-aaaaaaaaaaaa',
  '33222222-2222-4222-9222-bbbbbbbbbbbb'
);
delete from app.ikimina
where code in ('TEST-IK-A', 'TEST-IK-B');

delete from app.saccos
where id in (
  '31111111-1111-4111-9111-aaaaaaaaaaaa',
  '32222222-2222-4222-9222-bbbbbbbbbbbb'
);

delete from app.user_profiles
where user_id in (
  'aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-9ccc-cccccccccccc'
);

delete from auth.users
where id in (
  'aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-9ccc-cccccccccccc'
);

insert into auth.users (id, email, raw_app_meta_data)
values
  ('aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa', 'alice_staff@sacco.rw', jsonb_build_object('role', 'SACCO_STAFF')),
  ('bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb', 'ben_staff@sacco.rw', jsonb_build_object('role', 'SACCO_STAFF')),
  ('cccccccc-cccc-4ccc-9ccc-cccccccccccc', 'admin_staff@sacco.rw', jsonb_build_object('role', 'SYSTEM_ADMIN'))
on conflict do nothing;

insert into app.saccos (id, name, district, sector_code, merchant_code)
values
  ('31111111-1111-4111-9111-aaaaaaaaaaaa', 'Kigali SACCO', 'Gasabo', 'KGL', 'SM001'),
  ('32222222-2222-4222-9222-bbbbbbbbbbbb', 'Musanze SACCO', 'Muhoza', 'MSZ', 'SM002')
on conflict (id) do update
  set name = excluded.name,
      district = excluded.district,
      sector_code = excluded.sector_code,
      merchant_code = excluded.merchant_code;

insert into app.user_profiles (user_id, sacco_id, role)
values
  ('aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa', '31111111-1111-4111-9111-aaaaaaaaaaaa', 'SACCO_STAFF'),
  ('bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb', '32222222-2222-4222-9222-bbbbbbbbbbbb', 'SACCO_STAFF'),
  ('cccccccc-cccc-4ccc-9ccc-cccccccccccc', null, 'SYSTEM_ADMIN')
on conflict (user_id) do update
  set sacco_id = excluded.sacco_id,
      role = excluded.role;

insert into app.ikimina (id, sacco_id, code, name)
values
  ('33111111-1111-4111-9111-aaaaaaaaaaaa', '31111111-1111-4111-9111-aaaaaaaaaaaa', 'TEST-IK-A', 'Kigali Growth'),
  ('33222222-2222-4222-9222-bbbbbbbbbbbb', '32222222-2222-4222-9222-bbbbbbbbbbbb', 'TEST-IK-B', 'Musanze Progress')
on conflict (id) do update
  set sacco_id = excluded.sacco_id,
      code = excluded.code,
      name = excluded.name;

insert into app.members (id, ikimina_id, sacco_id, member_code, full_name, msisdn)
values
  ('35111111-1111-4111-9111-aaaaaaaaaaaa', '33111111-1111-4111-9111-aaaaaaaaaaaa', '31111111-1111-4111-9111-aaaaaaaaaaaa', 'M-A1', 'Aline Umuhoza', '+250788000001'),
  ('35222222-2222-4222-9222-bbbbbbbbbbbb', '33222222-2222-4222-9222-bbbbbbbbbbbb', '32222222-2222-4222-9222-bbbbbbbbbbbb', 'M-B1', 'Beni Kamanzi', '+250788000002')
on conflict (id) do update
  set ikimina_id = excluded.ikimina_id,
      sacco_id = excluded.sacco_id,
      member_code = excluded.member_code,
      full_name = excluded.full_name,
      msisdn = excluded.msisdn;

set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  member_total integer;
  outside_scope integer;
begin
  select count(*) into member_total from app.members;
  if member_total <> 1 then
    raise exception 'expected 1 member visible to SACCO A staff, got %', member_total;
  end if;

  select count(*) into outside_scope
  from app.members
  where sacco_id <> '31111111-1111-4111-9111-aaaaaaaaaaaa';

  if outside_scope <> 0 then
    raise exception 'staff should not see members outside their SACCO (found %)', outside_scope;
  end if;
end;
$$;

insert into app.members (ikimina_id, sacco_id, member_code, full_name, msisdn)
values (
  '33111111-1111-4111-9111-aaaaaaaaaaaa',
  '31111111-1111-4111-9111-aaaaaaaaaaaa',
  'M-A2',
  'Chantal Iradukunda',
  '+250788000010'
);

\echo 'Expect insert into foreign SACCO to fail'
do $$
declare
  allowed boolean := true;
begin
  begin
    insert into app.members (ikimina_id, sacco_id, member_code, full_name, msisdn)
    values (
      '33222222-2222-4222-9222-bbbbbbbbbbbb',
      '32222222-2222-4222-9222-bbbbbbbbbbbb',
      'M-B2',
      'Invalid Attempt',
      '+250788000011'
    );
  exception
    when others then
      allowed := false;
  end;

  if allowed then
    raise exception 'staff unexpectedly inserted into foreign SACCO';
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
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-9ccc-cccccccccccc', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'cccccccc-cccc-4ccc-9ccc-cccccccccccc', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  total_members integer;
begin
  select count(*) into total_members from app.members;
  if total_members < 3 then
    raise exception 'admin should see all members, found only %', total_members;
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;

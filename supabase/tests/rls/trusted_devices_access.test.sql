-- RLS coverage for trusted_devices registry

set role postgres;

delete from public.trusted_devices
where user_id in (
  '71111111-1111-4111-9111-aaaaaaaaaaaa',
  '72222222-2222-4222-9222-bbbbbbbbbbbb'
);

delete from public.users
where id in (
  '71111111-1111-4111-9111-aaaaaaaaaaaa',
  '72222222-2222-4222-9222-bbbbbbbbbbbb',
  '73333333-3333-4333-9333-cccccccccccc'
);

delete from auth.users
where id in (
  '71111111-1111-4111-9111-aaaaaaaaaaaa',
  '72222222-2222-4222-9222-bbbbbbbbbbbb',
  '73333333-3333-4333-9333-cccccccccccc'
);

delete from app.saccos
where id in (
  '47111111-1111-4111-9111-aaaaaaaaaaaa',
  '47222222-2222-4222-9222-bbbbbbbbbbbb'
);

insert into auth.users (id, email)
values
  ('71111111-1111-4111-9111-aaaaaaaaaaaa', 'alice_trusted@sacco.rw'),
  ('72222222-2222-4222-9222-bbbbbbbbbbbb', 'ben_trusted@sacco.rw'),
  ('73333333-3333-4333-9333-cccccccccccc', 'admin_trusted@sacco.rw')
on conflict do nothing;

insert into public.users (id, email, role, sacco_id, mfa_enabled)
values
  ('71111111-1111-4111-9111-aaaaaaaaaaaa', 'alice_trusted@sacco.rw', 'SACCO_STAFF', null, false),
  ('72222222-2222-4222-9222-bbbbbbbbbbbb', 'ben_trusted@sacco.rw', 'SACCO_STAFF', null, false),
  ('73333333-3333-4333-9333-cccccccccccc', 'admin_trusted@sacco.rw', 'SYSTEM_ADMIN', null, false)
on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      sacco_id = excluded.sacco_id,
      mfa_enabled = excluded.mfa_enabled;

insert into app.saccos (id, name, district, sector_code, merchant_code)
values
  ('47111111-1111-4111-9111-aaaaaaaaaaaa', 'Nyamirambo SACCO', 'Nyarugenge', 'NYA', 'NYA001'),
  ('47222222-2222-4222-9222-bbbbbbbbbbbb', 'Rubavu SACCO', 'Rubavu', 'RUB', 'RUB002')
on conflict (id) do update
  set name = excluded.name,
      district = excluded.district,
      sector_code = excluded.sector_code,
      merchant_code = excluded.merchant_code;

set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', '71111111-1111-4111-9111-aaaaaaaaaaaa', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '71111111-1111-4111-9111-aaaaaaaaaaaa', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

insert into public.trusted_devices (user_id, device_id, device_fingerprint_hash, user_agent_hash, ip_prefix)
values (
  auth.uid(),
  'device-a',
  'hash-a',
  'ua-a',
  '10.1.2'
)
on conflict do nothing;

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', '72222222-2222-4222-9222-bbbbbbbbbbbb', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '72222222-2222-4222-9222-bbbbbbbbbbbb', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

insert into public.trusted_devices (user_id, device_id, device_fingerprint_hash, user_agent_hash, ip_prefix)
values (
  auth.uid(),
  'device-b',
  'hash-b',
  'ua-b',
  '10.2.3'
)
on conflict do nothing;

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', '71111111-1111-4111-9111-aaaaaaaaaaaa', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '71111111-1111-4111-9111-aaaaaaaaaaaa', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  visible_count integer;
  owner uuid;
begin
  select count(*) into visible_count from public.trusted_devices;
  select user_id into owner from public.trusted_devices limit 1;
  if visible_count <> 1 or owner <> '71111111-1111-4111-9111-aaaaaaaaaaaa' then
    raise exception 'SACCO staff must only see their own trusted devices (count %, owner %)', visible_count, owner;
  end if;
end;
$$;


do $$
declare
  removed integer;
begin
  delete from public.trusted_devices
  where user_id = '72222222-2222-4222-9222-bbbbbbbbbbbb';
  get diagnostics removed = row_count;

  if removed <> 0 then
    raise exception 'staff should not delete trusted devices owned by another user (% rows)', removed;
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
select set_config('request.jwt.claim.sub', '73333333-3333-4333-9333-cccccccccccc', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '73333333-3333-4333-9333-cccccccccccc', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  total_count integer;
begin
  select count(*) into total_count from public.trusted_devices;
  if total_count < 2 then
    raise exception 'System admin should see all trusted devices, expected at least 2 got %', total_count;
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;








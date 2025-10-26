-- RLS coverage for trusted_devices registry
grant usage on schema public to app_authenticator;
grant select, insert, update, delete on all tables in schema public to app_authenticator;

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
  ('71111111-1111-1111-1111-111111111111', 'alice_trusted@sacco.rw'),
  ('72222222-2222-2222-2222-222222222222', 'ben_trusted@sacco.rw'),
  ('73333333-3333-3333-3333-333333333333', 'admin_trusted@sacco.rw')
ON CONFLICT (id) DO NOTHING;

insert into app.saccos (id, name, district, sector_code, merchant_code)
values
  ('47111111-1111-1111-1111-471111111111', 'Nyamirambo SACCO', 'Nyarugenge', 'NYA', 'NYA001'),
  ('47222222-2222-2222-2222-472222222222', 'Rubavu SACCO', 'Rubavu', 'RUB', 'RUB002');

insert into app.user_profiles (user_id, role, sacco_id)
values
  ('71111111-1111-1111-1111-111111111111', 'SACCO_STAFF', '47111111-1111-1111-1111-471111111111'),
  ('72222222-2222-2222-2222-222222222222', 'SACCO_STAFF', '47222222-2222-2222-2222-472222222222'),
  ('73333333-3333-3333-3333-333333333333', 'SYSTEM_ADMIN', null)
on conflict (user_id) do update
set role = excluded.role,
    sacco_id = excluded.sacco_id;

insert into public.trusted_devices (user_id, device_id, device_fingerprint_hash, user_agent_hash, ip_prefix)
values
  ('71111111-1111-1111-1111-111111111111', 'device-a', 'hash-a', 'ua-a', '10.1.2'),
  ('72222222-2222-2222-2222-222222222222', 'device-b', 'hash-b', 'ua-b', '10.2.3')
ON CONFLICT DO NOTHING;

reset role;

-- Staff from SACCO A should only see their own trusted device
set role app_authenticator;
select set_config('request.jwt.claim.sub', '71111111-1111-1111-1111-111111111111', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '71111111-1111-1111-1111-111111111111', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);

do $$
declare
  visible_count integer;
  owner uuid;
begin
  select count(*), max(user_id::text)::uuid into visible_count, owner from public.trusted_devices;
  if visible_count <> 1 or owner <> '71111111-1111-1111-1111-111111111111' then
    raise exception 'SACCO staff must only see their own trusted devices (count %, owner %)', visible_count, owner;
  end if;
end;
$$;

-- Staff may clear their own trusted device
do $$
declare
  removed integer;
begin
  delete from public.trusted_devices
  where user_id = '71111111-1111-1111-1111-111111111111';

  get diagnostics removed = row_count;
  if removed <> 1 then
    raise exception 'staff should be able to delete their own trusted devices (removed %)', removed;
  end if;

  insert into public.trusted_devices (user_id, device_id, device_fingerprint_hash, user_agent_hash, ip_prefix)
  values ('71111111-1111-1111-1111-111111111111', 'device-a', 'hash-a', 'ua-a', '10.1.2')
  on conflict (user_id, device_id) do update
    set device_fingerprint_hash = excluded.device_fingerprint_hash;
end;
$$;

do $$
declare
  before_count integer;
  after_count integer;
begin
  select count(*) into before_count from public.trusted_devices where user_id = '72222222-2222-2222-2222-222222222222';

  delete from public.trusted_devices where user_id = '72222222-2222-2222-2222-222222222222';

  select count(*) into after_count from public.trusted_devices where user_id = '72222222-2222-2222-2222-222222222222';

  if before_count <> after_count then
    raise exception 'SACCO staff should not delete trusted devices owned by another user (before %, after %)', before_count, after_count;
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

-- System admin should see all trusted devices
set role app_authenticator;
select set_config('request.jwt.claim.sub', '73333333-3333-3333-3333-333333333333', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '73333333-3333-3333-3333-333333333333', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);

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

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

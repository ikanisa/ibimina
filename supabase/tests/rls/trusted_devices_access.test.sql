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

set role service_role;

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

insert into public.users (id, email, role, sacco_id, mfa_enabled)
values
  ('71111111-1111-1111-1111-111111111111', 'alice_trusted@sacco.rw', 'SACCO_STAFF', '47111111-1111-1111-1111-471111111111', true),
  ('72222222-2222-2222-2222-222222222222', 'ben_trusted@sacco.rw', 'SACCO_STAFF', '47222222-2222-2222-2222-472222222222', true),
  ('73333333-3333-3333-3333-333333333333', 'admin_trusted@sacco.rw', 'SYSTEM_ADMIN', null, true)
ON CONFLICT (id) DO NOTHING;

insert into public.trusted_devices (user_id, device_id, device_fingerprint_hash, user_agent_hash, ip_prefix)
values
  ('71111111-1111-1111-1111-111111111111', 'device-a', 'hash-a', 'ua-a', '10.1.2'),
  ('72222222-2222-2222-2222-222222222222', 'device-b', 'hash-b', 'ua-b', '10.2.3')
ON CONFLICT DO NOTHING;

reset role;

-- Staff from SACCO A should only see their own trusted device
set role app_authenticator;
select set_config('request.jwt.claim.sub', '71111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '71111111-1111-1111-1111-111111111111', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  true
);

do $$
declare
  visible_count integer;
  owner uuid;
begin
  select count(*), max(user_id) into visible_count, owner from public.trusted_devices;
  if visible_count <> 1 or owner <> '71111111-1111-1111-1111-111111111111' then
    raise exception 'SACCO staff must only see their own trusted devices (count %, owner %)', visible_count, owner;
  end if;
end;
$$;

do $$
declare
  foreign_delete_allowed boolean := true;
begin
  begin
    delete from public.trusted_devices where user_id = '72222222-2222-2222-2222-222222222222';
  exception
    when others then
      foreign_delete_allowed := false;
  end;

  if foreign_delete_allowed then
    raise exception 'SACCO staff should not delete trusted devices owned by another user';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);

-- System admin should see all trusted devices
set role app_authenticator;
select set_config('request.jwt.claim.sub', '73333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '73333333-3333-3333-3333-333333333333', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  true
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
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);

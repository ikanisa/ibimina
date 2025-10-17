-- Grants to mimic Supabase authenticated role behaviour
grant usage on schema app to app_authenticator;
grant select, insert, update, delete on all tables in schema app to app_authenticator;

-- Seed canonical SACCO fixture data
insert into app.saccos (id, name, district, sector_code, merchant_code)
values
  ('31111111-1111-1111-1111-311111111111', 'Kigali SACCO', 'Gasabo', '001', 'M001'),
  ('32222222-2222-2222-2222-322222222222', 'Musanze SACCO', 'Muhoza', '002', 'M002');

insert into app.ikimina (id, sacco_id, code, name)
values
  ('33111111-1111-1111-1111-331111111111', '31111111-1111-1111-1111-311111111111', 'IK-A', 'Kigali Growth'),
  ('33222222-2222-2222-2222-332222222222', '32222222-2222-2222-2222-322222222222', 'IK-B', 'Musanze Progress');

insert into app.members (id, ikimina_id, sacco_id, member_code, full_name, msisdn)
values
  ('35111111-1111-1111-1111-351111111111', '33111111-1111-1111-1111-331111111111', '31111111-1111-1111-1111-311111111111', 'M-A1', 'Aline Umuhoza', '250788000001'),
  ('35222222-2222-2222-2222-352222222222', '33222222-2222-2222-2222-332222222222', '32222222-2222-2222-2222-322222222222', 'M-B1', 'Beni Kamanzi', '250788000002');

insert into auth.users (id, email, raw_app_meta_data)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice_staff@sacco.rw', jsonb_build_object('role', 'SACCO_STAFF')),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ben_staff@sacco.rw', jsonb_build_object('role', 'SACCO_STAFF')),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'admin_staff@sacco.rw', jsonb_build_object('role', 'SYSTEM_ADMIN'));

update app.user_profiles
set sacco_id = '31111111-1111-1111-1111-311111111111', role = 'SACCO_STAFF'
where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

update app.user_profiles
set sacco_id = '32222222-2222-2222-2222-322222222222', role = 'SACCO_STAFF'
where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

update app.user_profiles
set role = 'SYSTEM_ADMIN'
where user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Staff A visibility check
set role app_authenticator;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  true
);

do $$
declare
  member_total integer;
  outside_scope integer;
begin
  select count(*) into member_total from app.members;
  if member_total <> 1 then
    raise exception 'expected 1 member visible to SACCO A staff, got %', member_total;
  end if;

  select count(*)
  into outside_scope
  from app.members
  where sacco_id <> '31111111-1111-1111-1111-311111111111';

  if outside_scope <> 0 then
    raise exception 'staff should not see members outside their SACCO (found %)', outside_scope;
  end if;
end;
$$;

-- Staff A can add member to their SACCO
insert into app.members (ikimina_id, sacco_id, member_code, full_name, msisdn)
values ('33111111-1111-1111-1111-331111111111', '31111111-1111-1111-1111-311111111111', 'M-A2', 'Chantal Iradukunda', '250788000010');

-- Staff A blocked from inserting into SACCO B
\echo 'Expect insert into foreign SACCO to fail'
do $$
declare
  allowed boolean := true;
begin
  begin
    insert into app.members (ikimina_id, sacco_id, member_code, full_name, msisdn)
    values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'M-B2', 'Invalid Attempt', '250788000011');
  exception
    when others then
      allowed := false;
      perform null;
  end;

  if allowed then
    raise exception 'staff unexpectedly inserted into foreign SACCO';
  end if;
end;
$$;

-- Reset impersonation
reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);

-- Admin visibility check
set role app_authenticator;
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  true
);

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

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);

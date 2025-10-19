-- RLS coverage for app.mfa_email_codes
set role postgres;

delete from app.mfa_email_codes
where user_id in (
  '96666666-6666-4666-9666-aaaaaaaaaaaa',
  '97777777-7777-4777-9777-bbbbbbbbbbbb',
  '98888888-8888-4888-9888-cccccccccccc'
);

delete from app.user_profiles
where user_id in (
  '96666666-6666-4666-9666-aaaaaaaaaaaa',
  '97777777-7777-4777-9777-bbbbbbbbbbbb',
  '98888888-8888-4888-9888-cccccccccccc'
);

delete from app.saccos
where id in (
  '61111111-6666-4666-9666-aaaaaaaaaaaa'
);

delete from public.users
where id in (
  '96666666-6666-4666-9666-aaaaaaaaaaaa',
  '97777777-7777-4777-9777-bbbbbbbbbbbb',
  '98888888-8888-4888-9888-cccccccccccc'
);

delete from auth.users
where id in (
  '96666666-6666-4666-9666-aaaaaaaaaaaa',
  '97777777-7777-4777-9777-bbbbbbbbbbbb',
  '98888888-8888-4888-9888-cccccccccccc'
);

insert into auth.users (id, email)
values
  ('96666666-6666-4666-9666-aaaaaaaaaaaa', 'alice_mfa@sacco.rw'),
  ('97777777-7777-4777-9777-bbbbbbbbbbbb', 'ben_mfa@sacco.rw'),
  ('98888888-8888-4888-9888-cccccccccccc', 'admin_mfa@sacco.rw')
on conflict do nothing;

insert into public.users (id, email, role, sacco_id, mfa_enabled)
values
  ('96666666-6666-4666-9666-aaaaaaaaaaaa', 'alice_mfa@sacco.rw', 'SACCO_STAFF', null, false),
  ('97777777-7777-4777-9777-bbbbbbbbbbbb', 'ben_mfa@sacco.rw', 'SACCO_STAFF', null, false),
  ('98888888-8888-4888-9888-cccccccccccc', 'admin_mfa@sacco.rw', 'SYSTEM_ADMIN', null, false)
on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      sacco_id = excluded.sacco_id,
      mfa_enabled = excluded.mfa_enabled;

insert into app.saccos (id, name, district, sector_code, merchant_code)
values
  ('61111111-6666-4666-9666-aaaaaaaaaaaa', 'Test MFA SACCO', 'Gasabo', 'MFA', 'MFA001')
on conflict (id) do update
  set name = excluded.name,
      district = excluded.district,
      sector_code = excluded.sector_code,
      merchant_code = excluded.merchant_code;

insert into app.user_profiles (user_id, sacco_id, role)
values
  ('96666666-6666-4666-9666-aaaaaaaaaaaa', '61111111-6666-4666-9666-aaaaaaaaaaaa', 'SACCO_STAFF'),
  ('97777777-7777-4777-9777-bbbbbbbbbbbb', '61111111-6666-4666-9666-aaaaaaaaaaaa', 'SACCO_STAFF'),
  ('98888888-8888-4888-9888-cccccccccccc', null, 'SYSTEM_ADMIN')
on conflict (user_id) do update
  set sacco_id = excluded.sacco_id,
      role = excluded.role;

insert into app.mfa_email_codes (user_id, code_hash, salt, expires_at)
values (
  '97777777-7777-4777-9777-bbbbbbbbbbbb',
  'hash-other',
  'salt-other',
  timezone('utc', now()) + interval '10 minutes'
);

set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', '96666666-6666-4666-9666-aaaaaaaaaaaa', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '96666666-6666-4666-9666-aaaaaaaaaaaa', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

insert into app.mfa_email_codes (user_id, code_hash, salt, expires_at)
values (
  auth.uid(),
  'hash-self',
  'salt-self',
  timezone('utc', now()) + interval '5 minutes'
);

do $$
declare
  total integer;
  foreign_rows integer;
begin
  select count(*) into total from app.mfa_email_codes;
  if total <> 1 then
    raise exception 'staff should only see their own MFA codes (found %)', total;
  end if;

  select count(*) into foreign_rows
  from app.mfa_email_codes
  where user_id <> auth.uid();

  if foreign_rows <> 0 then
    raise exception 'staff unexpectedly saw other users'' MFA codes (% rows)', foreign_rows;
  end if;
end;
$$;

\echo 'Expect cross-user insert to fail'
do $$
declare
  allowed boolean := true;
begin
  begin
    insert into app.mfa_email_codes (user_id, code_hash, salt, expires_at)
    values (
      '97777777-7777-4777-9777-bbbbbbbbbbbb',
      'hash-foreign',
      'salt-foreign',
      timezone('utc', now()) + interval '5 minutes'
    );
  exception
    when others then
      allowed := false;
  end;

  if allowed then
    raise exception 'staff inserted MFA code for another user';
  end if;
end;
$$;

\echo 'Expect cross-user delete to leave rows untouched'
do $$
declare
  deleted_rows integer;
begin
  delete from app.mfa_email_codes
  where user_id = '97777777-7777-4777-9777-bbbbbbbbbbbb';
  get diagnostics deleted_rows = row_count;

  if deleted_rows <> 0 then
    raise exception 'staff deleted another user''s MFA code (% rows)', deleted_rows;
  end if;
end;
$$;

update app.mfa_email_codes
set consumed_at = timezone('utc', now())
where user_id = auth.uid();

do $$
declare
  consumed integer;
begin
  select count(*) into consumed
  from app.mfa_email_codes
  where user_id = auth.uid()
    and consumed_at is not null;

  if consumed <> 1 then
    raise exception 'staff could not update their own MFA code';
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
select set_config('request.jwt.claim.sub', '98888888-8888-4888-9888-cccccccccccc', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '98888888-8888-4888-9888-cccccccccccc', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  total integer;
begin
  select count(*) into total from app.mfa_email_codes;
  if total < 2 then
    raise exception 'admin expected to see all MFA codes (found %)', total;
  end if;

  delete from app.mfa_email_codes
  where user_id = '97777777-7777-4777-9777-bbbbbbbbbbbb';
end;
$$;

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;

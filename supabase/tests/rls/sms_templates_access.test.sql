-- RLS coverage for public.sms_templates
set role postgres;

delete from public.sms_templates
where id in (
  '74444444-1111-4111-9111-d4d4d4d4d4d4',
  '75555555-2222-4222-9222-e5e5e5e5e5e5',
  '76666666-3333-4333-9333-f6f6f6f6f6f6'
);

delete from public.saccos
where id = '63333333-1111-4111-9111-c3c3c3c3c3c3';

delete from app.user_profiles
where user_id in (
  '96661111-1111-4111-9111-a1a1a1a1a1a1',
  '97772222-2222-4222-9222-b2b2b2b2b2b2'
);

delete from public.users
where id in (
  '96661111-1111-4111-9111-a1a1a1a1a1a1',
  '97772222-2222-4222-9222-b2b2b2b2b2b2'
);

delete from auth.users
where id in (
  '96661111-1111-4111-9111-a1a1a1a1a1a1',
  '97772222-2222-4222-9222-b2b2b2b2b2b2'
);

insert into auth.users (id, email)
values
  ('96661111-1111-4111-9111-a1a1a1a1a1a1', 'alice_sms@sacco.rw'),
  ('97772222-2222-4222-9222-b2b2b2b2b2b2', 'admin_sms@sacco.rw')
on conflict do nothing;

insert into public.users (id, email, role, sacco_id, mfa_enabled)
values
  ('96661111-1111-4111-9111-a1a1a1a1a1a1', 'alice_sms@sacco.rw', 'SACCO_STAFF', null, false),
  ('97772222-2222-4222-9222-b2b2b2b2b2b2', 'admin_sms@sacco.rw', 'SYSTEM_ADMIN', null, false)
on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      sacco_id = excluded.sacco_id,
      mfa_enabled = excluded.mfa_enabled;

insert into app.saccos (id, name, district, sector_code, merchant_code, metadata)
values (
  '63333333-1111-4111-9111-c3c3c3c3c3c3',
  'Templates SACCO',
  'Nyarugenge',
  'TMP',
  'TMP001',
  '{}'::jsonb
)
on conflict (id) do update
  set name = excluded.name,
      district = excluded.district,
      sector_code = excluded.sector_code,
      merchant_code = excluded.merchant_code,
      metadata = excluded.metadata;

insert into app.user_profiles (user_id, sacco_id, role)
values
  ('96661111-1111-4111-9111-a1a1a1a1a1a1', '63333333-1111-4111-9111-c3c3c3c3c3c3', 'SACCO_STAFF'),
  ('97772222-2222-4222-9222-b2b2b2b2b2b2', null, 'SYSTEM_ADMIN')
on conflict (user_id) do update
  set sacco_id = excluded.sacco_id,
      role = excluded.role;

insert into public.sms_templates (id, sacco_id, name, body, is_active, version)
values
  (
    '74444444-1111-4111-9111-d4d4d4d4d4d4',
    '63333333-1111-4111-9111-c3c3c3c3c3c3',
    'welcome',
    'Murakaza neza ku SACCO yacu.',
    true,
    1
  ),
  (
    '75555555-2222-4222-9222-e5e5e5e5e5e5',
    '63333333-1111-4111-9111-c3c3c3c3c3c3',
    'reminder',
    'Mwibuke kwishyura umusanzu wanyu.',
    true,
    1
  )
on conflict (id) do update
  set name = excluded.name,
      body = excluded.body,
      is_active = excluded.is_active,
      version = excluded.version;

set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', '96661111-1111-4111-9111-a1a1a1a1a1a1', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '96661111-1111-4111-9111-a1a1a1a1a1a1', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  visible integer;
begin
  select count(*) into visible from public.sms_templates;
  if visible <> 0 then
    raise exception 'staff should not see SMS templates (found %)', visible;
  end if;
end;
$$;

\echo 'Expect staff insert to fail'
do $$
declare
  allowed boolean := true;
begin
  begin
    insert into public.sms_templates (id, sacco_id, name, body, is_active, version)
    values (
      '76666666-3333-4333-9333-f6f6f6f6f6f6',
      '63333333-1111-4111-9111-c3c3c3c3c3c3',
      'notice',
      'Ibi ni itangazo.',
      true,
      1
    );
  exception
    when others then
      allowed := false;
  end;

  if allowed then
    raise exception 'staff inserted an SMS template';
  end if;
end;
$$;

\echo 'Expect staff update to change zero rows'
do $$
declare
  updated integer;
begin
  update public.sms_templates
  set body = 'Amakuru mashya.'
  where id = '74444444-1111-4111-9111-d4d4d4d4d4d4';
  get diagnostics updated = row_count;

  if updated <> 0 then
    raise exception 'staff updated an SMS template (% rows)', updated;
  end if;
end;
$$;

\echo 'Expect staff delete to remove zero rows'
do $$
declare
  removed integer;
begin
  delete from public.sms_templates
  where id = '75555555-2222-4222-9222-e5e5e5e5e5e5';
  get diagnostics removed = row_count;

  if removed <> 0 then
    raise exception 'staff deleted an SMS template (% rows)', removed;
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
select set_config('request.jwt.claim.sub', '97772222-2222-4222-9222-b2b2b2b2b2b2', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '97772222-2222-4222-9222-b2b2b2b2b2b2', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  total integer;
begin
  select count(*) into total from public.sms_templates;
  if total < 2 then
    raise exception 'admin expected at least 2 SMS templates (found %)', total;
  end if;

  update public.sms_templates
  set body = 'Murakaza neza muri SACCO yacu!'
  where id = '74444444-1111-4111-9111-d4d4d4d4d4d4';

  insert into public.sms_templates (id, sacco_id, name, body, is_active, version)
  values (
    '76666666-3333-4333-9333-f6f6f6f6f6f6',
    '63333333-1111-4111-9111-c3c3c3c3c3c3',
    'notice',
    'Ubutumwa bushya bwemejwe.',
    true,
    1
  )
  on conflict (id) do update
    set body = excluded.body,
        version = excluded.version;
end;
$$;

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;

-- RLS coverage for public.rate_limit_counters
set role postgres;

delete from public.rate_limit_counters
where key in ('limit-staff', 'limit-admin', 'limit-new');

delete from app.user_profiles
where user_id in (
  '94444444-4444-4444-4444-dddddddddddd',
  '95555555-5555-5555-5555-eeeeeeeeeeee'
);

delete from public.users
where id in (
  '94444444-4444-4444-4444-dddddddddddd',
  '95555555-5555-5555-5555-eeeeeeeeeeee'
);

delete from auth.users
where id in (
  '94444444-4444-4444-4444-dddddddddddd',
  '95555555-5555-5555-5555-eeeeeeeeeeee'
);

insert into auth.users (id, email)
values
  ('94444444-4444-4444-4444-dddddddddddd', 'alice_rlc@sacco.rw'),
  ('95555555-5555-5555-5555-eeeeeeeeeeee', 'admin_rlc@sacco.rw')
on conflict do nothing;

insert into public.users (id, email, role, sacco_id, mfa_enabled)
values
  ('94444444-4444-4444-4444-dddddddddddd', 'alice_rlc@sacco.rw', 'SACCO_STAFF', null, false),
  ('95555555-5555-5555-5555-eeeeeeeeeeee', 'admin_rlc@sacco.rw', 'SYSTEM_ADMIN', null, false)
on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      sacco_id = excluded.sacco_id,
      mfa_enabled = excluded.mfa_enabled;

insert into app.user_profiles (user_id, sacco_id, role)
values
  ('94444444-4444-4444-4444-dddddddddddd', null, 'SACCO_STAFF'),
  ('95555555-5555-5555-5555-eeeeeeeeeeee', null, 'SYSTEM_ADMIN')
on conflict (user_id) do update
  set sacco_id = excluded.sacco_id,
      role = excluded.role;

insert into public.rate_limit_counters (key, hits, window_expires)
values
  ('limit-staff', 2, timezone('utc', now()) + interval '10 minutes'),
  ('limit-admin', 5, timezone('utc', now()) + interval '15 minutes')
on conflict (key) do update
  set hits = excluded.hits,
      window_expires = excluded.window_expires;

set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', '94444444-4444-4444-4444-dddddddddddd', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '94444444-4444-4444-4444-dddddddddddd', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  visible integer;
begin
  select count(*) into visible from public.rate_limit_counters;
  if visible <> 0 then
    raise exception 'staff should not see rate limit counters (found %)', visible;
  end if;
end;
$$;

\echo 'Expect staff insert to fail'
do $$
declare
  allowed boolean := true;
begin
  begin
    insert into public.rate_limit_counters (key, hits, window_expires)
    values ('limit-new', 1, timezone('utc', now()) + interval '1 minute');
  exception
    when others then
      allowed := false;
  end;

  if allowed then
    raise exception 'staff inserted a rate limit counter';
  end if;
end;
$$;

\echo 'Expect staff update to change zero rows'
do $$
declare
  updated integer;
begin
  update public.rate_limit_counters
  set hits = 10
  where key = 'limit-admin';
  get diagnostics updated = row_count;

  if updated <> 0 then
    raise exception 'staff updated a rate limit counter (% rows)', updated;
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
select set_config('request.jwt.claim.sub', '95555555-5555-5555-5555-eeeeeeeeeeee', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '95555555-5555-5555-5555-eeeeeeeeeeee', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  total integer;
begin
  select count(*) into total from public.rate_limit_counters;
  if total < 2 then
    raise exception 'admin expected at least 2 rate limit counters (found %)', total;
  end if;

  update public.rate_limit_counters
  set hits = hits + 1
  where key = 'limit-admin';

  insert into public.rate_limit_counters (key, hits, window_expires)
  values ('limit-new', 3, timezone('utc', now()) + interval '5 minutes')
  on conflict (key) do update
    set hits = excluded.hits,
        window_expires = excluded.window_expires;
end;
$$;

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;

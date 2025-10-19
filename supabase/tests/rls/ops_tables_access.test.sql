-- RLS coverage for ops.rate_limits and ops.idempotency

set role postgres;

delete from ops.rate_limits where route = '/api/test';
delete from ops.idempotency where key in ('ops-self', 'ops-ben');

delete from public.users
where id in (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

delete from auth.users
where id in (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

insert into auth.users (id, email)
values
  ('a1111111-1111-1111-1111-111111111111', 'alice_ops@sacco.rw'),
  ('a2222222-2222-2222-2222-222222222222', 'ben_ops@sacco.rw'),
  ('a3333333-3333-3333-3333-333333333333', 'admin_ops@sacco.rw')
on conflict do nothing;

insert into public.users (id, email, role, sacco_id, mfa_enabled)
values
  ('a1111111-1111-1111-1111-111111111111', 'alice_ops@sacco.rw', 'SACCO_STAFF', null, false),
  ('a2222222-2222-2222-2222-222222222222', 'ben_ops@sacco.rw', 'SACCO_STAFF', null, false),
  ('a3333333-3333-3333-3333-333333333333', 'admin_ops@sacco.rw', 'SYSTEM_ADMIN', null, false)
on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      sacco_id = excluded.sacco_id,
      mfa_enabled = excluded.mfa_enabled;

insert into ops.rate_limits (bucket_key, route, window_started, count)
values
  ('staff-a', '/api/test', timezone('utc', now()), 2),
  ('staff-b', '/api/test', timezone('utc', now()), 4)
on conflict do nothing;

set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', 'a1111111-1111-1111-1111-111111111111', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'a1111111-1111-1111-1111-111111111111', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

\echo 'Expect rate_limits select to fail for non-admin'
do $$
begin
  perform count(*) from ops.rate_limits;
  raise exception 'staff unexpectedly selected from ops.rate_limits';
exception
  when others then
    perform null;
end;
$$;

insert into ops.idempotency (user_id, key, request_hash, response, expires_at)
values (
  'a1111111-1111-1111-1111-111111111111',
  'ops-self',
  'hash-self',
  jsonb_build_object('ok', false),
  timezone('utc', now()) + interval '30 minutes'
)
on conflict (user_id, key) do update
  set request_hash = excluded.request_hash,
      response = excluded.response,
      expires_at = excluded.expires_at;

do $$
declare
  owned integer;
begin
  select count(*) into owned from ops.idempotency;

  if owned <> 1 then
    raise exception 'expected one idempotency row for staff user, found %', owned;
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
select set_config('request.jwt.claim.sub', 'a2222222-2222-2222-2222-222222222222', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'a2222222-2222-2222-2222-222222222222', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

insert into ops.idempotency (user_id, key, request_hash, response, expires_at)
values (
  'a2222222-2222-2222-2222-222222222222',
  'ops-ben',
  'hash-ben',
  jsonb_build_object('ok', false),
  timezone('utc', now()) + interval '45 minutes'
)
on conflict (user_id, key) do update
  set request_hash = excluded.request_hash,
      response = excluded.response,
      expires_at = excluded.expires_at;

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;

set role app_authenticator;
set row_security = on;
select set_config('request.jwt.claim.sub', 'a1111111-1111-1111-1111-111111111111', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'a1111111-1111-1111-1111-111111111111', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

\echo 'Expect cross-user idempotency update to change zero rows'
do $$
declare
  affected integer;
begin
  update ops.idempotency
  set response = jsonb_build_object('ok', 'forbidden')
  where user_id = 'a2222222-2222-2222-2222-222222222222'
    and key = 'ops-ben';
  get diagnostics affected = row_count;

  if affected <> 0 then
    raise exception 'staff updated another user''s idempotency row (% rows)', affected;
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
select set_config('request.jwt.claim.sub', 'a3333333-3333-3333-3333-333333333333', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'a3333333-3333-3333-3333-333333333333', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
declare
  total_limits integer;
  total_idempotency integer;
begin
  select count(*) into total_limits from ops.rate_limits;
  if total_limits < 2 then
    raise exception 'admin expected ≥2 rate limit buckets, found %', total_limits;
  end if;

  select count(*) into total_idempotency from ops.idempotency;
  if total_idempotency < 2 then
    raise exception 'admin expected ≥2 idempotency rows, found %', total_idempotency;
  end if;

  update ops.idempotency
  set response = jsonb_build_object('ok', 'admin')
  where user_id = 'a2222222-2222-2222-2222-222222222222'
    and key = 'ops-ben';
end;
$$;

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);
select set_config('request.jwt.claim.role', '', false);
set row_security = off;
reset role;

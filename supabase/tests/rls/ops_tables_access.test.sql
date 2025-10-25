-- RLS coverage for ops.rate_limits and ops.idempotency
grant usage on schema ops to app_authenticator;
grant select, insert, update, delete on all tables in schema ops to app_authenticator;

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
  ('a1111111-1111-1111-1111-111111111111', 'alice_ops@sacco.rw'),
  ('a2222222-2222-2222-2222-222222222222', 'ben_ops@sacco.rw'),
  ('a3333333-3333-3333-3333-333333333333', 'admin_ops@sacco.rw')
ON CONFLICT (id) DO NOTHING;

insert into app.user_profiles (user_id, role, sacco_id)
values
  ('a1111111-1111-1111-1111-111111111111', 'SACCO_STAFF', null),
  ('a2222222-2222-2222-2222-222222222222', 'SACCO_STAFF', null),
  ('a3333333-3333-3333-3333-333333333333', 'SYSTEM_ADMIN', null)
on conflict (user_id) do update
set role = excluded.role,
    sacco_id = excluded.sacco_id;

insert into ops.rate_limits (bucket_key, route, window_started, count)
values
  ('staff-a', '/api/test', timezone('utc', now()), 2),
  ('staff-b', '/api/test', timezone('utc', now()), 4)
ON CONFLICT DO NOTHING;

insert into ops.idempotency (user_id, key, request_hash, response, expires_at)
values
  ('a1111111-1111-1111-1111-111111111111', 'import-1', 'hash-a', jsonb_build_object('ok', true), timezone('utc', now()) + interval '1 hour'),
  ('a2222222-2222-2222-2222-222222222222', 'import-2', 'hash-b', jsonb_build_object('ok', true), timezone('utc', now()) + interval '1 hour')
ON CONFLICT DO NOTHING;

reset role;

-- SACCO staff cannot read rate_limits rows
set role app_authenticator;
select set_config('request.jwt.claim.sub', 'a1111111-1111-1111-1111-111111111111', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'a1111111-1111-1111-1111-111111111111', 'app_metadata', json_build_object('role', 'SACCO_STAFF'))::text,
  false
);

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

-- SACCO staff can view and update only their idempotency rows
do $$
declare
  owned integer;
  foreign_rows integer;
begin
  select count(*) into owned from ops.idempotency where user_id = 'a1111111-1111-1111-1111-111111111111';
  if owned <> 1 then
    raise exception 'expected exactly one idempotency row for staff user, found %', owned;
  end if;

  select count(*) into foreign_rows from ops.idempotency where user_id <> 'a1111111-1111-1111-1111-111111111111';
  if foreign_rows <> 0 then
    raise exception 'staff could see idempotency rows for other users (% found)', foreign_rows;
  end if;

  begin
    update ops.idempotency
    set response = jsonb_build_object('ok', false)
    where user_id = 'a2222222-2222-2222-2222-222222222222';
    raise exception 'staff updated another user''s idempotency row';
  exception
    when others then
      perform null;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

-- Admins can manage both tables
set role app_authenticator;
select set_config('request.jwt.claim.sub', 'a3333333-3333-3333-3333-333333333333', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'a3333333-3333-3333-3333-333333333333', 'app_metadata', json_build_object('role', 'SYSTEM_ADMIN'))::text,
  false
);

do $$
declare
  total_limits integer;
  total_idempotency integer;
begin
  select count(*) into total_limits from ops.rate_limits;
  if total_limits < 2 then
    raise exception 'admin expected 2+ rate limit buckets, found %', total_limits;
  end if;

  select count(*) into total_idempotency from ops.idempotency;
  if total_idempotency < 2 then
    raise exception 'admin expected 2+ idempotency rows, found %', total_idempotency;
  end if;

  update ops.idempotency
  set response = jsonb_build_object('ok', 'admin')
  where user_id = 'a2222222-2222-2222-2222-222222222222';
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

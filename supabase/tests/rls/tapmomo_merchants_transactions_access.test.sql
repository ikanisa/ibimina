-- RLS coverage for TapMoMo merchants and transactions tables

set role postgres;

grant usage on schema public to app_authenticator;
grant select, insert, update, delete on public.merchants to app_authenticator;
grant select on public.transactions to app_authenticator;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role;
  end if;
end;
$$;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.transactions to service_role;
grant select on public.merchants to service_role;

insert into auth.users (id, email)
values
  ('10000000-0000-4000-8000-000000000001', 'alice.merchant@tapmomo.rw'),
  ('20000000-0000-4000-8000-000000000002', 'ben.merchant@tapmomo.rw')
ON CONFLICT (id) DO NOTHING;

insert into public.merchants (id, user_id, display_name, network, merchant_code, secret_key)
values
  ('11111111-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '10000000-0000-4000-8000-000000000001', 'Alice Boutique', 'MTN', 'MTN001', decode('a1b2c3d4e5f60708a9b0c1d2e3f40506', 'hex')),
  ('22222222-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '20000000-0000-4000-8000-000000000002', 'Ben Electronics', 'Airtel', 'AIR222', decode('00112233445566778899aabbccddeeff', 'hex'))
ON CONFLICT (id) DO NOTHING;

insert into public.transactions (id, merchant_id, nonce, amount, currency, status, payer_hint, notes)
values
  ('33333333-cccc-4ccc-8ccc-ccccccccccc3', '11111111-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '44444444-cccc-4ccc-8ccc-ccccccccccc4', 2500, 'RWF', 'pending', '+250788000111', 'initial tap'),
  ('55555555-dddd-4ddd-8ddd-ddddddddddd5', '22222222-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '66666666-dddd-4ddd-8ddd-ddddddddddd6', 4200, 'RWF', 'settled', '+250788000222', 'reconciled')
ON CONFLICT (id) DO NOTHING;

reset role;

-- Alice should only see her merchant and transactions
set role app_authenticator;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', false);
select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-4000-8000-000000000001')::text, false);

-- Alice can see her merchant
\echo 'Alice merchant visibility'
do $$
declare
  total integer;
begin
  select count(*) into total from public.merchants;
  if total <> 1 then
    raise exception 'alice should only see 1 merchant, saw %', total;
  end if;
end;
$$;

-- Alice cannot see Ben's merchant data
\echo 'Alice cannot see Ben merchant'
do $$
declare
  forbidden integer;
begin
  select count(*) into forbidden from public.merchants where id = '22222222-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  if forbidden <> 0 then
    raise exception 'alice saw forbidden merchant row';
  end if;
end;
$$;

-- Alice can insert a merchant for herself
\echo 'Alice merchant insert allowed'
do $$
declare
  new_id uuid := '77777777-eeee-4eee-8eee-eeeeeeeeeee7';
  inserted uuid;
begin
  insert into public.merchants (id, user_id, display_name, network, merchant_code, secret_key)
  values (new_id, '10000000-0000-4000-8000-000000000001', 'Alice Extra Stall', 'MTN', 'MTN002', decode('ffeeddccbbaa99887766554433221100', 'hex'))
  returning id into inserted;

  if inserted is null then
    raise exception 'alice should be able to insert her merchant';
  end if;

  delete from public.merchants where id = new_id;
end;
$$;

-- Alice cannot update Ben's merchant
\echo 'Alice cross-merchant update forbidden'
do $$
declare
  updated integer;
begin
  update public.merchants
  set display_name = 'Hacked Name'
  where id = '22222222-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  get diagnostics updated = row_count;
  if updated <> 0 then
    raise exception 'alice unexpectedly updated foreign merchant';
  end if;
end;
$$;

-- Alice can only see her transactions
\echo 'Alice transactions visibility'
do $$
declare
  total integer;
  foreign_rows integer;
begin
  select count(*) into total from public.transactions;
  if total <> 1 then
    raise exception 'alice should see exactly 1 transaction, saw %', total;
  end if;

  select count(*) into foreign_rows from public.transactions where merchant_id <> '11111111-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  if foreign_rows <> 0 then
    raise exception 'alice saw transactions for other merchants';
  end if;
end;
$$;

-- Alice cannot insert transactions (service only)
\echo 'Alice transaction insert forbidden'
do $$
declare
  allowed boolean := true;
begin
  begin
    insert into public.transactions (merchant_id, nonce, amount, status)
    values ('11111111-aaaa-4aaa-8aaa-aaaaaaaaaaa1', gen_random_uuid(), 1000, 'pending');
  exception
    when others then
      allowed := false;
  end;

  if allowed then
    raise exception 'alice should not insert transactions';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

-- Service role can upsert transactions across merchants
set role service_role;

\echo 'Service role transaction insert allowed'
do $$
declare
  new_id uuid := '88888888-ffff-4fff-8fff-fffffffffff8';
  inserted uuid;
begin
  insert into public.transactions (id, merchant_id, nonce, amount, status)
  values (new_id, '22222222-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '99999999-ffff-4fff-8fff-fffffffffff9', 5100, 'failed')
  returning id into inserted;

  if inserted is null then
    raise exception 'service role failed to insert transaction';
  end if;
end;
$$;

\echo 'Service role transaction update allowed'
do $$
declare
  updated integer;
begin
  update public.transactions
  set status = 'settled'
  where id = '88888888-ffff-4fff-8fff-fffffffffff8';
  get diagnostics updated = row_count;
  if updated <> 1 then
    raise exception 'service role should update 1 row, updated %', updated;
  end if;

  delete from public.transactions where id = '88888888-ffff-4fff-8fff-fffffffffff8';
end;
$$;

reset role;

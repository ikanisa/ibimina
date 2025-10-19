do $$
declare
  rel_name text;
  schema_name text;
  table_name text;
begin
  foreach rel_name in array ARRAY[
    'auth.users',
    'public.users',
    'public.saccos',
    'public.ibimina',
    'public.members',
    'public.payments',
    'public.trusted_devices',
    'public.recon_exceptions',
    'ops.rate_limits',
    'ops.idempotency',
    'authx.otp_issues',
    'authx.user_mfa'
  ] loop
    schema_name := split_part(rel_name, '.', 1);
    table_name := split_part(rel_name, '.', 2);

    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = schema_name
        and c.relname = table_name
        and c.relkind in ('r', 'p')
    ) then
      execute format('truncate table %I.%I restart identity cascade', schema_name, table_name);
    end if;
  end loop;
end;
$$;

-- Reset tables before running RLS tests, skipping ones that may not exist in local fixtures.
do $$
declare
  scoped record;
begin
  for scoped in
    select schema_name, table_name from (values
      ('auth', 'users'),
      ('public', 'users'),
      ('public', 'saccos'),
      ('public', 'ibimina'),
      ('public', 'members'),
      ('public', 'payments'),
      ('public', 'trusted_devices'),
      ('public', 'recon_exceptions'),
      ('ops', 'rate_limits'),
      ('ops', 'idempotency'),
      ('authx', 'otp_issues'),
      ('authx', 'user_mfa')
    ) as targets(schema_name, table_name)
  loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = scoped.schema_name
        and table_name = scoped.table_name
        and table_type = 'BASE TABLE'
    ) then
      execute format(
        'truncate table %I.%I restart identity cascade',
        scoped.schema_name,
        scoped.table_name
      );
    end if;
  end loop;
end;
$$;

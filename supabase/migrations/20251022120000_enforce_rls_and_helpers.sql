-- Re-enable row level security on any tables that may have drifted,
-- keeping parity with docs/RLS.md expectations.
do $$
declare
  target_tables constant text[] := array[
    'app.user_profiles',
    'app.saccos',
    'app.ikimina',
    'app.members',
    'app.payments',
    'app.recon_exceptions',
    'app.accounts',
    'app.ledger_entries',
    'app.sms_inbox',
    'app.import_files',
    'app.audit_logs',
    'app.devices_trusted',
    'ops.rate_limits',
    'ops.idempotency',
    'public.users',
    'public.webauthn_credentials',
    'public.mfa_recovery_codes',
    'public.trusted_devices',
    'public.notification_queue',
    'public.configuration',
    'public.system_metrics',
    'public.members_app_profiles',
    'public.user_saccos',
    'public.join_requests',
    'public.group_invites',
    'public.notifications'
  ];
  schema_name text;
  table_name text;
  qualified_regclass regclass;
  relation_kind char;
  idx integer;
begin
  for idx in array_lower(target_tables, 1)..array_upper(target_tables, 1) loop
    schema_name := split_part(target_tables[idx], '.', 1);
    table_name := split_part(target_tables[idx], '.', 2);
    qualified_regclass := to_regclass(format('%I.%I', schema_name, table_name));

    if qualified_regclass is not null then
      select relkind
        into relation_kind
        from pg_class
        where oid = qualified_regclass;

      if relation_kind = 'r' then -- ordinary table
        execute format('alter table %I.%I enable row level security', schema_name, table_name);
      end if;
    end if;
  end loop;
end
$$;

-- Fail fast if critical helper functions disappeared; policies rely on them.
do $$
declare
  required_functions constant text[] := array[
    'app.current_sacco()',
    'app.current_role()',
    'app.is_admin()',
    'app.member_sacco(uuid)',
    'app.payment_sacco(uuid)',
    'app.account_sacco(uuid)',
    'app.account_balance(uuid)'
  ];
  missing_funcs text[];
begin
  select array_agg(fn)
    into missing_funcs
    from unnest(required_functions) as fn
    where to_regprocedure(fn) is null;

  if missing_funcs is not null then
    raise exception 'Missing expected helper functions: %', missing_funcs;
  end if;
end
$$;

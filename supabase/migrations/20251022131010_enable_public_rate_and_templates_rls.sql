-- Align legacy public tables with RLS expectations so Studio toggles can't disable policies.

-- public.rate_limit_counters should only be visible to admins/service role to avoid leaking throttle state.
alter table if exists public.rate_limit_counters enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rate_limit_counters'
  ) then
    execute '
    create policy rate_limit_counters_admin
      on public.rate_limit_counters
      for all
      using (app.is_admin())
      with check (app.is_admin());
  ';
  end if;
end;
$$;

-- public.sms_templates should only be managed by admins/service functions.
alter table if exists public.sms_templates enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sms_templates'
  ) then
    execute '
    create policy sms_templates_admin
      on public.sms_templates
      for all
      using (app.is_admin())
      with check (app.is_admin());
  ';
  end if;
end;
$$;

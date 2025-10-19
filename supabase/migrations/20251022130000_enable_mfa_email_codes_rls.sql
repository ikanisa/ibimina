-- Enable RLS on app.mfa_email_codes and align policies with other MFA tables
alter table if exists app.mfa_email_codes enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'app'
      and tablename = 'mfa_email_codes'
  ) then
    return;
  end if;

  execute '
    create policy mfa_email_codes_self_manage
    on app.mfa_email_codes
    for all
    using (auth.uid() = user_id or app.is_admin())
    with check (auth.uid() = user_id or app.is_admin())
  ';
end;
$$;

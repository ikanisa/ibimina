-- Align auth.users phone/email_change fields with non-null expectations, but
-- only when the legacy columns still exist (local Supabase CLI snapshots may
-- omit them).
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'users'
      and column_name = 'email_change'
  ) then
    execute 'update auth.users set email_change = coalesce(email_change, '''')';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'users'
      and column_name = 'phone'
  ) then
    execute 'update auth.users
             set phone = concat(''pending-'', id::text)
             where phone is null';
  end if;
end;
$$;

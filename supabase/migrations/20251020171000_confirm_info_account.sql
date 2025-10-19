-- Ensure the primary admin account is confirmed without assuming legacy columns
-- exist in every environment (Supabase CLI snapshots can drift).
do $$
declare
  col text;
  admin_email text := coalesce(nullif(current_setting('app.admin_default_email', true), ''), 'info@ikanisa.com');
begin
  for col in
    select column_name
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'users'
      and column_name = any (array[
        'email_confirmed_at',
        'confirmation_token',
        'email_change_token_current',
        'email_change_token_new',
        'recovery_token',
        'phone_change_token',
        'reauthentication_token'
      ])
  loop
    if col = 'email_confirmed_at' then
      execute format(
        'update auth.users set %I = timezone(''UTC'', now()) where email = %L',
        col,
        admin_email
      );
    else
      execute format(
        'update auth.users set %1$I = coalesce(%1$I, '''') where email = %2$L',
        col,
        admin_email
      );
    end if;
  end loop;
end;
$$;

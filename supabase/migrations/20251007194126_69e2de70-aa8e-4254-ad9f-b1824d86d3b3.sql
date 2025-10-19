-- Rollback the previous bad migration that tried to insert into auth.users
-- This was causing schema errors because email_change column was missing

-- Remove any incorrectly created admin users from the bad migration
DO $$
DECLARE
  admin_email text := coalesce(nullif(current_setting('app.admin_default_email', true), ''), 'info@ikanisa.com');
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'auth'
      AND table_name = 'users'
      AND column_name = 'email_change'
  ) THEN
    DELETE FROM auth.users WHERE email = admin_email AND email_change IS NULL;
  ELSE
    DELETE FROM auth.users WHERE email = admin_email;
  END IF;
END;
$$;
-- The correct approach is to use the bootstrap-admin edge function
-- which uses the Supabase Admin API to properly create users;

-- Ensure the primary system admin account exists with the expected credentials
DO $$
DECLARE
  admin_email text := coalesce(
    nullif(current_setting('app.admin_default_email', true), ''),
    'info@ikanisa.com'
  );
  admin_password text := coalesce(
    nullif(current_setting('app.admin_default_password', true), ''),
    'MoMo!!0099'
  );
  admin_name text := coalesce(
    nullif(current_setting('app.admin_default_name', true), ''),
    'System Admin'
  );
  admin_id uuid;
  new_password_hash text;
  admin_metadata jsonb := jsonb_build_object('full_name', admin_name);
BEGIN
  new_password_hash := crypt(admin_password, gen_salt('bf', 10));
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_current,
      email_change_token_new,
      recovery_token,
      phone_change_token,
      reauthentication_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      admin_email,
      new_password_hash,
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      admin_metadata,
      false,
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      ''
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = new_password_hash,
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || admin_metadata,
      updated_at = now(),
      confirmation_token = coalesce(confirmation_token, ''),
      email_change_token_current = coalesce(email_change_token_current, ''),
      email_change_token_new = coalesce(email_change_token_new, ''),
      recovery_token = coalesce(recovery_token, ''),
      phone_change_token = coalesce(phone_change_token, ''),
      reauthentication_token = coalesce(reauthentication_token, '')
    WHERE id = admin_id;
  END IF;

  IF to_regclass('public.users') IS NOT NULL THEN
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (admin_id, admin_email, 'SYSTEM_ADMIN', now(), now())
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          role = 'SYSTEM_ADMIN',
          updated_at = now();
  END IF;
END $$;

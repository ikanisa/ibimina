-- Create the admin user directly using Supabase's admin functions
-- This is a one-time bootstrap migration

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'info@ikanisa.com';

  -- Only create if doesn't exist
  IF admin_user_id IS NULL THEN
    -- Insert into auth.users (this is the Supabase auth table)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'info@ikanisa.com',
      crypt('MoMo!!0099', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;

    -- The trigger will automatically create the user in public.users with SYSTEM_ADMIN role
    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
  END IF;
END $$;

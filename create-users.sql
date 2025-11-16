-- Create users directly in auth.users table
-- This requires the pgcrypto extension for password hashing

-- Create admin user
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated', 
    'info@ikanisa.com',
    crypt('MoMo!!0099', gen_salt('bf')),
    NOW(),
    '{"role": "admin", "full_name": "Admin User"}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
) ON CONFLICT (email) DO UPDATE 
SET encrypted_password = crypt('MoMo!!0099', gen_salt('bf')),
    raw_user_meta_data = '{"role": "admin", "full_name": "Admin User"}'::jsonb;

-- Create staff user
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'bosco@ikanisa.com',
    crypt('MoMo!!0099', gen_salt('bf')),
    NOW(),
    '{"role": "staff", "full_name": "Bosco Staff"}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
) ON CONFLICT (email) DO UPDATE 
SET encrypted_password = crypt('MoMo!!0099', gen_salt('bf')),
    raw_user_meta_data = '{"role": "staff", "full_name": "Bosco Staff"}'::jsonb;

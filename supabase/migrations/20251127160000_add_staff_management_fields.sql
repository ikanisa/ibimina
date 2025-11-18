-- Adds status, pw_reset_required, last_login_at, suspended_at, suspended_by

-- Add status column (ACTIVE, SUSPENDED, INACTIVE)
ALTER TABLE app.user_profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';

-- Add password reset required flag
ALTER TABLE app.user_profiles
  ADD COLUMN IF NOT EXISTS pw_reset_required BOOLEAN NOT NULL DEFAULT false;

-- Add last login timestamp
ALTER TABLE app.user_profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Add suspension tracking
ALTER TABLE app.user_profiles
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE app.user_profiles
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add notes/comments field for admin use
ALTER TABLE app.user_profiles
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON app.user_profiles(status);

-- Create index for pw_reset_required filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_pw_reset_required ON app.user_profiles(pw_reset_required) WHERE pw_reset_required = true;

-- Expose the new fields through the public.users security-barrier view
CREATE OR REPLACE VIEW public.users
WITH (security_barrier = true) AS
SELECT
  p.user_id AS id,
  auth_users.email,
  COALESCE(p.role, 'SACCO_STAFF')::public.app_role AS role,
  p.sacco_id,
  p.status,
  p.pw_reset_required,
  p.last_login_at,
  p.suspended_at,
  p.suspended_by,
  p.notes,
  auth_users.created_at,
  auth_users.updated_at
FROM app.user_profiles p
JOIN auth.users auth_users ON auth_users.id = p.user_id;

ALTER VIEW public.users SET (security_barrier = true);

-- Add staff management fields to public.users table
-- Adds status, pw_reset_required, last_login_at, suspended_at, suspended_by

-- Add status column (ACTIVE, SUSPENDED, INACTIVE)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';

-- Add password reset required flag
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS pw_reset_required BOOLEAN NOT NULL DEFAULT false;

-- Add last login timestamp
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Add suspension tracking
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add notes/comments field for admin use
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Create index for pw_reset_required filtering
CREATE INDEX IF NOT EXISTS idx_users_pw_reset_required ON public.users(pw_reset_required) WHERE pw_reset_required = true;

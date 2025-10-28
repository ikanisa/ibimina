-- Staff management: Add fields for password reset, account status, and staff metadata
-- Supports E1: Staff Directory + Add/Invite Staff

-- 1. Add pw_reset_required column to public.users ----------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'pw_reset_required'
  ) THEN
    ALTER TABLE public.users ADD COLUMN pw_reset_required BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Add account_status column to public.users --------------------------------
-- Enum values: 'ACTIVE', 'SUSPENDED', 'INACTIVE'
DO $$
BEGIN
  -- Create enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_account_status') THEN
    CREATE TYPE public.user_account_status AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');
  END IF;
  
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN account_status public.user_account_status NOT NULL DEFAULT 'ACTIVE';
  END IF;
END $$;

-- 3. Add staff metadata columns -----------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN full_name TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;
END $$;

-- 4. Add indexes for common queries -------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_pw_reset_required ON public.users(pw_reset_required) WHERE pw_reset_required = true;

-- 5. Add helpful comments -----------------------------------------------------
COMMENT ON COLUMN public.users.pw_reset_required IS 'Forces password reset on next login for newly invited staff';
COMMENT ON COLUMN public.users.account_status IS 'Account status: ACTIVE, SUSPENDED, or INACTIVE';
COMMENT ON COLUMN public.users.full_name IS 'Staff member full name';
COMMENT ON COLUMN public.users.phone IS 'Staff member phone number';
COMMENT ON COLUMN public.users.last_login_at IS 'Timestamp of last successful login';

-- 6. Create helper function to check if user account is active ----------------
CREATE OR REPLACE FUNCTION public.is_user_account_active(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_uuid AND account_status = 'ACTIVE'
  );
END;
$$;

COMMENT ON FUNCTION public.is_user_account_active(UUID) IS 'Returns true if user account status is ACTIVE';

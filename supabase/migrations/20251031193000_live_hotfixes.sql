-- === ENUMS =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='notification_channel') THEN
    EXECUTE 'CREATE TYPE public.notification_channel AS ENUM (''IN_APP'',''EMAIL'',''WHATSAPP'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='notification_type') THEN
    EXECUTE 'CREATE TYPE public.notification_type AS ENUM (''invite_accepted'',''new_member'',''payment_confirmed'')';
  END IF;
END $$;

-- === USERS VIEW ===============================================
DO $$
DECLARE
  view_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_catalog.pg_views
    WHERE schemaname = 'public' AND viewname = 'users'
  )
  INTO view_exists;

  IF view_exists THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW public.users
        (id,email,role,sacco_id,status,pw_reset_required,last_login_at,suspended_at,
         suspended_by,notes,created_at,updated_at)
      WITH (security_barrier = true) AS
      SELECT
        p.user_id AS id,
        au.email,
        COALESCE(p.role,'SACCO_STAFF')::public.app_role AS role,
        p.sacco_id,
        p.status,
        p.pw_reset_required,
        p.last_login_at,
        p.suspended_at,
        p.suspended_by,
        p.notes,
        au.created_at,
        au.updated_at
      FROM app.user_profiles p
      JOIN auth.users au ON au.id = p.user_id;
    $view$;
  ELSE
    EXECUTE $view$
      CREATE VIEW public.users
        (id,email,role,sacco_id,status,pw_reset_required,last_login_at,suspended_at,
         suspended_by,notes,created_at,updated_at)
      WITH (security_barrier = true) AS
      SELECT
        p.user_id AS id,
        au.email,
        COALESCE(p.role,'SACCO_STAFF')::public.app_role AS role,
        p.sacco_id,
        p.status,
        p.pw_reset_required,
        p.last_login_at,
        p.suspended_at,
        p.suspended_by,
        p.notes,
        au.created_at,
        au.updated_at
      FROM app.user_profiles p
      JOIN auth.users au ON au.id = p.user_id;
    $view$;
  END IF;
END $$;
ALTER VIEW public.users SET (security_barrier = true);

-- === OTP: one active code per phone ===========================
CREATE UNIQUE INDEX IF NOT EXISTS ux_whatsapp_otp_active
  ON app.whatsapp_otp_codes (phone_number)
  WHERE consumed_at IS NULL;

-- === Telco timestamps + unique ================================
ALTER TABLE public.telco_providers
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('UTC', now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('UTC', now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_class t ON t.oid = c.conrelid
    JOIN   pg_namespace n ON n.oid = t.relnamespace
    WHERE  c.contype='u' AND n.nspname='public' AND t.relname='telco_providers'
           AND pg_get_constraintdef(c.oid) ILIKE 'UNIQUE (country_id, name)%'
  ) THEN
    ALTER TABLE public.telco_providers
      ADD CONSTRAINT telco_providers_country_name_key UNIQUE (country_id, name);
  END IF;
END $$;

-- === Helper: is_platform_admin() ==============================
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'SYSTEM_ADMIN'
  );
$$;

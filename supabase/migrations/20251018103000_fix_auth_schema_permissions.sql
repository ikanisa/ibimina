-- Restore Supabase auth schema privileges after custom schema rollout
-- The Supabase auth API runs as the `supabase_authenticator` role. When the new
-- `authx` schema was introduced we forgot to grant usage/select on that schema
-- to the internal auth roles. As soon as GoTrue attempted to introspect the
-- database during password login it failed with "Database error querying
-- schema", which surfaced as a 500 from `/auth/v1/token`. These grants ensure
-- GoTrue can inspect `auth.users` and related tables again while keeping the
-- application roles locked down.

-- Ensure the internal roles exist before applying grants to avoid errors on
-- self-hosted tests.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_authenticator') THEN
    RAISE NOTICE 'supabase_authenticator role missing; skipping grants';
    RETURN;
  END IF;

  -- Re-grant explicit usage and select privileges on the auth schemas used by
  -- the Supabase auth stack.
  EXECUTE 'GRANT USAGE ON SCHEMA auth TO supabase_authenticator';
  EXECUTE 'GRANT USAGE ON SCHEMA authx TO supabase_authenticator';
  EXECUTE 'GRANT SELECT ON ALL TABLES IN SCHEMA auth TO supabase_authenticator';
  EXECUTE 'GRANT SELECT ON ALL TABLES IN SCHEMA authx TO supabase_authenticator';

  -- Future tables created in auth/authx should also be visible to the auth
  -- service. The default privileges ensure the grants survive schema changes.
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT SELECT ON TABLES TO supabase_authenticator';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA authx GRANT SELECT ON TABLES TO supabase_authenticator';

  -- The auth admin role powers migrations and service-role operations. Keep its
  -- access aligned with the authenticator to avoid divergence.
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA auth TO supabase_auth_admin';
    EXECUTE 'GRANT USAGE ON SCHEMA authx TO supabase_auth_admin';
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA authx TO supabase_auth_admin';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA authx GRANT ALL ON TABLES TO supabase_auth_admin';
  END IF;
END
$$;

-- Minimal Supabase auth schema & helpers for local RLS tests
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create schema if not exists auth;
create schema if not exists ops;
create schema if not exists app_helpers;
create schema if not exists storage;
create schema if not exists extensions;

create or replace function extensions.uuid_generate_v4()
returns uuid
language sql
volatile
as $$
  select public.uuid_generate_v4();
$$;

create table if not exists storage.buckets (
  id text primary key,
  name text unique,
  owner uuid,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz not null default timezone('UTC', now()),
  updated_at timestamptz not null default timezone('UTC', now())
);

create table if not exists storage.objects (
  id uuid primary key default uuid_generate_v4(),
  bucket_id text not null references storage.buckets(id) on delete cascade,
  name text not null,
  owner uuid,
  created_at timestamptz not null default timezone('UTC', now()),
  updated_at timestamptz not null default timezone('UTC', now()),
  last_accessed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  path_tokens text[] not null default '{}'::text[]
);

create table if not exists auth.users (
  instance_id uuid default '00000000-0000-0000-0000-000000000000',
  id uuid primary key,
  aud text not null default 'authenticated',
  role text not null default 'authenticated',
  email text unique,
  email_change text,
  encrypted_password text,
  phone text,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  confirmation_token text,
  email_change_token_current text,
  email_change_token_new text,
  recovery_token text,
  phone_change_token text,
  reauthentication_token text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default timezone('UTC', now()),
  updated_at timestamptz not null default timezone('UTC', now())
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    auth.jwt() ->> 'role',
    'anon'
  );
$$;

-- Helper function to check if user has a specific role
-- Safe version that handles missing tables
create or replace function public.has_role(user_id uuid, role_name text)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  -- Check if users table exists first
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'users'
  ) then
    return false;
  end if;
  
  return exists (
    select 1 from public.users
    where id = user_id and role = role_name
  );
exception
  when others then
    return false;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;
end;
$$;

grant usage on schema auth to authenticated, service_role, anon;
grant select, insert, update, delete on all tables in schema auth to service_role;
grant usage on schema auth to app_authenticator;
grant select on all tables in schema auth to app_authenticator;
alter default privileges in schema auth grant select on tables to app_authenticator;

grant usage on schema public to service_role, authenticated, anon;
grant select, insert, update, delete on all tables in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_authenticator') then
    create role app_authenticator;
  end if;
end;
$$;

grant usage on schema ops to service_role, app_authenticator;
grant select, insert, update, delete on all tables in schema ops to service_role;
alter default privileges in schema ops grant select, insert, update, delete on tables to service_role;

grant app_authenticator to postgres;
grant usage on schema public to app_authenticator;
alter default privileges in schema public grant select on tables to app_authenticator;

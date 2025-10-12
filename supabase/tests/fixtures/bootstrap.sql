-- Minimal Supabase auth schema & helpers for local RLS tests
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create schema if not exists auth;

create table if not exists auth.users (
  instance_id uuid default '00000000-0000-0000-0000-000000000000',
  id uuid primary key,
  aud text not null default 'authenticated',
  role text not null default 'authenticated',
  email text unique,
  encrypted_password text,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
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

create role if not exists authenticated;
create role if not exists service_role;
create role if not exists anon;

grant usage on schema auth to authenticated, service_role, anon;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_authenticator') then
    create role app_authenticator;
  end if;
end;
$$;


-- Minimal Supabase auth schema & helpers for local RLS tests
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create schema if not exists auth;
create schema if not exists ops;
create schema if not exists app_helpers;

create table if not exists auth.users (
  instance_id uuid default '00000000-0000-0000-0000-000000000000',
  id uuid primary key,
  aud text not null default 'authenticated',
  role text not null default 'authenticated',
  email text unique,
  encrypted_password text,
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

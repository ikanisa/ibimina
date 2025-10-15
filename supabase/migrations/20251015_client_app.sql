-- 20251015_client_app.sql
-- SACCO+ Client App: tables + helpers + RLS

-- Extensions (safe to call)
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================================
-- 0) Core reference tables (create if missing)
-- ============================================================================

create table if not exists public.saccos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district text not null,
  sector_code text not null,
  merchant_code text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

alter table public.saccos
  add column if not exists merchant_code text not null default '9XXXXX';

create table if not exists public.ikimina (
  id uuid primary key default gen_random_uuid(),
  sacco_id uuid not null references public.saccos(id) on delete cascade,
  code text not null,
  name text not null,
  type text not null default 'ASCA',
  settings jsonb not null default '{}',
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  unique (sacco_id, code)
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  ikimina_id uuid not null references public.ikimina(id) on delete cascade,
  user_id uuid,                  -- auth.users.id (nullable for legacy members)
  member_code text,
  full_name text,
  national_id text,
  msisdn text,
  joined_at timestamptz not null default now(),
  status text not null default 'ACTIVE',
  unique (ikimina_id, member_code)
);

-- ============================================================================
-- 1) Client app profile and relations
-- ============================================================================

create table if not exists public.members_app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  whatsapp_msisdn text not null,
  momo_msisdn text not null,
  id_type text check (id_type in ('NID','DL','PASSPORT')),
  id_number text,
  id_files jsonb default '{}'::jsonb,     -- {front_url, back_url}
  ocr_json jsonb default '{}'::jsonb,     -- extracted fields with confidence
  lang text default 'rw',                 -- 'rw' | 'en' | 'fr'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_saccos (
  user_id uuid not null references auth.users(id) on delete cascade,
  sacco_id uuid not null references public.saccos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, sacco_id)
);

create type public.join_status as enum ('pending','approved','rejected');

create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sacco_id uuid not null references public.saccos(id) on delete cascade,
  group_id uuid not null references public.ikimina(id) on delete cascade,
  note text,
  status public.join_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid      -- auth.users.id of staff (admin app writes)
);

create type public.invite_status as enum ('sent','accepted','expired');

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.ikimina(id) on delete cascade,
  invitee_user_id uuid,           -- if known
  invitee_msisdn text,            -- or phone-based invite
  token text not null unique,     -- opaque
  status public.invite_status not null default 'sent',
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create type public.notify_type as enum ('new_member','payment_confirmed','invite_accepted');

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.notify_type not null,
  payload jsonb not null,         -- free-form: {group_id, amount, ...}
  created_at timestamptz not null default now(),
  read_at timestamptz
);

insert into storage.buckets (id, name, public)
values ('private', 'private', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'payment_status' and n.nspname = 'public'
  ) then
    create type public.payment_status as enum ('pending','completed','failed');
  end if;
end $$;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  sacco_id uuid not null references public.saccos(id) on delete cascade,
  ikimina_id uuid references public.ikimina(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  txn_id text,
  source_id text,
  channel text,
  amount numeric(18,2) not null,
  currency text not null default 'RWF',
  status text not null default 'pending',
  confidence numeric,
  msisdn text,
  msisdn_encrypted text,
  msisdn_hash text,
  msisdn_masked text,
  reference text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ai_version text
);

alter table public.payments
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.payments
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.payments
  add column if not exists updated_at timestamptz not null default now();

update public.payments
set updated_at = now()
where updated_at is null;

alter table public.payments
  alter column metadata set default '{}'::jsonb;

-- Helpful indexes
create index if not exists idx_members_user_id on public.members(user_id);
create index if not exists idx_members_msisdn on public.members(msisdn);
create index if not exists idx_members_nid on public.members(national_id);
create index if not exists idx_ikimina_sacco on public.ikimina(sacco_id);
create index if not exists idx_join_requests_user on public.join_requests(user_id);
create index if not exists idx_group_invites_token on public.group_invites(token);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_group on public.payments(ikimina_id);
create index if not exists idx_payments_status on public.payments(status);

-- ============================================================================
-- 2) Helper functions for RLS
-- ============================================================================

-- current auth user (shortcut)
create or replace function public.current_user_id()
returns uuid language sql stable as $$
  select auth.uid()
$$;

-- is the current user a member of a given group?
create or replace function public.is_user_member_of_group(gid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.members m
    where m.ikimina_id = gid and (m.user_id = auth.uid())
  );
$$;

-- ============================================================================
-- 3) RLS Policies
-- ============================================================================

alter table public.members_app_profiles enable row level security;
alter table public.user_saccos          enable row level security;
alter table public.join_requests        enable row level security;
alter table public.group_invites        enable row level security;
alter table public.notifications        enable row level security;
alter table public.payments             enable row level security;

-- Profiles: user can see/update ONLY their own profile
drop policy if exists prof_select_self on public.members_app_profiles;
create policy prof_select_self on public.members_app_profiles
for select using (user_id = auth.uid());

drop policy if exists prof_update_self on public.members_app_profiles;
create policy prof_update_self on public.members_app_profiles
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists prof_insert_self on public.members_app_profiles;
create policy prof_insert_self on public.members_app_profiles
for insert with check (user_id = auth.uid());

-- User SACCOs: only own rows
drop policy if exists us_select_self on public.user_saccos;
create policy us_select_self on public.user_saccos
for select using (user_id = auth.uid());

drop policy if exists us_insert_self on public.user_saccos;
create policy us_insert_self on public.user_saccos
for insert with check (user_id = auth.uid());

-- Join requests: only user’s own
drop policy if exists jr_select_self on public.join_requests;
create policy jr_select_self on public.join_requests
for select using (user_id = auth.uid());

drop policy if exists jr_insert_self on public.join_requests;
create policy jr_insert_self on public.join_requests
for insert with check (user_id = auth.uid());

-- Staff/admin app (not covered here) should use service role to approve/reject.

-- Group invites:
-- Accepting by token (route uses token), allow select if you are invitee OR using token in a server function.
drop policy if exists gi_select_limited on public.group_invites;
create policy gi_select_limited on public.group_invites
for select using (
  (invitee_user_id = auth.uid()) or (auth.role() = 'service_role')
);

drop policy if exists gi_update_accept on public.group_invites;
create policy gi_update_accept on public.group_invites
for update using (
  (invitee_user_id = auth.uid()) or (auth.role() = 'service_role')
) with check (
  (invitee_user_id = auth.uid()) or (auth.role() = 'service_role')
);

-- Notifications: only own
drop policy if exists notif_select_self on public.notifications;
create policy notif_select_self on public.notifications
for select using (user_id = auth.uid());

drop policy if exists notif_update_self on public.notifications;
create policy notif_update_self on public.notifications
for update using (user_id = auth.uid());

drop policy if exists notif_insert_service on public.notifications;
create policy notif_insert_service on public.notifications
for insert with check (user_id = auth.uid() or auth.role() = 'service_role');

drop policy if exists payments_select_self on public.payments;
create policy payments_select_self on public.payments
for select using (user_id = auth.uid());

drop policy if exists payments_insert_service on public.payments;
create policy payments_insert_service on public.payments
for insert with check (auth.role() = 'service_role');

drop policy if exists payments_update_service on public.payments;
create policy payments_update_service on public.payments
for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Group members list is protected via app logic + existing RLS on "members":
-- Ensure "members" table has RLS and only allows select if the current user
-- is a member of that same group.
alter table public.members enable row level security;

drop policy if exists members_select_guarded on public.members;
create policy members_select_guarded on public.members
for select using (
  public.is_user_member_of_group(ikimina_id) or auth.role() = 'service_role'
);

-- Public metadata for saccos/ikimina is readable by all authenticated users.
alter table public.saccos enable row level security;
drop policy if exists saccos_select_all_auth on public.saccos;
create policy saccos_select_all_auth on public.saccos
for select using (auth.uid() is not null);

alter table public.ikimina enable row level security;
drop policy if exists ikimina_select_all_auth on public.ikimina;
create policy ikimina_select_all_auth on public.ikimina
for select using (auth.uid() is not null);

-- ============================================================================
-- 4) Aggregations & analytics helpers
-- ============================================================================

create or replace function public.sum_group_deposits(gid uuid)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'amount', coalesce(sum(p.amount), 0),
    'currency', coalesce(nullif(max(p.currency), ''), 'RWF')
  )
  from public.payments p
  where p.ikimina_id = gid and p.status = 'completed';
$$;

-- ============================================================================
-- 5) Optional semantic search helper (trigram)
-- ============================================================================

create index if not exists idx_saccos_name_trgm on public.saccos using gin (name gin_trgm_ops);
create index if not exists idx_saccos_sector_trgm on public.saccos using gin (sector_code gin_trgm_ops);

create or replace function public.search_saccos_trgm(q text)
returns table (
  id uuid,
  name text,
  district text,
  sector_code text,
  similarity double precision
) language sql stable as $$
  select
    s.id,
    s.name,
    s.district,
    s.sector_code,
    greatest(similarity(s.name, q), similarity(s.sector_code, q)) as similarity
  from public.saccos s
  where coalesce(trim(q), '') <> ''
  order by similarity desc, s.name
  limit 20
$$;

-- ============================================================================
-- 6) Timestamps auto update
-- ============================================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_members_app_profiles_touch on public.members_app_profiles;
create trigger trg_members_app_profiles_touch
before update on public.members_app_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_payments_touch on public.payments;
create trigger trg_payments_touch
before update on public.payments
for each row execute function public.touch_updated_at();

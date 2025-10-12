-- authx schema for unified MFA orchestration
create schema if not exists authx;

create table if not exists authx.user_mfa (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_factor text not null default 'passkey'
    check (preferred_factor in ('passkey', 'totp', 'email', 'whatsapp', 'backup')),
  enrollment jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function authx.touch_user_mfa()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_user_mfa on authx.user_mfa;
create trigger trg_touch_user_mfa
before update on authx.user_mfa
for each row
execute procedure authx.touch_user_mfa();

create table if not exists authx.otp_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp')),
  code_hash text,
  legacy_code_id uuid,
  meta jsonb default '{}'::jsonb,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_authx_otp_issues_user_channel
  on authx.otp_issues (user_id, channel, used_at);

create table if not exists authx.audit (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  detail jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- expose existing passkey/trusted device data via convenience views
create or replace view authx.webauthn_credentials as
select
  id,
  user_id,
  credential_id,
  credential_public_key as public_key,
  sign_count as counter,
  transports,
  created_at,
  last_used_at
from public.webauthn_credentials;

create or replace view authx.trusted_devices as
select
  user_id,
  device_id,
  device_fingerprint_hash,
  user_agent_hash,
  ip_prefix,
  created_at,
  last_used_at
from public.trusted_devices;

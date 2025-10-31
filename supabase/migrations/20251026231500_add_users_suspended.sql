-- Add suspended flag to staff users (soft suspension)
alter table public.users
  add column if not exists suspended boolean not null default false;

comment on column public.users.suspended is 'When true, UI and APIs should deny access for this staff user.';


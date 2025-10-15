-- Materialize dashboard analytics and automate cache invalidation

create schema if not exists analytics;

do $do$
begin
  if exists (
    select 1 from pg_available_extensions where name = 'pg_net'
  ) then
    execute 'create extension if not exists pg_net with schema net';
  else
    execute 'create schema if not exists net';
    execute $func$
      create or replace function net.http_post(
        url text,
        headers jsonb default '{}'::jsonb,
        body jsonb default '{}'::jsonb,
        timeout_msec integer default null
      )
      returns jsonb
      language sql
      as $body$
        select jsonb_build_object('status', 'stubbed');
      $body$;
    $func$;
  end if;
end;
$do$;

do $do$
begin
  if exists (
    select 1 from pg_available_extensions where name = 'pg_cron'
  ) then
    execute 'create extension if not exists pg_cron';
  end if;
end;
$do$;

-- Aggregated payment rollups per SACCO and globally
create materialized view if not exists public.analytics_payment_rollups_mv as
with params as (
  select
    timezone('utc', current_date)::timestamp as today_start,
    timezone('utc', current_date - interval '7 days')::timestamp as week_start,
    date_trunc('month', timezone('utc', current_date)) as month_start,
    timezone('utc', now()) as refreshed_at
),
scoped as (
  select
    p.sacco_id,
    p.amount,
    p.status,
    p.occurred_at,
    params.today_start,
    params.week_start,
    params.month_start,
    params.refreshed_at
  from public.payments p
  cross join params
)
select
  sacco_id,
  sum(case when status in ('POSTED', 'SETTLED') and occurred_at >= month_start then amount else 0 end) as month_total,
  sum(case when status in ('POSTED', 'SETTLED') and occurred_at >= week_start then amount else 0 end) as week_total,
  sum(case when status in ('POSTED', 'SETTLED') and occurred_at >= today_start then amount else 0 end) as today_total,
  count(*) filter (where status = 'UNALLOCATED') as unallocated_count,
  max(occurred_at) filter (where status in ('POSTED', 'SETTLED')) as latest_payment_at,
  max(refreshed_at) as refreshed_at
from scoped
group by rollup(sacco_id);

create unique index if not exists analytics_payment_rollups_mv_sacco_idx
  on public.analytics_payment_rollups_mv ((coalesce(sacco_id::text, '00000000-0000-0000-0000-000000000000')));

-- Ikimina level monthly aggregates
create materialized view if not exists public.analytics_ikimina_monthly_mv as
with params as (
  select
    date_trunc('month', timezone('utc', current_date)) as month_start,
    timezone('utc', now()) as refreshed_at
)
select
  i.id as ikimina_id,
  i.sacco_id,
  i.name,
  i.code,
  i.status,
  i.updated_at,
  coalesce(sum(case when p.status in ('POSTED', 'SETTLED') and p.occurred_at >= params.month_start then p.amount else 0 end), 0) as month_total,
  coalesce(count(distinct case when p.status in ('POSTED', 'SETTLED') and p.occurred_at >= params.month_start then p.member_id end), 0) as contributing_members,
  count(distinct case when m.status = 'ACTIVE' then m.id end) as active_member_count,
  max(p.occurred_at) filter (where p.status in ('POSTED', 'SETTLED')) as last_contribution_at,
  max(params.refreshed_at) as refreshed_at
from public.ibimina i
cross join params
left join public.payments p on p.ikimina_id = i.id
left join public.members m on m.ikimina_id = i.id
group by i.id, i.sacco_id, i.name, i.code, i.status, i.updated_at, params.month_start;

create unique index if not exists analytics_ikimina_monthly_mv_pk
  on public.analytics_ikimina_monthly_mv (ikimina_id);
create index if not exists analytics_ikimina_monthly_mv_sacco_idx
  on public.analytics_ikimina_monthly_mv (sacco_id, month_total desc);

-- Member last-payment snapshots
create materialized view if not exists public.analytics_member_last_payment_mv as
with params as (
  select timezone('utc', now()) as refreshed_at
)
select
  m.id as member_id,
  m.sacco_id,
  m.ikimina_id,
  m.member_code,
  m.full_name,
  m.msisdn,
  m.status,
  i.name as ikimina_name,
  max(case when p.status in ('POSTED', 'SETTLED') then p.occurred_at end) as last_payment_at,
  coalesce(
    date_part('day', max(params.refreshed_at) - max(case when p.status in ('POSTED', 'SETTLED') then p.occurred_at end)),
    999
  )::int as days_since_last,
  max(params.refreshed_at) as refreshed_at
from public.members m
left join public.ibimina i on i.id = m.ikimina_id
left join public.payments p on p.member_id = m.id
cross join params
group by m.id, m.sacco_id, m.ikimina_id, m.member_code, m.full_name, m.msisdn, m.status, i.name;

create unique index if not exists analytics_member_last_payment_mv_pk
  on public.analytics_member_last_payment_mv (member_id);
create index if not exists analytics_member_last_payment_mv_sacco_idx
  on public.analytics_member_last_payment_mv (sacco_id, days_since_last desc);

refresh materialized view public.analytics_payment_rollups_mv;
refresh materialized view public.analytics_ikimina_monthly_mv;
refresh materialized view public.analytics_member_last_payment_mv;

create table if not exists analytics.cache_invalidation_failures (
  id bigserial primary key,
  event text not null,
  sacco_id uuid null,
  error_message text not null,
  occurred_at timestamptz not null default timezone('utc', now())
);

create or replace function analytics.refresh_dashboard_materialized_views()
returns void
language plpgsql
security definer
set search_path = public, analytics
as $$
begin
  refresh materialized view concurrently public.analytics_payment_rollups_mv;
  refresh materialized view concurrently public.analytics_ikimina_monthly_mv;
  refresh materialized view concurrently public.analytics_member_last_payment_mv;
end;
$$;

-- Ensure the refresh job runs frequently
select cron.unschedule('refresh-dashboard-materialized-views') where exists (
  select 1 from cron.job where jobname = 'refresh-dashboard-materialized-views'
);
select cron.schedule(
  'refresh-dashboard-materialized-views',
  '*/5 * * * *',
  $$select analytics.refresh_dashboard_materialized_views();$$
) where not exists (
  select 1 from cron.job where jobname = 'refresh-dashboard-materialized-views'
);

create or replace function analytics.emit_cache_invalidation()
returns trigger
language plpgsql
security definer
set search_path = public, analytics
as $$
declare
  webhook_url text;
  webhook_token text;
  headers jsonb;
  sacco_ids uuid[];
  sacco_id uuid;
  payload jsonb;
  tags text[];
begin
  select value::text
    into webhook_url
  from public.configuration
  where key = 'analytics_cache_webhook_url';

  if webhook_url is null or length(trim(webhook_url)) = 0 then
    return null;
  end if;

  select value::text
    into webhook_token
  from public.configuration
  where key = 'analytics_cache_webhook_token';

  headers := jsonb_build_object('content-type', 'application/json');
  if webhook_token is not null then
    headers := headers || jsonb_build_object('authorization', 'Bearer ' || webhook_token);
  end if;

  select coalesce(array_agg(distinct sacco_id), array[]::uuid[])
    into sacco_ids
  from (
    select sacco_id from new_rows
    union
    select sacco_id from old_rows
  ) scoped;

  if sacco_ids is null or array_length(sacco_ids, 1) is null then
    sacco_ids := array[null::uuid];
  else
    sacco_ids := array_append(sacco_ids, null::uuid);
  end if;

  foreach sacco_id in array sacco_ids loop
    tags := array['dashboard:summary', 'analytics:executive:' || coalesce(sacco_id::text, 'all')];
    if sacco_id is not null then
      tags := array_append(tags, 'sacco:' || sacco_id::text);
    end if;

    payload := jsonb_build_object(
      'event', TG_ARGV[0],
      'saccoId', sacco_id,
      'tags', tags
    );

    begin
      perform net.http_post(
        url := webhook_url,
        headers := headers,
        body := payload,
        timeout_msec := 750
      );
    exception
      when others then
        insert into analytics.cache_invalidation_failures(event, sacco_id, error_message)
        values (TG_ARGV[0], sacco_id, sqlerrm);
    end;
  end loop;

  return null;
end;
$$;

drop trigger if exists payments_cache_invalidation on public.payments;
create trigger payments_cache_invalidation
  after insert or update or delete on public.payments
  referencing new table as new_rows old table as old_rows
  for each statement execute function analytics.emit_cache_invalidation('payments_changed');

drop trigger if exists recon_cache_invalidation on public.recon_exceptions;
create trigger recon_cache_invalidation
  after insert or update or delete on public.recon_exceptions
  referencing new table as new_rows old table as old_rows
  for each statement execute function analytics.emit_cache_invalidation('recon_exceptions_changed');

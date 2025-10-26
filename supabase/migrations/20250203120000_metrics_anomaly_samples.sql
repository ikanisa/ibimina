create table if not exists public.system_metric_samples (
  id bigserial primary key,
  event text not null,
  total bigint not null default 0,
  collected_at timestamptz not null default now()
);

create index if not exists idx_system_metric_samples_event_time
  on public.system_metric_samples (event, collected_at desc);

alter table public.system_metric_samples enable row level security;

create policy "Admins can view metric samples"
  on public.system_metric_samples for select
  using (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

create policy "Admins can manage metric samples"
  on public.system_metric_samples for all
  using (public.has_role(auth.uid(), 'SYSTEM_ADMIN'))
  with check (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

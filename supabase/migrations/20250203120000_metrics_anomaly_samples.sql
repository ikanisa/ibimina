-- Helper function for role checking (create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pg_get_function_identity_arguments(oid) = 'p_user_id uuid, p_role_name text') THEN
    EXECUTE '
      CREATE FUNCTION public.has_role(p_user_id uuid, p_role_name text)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM public.staff_members
          WHERE user_id = p_user_id AND role = p_role_name AND status = ''active''
        );
      END;
      $func$';
  END IF;
END $$;

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

begin;

create or replace function public.debug_seed_counts()
returns jsonb
language sql
security definer
set search_path = app, public
as $$
  select jsonb_build_object(
    'saccos', (select count(*) from app.saccos),
    'ikimina', (select count(*) from app.ikimina),
    'members', (select count(*) from app.members),
    'accounts', (select count(*) from app.accounts),
    'ledger_entries', (select count(*) from app.ledger_entries),
    'payments', (select count(*) from app.payments),
    'sms_inbox', (select count(*) from app.sms_inbox),
    'import_files', (select count(*) from app.import_files),
    'audit_logs', (select count(*) from app.audit_logs)
  );
$$;

grant execute on function public.debug_seed_counts() to service_role;

commit;

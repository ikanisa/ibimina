-- Provision the statements storage bucket only when the storage schema is present
-- (the Supabase CLI RLS database used in tests omits these tables).
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
      values ('statements', 'statements', false)
      on conflict (id) do nothing;
  end if;

  if to_regclass('storage.objects') is not null then
    execute 'create policy "Authenticated read statements"
             on storage.objects for select
             using (bucket_id = ''statements'' and auth.role() = ''authenticated'')';

    execute 'create policy "Authenticated insert statements"
             on storage.objects for insert
             with check (bucket_id = ''statements'' and auth.role() = ''authenticated'')';

    execute 'create policy "Authenticated update statements"
             on storage.objects for update
             using (bucket_id = ''statements'' and auth.role() = ''authenticated'')
             with check (bucket_id = ''statements'' and auth.role() = ''authenticated'')';

    execute 'create policy "Authenticated delete statements"
             on storage.objects for delete
             using (bucket_id = ''statements'' and auth.role() = ''authenticated'')';
  end if;
end;
$$;

begin;

insert into storage.buckets (id, name, public)
  values ('statements', 'statements', false)
  on conflict (id) do nothing;

create policy "Authenticated read statements"
  on storage.objects for select
  using (bucket_id = 'statements' and auth.role() = 'authenticated');

create policy "Authenticated insert statements"
  on storage.objects for insert
  with check (bucket_id = 'statements' and auth.role() = 'authenticated');

create policy "Authenticated update statements"
  on storage.objects for update
  using (bucket_id = 'statements' and auth.role() = 'authenticated')
  with check (bucket_id = 'statements' and auth.role() = 'authenticated');

create policy "Authenticated delete statements"
  on storage.objects for delete
  using (bucket_id = 'statements' and auth.role() = 'authenticated');

commit;

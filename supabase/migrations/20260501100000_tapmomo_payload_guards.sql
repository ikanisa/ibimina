-- Ensure NFC payload TTL metadata is stored server-side and exhausted payloads
-- are tracked to prevent replays.

alter table if exists public.tapmomo_transactions
    add column if not exists ttl_seconds integer not null default 120,
    add column if not exists expires_at timestamptz,
    add column if not exists payload_signature text,
    add column if not exists is_exhausted boolean not null default false,
    add column if not exists exhausted_at timestamptz;

update public.tapmomo_transactions
   set expires_at = coalesce(expires_at, created_at + (ttl_seconds || ' seconds')::interval)
 where expires_at is null;

create or replace function public.mark_tapmomo_payload_exhausted(p_nonce uuid, p_reason text default null)
returns boolean
language plpgsql
as $$
declare
    updated_rows integer;
begin
    update public.tapmomo_transactions
       set is_exhausted = true,
           exhausted_at = coalesce(exhausted_at, now()),
           status = case when status = 'initiated' then 'pending' else status end,
           error_message = coalesce(p_reason, error_message)
     where nonce = p_nonce;
    get diagnostics updated_rows = row_count;
    return updated_rows > 0;
end;
$$;

grant execute on function public.mark_tapmomo_payload_exhausted(uuid, text) to authenticated;

do $$
begin
    if exists (
        select 1 from information_schema.tables
        where table_schema = 'app' and table_name = 'tapmomo_transactions'
    ) then
        execute $$
            alter table app.tapmomo_transactions
                add column if not exists ttl_seconds integer not null default 120,
                add column if not exists expires_at timestamptz,
                add column if not exists payload_signature text,
                add column if not exists is_exhausted boolean not null default false,
                add column if not exists exhausted_at timestamptz;
        $$;

        execute $$
            update app.tapmomo_transactions
               set expires_at = coalesce(expires_at, created_at + (ttl_seconds || ' seconds')::interval)
             where expires_at is null;
        $$;

        execute $$
            create or replace function app.mark_tapmomo_payload_exhausted(p_nonce uuid, p_reason text default null)
            returns boolean
            language plpgsql
            security definer
            as $$
            declare
                updated_rows integer;
            begin
                update app.tapmomo_transactions
                   set is_exhausted = true,
                       exhausted_at = coalesce(exhausted_at, now()),
                       status = case when status = 'initiated' then 'pending' else status end,
                       error_message = coalesce(p_reason, error_message)
                 where nonce = p_nonce;
                get diagnostics updated_rows = row_count;
                return updated_rows > 0;
            end;
            $$;
        $$;

        execute $$ grant execute on function app.mark_tapmomo_payload_exhausted(uuid, text) to authenticated; $$;
    end if;
end;
$$;

-- Table for staff SMS ingestion so parsed statements can be reconciled with allocations.
create table if not exists public.momo_sms_events (
    id uuid primary key default gen_random_uuid(),
    provider text not null,
    amount numeric,
    currency text not null default 'RWF',
    reference text,
    sender_phone text,
    allocation_reference text,
    raw_message text not null,
    received_at timestamptz not null default now(),
    status text not null default 'unmatched' check (status in ('unmatched','matched')),
    matched_allocation_id uuid references public.allocations(id)
);

alter table public.momo_sms_events enable row level security;
create index if not exists idx_momo_sms_events_reference on public.momo_sms_events(reference);
create index if not exists idx_momo_sms_events_status on public.momo_sms_events(status);

grant insert, select on public.momo_sms_events to authenticated;
create policy "Authenticated users can insert sms events"
    on public.momo_sms_events for insert
    with check (auth.role() = 'authenticated');
create policy "Authenticated users can view sms events"
    on public.momo_sms_events for select
    using (auth.role() = 'authenticated');

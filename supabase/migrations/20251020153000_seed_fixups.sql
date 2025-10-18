-- Align seeded app schema data with legacy sources without overwriting existing customisations

begin;

-- Ensure merchant_code and metadata from legacy records persist in app.saccos
update app.saccos s
set merchant_code = src.merchant_code,
    metadata = coalesce(src.metadata, '{}'::jsonb),
    updated_at = timezone('UTC', now())
from public.saccos src
where s.id = src.id
  and (
    (src.merchant_code is not null and src.merchant_code <> s.merchant_code)
    or (src.metadata is not null and src.metadata <> s.metadata)
  );

-- Back-fill sacco relationships on app.accounts when the legacy table exposes them
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'accounts'
      and column_name = 'sacco_id'
  ) then
    update app.accounts a
    set sacco_id = src.sacco_id,
        updated_at = timezone('UTC', now())
    from public.accounts src
    where a.id = src.id
      and src.sacco_id is not null
      and (
        a.sacco_id is distinct from src.sacco_id
        or a.sacco_id is null
      );
  end if;
end;
$$;

-- Propagate sacco context into ledger entries where possible
with account_map as (
  select id, sacco_id
  from app.accounts
  where sacco_id is not null
)
update app.ledger_entries le
set sacco_id = acc.sacco_id
from account_map acc
where le.debit_id = acc.id
  and (
    le.sacco_id is distinct from acc.sacco_id
    or le.sacco_id is null
  );

with credit_account_map as (
  select id, sacco_id
  from app.accounts
  where sacco_id is not null
)
update app.ledger_entries le
set sacco_id = acc.sacco_id
from credit_account_map acc
where le.sacco_id is null
  and le.credit_id = acc.id;

commit;

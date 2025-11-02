-- Verify that country propagation triggers keep data consistent across core tables
insert into public.countries (id, iso2, iso3, name, default_locale, currency_code, timezone)
values
  ('00000000-0000-0000-0000-00000000a001', 'Z1', 'ZZ1', 'Testland One', 'en-Z1', 'TZ1', 'Africa/Kigali'),
  ('00000000-0000-0000-0000-00000000a002', 'Z2', 'ZZ2', 'Testland Two', 'en-Z2', 'TZ2', 'Africa/Kampala')
on conflict (id) do nothing;

insert into public.organizations (id, type, name, district_code, parent_id, country_id)
values
  ('10000000-0000-0000-0000-000000000001', 'DISTRICT', 'District One', 'D1', null, '00000000-0000-0000-0000-00000000a001'),
  ('10000000-0000-0000-0000-000000000002', 'DISTRICT', 'District Two', 'D2', null, '00000000-0000-0000-0000-00000000a002')
on conflict (id) do nothing;

insert into public.groups (id, org_id, name, code)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Propagation Test Group', 'GRP-1');

do $$
declare
  v_country uuid;
begin
  select country_id into v_country from public.groups where id = '20000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a001' then
    raise exception 'Expected group country % but found %', '00000000-0000-0000-0000-00000000a001', v_country;
  end if;
end;
$$;

update public.groups
set org_id = '10000000-0000-0000-0000-000000000002'
where id = '20000000-0000-0000-0000-000000000001';

do $$
declare
  v_country uuid;
begin
  select country_id into v_country from public.groups where id = '20000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a002' then
    raise exception 'Expected group update to reflect new country';
  end if;
end;
$$;

insert into public.groups (id, org_id, name, code)
values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Propagation Test Group Two', 'GRP-2')
on conflict (id) do nothing;

insert into public.group_members (id, group_id, member_name, member_code)
values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Alice Propagation', 'MEM-1');

do $$
declare
  v_country uuid;
begin
  select country_id into v_country from public.group_members where id = '30000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a002' then
    raise exception 'Expected group member country to follow group update';
  end if;
end;
$$;

update public.group_members
set group_id = '20000000-0000-0000-0000-000000000002'
where id = '30000000-0000-0000-0000-000000000001';

do $$
declare
  v_country uuid;
begin
  select country_id into v_country from public.group_members where id = '30000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a002' then
    raise exception 'Expected reassigned group member to reflect target country';
  end if;
end;
$$;

insert into public.uploads (id, org_id, file_name, file_type)
values ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'seed.csv', 'text/csv');

do $$
declare
  v_country uuid;
begin
  select country_id into v_country from public.uploads where id = '40000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a001' then
    raise exception 'Uploads should inherit country from organization on insert';
  end if;
end;
$$;

update public.uploads
set org_id = '10000000-0000-0000-0000-000000000002'
where id = '40000000-0000-0000-0000-000000000001';

do $$
declare
  v_country uuid;
begin
  select country_id into v_country from public.uploads where id = '40000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a002' then
    raise exception 'Uploads should re-sync country when organization changes';
  end if;
end;
$$;

insert into public.allocations (id, org_id, momo_txn_id, amount, ts)
values ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'TXN-1', 1000, timezone('UTC', now()));

do $$
declare
  v_country uuid;
begin
  select country_id into v_country from public.allocations where id = '50000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a001' then
    raise exception 'Allocations should inherit country on insert';
  end if;
end;
$$;

update public.allocations
set org_id = '10000000-0000-0000-0000-000000000002'
where id = '50000000-0000-0000-0000-000000000001';

do $$
declare
  v_country uuid;
begin
  select country_id into v_country from public.allocations where id = '50000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a002' then
    raise exception 'Allocations should update country when organization changes';
  end if;
end;
$$;

insert into auth.users (id, email)
values
  ('60000000-0000-0000-0000-000000000001', 'ticket-owner@test.io'),
  ('60000000-0000-0000-0000-000000000002', 'ticket-owner2@test.io')
on conflict (id) do nothing;

insert into public.tickets (id, org_id, user_id, channel, subject, priority)
values
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'in_app', 'Propagation Ticket 1', 'normal'),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', 'in_app', 'Propagation Ticket 2', 'normal');

do $$
declare
  v_country uuid;
begin
  select country_id into v_country from public.tickets where id = '70000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a001' then
    raise exception 'Ticket should inherit country from organization';
  end if;
end;
$$;

insert into public.ticket_messages (id, ticket_id, author_id, body)
values ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Initial context message');

do $$
declare
  v_country uuid;
  v_org uuid;
begin
  select country_id, org_id into v_country, v_org from public.ticket_messages where id = '80000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a001' or v_org <> '10000000-0000-0000-0000-000000000001' then
    raise exception 'Ticket message should align with parent ticket context after insert';
  end if;
end;
$$;

update public.ticket_messages
set ticket_id = '70000000-0000-0000-0000-000000000002'
where id = '80000000-0000-0000-0000-000000000001';

do $$
declare
  v_country uuid;
  v_org uuid;
begin
  select country_id, org_id into v_country, v_org from public.ticket_messages where id = '80000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a002' or v_org <> '10000000-0000-0000-0000-000000000002' then
    raise exception 'Ticket message should refresh context when reassigned to a new ticket';
  end if;
end;
$$;

update public.tickets
set org_id = '10000000-0000-0000-0000-000000000002'
where id = '70000000-0000-0000-0000-000000000001';

do $$
declare
  v_country uuid;
begin
  select country_id into v_country from public.tickets where id = '70000000-0000-0000-0000-000000000001';
  if v_country <> '00000000-0000-0000-0000-00000000a002' then
    raise exception 'Ticket country should refresh after organization update';
  end if;
end;
$$;

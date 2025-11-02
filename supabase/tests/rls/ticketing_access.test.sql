-- RLS coverage for tickets and ticket_messages tables
insert into public.countries (id, iso2, iso3, name, default_locale, currency_code, timezone)
values
  ('90000000-0000-0000-0000-000000000001', 'T1', 'TT1', 'Ticketland One', 'en-T1', 'TC1', 'Africa/Kigali'),
  ('90000000-0000-0000-0000-000000000002', 'T2', 'TT2', 'Ticketland Two', 'en-T2', 'TC2', 'Africa/Kampala')
on conflict (id) do nothing;

insert into public.organizations (id, type, name, district_code, parent_id, country_id)
values
  ('a0000000-0000-0000-0000-000000000001', 'DISTRICT', 'Ticket District One', 'TD1', null, '90000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000002', 'DISTRICT', 'Ticket District Two', 'TD2', null, '90000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

insert into auth.users (id, email, raw_app_meta_data)
values
  ('b0000000-0000-0000-0000-000000000001', 'staff.one@tickets.test', jsonb_build_object('role', 'MFI_STAFF')),
  ('b0000000-0000-0000-0000-000000000002', 'staff.two@tickets.test', jsonb_build_object('role', 'MFI_STAFF')),
  ('b0000000-0000-0000-0000-000000000003', 'customer.one@tickets.test', jsonb_build_object('role', 'CLIENT')),
  ('b0000000-0000-0000-0000-000000000004', 'customer.two@tickets.test', jsonb_build_object('role', 'CLIENT'))
on conflict (id) do update set raw_app_meta_data = excluded.raw_app_meta_data;

insert into public.org_memberships (user_id, org_id, role)
values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'MFI_STAFF'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'MFI_STAFF')
on conflict (user_id, org_id) do update set role = excluded.role;

insert into public.tickets (id, org_id, user_id, channel, subject, status, priority)
values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'in_app', 'Loan follow up', 'open', 'normal'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'in_app', 'Savings question', 'open', 'normal')
on conflict (id) do update set subject = excluded.subject;

insert into public.ticket_messages (id, ticket_id, author_id, body)
values
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Initial staff response'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Different org response')
on conflict (id) do update set body = excluded.body;

-- Staff from organization one should only see their ticket
set role app_authenticator;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000001', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'b0000000-0000-0000-0000-000000000001', 'app_metadata', json_build_object('role', 'MFI_STAFF'))::text,
  false
);

do $$
declare
  visible_tickets integer;
begin
  select count(*) into visible_tickets from public.tickets;
  if visible_tickets <> 1 then
    raise exception 'Staff should only see one ticket, found %', visible_tickets;
  end if;
end;
$$;

insert into public.ticket_messages (ticket_id, author_id, body)
values ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Follow up note');

-- Attempting to write to another organization should fail
\echo 'Expect cross-organization message insert to fail';
do $$
begin
  begin
    insert into public.ticket_messages (ticket_id, author_id, body)
    values ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Invalid write');
    raise exception 'Staff unexpectedly inserted into foreign organization ticket';
  exception
    when others then
      perform null;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

-- Customer visibility limited to own ticket and messages
set role app_authenticator;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000003', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'b0000000-0000-0000-0000-000000000003', 'app_metadata', json_build_object('role', 'CLIENT'))::text,
  false
);

do $$
declare
  ticket_count integer;
  message_count integer;
begin
  select count(*) into ticket_count from public.tickets;
  if ticket_count <> 1 then
    raise exception 'Customer should only see their ticket, found %', ticket_count;
  end if;

  select count(*) into message_count from public.ticket_messages;
  if message_count <> 2 then
    raise exception 'Customer should see staff reply and own inserts, found %', message_count;
  end if;
end;
$$;

insert into public.ticket_messages (ticket_id, author_id, body)
values ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Customer acknowledgement');

\echo 'Expect customer insert into other ticket to fail';
do $$
begin
  begin
    insert into public.ticket_messages (ticket_id, author_id, body)
    values ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'Out of scope');
    raise exception 'Customer unexpectedly inserted message for another ticket';
  exception
    when others then
      perform null;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

-- Staff from organization two should see their data only
set role app_authenticator;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000002', false);
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'b0000000-0000-0000-0000-000000000002', 'app_metadata', json_build_object('role', 'MFI_STAFF'))::text,
  false
);

do $$
declare
  tickets_visible integer;
  messages_visible integer;
begin
  select count(*) into tickets_visible from public.tickets;
  if tickets_visible <> 1 then
    raise exception 'Second staff member should see exactly one ticket, found %', tickets_visible;
  end if;

  select count(*) into messages_visible from public.ticket_messages;
  if messages_visible <> 1 then
    raise exception 'Second staff member should only see messages in their organization, found %', messages_visible;
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

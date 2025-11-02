\set ON_ERROR_STOP on

BEGIN;

-- Test identifiers
SELECT
  gen_random_uuid() AS user_id,
  gen_random_uuid() AS org_id,
  gen_random_uuid() AS country_id
INTO TEMP TABLE agent_ids;

\gset

-- Ensure required seed data exists
INSERT INTO auth.users (id, email)
VALUES (:'user_id', 'agent-test@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.countries (id, iso2, iso3, name, default_locale, currency_code, timezone)
VALUES (:'country_id', 'RW', 'RWA', 'Rwanda', 'rw-RW', 'RWF', 'Africa/Kigali')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.organizations (id, type, name, country_id)
VALUES (:'org_id', 'SACCO', 'Ikimina Test Coop', :'country_id')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.org_memberships (user_id, org_id, role)
VALUES (:'user_id', :'org_id', 'MEMBER')
ON CONFLICT DO NOTHING;

-- Knowledge base article (lexical fallback)
INSERT INTO public.org_kb (org_id, title, content, tags, language_code)
VALUES (:'org_id', 'USSD payments', 'Dial *182# and enter your token.', ARRAY['ussd'], 'en');

-- Allocation row
INSERT INTO public.allocations (
  id,
  org_id,
  sacco_name,
  raw_ref,
  amount,
  ts,
  match_status
)
VALUES (
  gen_random_uuid(),
  :'org_id',
  'Ikimina Test Coop',
  'TOK123',
  25000,
  timezone('UTC', now()),
  'MATCHED'
);

-- Reference token owned by user
INSERT INTO public.member_reference_tokens (
  org_id,
  user_id,
  token,
  channel,
  purpose,
  expires_at,
  metadata,
  created_by
)
VALUES (
  :'org_id',
  :'user_id',
  'TOK123',
  'app',
  'testing',
  timezone('UTC', now()) + interval '1 day',
  jsonb_build_object('seed', true),
  :'user_id'
)
ON CONFLICT (token) DO NOTHING;

-- Validate org scope resolution
SELECT * FROM public.agent_resolve_org_scope(:'user_id', :'org_id');

-- Validate knowledge base search respects scope
SELECT COUNT(*) AS kb_matches
FROM public.agent_kb_search(:'user_id', ARRAY[0.1,0.2,0.3]::vector, 'USSD', :'org_id', 'en', 5);

-- Validate allocations lookup
SELECT COUNT(*) AS allocation_rows
FROM public.agent_allocations_read_mine(:'user_id', 'TOK123', :'org_id', FALSE, 10);

-- Generate a new reference token
SELECT token, channel, purpose
FROM public.agent_reference_generate(:'user_id', :'org_id', 'app', 'wallet_topup', NULL, 60, 'via test');

-- Create a ticket
SELECT ticket_id, org_id, status
FROM public.agent_tickets_create(:'user_id', :'org_id', 'Need help', 'My payment failed', 'in_app', 'normal', 'TOK123');

ROLLBACK;

\echo 'Agent function tests completed successfully ✓'

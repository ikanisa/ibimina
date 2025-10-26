-- Ensure analytics cache webhook configuration matches deployed admin app
insert into public.configuration as config (key, description, value)
values (
  'analytics_cache_webhook_url',
  'Webhook endpoint invoked after analytics changes to trigger Next.js cache revalidation',
  '"https://ibimina-admin.vercel.app/api/cache/revalidate"'::jsonb
)
on conflict (key) do update
set
  description = excluded.description,
  value = excluded.value;

insert into public.configuration as config (key, description, value)
values (
  'analytics_cache_webhook_token',
  'Bearer token expected by the analytics cache revalidation webhook',
  '"313cf8ae6ca27abcd89b3e5e1db43a5b0cd43b0702d2b356f410f5c15f2fff5f"'::jsonb
)
on conflict (key) do update
set
  description = excluded.description,
  value = excluded.value;

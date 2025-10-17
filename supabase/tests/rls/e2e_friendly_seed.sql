-- Reset tables before running RLS tests
truncate table auth.users restart identity cascade;
truncate table public.users restart identity cascade;
truncate table public.saccos restart identity cascade;
truncate table public.ibimina restart identity cascade;
truncate table public.members restart identity cascade;
truncate table public.payments restart identity cascade;
truncate table public.trusted_devices restart identity cascade;
truncate table public.recon_exceptions restart identity cascade;
truncate table ops.rate_limits restart identity cascade;
truncate table ops.idempotency restart identity cascade;
truncate table authx.otp_issues restart identity cascade;
truncate table authx.user_mfa restart identity cascade;

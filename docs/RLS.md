# SACCO+ Row Level Security

Row Level Security is enabled on all `app` tables (including MFA-specific registries such as `app.mfa_email_codes`) plus the operational helpers that accept writes from Edge Functions, and on the member-facing tables under `public` (`members_app_profiles`, `user_saccos`, `join_requests`, `group_invites`, `notifications`, `webauthn_credentials`, `mfa_recovery_codes`, `trusted_devices`, `configuration`, `notification_queue`, `system_metrics`, and `users`). Policies lean on helper functions defined in `supabase/migrations/20251012120000_sacco_plus_schema.sql`, and migration `20251022120000_enforce_rls_and_helpers.sql`—with `20251022130000_enable_mfa_email_codes_rls.sql` patching the MFA email codes table—re-applies `ENABLE ROW LEVEL SECURITY` across the set while aborting if helper functions disappear. This prevents silent drift when using Supabase Studio without forcing RLS on backend-managed tables.

- `app.current_sacco()` – current user’s SACCO from `app.user_profiles`.
- `app.current_role()` – role (`SYSTEM_ADMIN`, `SACCO_MANAGER`, `SACCO_STAFF`).
- `app.is_admin()` – `true` if the JWT or profile role is `SYSTEM_ADMIN`.
- `app.payment_sacco(payment_id)` / `app.account_sacco(account_id)` – derive SACCO for dependent records.

## Policy matrix

| Table | Select | Insert | Update/Delete |
| --- | --- | --- | --- |
| `app.user_profiles` | user sees own row; admins see all | admins only | admins only |
| `app.saccos` | staff: own SACCO; admins: all | admins only | admins only |
| `app.ikimina` | staff: same SACCO; admins: all | staff within SACCO, admins all | staff within SACCO, admins all |
| `app.members` | staff: same SACCO; admins: all | staff within SACCO, admins all | staff within SACCO, admins all |
| `app.payments` | staff: same SACCO; admins: all | staff within SACCO, admins all | staff within SACCO, admins all |
| `app.recon_exceptions` | staff: via payment SACCO; admins: all | system/service role | staff within SACCO, admins all |
| `app.accounts` | staff: SACCO-linked accounts; admins: all | admins only | admins only |
| `app.ledger_entries` | staff: SACCO-linked entries; admins: all | admins only | admins only |
| `app.sms_inbox` | staff: same SACCO; admins: all | service role (Edge Functions) | staff within SACCO, admins all |
| `app.import_files` | staff: same SACCO; admins: all | staff within SACCO, admins all | staff within SACCO, admins all |
| `app.audit_logs` | actor sees own entries; admins: all | open insert policy for system/service role | n/a (reads only) |
| `app.devices_trusted` | owner or admin | owner/admin | owner/admin |
| `ops.rate_limits` | admins only | admins only | admins only |
| `ops.idempotency` | owner or admin | owner or admin | owner or admin |

The Supabase service-role key used inside Edge Functions bypasses RLS; every function enforces SACCO scope before writing with the elevated client.

## JWT expectations

- Staff JWTs include `app_metadata.role`. If absent the role falls back to `app.user_profiles.role`.
- System administrators receive `SYSTEM_ADMIN`; they bypass SACCO filters.
- Edge Functions parsing staff JWTs must forward the bearer token when re-calling Supabase APIs that should respect RLS (UI clients do this automatically).

## Examples

- A SACCO staff member posting to `/payments/apply` must specify their own `saccoId`. The function rejects mismatched SACCOs even though it uses the service role internally.
- `/recon/exceptions` GET filters by `payment.sacco_id`, so staff only see exceptions for their SACCO; admins get the full dataset.
- `/admin/reset-mfa` is restricted to `SYSTEM_ADMIN` via JWT + profile check before any MFA data is mutated.

Keep this file updated whenever policies change to ensure auditors can trace authorisation paths quickly.

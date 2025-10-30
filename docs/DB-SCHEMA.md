# SACCO+ Database Schema

All SACCO+ objects live in the dedicated `app` schema with operational helpers
in `ops`. This section summarises the core tables, helper functions, and
scheduled jobs provisioned by
`supabase/migrations/20251012120000_sacco_plus_schema.sql`.

## Schemas

- `app` – tenant-scoped business entities (SACCOs, ikimina, members, payments,
  ledger, audit).
- `ops` – cross-tenant operational helpers (rate limits, idempotency).
- `auth` – Supabase Auth (managed by Supabase, extended via triggers).

## Core tables

| Table                         | Purpose                                    | Key columns                                                                                                                |
| ----------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `app.saccos`                  | SACCO registry                             | `id`, `name`, `merchant_code`, `status`, `metadata`                                                                        |
| `app.ikimina`                 | Group accounts under a SACCO               | `sacco_id`, `code`, `name`, `type`, `settings`                                                                             |
| `app.members`                 | Members joined to an ikimina               | `ikimina_id`, `sacco_id`, `member_code`, `full_name`, `msisdn*`, `national_id*`, `status`                                  |
| `app.accounts`                | Ledger accounts                            | `sacco_id`, `owner_type`, `owner_id`, `currency`, `status`                                                                 |
| `app.ledger_entries`          | Double-entry movements                     | `sacco_id`, `debit_id`, `credit_id`, `amount`, `external_id`, `memo`                                                       |
| `app.sms_inbox`               | Raw SMS payloads                           | `sacco_id`, `raw_text`, `received_at`, `parsed_json`, `parse_source`, `confidence`, `msisdn*`                              |
| `app.payments`                | Normalised payments                        | `sacco_id`, `ikimina_id`, `member_id`, `txn_id`, `reference`, `status`, `source_id`, `ai_version`, `confidence`, `msisdn*` |
| `app.recon_exceptions`        | Manual reconciliation queue                | `payment_id`, `reason`, `status`, `note`, `resolved_at`                                                                    |
| `app.import_files`            | Statement / SMS imports                    | `sacco_id`, `type`, `filename`, `uploaded_by`, `status`, `error`                                                           |
| `app.audit_logs`              | Immutable audit trail                      | `sacco_id`, `actor`, `action`, `entity`, `entity_id`, `diff`                                                               |
| `app.user_profiles`           | SACCO-scoped role binding                  | `user_id`, `sacco_id`, `role` (`SYSTEM_ADMIN`, `SACCO_MANAGER`, `SACCO_STAFF`)                                             |
| `app.financial_institutions`  | Registry of SACCOs, microfinance, insurers | `name`, `kind`, `district`, `sacco_id`, `metadata`                                                                         |
| `app.momo_codes`              | District-level MoMo merchant codes         | `provider`, `district`, `code`, `account_name`, `description`                                                              |
| `app.devices_trusted`         | Trusted device fingerprints                | `user_id`, `device_hash`, `device_label`, `expires_at`, `metadata`                                                         |
| `app.mfa_email_codes`         | Time-boxed email OTPs (hashed)             | `user_id`, `code_hash`, `salt`, `expires_at`, `consumed_at`, `attempt_count`                                               |
| `public.webauthn_credentials` | Passkey (WebAuthn) registrations           | `user_id`, `credential_id`, `credential_public_key`, `sign_count`, `transports`, `device_type`, `friendly_name`            |
| `public.mfa_recovery_codes`   | Backup codes (hashed)                      | `user_id`, `codes[]`, `updated_at`                                                                                         |
| `ops.rate_limits`             | Minute buckets for rate limiting           | `bucket_key` (`ip:...`, `user:...`), `route`, `window_started`, `count`                                                    |
| `ops.idempotency`             | Per-user idempotency ledger                | `user_id`, `key`, `request_hash`, `response`, `expires_at`                                                                 |

_\*Encrypted & masked columns_ – `msisdn_encrypted`, `msisdn_masked`,
`msisdn_hash`, `national_id_encrypted`, `national_id_masked`, `national_id_hash`
use the AES-256-GCM data key exposed via `KMS_DATA_KEY_BASE64`. Never store
plaintext PII outside the encrypted columns.

## Helper functions

- `app.current_sacco()` / `app.current_role()` – resolves the caller’s
  SACCO/role from `app.user_profiles`.
- `app.is_admin()` – true when the JWT `app_metadata.role` or profile role is
  `SYSTEM_ADMIN`.
- `app.account_sacco(account_id)` – maps ledger accounts back to the owning
  SACCO.
- `app.account_balance(account_id)` – returns net credits minus debits for the
  account.
- `ops.consume_rate_limit(bucket_key, route, max_hits, window_seconds)` – atomic
  minute-bucket counter; exposed as `public.consume_route_rate_limit`.

## Triggers

- `app.handle_new_auth_user` – automatically inserts an `app.user_profiles` row
  for every new `auth.users` record (defaults to `SACCO_STAFF`).
- `*_touch_updated_at` – reuse `public.set_updated_at` to keep `updated_at`
  columns current.

## Stored Procedures

### Operational Procedures

- `ops.sp_nightly_recon()` – Re-opens lingering reconciliation exceptions. Runs
  nightly at 2 AM via pg_cron. Checks for payments that remain unallocated
  beyond the configured threshold and escalates them for manual review.
- `ops.sp_monthly_close()` – Creates an immutable monthly close snapshot in
  `app.audit_logs`. Runs on the 1st of each month at 2:10 AM. Captures aggregate
  balances, payment volumes, and exception counts for regulatory reporting.

### Search & Analytics

- `public.search_saccos_semantic(query text, max_results int)` – Trigram-based
  fuzzy search across SACCO names, districts, and sectors. Returns ranked
  results with similarity scores. Used by the global search palette and SACCO
  picker components.

- `public.get_dashboard_metrics(sacco_id uuid, start_date date, end_date date)`
  – Computes key performance indicators including total deposits, active
  members, pending reconciliations, and daily payment trends. Optimized with
  indexed queries to support dashboard views.

### Payment Processing

- `app.apply_payment(...)` – Core payment ingestion procedure. Validates
  incoming payment data, encrypts PII fields, matches payments to members via
  phone number or reference, creates ledger entries, and handles exceptions.
  Called by the `payments-apply` Edge Function.

- `app.resolve_member_by_msisdn(msisdn text, sacco_id uuid)` – Looks up a member
  by encrypted phone number hash. Uses the `msisdn_hash` index for efficient
  lookups without exposing plaintext.

## Scheduled jobs (pg_cron)

| Job                | Schedule     | Command                                                                      |
| ------------------ | ------------ | ---------------------------------------------------------------------------- |
| `00-nightly-recon` | `0 2 * * *`  | `call ops.sp_nightly_recon();` – re-open lingering exceptions.               |
| `01-monthly-close` | `10 2 1 * *` | `call ops.sp_monthly_close();` – snapshot monthly close in `app.audit_logs`. |

Jobs are managed through `cron.job`; re-running the migration upserts both
entries without duplicating.

## Encryption & secrets

| Secret                                                 | Usage                                                                                                                                  |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `KMS_DATA_KEY_BASE64`                                  | AES-256-GCM key for encrypting PII columns (members, payments, sms inbox).                                                             |
| `HMAC_SHARED_SECRET`                                   | Shared secret for timestamped HMAC on `/sms/inbox`, `/ingest-sms`, `/parse-sms`, `/scheduled-reconciliation`, and `/metrics-exporter`. |
| `OPENAI_API_KEY`                                       | AI fallback in `/sms/ai-parse`.                                                                                                        |
| `SUPABASE_SERVICE_ROLE_KEY`                            | Internal Edge Function Supabase client.                                                                                                |
| `REPORT_SIGNING_KEY`                                   | Optional HMAC signature on CSV exports.                                                                                                |
| `BACKUP_PEPPER` / `EMAIL_OTP_PEPPER`                   | Salt for backup/email MFA codes.                                                                                                       |
| `MFA_SESSION_SECRET`, `TRUSTED_COOKIE_SECRET`          | MFA challenge + trusted-device cookie signing.                                                                                         |
| `RESEND_API_KEY`, `MFA_EMAIL_FROM`, `MFA_EMAIL_LOCALE` | Email OTP dispatch via `mfa-email` function.                                                                                           |

Keep secrets in Supabase via `supabase secrets set`; never commit them to the
repo.

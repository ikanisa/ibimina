# SACCO+ Auth Setup Guide

This document captures the configuration required to run the SACCO+
authentication stack locally, in preview, and in production.

## 1. Environment Variables

Populate the following secrets (see `.env.example` for defaults):

| Key                                                           | Purpose                                                                                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Supabase project URL and anon key for SSR/client operations.【F:.env.example†L1-L4】                                                          |
| `SUPABASE_SERVICE_ROLE_KEY`                                   | Server-only key for admin client used by MFA APIs and Edge Functions.【F:.env.example†L6-L7】【F:lib/supabase/admin.ts†L1-L21】               |
| `KMS_DATA_KEY` (or `_BASE64`)                                 | 32-byte AES-GCM key for encrypting TOTP secrets/pending tokens.【F:.env.example†L9-L10】【F:lib/mfa/crypto.ts†L33-L70】                       |
| `BACKUP_PEPPER` / `EMAIL_OTP_PEPPER`                          | Pepper for hashing backup codes and email OTP digests.【F:.env.example†L11-L16】【F:lib/mfa/crypto.ts†L94-L123】【F:lib/mfa/email.ts†L5-L44】 |
| `MFA_SESSION_SECRET` / `TRUSTED_COOKIE_SECRET`                | Secrets for signed MFA session + trusted device cookies.【F:.env.example†L11-L16】【F:lib/mfa/session.ts†L6-L64】                             |
| `MFA_RP_ID` / `MFA_ORIGIN` / `MFA_RP_NAME`                    | WebAuthn relying party settings.【F:.env.example†L17-L19】【F:lib/mfa/passkeys.ts†L15-L57】                                                   |
| `MAIL_FROM` / `SMTP_*` or Resend API key                      | Email OTP sender configuration; required for `/api/mfa/email/request`.【F:.env.example†L21-L27】【F:lib/mfa/email.ts†L32-L95】                |
| `META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID` | WhatsApp OTP provider via Meta Business API; optional for development.                                                                        |

For preview deployments, inject secrets via your chosen deployment CLI or secret
store (e.g., Doppler, 1Password, or container orchestrator secrets). Ensure
`MFA_SESSION_SECRET` and `TRUSTED_COOKIE_SECRET` differ per environment.

## 2. Database Preparation

1. Apply Supabase migrations (`supabase db push` or run `scripts/db-reset.sh`
   for local Postgres).【F:scripts/db-reset.sh†L1-L18】
2. Seed RLS test fixtures with `scripts/test-rls.sh`; update fixtures when
   adding
   policies.【F:scripts/test-rls.sh†L1-L16】【F:supabase/tests/fixtures/bootstrap.sql†L1-L36】
3. Regenerate Supabase TypeScript types whenever schema changes to keep
   `lib/supabase/types.ts` in sync.【F:lib/supabase/types.ts†L1-L32】

## 3. Provider Configuration

- **Email OTP**: Deploy Supabase Edge Function `mfa-email` or configure SMTP
  provider; confirm `MAIL_FROM` matches verified sender. Test with
  `/api/mfa/email/request`.
- **WhatsApp OTP**: Configure Meta WhatsApp Business API (Access Token, Phone
  Number ID). WhatsApp OTP temporarily disabled pending full Meta integration.
- **Passkeys**: Set `MFA_RP_ID` to primary domain (e.g., `sacco.plus`) and
  `MFA_ORIGIN` to full https origin for previews/production. Local dev defaults
  to `localhost`.【F:lib/mfa/passkeys.ts†L15-L73】

## 4. Local Development

1. Install dependencies: `pnpm install`.
2. Start Supabase local stack (if required) and run `scripts/db-reset.sh` to
   seed fixtures.
3. Run `pnpm dev` and sign in with seeded Supabase user; use `/api/mfa/enroll`
   via UI to enable TOTP.
4. Execute `pnpm test` (after adding MFA unit tests) and `pnpm test:rls` for
   policy validation.【F:scripts/test-rls.sh†L1-L16】

## 5. Preview Deployments

- Configure GitHub secrets for your deployment target (e.g., container registry
  credentials, platform API tokens) and Supabase branch database. The preview
  workflow (`.github/workflows/preview.yml`) builds via the configured
  deployment CLI; extend to provision branch DB and seed fixtures before
  Playwright tests.【F:.github/workflows/preview.yml†L1-L42】
- Inject environment secrets into previews via your deployment CLI's secret
  management step and the Supabase branch password store.

## 6. Production Checklist

- AuthX verify parity tests green (TOTP/passkey/email/backup/trusted device).
- Edge Functions require JWT/HMAC, logs shipping to observability
  stack.【F:supabase/config.toml†L1-L22】【F:lib/observability/logger.ts†L1-L76】
- `docs/AUTH-SETUP.md` kept in sync with secret rotations and provider changes;
  update after each MFA feature release.

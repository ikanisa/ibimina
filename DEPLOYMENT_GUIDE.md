# SACCO+ Deployment Guide (Supabase Email + QR Auth)

This guide streamlines deployment for the staff console now that authentication
is centered on Supabase email/password, admin invites, and QR continuation.
Follow the quickstart to stand up a review or production environment with the
minimum required secrets.

## Deployment quickstart

```bash
# 1) Ensure tooling
nvm use 20
npm install -g pnpm@10.19.0
pnpm install
supabase login

# 2) Configure env
cp .env.example .env  # fill Supabase URL/keys + auth secrets listed below

# 3) Prepare data + auth helpers
supabase db reset
cd supabase && supabase functions deploy invite-user auth-qr-generate auth-qr-verify auth-qr-poll admin-reset-mfa

# 4) Build and run
cd ..
pnpm --filter @ibimina/staff-admin-pwa build
pnpm --filter @ibimina/staff-admin-pwa start
```

## Required environment

Set these in `.env` (and mirror them in your hosting provider/CI secrets). The
values map 1:1 with `.env.example`.

| Variable                         | Purpose                                                 |
| -------------------------------- | ------------------------------------------------------- |
| `APP_ENV`                        | Runtime label (`staging`, `production`, `development`). |
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project URL for browser + mobile clients.      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Anon key used by client-side Supabase calls.            |
| `SUPABASE_URL`                   | Service URL used by edge functions.                     |
| `SUPABASE_SERVICE_ROLE_KEY`      | Service role key for `invite-user` and QR flows.        |
| `KMS_DATA_KEY_BASE64`            | 32-byte base64 key used for encrypted fields.           |
| `BACKUP_PEPPER`                  | Shared pepper for hashed backup codes/OTPs.             |
| `MFA_SESSION_SECRET`             | Signs QR + MFA cookies.                                 |
| `TRUSTED_COOKIE_SECRET`          | Signs trusted device cookies.                           |
| `HMAC_SHARED_SECRET`             | HMAC for webhook/function verification.                 |
| `MFA_EMAIL_FROM`                 | Sender for Supabase-hosted password reset emails.       |
| `EMAIL_WEBHOOK_URL` _(optional)_ | Custom webhook for invite mail.                         |
| `EMAIL_WEBHOOK_KEY` _(optional)_ | Bearer token for the mail webhook.                      |
| `STAFF_APP_URL` _(optional)_     | Public URL inserted into invite links.                  |

Optional MFA UX refinements:

- `MFA_RP_ID`, `MFA_ORIGIN`, `MFA_RP_NAME` if you need explicit WebAuthn relying
  party overrides.

## Auth deployment steps

1. **Deploy edge functions**: `invite-user`, `auth-qr-generate`,
   `auth-qr-verify`, `auth-qr-poll`, and `admin-reset-mfa` must be deployed to
   production and preview environments.
2. **Seed the first admin**: invoke `invite-user` with the service role key to
   create a `SYSTEM_ADMIN` and capture the temporary password. If
   `EMAIL_WEBHOOK_URL` is configured the welcome email is sent automatically;
   otherwise Supabase sends its default invite.
3. **Verify QR tables**: ensure `auth_qr_sessions` and `staff_devices` exist in
   your target database (run `supabase db reset` locally or `supabase db push`
   against preview/production).
4. **Mirror secrets**: set the same variables in your CI/CD, hosting provider,
   and Supabase project secrets so edge functions and the Next.js runtime share
   keys.

## Hosting targets

- **Local/staging**: run `pnpm --filter @ibimina/staff-admin-pwa dev` after
  copying `.env`. Supabase CLI can proxy to your cloud project or a local
  instance (`supabase start`).
- **Production**: build with `pnpm --filter @ibimina/staff-admin-pwa build` and
  serve the standalone output (or use your platform's Next.js adapter). Ensure
  the variables above are exported before starting the server.

## Operations checklist

- Rotate `SUPABASE_SERVICE_ROLE_KEY` and `HMAC_SHARED_SECRET` together; redeploy
  edge functions after rotation.
- Keep `EMAIL_WEBHOOK_URL`/`EMAIL_WEBHOOK_KEY` aligned between preview and
  production to avoid blocked invite flows.
- Monitor `auth_qr_sessions` for `expired` rows to confirm mobile devices are
  completing the hand-off.
- Use `admin-reset-mfa` to revoke devices when hardware is lost or reassigned.

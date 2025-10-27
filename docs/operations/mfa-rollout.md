# MFA Rollout Guide

Use this checklist when enabling the new TOTP-based multi-factor authentication
stack in each environment.

## 1. Secrets & Environment

Set the following secrets before redeploying Supabase or the Next.js app:

```
KMS_DATA_KEY=<base64-encoded 32-byte AES key>
BACKUP_PEPPER=<random string used to salt backup code hashes>
EMAIL_OTP_PEPPER=<random string for email OTP hashing>
MFA_SESSION_SECRET=<random string for short-lived MFA session cookies>
TRUSTED_COOKIE_SECRET=<random string for trusted-device cookies>
RESEND_API_KEY=<Resend API key for outbound email>
MFA_EMAIL_FROM=<Email address used as sender>
MFA_EMAIL_LOCALE=<Optional: default email locale en|fr|rw>
MFA_RP_ID=<relying party domain for WebAuthn challenges>
MFA_ORIGIN=<https origin used when verifying WebAuthn responses>
MFA_RP_NAME=<friendly name shown to users, default “SACCO+”>
```

Recommended generation (macOS/Linux):

```
openssl rand -base64 32 # repeat per key
```

Apply them to Supabase:

```
supabase secrets set \
  --env-file supabase/.env.production \
  KMS_DATA_KEY=... \
  BACKUP_PEPPER=... \
  MFA_SESSION_SECRET=... \
  TRUSTED_COOKIE_SECRET=... \
  EMAIL_OTP_PEPPER=... \
  RESEND_API_KEY=... \
  MFA_EMAIL_FROM=... \
  MFA_RP_ID=... \
  MFA_ORIGIN=... \
  MFA_RP_NAME="SACCO+"
```

Ensure the same values (or appropriate environment-specific variants) are
present in your production secret store (for example, Supabase and your hosting
provider) so the Next.js runtime can decrypt MFA payloads.

## 2. Database Migrations

The MFA implementation ships with migrations:

```
supabase/migrations/20251009175910_feature_flags_configuration.sql
supabase/migrations/20251009180500_add_mfa_and_trusted_devices.sql
supabase/migrations/20251012183000_add_passkeys_mfa.sql
supabase/migrations/20251013100000_add_mfa_email_codes.sql
```

Apply them in order:

```
supabase migration up --include 20251009175910_feature_flags_configuration.sql,20251009180500_add_mfa_and_trusted_devices.sql,20251012183000_add_passkeys_mfa.sql,20251013100000_add_mfa_email_codes.sql --yes
```

Alternatively, run `supabase migration up --include-all --yes` if the
environment is behind on previous migrations.

## 3. Supabase Functions & Next.js Redeploy

After secrets/migrations are in place:

```
./scripts/supabase-go-live.sh deploy-functions
npm run build
# Deploy via your chosen platform
```

Deploy or update the following edge functions after secrets are in place:

```
supabase functions deploy metrics-exporter
supabase functions deploy admin-reset-mfa
supabase functions deploy mfa-email
```

Ensure `metrics-exporter` and `mfa-email` appear in the deployed function list
(the go-live script already includes the former; the latter must exist for email
OTP delivery).

## 4. Verification (Staging)

Perform the following smoke tests on staging:

1. **Email toggle:** Profile → Security → “Require email codes”. Sign out/in and
   confirm the challenge screen defaults to email (no authenticator enrolled).
2. **Enrollment:** Profile → Security → Enable authenticator. Scan QR, enter two
   consecutive codes. Confirm backup codes return and MFA status updates.
3. **Login challenge (TOTP):** Sign out, log back in. Enter a valid TOTP and
   confirm dashboard access.
4. **Rate limit:** Submit an invalid code multiple times—after 5 attempts you
   should see `rate_limit_exceeded`.
5. **Backup code:** Use one backup code to sign in; ensure it cannot be reused
   and the remaining count decreases.
6. **Email code:** From the login challenge screen choose “Send email code”.
   Ensure the email arrives, verify the OTP, confirm rate limiting prevents
   re-sending within 60 seconds, and check `/api/mfa/channels` reflects the
   active code count.
7. **Passkey enrollment:** From Profile → Security, click “Add passkey”, approve
   with a platform authenticator, and confirm the new credential appears in the
   list.
8. **Passkey challenge:** Sign out, sign back in, and choose “Use passkey”.
   Confirm the dashboard loads without entering a TOTP code.
9. **Trusted device:** Sign in with “Trust this device” checked. Verify
   `/api/mfa/status` returns `trustedDevice: true`, then revoke the entry from
   the profile page and ensure the next login prompts for MFA.
10. **Admin reset:** Call `POST /api/mfa/reset/{userId}` (SYSTEM_ADMIN only)
    with JSON body `{ "reason": "lost device" }`. Confirm MFA is disabled and
    trusted devices cleared.

Check `audit_logs` for `MFA_ENROLLMENT_STARTED`, `MFA_ENROLLED`, `MFA_SUCCESS`,
`MFA_FAILED`, `MFA_BACKUP_SUCCESS`, `MFA_EMAIL_CODE_SENT`, `MFA_EMAIL_VERIFIED`,
`MFA_EMAIL_FAILED`, `MFA_EMAIL_ENABLED`, `MFA_EMAIL_DISABLED`,
`MFA_METHOD_REMOVED`, `MFA_PASSKEY_ENROLLED`, `MFA_PASSKEY_SUCCESS`,
`MFA_PASSKEY_DELETED`, `MFA_TRUSTED_DEVICE_REVOKE`, and `MFA_RESET`. The profile
page now surfaces a recent email-code activity list as a quick audit reference.

Verify Grafana (or Supabase metrics) shows increments for the new counters:

- `mfa_email_sent` — increments on successful OTP dispatch
- `mfa_email_failure` — increments when the Resend API call fails or payload
  validation fails

Add alerts for elevated failure rates (suggested: >50% failures in 1 hour)
before promoting to production.

## 5. Production Rollout

Repeat steps 1–4 for production. Communicate cutover plan to staff:

- Require staff to enroll before the enforcement window.
- Provide instructions on printing/saving backup codes.
- Share the support path for admin break-glass resets.

Document the feature flag setting (if any) in `public.configuration` to track
environment-wide policies, and update release notes with deployment time,
responsible operator, and Grafana dashboard link.

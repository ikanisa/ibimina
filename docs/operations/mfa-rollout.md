# MFA Rollout Guide

Use this checklist when enabling the new TOTP-based multi-factor authentication stack in each environment.

## 1. Secrets & Environment

Set the following secrets before redeploying Supabase or the Next.js app:

```
KMS_DATA_KEY=<base64-encoded 32-byte AES key>
BACKUP_PEPPER=<random string used to salt backup code hashes>
MFA_SESSION_SECRET=<random string for short-lived MFA session cookies>
TRUSTED_COOKIE_SECRET=<random string for trusted-device cookies>
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
  MFA_RP_ID=... \
  MFA_ORIGIN=... \
  MFA_RP_NAME="SACCO+"
```

Ensure the same values (or appropriate environment-specific variants) are present in Lovable Cloud / Vercel secrets so the Next.js runtime can decrypt MFA payloads.

## 2. Database Migrations

The MFA implementation ships with migrations:

```
supabase/migrations/20251009175910_feature_flags_configuration.sql
supabase/migrations/20251009180500_add_mfa_and_trusted_devices.sql
supabase/migrations/20251012183000_add_passkeys_mfa.sql
```

Apply them in order:

```
supabase migration up --include 20251009175910_feature_flags_configuration.sql,20251009180500_add_mfa_and_trusted_devices.sql --yes
```

Alternatively, run `supabase migration up --include-all --yes` if the environment is behind on previous migrations.

## 3. Supabase Functions & Next.js Redeploy

After secrets/migrations are in place:

```
./scripts/supabase-go-live.sh deploy-functions
npm run build
# Deploy via Lovable Cloud / Vercel
```

Ensure `metrics-exporter` shows up in the function list (the go-live script already includes it).

## 4. Verification (Staging)

Perform the following smoke tests on staging:

1. **Enrollment:** Profile → Security → Enable authenticator. Scan QR, enter two consecutive codes. Confirm the API returns backup codes and that the profile shows MFA enabled.
2. **Login challenge:** Sign out, log back in. Enter a valid TOTP and confirm dashboard access.
3. **Rate limit:** Submit an invalid code multiple times—after 5 attempts you should see `rate_limit_exceeded`.
4. **Backup code:** Use one backup code to sign in; ensure it cannot be reused and remaining backup count decreases.
5. **Passkey enrollment:** From Profile → Security, click “Add passkey”, approve with a platform authenticator, and confirm the new credential appears in the list.
6. **Passkey challenge:** Sign out, sign back in, and choose “Use passkey”. Confirm the dashboard loads without entering a TOTP code.
7. **Trusted device:** Sign in with “Trust this device” checked. Verify `/api/mfa/status` returns `trustedDevice: true`, then revoke the entry from the profile page and ensure the next login prompts for MFA.
8. **Admin reset:** Call `POST /api/mfa/reset/{userId}` (SYSTEM_ADMIN only) with JSON body `{ "reason": "lost device" }`. Confirm MFA is disabled and trusted devices cleared.

Check `audit_logs` for `MFA_ENROLLMENT_STARTED`, `MFA_ENROLLED`, `MFA_SUCCESS`, `MFA_FAILED`, `MFA_PASSKEY_ENROLLED`, `MFA_PASSKEY_SUCCESS`, `MFA_PASSKEY_DELETED`, `MFA_TRUSTED_DEVICE_REVOKE`, and `MFA_RESET`.

## 5. Production Rollout

Repeat steps 1–4 for production. Communicate cutover plan to staff:

- Require staff to enroll before the enforcement window.
- Provide instructions on printing/saving backup codes.
- Share the support path for admin break-glass resets.

Document the feature flag setting (if any) in `public.configuration` to track environment-wide policies, and update release notes with deployment time, responsible operator, and Grafana dashboard link.

# Authentication Quickstart (Supabase Email + Admin Invites + QR)

This repo now ships a single, Supabase-native flow for staff authentication:

- **Email sign-in** backed by Supabase Auth.
- **Admin invites** that mint a temporary password and force a reset on first
  login.
- **QR hand-off** between browser and mobile, powered by the `auth-qr-*` edge
  functions.

The WhatsApp OTP and legacy MFA stacks have been retired; use this guide as the
source of truth when configuring auth or onboarding staff.

## What ships in this flow

- **Invite + bootstrap** — `supabase/functions/invite-user` creates a user,
  assigns a role, marks it as password-reset-required, and optionally sends a
  custom welcome email via `EMAIL_WEBHOOK_URL`.
- **First login** — Staff sign in with the temporary password, then Supabase
  forces a reset before granting a long-lived session.
- **QR authentication** — Web sessions can be approved from a signed-in mobile
  device by scanning a QR payload generated via `auth-qr-generate` and verified
  through `auth-qr-verify`; the browser polls `auth-qr-poll` for completion.
- **Recover + reset** — Admins can reset factors with
  `supabase/functions/admin-reset-mfa` if a device is lost.

## Prerequisites

1. **Secrets** — set the required environment variables (values mirror
   `.env.example`):

   | Variable                         | Purpose                                                           |
   | -------------------------------- | ----------------------------------------------------------------- |
   | `APP_ENV`                        | Runtime label (`development`, `staging`, `production`).           |
   | `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project URL used by clients.                             |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Browser anon key for RLS-aware calls.                             |
   | `SUPABASE_SERVICE_ROLE_KEY`      | Service role key for edge functions and admin invites.            |
   | `KMS_DATA_KEY_BASE64`            | 32-byte base64 key for encrypting secrets.                        |
   | `BACKUP_PEPPER`                  | Shared pepper for backup/OTP hashing.                             |
   | `MFA_SESSION_SECRET`             | Signs MFA cookies for QR + email sessions.                        |
   | `TRUSTED_COOKIE_SECRET`          | Signs trusted device cookies.                                     |
   | `HMAC_SHARED_SECRET`             | HMAC for webhook and function calls.                              |
   | `MFA_EMAIL_FROM`                 | From address for Supabase email reset/alerts.                     |
   | `EMAIL_WEBHOOK_URL` _(optional)_ | Custom mail webhook for invite emails.                            |
   | `EMAIL_WEBHOOK_KEY` _(optional)_ | Bearer token for the mail webhook.                                |
   | `STAFF_APP_URL` _(optional)_     | Public URL used in invite links (e.g. https://staff.example.com). |

2. **Supabase CLI** — install and log in so you can deploy functions and seed
   tables: `supabase login`.

3. **Schema** — apply the latest migrations so `auth_qr_sessions`,
   `staff_devices`, and `users` are present:
# Authentication Features - Quick Start

This guide helps you get started with the new authentication features
implemented for SACCO+.

## Overview

Authentication code is concentrated in the PWAs and Supabase Edge Functions. The
current state in the repo is:

- **Staff-admin PWA (`apps/pwa/staff-admin`)**: All login, biometric device
  login, and MFA routes are temporarily stubbed to redirect to the dashboard,
  but the underlying factor engine still supports TOTP, backup codes, email
  links, WhatsApp OTP, and passkeys for future restoration.
- **Member PWA (`apps/pwa/client`)**: WhatsApp OTP sign-in is active and wired
  to Supabase Edge Functions for sending and verifying codes.

## Quick Links

- 📖 [Complete Authentication Guide](./docs/AUTHENTICATION_GUIDE.md)
- 📝 [Implementation Summary](./AUTHENTICATION_IMPLEMENTATION_SUMMARY.md)
- 🔧 [Troubleshooting](#troubleshooting)

## Current auth map and removal targets

- **Staff-admin routes (disabled)**: The login, device-login, and MFA pages
  under `apps/pwa/staff-admin/app/(auth)` immediately redirect to the dashboard
  while preserving the prior UI in comments, marking them as candidates for
  cleanup if the flows stay
  retired. 【F:apps/pwa/staff-admin/app/(auth)/login/page.tsx†L1-L62】【F:apps/pwa/staff-admin/app/(auth)/device-login/page.tsx†L1-L26】【F:apps/pwa/staff-admin/app/(auth)/mfa/page.tsx†L1-L30】
- **Staff-admin factor engine (active code path, unused UI)**: MFA factor
  support for TOTP, backup codes, email, WhatsApp OTP, and passkeys lives under
  `apps/pwa/staff-admin/src/auth/factors`, ready for
  re-enablement. 【F:apps/pwa/staff-admin/src/auth/factors/index.ts†L1-L161】
- **Staff-admin device auth APIs (active)**: QR/device-authentication endpoints
  remain exposed under `app/api/device-auth/*` for mobile-signature login even
  though the UI is
  disabled. 【F:apps/pwa/staff-admin/app/api/device-auth/challenge/route.ts†L1-L93】
- **Member PWA login (active)**: WhatsApp OTP send/verify flow is live in
  `apps/pwa/client/app/(auth)/login/page.tsx`, integrating with Supabase Edge
  Functions for session
  creation. 【F:apps/pwa/client/app/(auth)/login/page.tsx†L1-L195】

## For Developers

### Prerequisites

```bash
# Required environment variables
META_WHATSAPP_ACCESS_TOKEN=your_access_token
META_WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```

### Setup

1. **Run the migration**:

   ```bash
   supabase db push
   ```

2. **Deploy edge functions**:

   ```bash
   supabase functions deploy whatsapp-otp-send
   supabase functions deploy whatsapp-otp-verify
   ```

3. **Test OTP flow**:

   ```bash
   supabase db reset
   ```

## Bootstrapping the first admin

```bash
# Deploy invite + QR functions (needed for onboarding and device pairing)
cd supabase
supabase functions deploy invite-user auth-qr-generate auth-qr-verify auth-qr-poll admin-reset-mfa

# Create the first SYSTEM_ADMIN user from your terminal
supabase functions invoke invite-user \
  --headers "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  --env-file ../.env \
  --body '{"email":"ops@example.com","role":"SYSTEM_ADMIN"}'
```

Check the function response for the temporary password. If `EMAIL_WEBHOOK_URL`
was set, the invite email will also be dispatched with a link to the staff app.

## Day-to-day flows

- **Staff sign-in** — navigate to `/auth/login`, enter email + temporary
  password, and set a new password when prompted. Subsequent logins use the new
  password (Supabase-hosted email reset works via the same sender).
- **Issue invites from the UI** — the staff console uses the
  `admin-invite-staff` flow wired to `invite-user`; roles and org assignment are
  enforced from
  `apps/pwa/staff-admin/components/admin/staff/add-staff-drawer.tsx`.
- **QR sign-in** —
  1. Browser calls `auth-qr-generate` and renders the base64 payload as a QR.
  2. Mobile app scans and posts to `auth-qr-verify` with its JWT + device id.
  3. Browser polls `auth-qr-poll` until the session is marked `verified`.
- **Lost device / factor reset** — call `admin-reset-mfa` from the staff console
  or via Supabase CLI to revoke trusted devices and require MFA re-enrolment.

## Troubleshooting

- **Invite email missing** — confirm `EMAIL_WEBHOOK_URL`/`EMAIL_WEBHOOK_KEY` are
  set; if not, Supabase will fall back to `inviteUserByEmail` so check the
  project Auth > Templates screen.
- **QR session never completes** — make sure `auth_qr_sessions` is migrated and
  that the mobile client passes a valid bearer token to `auth-qr-verify`.
- **Password reset loop** — remove the `pw_reset_required` flag in
  `auth.users.user_metadata` if a user already set a new password but still sees
  the reset wall.

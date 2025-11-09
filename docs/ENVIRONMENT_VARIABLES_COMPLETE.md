# Complete Environment Variables Reference — SACCO+

_Last Updated: 2025-11-02_  
_Version: 2.0_

## Overview

This document provides a comprehensive catalog of all environment variables used
across the SACCO+ platform, including web apps (admin/client/staff), mobile app,
Edge Functions, and infrastructure.

## Quick Reference

| Category                | Required Vars | Optional Vars | Total  |
| ----------------------- | ------------- | ------------- | ------ |
| Supabase                | 5             | 2             | 7      |
| Security & Secrets      | 8             | 6             | 14     |
| MFA & Auth              | 5             | 7             | 12     |
| Email                   | 2             | 8             | 10     |
| Logging & Observability | 0             | 11            | 11     |
| Analytics               | 0             | 3             | 3      |
| Mobile                  | 0             | 4             | 4      |
| Edge Functions          | 0             | 3             | 3      |
| CI/CD                   | 0             | 5             | 5      |
| Other                   | 2             | 12            | 14     |
| **TOTAL**               | **22**        | **61**        | **83** |

## Environment Matrix

| Environment    | Supabase Project   | Vercel/Deployment | Purpose                         |
| -------------- | ------------------ | ----------------- | ------------------------------- |
| **Local**      | `localhost:54321`  | `localhost:3100`  | Development with Docker Compose |
| **Preview**    | `preview-*` branch | Vercel Preview    | PR validation                   |
| **Staging**    | `ibimina-staging`  | Vercel Staging    | Pre-production testing          |
| **Production** | `ibimina-prod`     | Vercel Production | Live system                     |

---

## 1. Supabase Configuration

### Required

#### `NEXT_PUBLIC_SUPABASE_URL`

- **Required**: ✅ Yes
- **Sensitivity**: 🔓 Public
- **Description**: Supabase project URL for client-side calls
- **Format**: `https://[project-ref].supabase.co`
- **Example**: `https://xyzabcdef123.supabase.co`
- **Used In**: All web apps, mobile app
- **Notes**: Must be public-facing. Exposed in client bundles.

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Required**: ✅ Yes
- **Sensitivity**: 🔓 Public (but RLS-protected)
- **Description**: Supabase anon/public key for browser-side database calls
- **Format**: JWT token string (long)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Used In**: All web apps, mobile app
- **Notes**: RLS policies must be enabled. This key is public but scoped.

#### `SUPABASE_URL`

- **Required**: ✅ Yes (server-side)
- **Sensitivity**: 🔒 Private
- **Description**: Supabase project URL for server-side calls
- **Format**: `https://[project-ref].supabase.co`
- **Example**: `https://xyzabcdef123.supabase.co`
- **Used In**: Server actions, API routes, Edge Functions
- **Notes**: Often same as NEXT_PUBLIC_SUPABASE_URL but kept separate for
  flexibility

#### `SUPABASE_SERVICE_ROLE_KEY`

- **Required**: ✅ Yes (server-side)
- **Sensitivity**: 🔴 CRITICAL - Never expose to client
- **Description**: Supabase service role key with admin privileges (bypasses
  RLS)
- **Format**: JWT token string (long)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Used In**: Server actions, Edge Functions, admin operations
- **Notes**: **NEVER** include in client bundles. CI must verify absence with
  grep check.
- **Rotation**: Quarterly or immediately if compromised

#### `SUPABASE_ACCESS_TOKEN`

- **Required**: ✅ Yes (CI/CD only)
- **Sensitivity**: 🔴 CRITICAL
- **Description**: Personal access token for Supabase CLI operations
- **Format**: Token string
- **Used In**: GitHub Actions, deployment pipelines
- **Notes**: Required for migrations, type generation, function deployment

### Optional

#### `SUPABASE_PROJECT_REF`

- **Required**: ⚪ Optional (inferred from SUPABASE_URL)
- **Sensitivity**: 🔓 Public
- **Description**: Project reference ID for Supabase CLI
- **Format**: Alphanumeric string
- **Example**: `xyzabcdef123`
- **Used In**: CI/CD, deployment scripts

#### `EDGE_URL`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔓 Public
- **Description**: Base URL for Supabase Edge Functions
- **Format**: `https://[project-ref].supabase.co/functions/v1`
- **Default**: Derived from SUPABASE_URL
- **Used In**: Smoke tests, development

---

## 2. Security & Secrets

### Required

#### `KMS_DATA_KEY_BASE64`

- **Required**: ✅ Yes
- **Sensitivity**: 🔴 CRITICAL
- **Description**: Base64-encoded 32-byte key for field-level encryption
- **Format**: Base64 string (44 characters)
- **Example**: `YourBase64EncodedKeyHere==`
- **Generation**: `openssl rand -base64 32`
- **Used In**: Encrypted fields in database
- **Rotation**: Requires re-encryption migration
- **Notes**: Cannot rotate without data migration

#### `BACKUP_PEPPER`

- **Required**: ✅ Yes
- **Sensitivity**: 🔴 CRITICAL
- **Description**: Hex-encoded pepper for MFA backup code hashing
- **Format**: 64-character hex string
- **Example**: `a1b2c3d4e5f6...` (64 chars)
- **Generation**: `openssl rand -hex 32`
- **Used In**: MFA backup code verification
- **Rotation**: Monthly, invalidates old backup codes

#### `MFA_SESSION_SECRET`

- **Required**: ✅ Yes
- **Sensitivity**: 🔴 CRITICAL
- **Description**: Secret for signing MFA session cookies
- **Format**: 64-character hex string
- **Generation**: `openssl rand -hex 32`
- **Used In**: MFA authentication flow
- **Rotation**: Monthly, invalidates active MFA sessions

#### `TRUSTED_COOKIE_SECRET`

- **Required**: ✅ Yes
- **Sensitivity**: 🔴 CRITICAL
- **Description**: Secret for signing trusted device cookies
- **Format**: 64-character hex string
- **Generation**: `openssl rand -hex 32`
- **Used In**: Trusted device authentication
- **Rotation**: Monthly, invalidates trusted devices

#### `HMAC_SHARED_SECRET`

- **Required**: ✅ Yes (for Edge Functions)
- **Sensitivity**: 🔴 CRITICAL
- **Description**: Shared secret for HMAC signature verification on webhooks
- **Format**: 64-character hex string
- **Generation**: `openssl rand -hex 32`
- **Used In**: Edge Functions (ingest-sms, etc.), webhook verification
- **Rotation**: Quarterly, requires telco partner coordination

#### `OPENAI_API_KEY`

- **Required**: ✅ Yes (if AI agent enabled)
- **Sensitivity**: 🔴 CRITICAL
- **Description**: OpenAI API key for AI agent functionality
- **Format**: `sk-...` (OpenAI key format)
- **Used In**: AI agent, RAG search
- **Billing**: Charges apply per usage
- **Rotation**: As needed via OpenAI dashboard

### Optional

#### `KMS_DATA_KEY`

- **Required**: ⚪ Optional (alternative to KMS_DATA_KEY_BASE64)
- **Sensitivity**: 🔴 CRITICAL
- **Description**: Hex-encoded alternative to base64 KMS key
- **Notes**: Use either this OR KMS_DATA_KEY_BASE64, not both

#### `RATE_LIMIT_SECRET`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔒 Private
- **Description**: Pepper for rate limiting cache keys
- **Format**: 64-character hex string
- **Generation**: `openssl rand -hex 32`
- **Used In**: Rate limiting calculations
- **Default**: Derived from HMAC_SHARED_SECRET if not set

#### `EMAIL_OTP_PEPPER`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔒 Private
- **Description**: Pepper for email OTP hashing
- **Format**: 64-character hex string
- **Generation**: `openssl rand -hex 32`
- **Default**: Derived from BACKUP_PEPPER if not set

#### `REPORT_SIGNING_KEY`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔒 Private
- **Description**: Key for signing CSV exports and analytics caches
- **Format**: 64-character hex string
- **Generation**: `openssl rand -hex 32`
- **Used In**: Export validation, cache integrity

#### `ANALYTICS_CACHE_TOKEN`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔒 Private
- **Description**: Token for analytics cache revalidation API
- **Used In**: Analytics edge routes

---

## 3. MFA & Authentication

### Required

#### `MFA_EMAIL_FROM`

- **Required**: ✅ Yes
- **Sensitivity**: 🔓 Public
- **Description**: From email address for MFA emails
- **Format**: Email address
- **Example**: `security@sacco-plus.com`
- **Used In**: MFA email sending

#### `MFA_EMAIL_LOCALE`

- **Required**: ✅ Yes
- **Sensitivity**: 🔓 Public
- **Description**: Default locale for MFA emails
- **Format**: Locale code (en, rw, fr)
- **Example**: `rw`
- **Default**: `en`
- **Used In**: MFA email templates

### Optional

#### `MFA_RP_ID`

- **Required**: ⚪ Optional (auto-detected)
- **Sensitivity**: 🔓 Public
- **Description**: Relying Party ID for WebAuthn/passkeys
- **Format**: Domain name
- **Example**: `staff.sacco-plus.com`
- **Default**: Derived from request host
- **Used In**: Passkey registration/authentication
- **Notes**: Must match domain exactly

#### `MFA_ORIGIN`

- **Required**: ⚪ Optional (auto-detected)
- **Sensitivity**: 🔓 Public
- **Description**: Origin for WebAuthn/passkeys
- **Format**: Full URL with protocol
- **Example**: `https://staff.sacco-plus.com`
- **Default**: Derived from request
- **Used In**: Passkey registration/authentication

#### `MFA_RP_NAME`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔓 Public
- **Description**: Friendly name shown in authenticator prompts
- **Example**: `SACCO+ Staff Console`
- **Default**: `Ibimina Staff Console`
- **Used In**: Passkey registration UI

#### `MFA_SESSION_TTL_SECONDS`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔓 Public
- **Description**: MFA session lifetime in seconds
- **Default**: `43200` (12 hours)
- **Used In**: MFA cookie expiration

#### `TRUSTED_DEVICE_TTL_SECONDS`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔓 Public
- **Description**: Trusted device cookie lifetime in seconds
- **Default**: `2592000` (30 days)
- **Used In**: Trusted device cookie expiration

---

## 4. Email Configuration

### Required

#### `MAIL_FROM`

- **Required**: ✅ Yes (if email enabled)
- **Sensitivity**: 🔓 Public
- **Description**: Default from address for transactional emails
- **Format**: `"Name <email@domain.com>"`
- **Example**: `"SACCO+ Ops <no-reply@sacco-plus.com>"`

### Optional

#### `EMAIL_WEBHOOK_URL`

- **Required**: ⚪ Optional (webhook approach)
- **Description**: URL for transactional email webhook
- **Used In**: Email sending via webhook

#### `EMAIL_WEBHOOK_KEY`

- **Required**: ⚪ Optional (if webhook used)
- **Sensitivity**: 🔒 Private
- **Description**: Bearer token for email webhook auth

#### `SMTP_HOST`

- **Required**: ⚪ Optional (SMTP approach)
- **Description**: SMTP server hostname
- **Example**: `smtp.sendgrid.net`

#### `SMTP_USER`

- **Required**: ⚪ Optional (if SMTP auth required)
- **Sensitivity**: 🔒 Private
- **Description**: SMTP authentication username

#### `SMTP_PASS`

- **Required**: ⚪ Optional (if SMTP auth required)
- **Sensitivity**: 🔴 CRITICAL
- **Description**: SMTP authentication password

#### `SMTP_PORT`

- **Required**: ⚪ Optional
- **Description**: SMTP server port
- **Default**: `587` (STARTTLS)
- **Options**: 25, 465 (SSL), 587 (TLS)

---

## 5. Logging & Observability

### Optional (All)

#### `LOG_DRAIN_URL`

- **Required**: ⚪ Optional (recommended for production)
- **Sensitivity**: 🔒 Private
- **Description**: Webhook endpoint for structured log delivery
- **Example**: `https://logs.datadog.com/webhook`
- **Used In**: Production log aggregation

#### `LOG_DRAIN_TOKEN`

- **Required**: ⚪ Optional (if LOG_DRAIN_URL set)
- **Sensitivity**: 🔒 Private
- **Description**: Bearer token for log drain authentication

#### `LOG_DRAIN_SOURCE`

- **Required**: ⚪ Optional
- **Description**: Source label for log messages
- **Default**: `nextjs-admin`
- **Example**: `sacco-plus-admin-production`

#### `LOG_DRAIN_TIMEOUT_MS`

- **Required**: ⚪ Optional
- **Description**: HTTP timeout for log drain requests
- **Default**: `2000` (2 seconds)

#### `LOG_DRAIN_ALERT_WEBHOOK`

- **Required**: ⚪ Optional
- **Description**: Alert webhook for log drain failures
- **Used In**: Operational alerts

#### `LOG_DRAIN_ALERT_TOKEN`

- **Required**: ⚪ Optional (if alert webhook set)
- **Sensitivity**: 🔒 Private
- **Description**: Bearer token for alert webhook

#### `LOG_DRAIN_ALERT_COOLDOWN_MS`

- **Required**: ⚪ Optional
- **Description**: Cooldown between alert notifications
- **Default**: `300000` (5 minutes)

#### `LOG_DRAIN_SILENT`

- **Required**: ⚪ Optional
- **Description**: Suppress log drain errors (0 or 1)
- **Default**: `0`
- **Notes**: Set to 1 in noisy dev environments

#### `SENTRY_DSN`

- **Required**: ⚪ Optional (recommended for production)
- **Sensitivity**: 🔓 Public (DSN is safe to expose)
- **Description**: Sentry error tracking DSN
- **Format**: `https://[key]@[org].ingest.sentry.io/[project]`
- **Used In**: Error tracking and monitoring

#### `SENTRY_AUTH_TOKEN`

- **Required**: ⚪ Optional (CI/CD for source maps)
- **Sensitivity**: 🔒 Private
- **Description**: Sentry auth token for uploading source maps
- **Used In**: Build-time source map upload

---

## 6. Analytics

### Optional (All)

#### `NEXT_PUBLIC_POSTHOG_KEY`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔓 Public
- **Description**: PostHog public project key
- **Used In**: Client-side analytics

#### `NEXT_PUBLIC_POSTHOG_HOST`

- **Required**: ⚪ Optional
- **Description**: PostHog host URL
- **Default**: `https://app.posthog.com`
- **Example**: `https://eu.posthog.com` (for EU data residency)

---

## 7. Mobile App

### Optional (All)

#### `EXPO_PUBLIC_SUPABASE_URL`

- **Required**: ⚪ Optional (mobile-specific)
- **Description**: Supabase URL for Expo mobile app
- **Notes**: Usually same as NEXT_PUBLIC_SUPABASE_URL

#### `EXPO_PUBLIC_SUPABASE_ANON_KEY`

- **Required**: ⚪ Optional (mobile-specific)
- **Description**: Supabase anon key for Expo mobile app

#### `EAS_PROJECT_ID`

- **Required**: ⚪ Optional (EAS builds)
- **Description**: Expo Application Services project ID
- **Used In**: EAS build configuration

#### `EAS_ACCESS_TOKEN`

- **Required**: ⚪ Optional (CI/CD for EAS builds)
- **Sensitivity**: 🔒 Private
- **Description**: EAS access token for automated builds
- **Used In**: GitHub Actions mobile build workflows

---

## 8. Edge Functions & Webhooks

### Optional (All)

#### `GSMPRO_API_KEY`

- **Required**: ⚪ Optional (if GSM modem integration)
- **Sensitivity**: 🔒 Private
- **Description**: API key for GSM modem service
- **Used In**: SMS forwarding, GSM heartbeat

#### `TWILIO_ACCOUNT_SID`

- **Required**: ⚪ Optional (if Twilio integration)
- **Sensitivity**: 🔒 Private
- **Description**: Twilio account SID
- **Used In**: Alternative SMS provider

#### `TWILIO_AUTH_TOKEN`

- **Required**: ⚪ Optional (if Twilio integration)
- **Sensitivity**: 🔴 CRITICAL
- **Description**: Twilio authentication token
- **Used In**: Twilio API calls

---

## 9. Build & CI/CD

### Optional (All)

#### `APP_ENV`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔓 Public
- **Description**: Runtime environment label
- **Values**: `development`, `staging`, `production`
- **Default**: `development`
- **Used In**: Environment-specific logic

#### `NODE_ENV`

- **Required**: ⚪ Optional (set by framework)
- **Sensitivity**: 🔓 Public
- **Description**: Node.js environment
- **Values**: `development`, `production`, `test`
- **Notes**: Usually set automatically by Next.js/Expo

#### `NEXT_PUBLIC_BUILD_ID`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔓 Public
- **Description**: Deterministic build ID for CI
- **Default**: Auto-generated timestamp
- **Used In**: Cache busting, version display

#### `NEXT_PUBLIC_SITE_URL`

- **Required**: ⚪ Optional
- **Sensitivity**: 🔓 Public
- **Description**: Canonical site URL
- **Example**: `https://staff.sacco-plus.com`
- **Used In**: OG tags, redirects, canonical URLs

#### `SITE_URL`

- **Required**: ⚪ Optional (server-side alternative)
- **Description**: Server-side site URL
- **Notes**: Used in server actions when request context unavailable

#### `PORT`

- **Required**: ⚪ Optional
- **Description**: Port for development server
- **Default**: `3000`
- **Used In**: `pnpm dev`, `pnpm start`

#### `CLOUDFLARE_BUILD`

- **Required**: ⚪ Optional (CI/CD)
- **Description**: Flag to indicate Cloudflare Pages build
- **Values**: `1` (enabled) or unset
- **Used In**: Build-time configuration adjustments

#### `ANALYZE_BUNDLE`

- **Required**: ⚪ Optional (CI/CD)
- **Description**: Enable bundle analyzer
- **Values**: `1` (enabled) or unset
- **Used In**: Bundle size analysis

#### `AUTH_E2E_STUB`

- **Required**: ⚪ Optional (testing)
- **Description**: Enable auth stubbing for E2E tests
- **Values**: `1` (enabled) or unset
- **Used In**: Playwright E2E tests

---

## Environment Variable Security Checklist

### ✅ DO

- [ ] Store secrets in 1Password or equivalent secret manager
- [ ] Use Vercel/GitHub encrypted secrets for CI/CD
- [ ] Rotate critical secrets quarterly (or monthly for high-risk)
- [ ] Use different secrets per environment (dev/staging/prod)
- [ ] Regenerate secrets immediately if compromised
- [ ] Document secret ownership and rotation schedule
- [ ] Verify service-role key never appears in client bundles (CI grep check)

### ❌ DON'T

- [ ] Never commit `.env` files to git
- [ ] Never share secrets via email/Slack
- [ ] Never reuse production secrets in development
- [ ] Never expose service-role key to client-side code
- [ ] Never log secrets (even partially)
- [ ] Never include secrets in error messages

---

## Quick Start for New Environments

### Local Development

```bash
# 1. Copy template
cp .env.example .env

# 2. Generate secrets
export BACKUP_PEPPER=$(openssl rand -hex 32)
export MFA_SESSION_SECRET=$(openssl rand -hex 32)
export TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
export HMAC_SHARED_SECRET=$(openssl rand -hex 32)
export KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)

# 3. Set Supabase (from local Docker or hosted project)
export NEXT_PUBLIC_SUPABASE_URL=https://localhost:54321
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
export SUPABASE_URL=https://localhost:54321
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 4. Optional: OpenAI (for AI agent)
export OPENAI_API_KEY=sk-your-key

# 5. Save to .env file
```

### Staging/Production

1. Use Vercel dashboard or CLI to set environment variables
2. Ensure secrets are unique per environment
3. Set `APP_ENV=staging` or `APP_ENV=production`
4. Configure log drain and observability
5. Verify all required variables are set

---

## Verification Commands

```bash
# Check which variables are set
env | grep -E "SUPABASE|MFA|BACKUP|HMAC|KMS" | cut -d= -f1

# Verify no service-role key in client bundles (CI check)
grep -r "SUPABASE_SERVICE_ROLE" apps/*/public apps/*/.next/static packages/*/dist || echo "✅ Clean"

# Test Supabase connection
pnpm --filter @ibimina/admin run test:supabase-connection
```

---

## Troubleshooting

### "Supabase types out of date"

**Cause**: Database schema changed but types.ts not regenerated  
**Fix**: `pnpm gen:types`

### "MFA verification failed"

**Cause**: MFA secrets don't match between environments  
**Fix**: Ensure MFA_SESSION_SECRET is consistent and not rotated mid-session

### "HMAC signature invalid"

**Cause**: HMAC_SHARED_SECRET mismatch between app and telco partner  
**Fix**: Coordinate secret rotation with partner

### "Build fails with missing env var"

**Cause**: Required variable not set  
**Fix**: Check error message for variable name, set in .env or Vercel

---

## References

- [Supabase Environment Variables](https://supabase.com/docs/guides/cli/config)
- [Next.js Environment Variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Change Log

| Date       | Version | Changes                                          |
| ---------- | ------- | ------------------------------------------------ |
| 2025-11-02 | 2.0     | Complete catalog of all 83 environment variables |
| 2025-10-01 | 1.0     | Initial environment matrix documentation         |

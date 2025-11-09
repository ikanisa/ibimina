# Environment Variables Reference

**Version**: 1.0  
**Last Updated**: 2025-10-29

This document provides a comprehensive reference for all environment variables
used in the ibimina project.

## 📋 Overview

Environment variables are categorized into:

- **Public (Client-side)**: Exposed to browser, prefixed with `NEXT_PUBLIC_`
- **Server-side**: Never exposed to browser, no prefix
- **Supabase Edge Functions**: Set via Supabase dashboard/CLI

## 🔑 Variable Categories

### Security Level Classification

| Level             | Description                    | Examples                           |
| ----------------- | ------------------------------ | ---------------------------------- |
| **Critical**      | Secrets that grant full access | Service role keys, encryption keys |
| **Sensitive**     | Secrets with limited scope     | API keys, tokens                   |
| **Configuration** | Non-secret settings            | URLs, feature flags                |
| **Public**        | Browser-safe values            | Public API keys, site URLs         |

## 🌐 Public (Client-Side) Variables

These variables are bundled into the client-side JavaScript and **visible to
users**.

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`

- **Type**: String (URL)
- **Required**: Yes
- **Security**: Public
- **Description**: Supabase project URL
- **Example**: `https://abcdefghijklmnop.supabase.co`
- **Usage**: Client-side Supabase queries
- **Notes**: Safe to expose, RLS protects data

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Type**: String (JWT)
- **Required**: Yes
- **Security**: Public
- **Description**: Supabase anonymous/public key for client queries
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Usage**: Client-side authentication and queries
- **Notes**: RLS must be enabled on all tables

### Application Configuration

#### `NEXT_PUBLIC_SITE_URL`

- **Type**: String (URL)
- **Required**: No (defaults to inferred value)
- **Security**: Public
- **Description**: Canonical site URL for redirects and passkeys
- **Example**: `https://app.ibimina.rw`
- **Usage**: Passkey relying party, OAuth redirects
- **Default**: Inferred from request headers

#### `NEXT_PUBLIC_E2E`

- **Type**: String ("1" or unset)
- **Required**: No
- **Security**: Public
- **Description**: Enable E2E testing mode
- **Example**: `1`
- **Usage**: Bypass certain checks in test environment
- **Default**: Unset (disabled)

#### `NEXT_PUBLIC_BUILD_ID`

- **Type**: String
- **Required**: No
- **Security**: Public
- **Description**: Build identifier for cache busting
- **Example**: `v1.2.3-abc123`
- **Usage**: Display version, cache invalidation
- **Set by**: CI/CD pipeline

### Web Push Notifications

#### `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

- **Type**: String (Base64)
- **Required**: No (if push notifications used)
- **Security**: Public
- **Description**: VAPID public key for web push
- **Example**: `BCk-QqERU0q-CfYZjcuB6lnyyOYfwTNdXXXXXXXXXXX`
- **Generation**: `npx web-push generate-vapid-keys`
- **Usage**: Subscribe to push notifications

## 🔒 Server-Side Variables

These variables are **never exposed** to the browser.

### Critical Security Variables

#### `SUPABASE_SERVICE_ROLE_KEY`

- **Type**: String (JWT)
- **Required**: Yes
- **Security**: CRITICAL
- **Description**: Supabase service role key (bypasses RLS)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Usage**: Admin operations, background jobs
- **Warning**: Never use in client code!
- **Validation**: Checked by prebuild hooks

#### `KMS_DATA_KEY` or `KMS_DATA_KEY_BASE64`

- **Type**: String (32-byte hex or base64)
- **Required**: Yes
- **Security**: CRITICAL
- **Description**: Master encryption key for data encryption
- **Generation**: `openssl rand -base64 32`
- **Usage**: Encrypt sensitive data at rest
- **Rotation**: Quarterly (requires re-encryption)
- **Storage**: Secure secret manager in production

#### `BACKUP_PEPPER`

- **Type**: String (32-byte hex)
- **Required**: Yes
- **Security**: CRITICAL
- **Description**: Pepper for backup encryption and password hashing
- **Generation**: `openssl rand -hex 32`
- **Usage**: Add randomness to hashing
- **Default fallback**: Used by other peppers if not set

#### `MFA_SESSION_SECRET`

- **Type**: String (32-byte hex)
- **Required**: Yes
- **Security**: CRITICAL
- **Description**: Secret for signing MFA session cookies
- **Generation**: `openssl rand -hex 32`
- **Usage**: Sign/verify MFA session tokens
- **Rotation**: Quarterly (invalidates sessions)

#### `TRUSTED_COOKIE_SECRET`

- **Type**: String (32-byte hex)
- **Required**: Yes
- **Security**: CRITICAL
- **Description**: Secret for trusted device cookies
- **Generation**: `openssl rand -hex 32`
- **Usage**: Sign/verify trusted device tokens
- **Rotation**: Quarterly (requires re-trust)

#### `HMAC_SHARED_SECRET`

- **Type**: String (32-byte hex)
- **Required**: Yes
- **Security**: CRITICAL
- **Description**: Shared secret for webhook signature verification
- **Generation**: `openssl rand -hex 32`
- **Usage**: Verify incoming webhook signatures
- **Sharing**: Share with webhook providers

### Optional Security Variables

#### `RATE_LIMIT_SECRET`

- **Type**: String (32-byte hex)
- **Required**: No
- **Security**: Sensitive
- **Description**: Secret for rate limit token generation
- **Generation**: `openssl rand -hex 32`
- **Usage**: Generate rate limit bypass tokens
- **Default**: Falls back to `BACKUP_PEPPER`

#### `EMAIL_OTP_PEPPER`

- **Type**: String (32-byte hex)
- **Required**: No
- **Security**: Sensitive
- **Description**: Pepper for email OTP hashing
- **Generation**: `openssl rand -hex 32`
- **Usage**: Hash email OTP codes
- **Default**: Falls back to `BACKUP_PEPPER`

#### `REPORT_SIGNING_KEY`

- **Type**: String (32-byte hex)
- **Required**: No
- **Security**: Sensitive
- **Description**: Secret for signing CSV exports
- **Generation**: `openssl rand -hex 32`
- **Usage**: Sign report downloads
- **Default**: Unset (signing disabled)

#### `SUPABASE_JWT_SECRET`

- **Type**: String (JWT secret)
- **Required**: No
- **Security**: Sensitive
- **Description**: Supabase JWT secret for server-side validation
- **Example**: From Supabase dashboard
- **Usage**: Validate JWT tokens server-side
- **Default**: Not needed for most use cases

### Application Configuration

#### `APP_ENV`

- **Type**: String
- **Required**: Yes
- **Security**: Configuration
- **Description**: Application environment
- **Values**: `local`, `development`, `staging`, `production`
- **Usage**: Environment-specific behavior
- **Default**: `local`

#### `PORT`

- **Type**: Number
- **Required**: No
- **Security**: Configuration
- **Description**: HTTP port for application server
- **Example**: `3000`
- **Usage**: Next.js server port
- **Default**: `3000`

#### `SITE_URL`

- **Type**: String (URL)
- **Required**: No
- **Security**: Configuration
- **Description**: Server-side canonical URL
- **Example**: `https://app.ibimina.rw`
- **Usage**: Email links, OAuth, API callbacks
- **Default**: `http://localhost:3100` in dev

#### `EDGE_URL`

- **Type**: String (URL)
- **Required**: No (for smoke tests)
- **Security**: Configuration
- **Description**: Base URL for Supabase Edge Functions
- **Example**: `https://abcdefghijklmnop.supabase.co/functions/v1`
- **Usage**: Edge function smoke tests

### MFA Configuration

#### `MFA_RP_ID`

- **Type**: String (Domain)
- **Required**: No (inferred)
- **Security**: Configuration
- **Description**: Passkey relying party ID (domain)
- **Example**: `ibimina.rw`
- **Usage**: WebAuthn/passkey registration
- **Default**: Inferred from URL

#### `MFA_ORIGIN`

- **Type**: String (URL)
- **Required**: No (inferred)
- **Security**: Configuration
- **Description**: Passkey origin URL
- **Example**: `https://app.ibimina.rw`
- **Usage**: WebAuthn/passkey validation
- **Default**: Inferred from URL

#### `MFA_RP_NAME`

- **Type**: String
- **Required**: Yes
- **Security**: Configuration
- **Description**: Display name for passkey prompts
- **Example**: `SACCO+`
- **Usage**: Shown in browser passkey dialogs
- **Default**: `SACCO+`

#### `MFA_EMAIL_LOCALE`

- **Type**: String (Locale code)
- **Required**: Yes
- **Security**: Configuration
- **Description**: Locale for MFA emails
- **Example**: `en`, `rw`
- **Usage**: Email template localization
- **Default**: `en`

#### `MFA_EMAIL_FROM`

- **Type**: String (Email)
- **Required**: Yes
- **Security**: Configuration
- **Description**: From address for MFA emails
- **Example**: `security@ibimina.rw`
- **Usage**: MFA email sender
- **Default**: `security@example.com`

#### `MFA_SESSION_TTL_SECONDS`

- **Type**: Number (Seconds)
- **Required**: No
- **Security**: Configuration
- **Description**: MFA session timeout
- **Example**: `43200` (12 hours)
- **Usage**: MFA session expiration
- **Default**: `43200`

#### `TRUSTED_DEVICE_TTL_SECONDS`

- **Type**: Number (Seconds)
- **Required**: No
- **Security**: Configuration
- **Description**: Trusted device token lifetime
- **Example**: `2592000` (30 days)
- **Usage**: Trusted device expiration
- **Default**: `2592000`

### Email Configuration

#### `MAIL_FROM`

- **Type**: String (Email with name)
- **Required**: Yes
- **Security**: Configuration
- **Description**: Default from address for emails
- **Example**: `SACCO+ <no-reply@sacco.plus>`
- **Usage**: Transactional emails
- **Default**: `SACCO+ <no-reply@sacco.plus>`

#### SMTP Configuration (Optional)

#### `SMTP_HOST`

- **Type**: String (Hostname)
- **Required**: No (if using SMTP)
- **Description**: SMTP server hostname
- **Example**: `smtp.gmail.com`

#### `SMTP_PORT`

- **Type**: Number
- **Required**: No
- **Description**: SMTP server port
- **Example**: `587`
- **Default**: `587`

#### `SMTP_USER`

- **Type**: String
- **Required**: No (if using SMTP)
- **Description**: SMTP authentication username

#### `SMTP_PASS`

- **Type**: String
- **Required**: No (if using SMTP)
- **Security**: Sensitive
- **Description**: SMTP authentication password

### Observability

#### `LOG_DRAIN_URL`

- **Type**: String (URL)
- **Required**: No
- **Security**: Configuration
- **Description**: URL for structured log drain
- **Example**: `https://logs.example.com/ingest`
- **Usage**: Send logs to external service

#### `LOG_DRAIN_TOKEN`

- **Type**: String
- **Required**: No (if LOG_DRAIN_URL set)
- **Security**: Sensitive
- **Description**: Authentication token for log drain
- **Usage**: Authenticate log drain requests

#### `LOG_DRAIN_SOURCE`

- **Type**: String
- **Required**: No
- **Description**: Source identifier for logs
- **Example**: `ibimina-admin-prod`
- **Usage**: Tag logs by source

#### `LOG_DRAIN_TIMEOUT_MS`

- **Type**: Number (Milliseconds)
- **Required**: No
- **Description**: Timeout for log drain requests
- **Example**: `2000`
- **Default**: `2000`

#### `LOG_DRAIN_ALERT_WEBHOOK`

- **Type**: String (URL)
- **Required**: No
- **Description**: Webhook URL for critical alerts
- **Example**: `https://hooks.slack.com/...`

#### `LOG_DRAIN_ALERT_TOKEN`

- **Type**: String
- **Required**: No
- **Security**: Sensitive
- **Description**: Token for alert webhook

#### `LOG_DRAIN_ALERT_COOLDOWN_MS`

- **Type**: Number (Milliseconds)
- **Required**: No
- **Description**: Minimum time between alerts
- **Example**: `300000` (5 minutes)
- **Default**: `300000`

#### `LOG_DRAIN_SILENT`

- **Type**: String ("1" or unset)
- **Required**: No
- **Description**: Suppress log drain errors
- **Example**: `1`
- **Usage**: Prevent log drain failures from affecting app

### Analytics

#### `ANALYTICS_CACHE_TOKEN`

- **Type**: String
- **Required**: No
- **Security**: Sensitive
- **Description**: Bearer token for cache revalidation
- **Generation**: Random token
- **Usage**: Revalidate analytics cache
- **Default**: Unset (endpoint disabled)

### External Services

#### Twilio (WhatsApp/SMS)

#### `TWILIO_ACCOUNT_SID`

- **Type**: String
- **Required**: No (if using Twilio)
- **Security**: Sensitive
- **Description**: Twilio account identifier

#### `TWILIO_AUTH_TOKEN`

- **Type**: String
- **Required**: No (if using Twilio)
- **Security**: Sensitive
- **Description**: Twilio authentication token

#### `TWILIO_WHATSAPP_FROM`

- **Type**: String (Phone number)
- **Required**: No
- **Description**: Twilio WhatsApp sender number
- **Example**: `whatsapp:+14155238886`
- **Default**: `whatsapp:+14155238886`

#### Web Push (VAPID)

#### `VAPID_PRIVATE_KEY`

- **Type**: String (Base64)
- **Required**: No (if push notifications used)
- **Security**: Sensitive
- **Description**: VAPID private key for web push
- **Generation**: `npx web-push generate-vapid-keys`

#### `VAPID_SUBJECT`

- **Type**: String (Email or URL)
- **Required**: No
- **Description**: VAPID subject (contact info)
- **Example**: `mailto:admin@example.com`

### AI Features

#### `OPENAI_API_KEY`

- **Type**: String
- **Required**: No (if AI features used)
- **Security**: Sensitive
- **Description**: OpenAI API key for AI features
- **Example**: `sk-...`
- **Usage**: AI-powered analytics, chatbot

#### `OPENAI_RESPONSES_MODEL`

- **Type**: String
- **Required**: No
- **Description**: OpenAI model for responses
- **Example**: `gpt-4-turbo-preview`
- **Default**: `gpt-4o-mini`

### Feature Flags

#### `DISABLE_PWA`

- **Type**: String ("1" or unset)
- **Required**: No
- **Description**: Disable Progressive Web App features
- **Example**: `1`
- **Usage**: Disable service worker and offline support

#### `ANALYZE_BUNDLE`

- **Type**: String ("1" or unset)
- **Required**: No
- **Description**: Enable bundle analysis on build
- **Example**: `1`
- **Usage**: Generate bundle size report

### Build Metadata

#### `GIT_COMMIT_SHA`

- **Type**: String
- **Required**: No
- **Security**: Public
- **Description**: Git commit SHA for this build
- **Example**: `abc123def456`
- **Set by**: CI/CD pipeline
- **Usage**: Version tracking, debugging

#### `APP_REGION`

- **Type**: String
- **Required**: No
- **Description**: Deployment region
- **Example**: `us-east-1`
- **Usage**: Regional routing, latency tracking

## 📦 Supabase Edge Function Variables

These are set via Supabase dashboard or CLI:

```bash
supabase secrets set VAR_NAME=value --env-file .env.production
```

### Required for Edge Functions

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HMAC_SHARED_SECRET`
- `KMS_DATA_KEY_BASE64`
- `OPENAI_API_KEY` (if AI features used)
- `RESEND_API_KEY` (if email used)
- `MFA_EMAIL_FROM`
- `MFA_EMAIL_LOCALE`

### Edge Function Configuration

- `FORECAST_LOOKBACK_DAYS`: Number (default: 120)
- `FORECAST_HORIZON_DAYS`: Number (default: 21)
- `RATE_LIMIT_WINDOW_SECONDS`: Number (default: 60)
- `RATE_LIMIT_MAX`: Number (default: 120)
- `RECON_AUTO_ESCALATE_HOURS`: Number (default: 48)
- `SMS_AUTOMATION_THRESHOLD_MINUTES`: Number (default: 10)
- `SMS_AUTOMATION_BATCH`: Number (default: 25)

## 🧪 Testing Variables

### Playwright E2E Tests

These variables are used in E2E testing:

- `PLAYWRIGHT_BASE_URL`: Test server URL
- `PLAYWRIGHT_SUPABASE_URL`: Test Supabase URL
- `PLAYWRIGHT_SUPABASE_ANON_KEY`: Test anon key
- `PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY`: Test service key
- `PLAYWRIGHT_OPENAI_API_KEY`: Test OpenAI key (stub)
- `PLAYWRIGHT_HMAC_SHARED_SECRET`: Test HMAC secret (stub)

### RLS Tests

- `RLS_TEST_DATABASE_URL`: PostgreSQL URL for RLS tests

## ✅ Validation

Environment variables are validated using Zod in `packages/config/src/env.ts`.

### Validation Checks

- **Type**: String, number, URL, email
- **Required**: Must be present
- **Format**: Valid URL, email, base64, hex
- **Length**: Minimum length for secrets

### Runtime Validation

```typescript
import { env } from "@ibimina/config";

// Throws error if validation fails
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
```

### Build-time Validation

CI checks for:

- Required variables present
- Correct format
- No accidental secret commits
- Service role key not in client code

## 🔄 Secret Rotation

### Rotation Schedule

| Secret                | Frequency | Impact                        |
| --------------------- | --------- | ----------------------------- |
| Service Role Key      | Annually  | Update config, redeploy       |
| KMS Data Key          | Quarterly | Re-encrypt data               |
| MFA Session Secret    | Quarterly | Invalidates MFA sessions      |
| Trusted Cookie Secret | Quarterly | Users must re-trust devices   |
| HMAC Shared Secret    | Quarterly | Update webhook providers      |
| API Keys              | Annually  | Update in provider dashboards |

### Rotation Procedure

1. Generate new secret
2. Add both old and new to config (if supported)
3. Deploy application
4. Update external services
5. Remove old secret after grace period
6. Monitor for issues

## 📝 Best Practices

### DO

- ✅ Use `.env.example` as template
- ✅ Generate secrets with `openssl rand`
- ✅ Validate all environment variables
- ✅ Use different secrets per environment
- ✅ Store secrets in secure secret manager
- ✅ Rotate secrets regularly
- ✅ Document new variables here

### DON'T

- ❌ Commit secrets to git
- ❌ Use default/example values in production
- ❌ Share secrets in chat/email
- ❌ Reuse secrets across services
- ❌ Use weak secrets (< 32 bytes)
- ❌ Expose server secrets to client

## 🔗 Related Documentation

- [Ground Rules](GROUND_RULES.md) - Secret management standards
- [Quick Reference](QUICK_REFERENCE.md) - Quick setup
- [Security Hardening](SECURITY_HARDENING.md) - Security best practices

---

**Last Updated**: 2025-10-29  
**Maintainers**: DevOps Team

# Netlify Environment Configuration Guide

## Overview

This document explains how to configure environment variables for the SACCO+ Admin application on Netlify, particularly addressing build-time validation issues.

## Problem

The Next.js build process validates environment variables using Zod schemas at build time. In Netlify, several secrets were undefined, causing builds to fail with validation errors for:

- `BACKUP_PEPPER`
- `MFA_SESSION_SECRET`
- `TRUSTED_COOKIE_SECRET`
- `HMAC_SHARED_SECRET`
- `OPENAI_API_KEY`
- `KMS_DATA_KEY_BASE64`

## Solution

The application now uses **context-aware validation**:

- **Production builds**: All secrets are strictly required
- **Preview/branch builds**: Secrets are optional and use safe fallback values
- **Development builds**: Secrets are optional and use safe fallback values

This allows preview deployments to build successfully without exposing production secrets, while maintaining strict validation for production.

## Setting Environment Variables in Netlify

### Option 1: Netlify CLI (Recommended)

The CLI provides better control over scopes and contexts:

```bash
# Navigate to your repository root
cd /path/to/ibimina

# Ensure you're linked to the right site
netlify link

# Generate and set production secrets
netlify env:set BACKUP_PEPPER "$(openssl rand -base64 32)" --context production --scope builds functions --secret
netlify env:set MFA_SESSION_SECRET "$(openssl rand -base64 32)" --context production --scope builds functions --secret
netlify env:set TRUSTED_COOKIE_SECRET "$(openssl rand -base64 32)" --context production --scope builds functions --secret
netlify env:set HMAC_SHARED_SECRET "$(openssl rand -base64 32)" --context production --scope builds functions --secret
netlify env:set KMS_DATA_KEY_BASE64 "$(openssl rand -base64 32)" --context production --scope builds functions --secret
netlify env:set OPENAI_API_KEY "sk-your-key-here" --context production --scope builds functions --secret

# Set Supabase credentials (required for all contexts)
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://your-project.supabase.co" --context production deploy-preview --scope builds functions
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-anon-key" --context production deploy-preview --scope builds functions
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-service-role-key" --context production deploy-preview --scope builds functions --secret

# Verify configuration
netlify env:list --context production --scope builds
netlify env:list --context production --scope functions
```

### Option 2: Netlify UI

1. Go to your site in Netlify
2. Navigate to **Site settings → Environment variables**
3. Click **Add a variable**
4. Set each required variable with:
   - **Key**: Variable name
   - **Value**: Generated secret or API key
   - **Scopes**: Select both **Builds** and **Functions**
   - **Contexts**: Select **Production** (and optionally **Deploy Preview**/★**Branch deploys**)

### Required Variables by Context

#### All Contexts (Production, Preview, Branch)

These must be set for builds to succeed:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Production Only (Strictly Required)

These are validated strictly in production but optional in preview/branch:

- `BACKUP_PEPPER`
- `MFA_SESSION_SECRET`
- `TRUSTED_COOKIE_SECRET`
- `HMAC_SHARED_SECRET`
- `OPENAI_API_KEY`
- `KMS_DATA_KEY_BASE64`

#### Optional (All Contexts)

- `APP_ENV` (defaults to inferred from context)
- `NEXT_PUBLIC_SITE_URL`
- `MFA_EMAIL_FROM`
- `LOG_DRAIN_URL`
- Sentry, PostHog, and other integrations

## Generating Secrets

### Using OpenSSL (macOS/Linux)

```bash
# Generate a 32-byte base64-encoded secret
openssl rand -base64 32
```

### Using Node.js (Cross-platform)

```bash
# Generate a 32-byte base64-encoded secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Scopes Explained

Netlify environment variables support different scopes:

- **Builds**: Available during the build process (`next build`)
- **Functions**: Available at runtime in Netlify Functions/SSR
- **Post-processing**: Available during post-processing steps

For this application:
- Variables needed during build validation **must** include **Builds**
- Variables used in server actions/API routes **should** include **Functions**
- Use both scopes for most secrets: `--scope builds functions`

## Deploy Contexts

Netlify supports different deploy contexts:

- **production**: Main production branch (usually `main`)
- **deploy-preview**: Pull request previews
- **branch-deploy**: Branch deployments (e.g., staging)

You can set different values per context to:
- Keep production secrets isolated
- Use test/throwaway keys in previews
- Disable expensive features (like OpenAI) in non-production

## Security Best Practices

1. **Never** prefix secrets with `NEXT_PUBLIC_` (they'll be bundled to the client)
2. Use the `--secret` flag when setting via CLI (prevents values from being read later)
3. For public repositories, configure Netlify's [sensitive variable policy](https://docs.netlify.com/configure-builds/environment-variables/#sensitive-variable-policy)
4. Rotate secrets periodically
5. Use different secrets for production vs preview/branch contexts
6. Review [Netlify's environment variable docs](https://docs.netlify.com/configure-builds/environment-variables/)

## Verification

After setting variables, verify your configuration:

```bash
# List all production build variables
netlify env:list --context production --scope builds

# List all production function variables
netlify env:list --context production --scope functions

# Get a specific variable value (only works for non-secret variables)
netlify env:get NEXT_PUBLIC_SUPABASE_URL --context production --scope builds
```

Then trigger a new deploy to test the build.

## Troubleshooting

### Build fails with "X is required"

The variable is missing or empty. Set it using the CLI or UI with the **Builds** scope.

### Runtime error: "X is undefined"

The variable is missing the **Functions** scope. Add it using:

```bash
netlify env:set X "value" --context production --scope builds functions
```

### Preview builds fail but production works

Either:
1. Set the variable for preview contexts: `--context deploy-preview branch-deploy`
2. Or ensure the variable is truly optional for non-production (the code now supports this)

### Build succeeds but runtime features don't work

You likely forgot to include the **Functions** scope. Update the variable to include both scopes.

## References

- [Netlify Environment Variables Documentation](https://docs.netlify.com/configure-builds/environment-variables/)
- [Netlify CLI Environment Commands](https://cli.netlify.com/commands/env)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [.env.netlify.example](./apps/admin/.env.netlify.example) - Template with all variables

## What Changed

The following changes were made to fix the Netlify build issue:

1. **Modified `packages/config/src/env.ts`**:
   - Made `BACKUP_PEPPER`, `MFA_SESSION_SECRET`, `TRUSTED_COOKIE_SECRET`, `HMAC_SHARED_SECRET`, and `OPENAI_API_KEY` optional in the Zod schema
   - Added context-aware validation in `superRefine` that only requires these secrets in production (`APP_ENV=production`)
   - Updated `prepareServerEnv` to provide safe fallback values for non-production contexts
   - Made `KMS_DATA_KEY_BASE64` optional for non-production, with fallback

2. **Created `.env.netlify.example`**:
   - Comprehensive template for Netlify environment variables
   - Clear documentation on which variables are required and when
   - CLI commands for setting variables with proper scopes and contexts

3. **Created `NETLIFY_ENV_CONFIG.md`**:
   - Complete guide for configuring Netlify environment variables
   - Troubleshooting section
   - Security best practices
   - Context and scope explanations

This allows:
- Production builds to maintain strict validation
- Preview/branch builds to succeed without production secrets
- Developers to test locally without needing all production secrets
- Better security by isolating production secrets from preview environments

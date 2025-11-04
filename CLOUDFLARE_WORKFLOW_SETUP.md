# Cloudflare Workflow Setup Guide

## Overview

This document describes the GitHub Actions workflow configured for deploying the Staff Admin PWA to Cloudflare Pages.

## Workflow Details

**Workflow File**: `.github/workflows/deploy-admin-cloudflare.yml`

**Workflow Name**: Deploy Staff Admin PWA to Cloudflare Pages

**Project Name**: `ibimina-staff-admin-pwa`

## GitHub Secrets Required

The following secrets must be configured in your GitHub repository (Settings → Secrets and variables → Actions):

### Cloudflare Credentials
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages deployment permissions
  - **Value provided**: `FmATZTT0qMJ8AbMz8fwo05QTivXLQ1u98hKtjqcE`
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
  - **Value provided**: `2209b915a85b1c11cee79b7806c6e73b`

### Application Secrets (Required for Build)
These must be configured in GitHub secrets:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `BACKUP_PEPPER`: Backup encryption pepper (32+ bytes)
- `MFA_SESSION_SECRET`: MFA session secret (32+ bytes)
- `TRUSTED_COOKIE_SECRET`: Trusted cookie secret (32+ bytes)
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `HMAC_SHARED_SECRET`: HMAC shared secret (32+ bytes)
- `KMS_DATA_KEY_BASE64`: KMS data key in base64 format

## How to Trigger the Workflow

### Option 1: Manual Trigger (Workflow Dispatch)

1. Go to your GitHub repository
2. Click on the "Actions" tab
3. Select "Deploy Staff Admin PWA to Cloudflare Pages" from the workflows list
4. Click "Run workflow" button
5. Select the branch (e.g., `main` or your current branch)
6. Click "Run workflow"

### Option 2: Automatic Trigger on Push

The workflow automatically runs when:
- Code is pushed to the `main` branch
- Changes are made to files in:
  - `apps/admin/**`
  - `packages/**`
  - `.github/workflows/deploy-admin-cloudflare.yml`

## Workflow Steps

The workflow performs the following steps:

1. **Checkout**: Checks out the repository code
2. **Setup Node.js**: Installs Node.js v20
3. **Install pnpm**: Installs pnpm v10.19.0
4. **Setup pnpm cache**: Caches pnpm store for faster builds
5. **Install dependencies**: Runs `pnpm install --frozen-lockfile`
6. **Build workspace packages**: Builds shared packages (@ibimina/config, @ibimina/lib, @ibimina/locales, @ibimina/ui)
7. **Fix config package imports**: Patches ES module imports
8. **Build Admin App**: Builds the admin application with all required environment variables
9. **Build for Cloudflare**: Runs Cloudflare Pages adapter (@cloudflare/next-on-pages)
10. **Publish to Cloudflare Pages**: Deploys to Cloudflare Pages project `ibimina-staff-admin-pwa`

## Build Output

The build output is located at:
```
apps/admin/.vercel/output/static
```

This directory is deployed to Cloudflare Pages.

## Monitoring Deployment

### In GitHub Actions
- Navigate to Actions tab
- Click on the running workflow
- Monitor each step's progress and logs

### In Cloudflare Dashboard
- Go to Cloudflare Dashboard
- Navigate to Workers & Pages → Overview
- Look for project `ibimina-staff-admin-pwa`
- View deployment status, logs, and URL

## Troubleshooting

### Build Fails with "Missing Environment Variable"
- Ensure all required secrets are configured in GitHub repository settings
- Verify secret names match exactly (case-sensitive)

### Cloudflare Deployment Fails
- Verify `CLOUDFLARE_API_TOKEN` has correct permissions (Cloudflare Pages:Edit)
- Verify `CLOUDFLARE_ACCOUNT_ID` is correct
- Check that the project `ibimina-staff-admin-pwa` exists in Cloudflare dashboard or will be auto-created

### Build Takes Too Long
- The build typically takes 5-10 minutes
- Most time is spent on pnpm install and building packages
- Caching helps reduce subsequent build times

## Next Steps After Deployment

1. Verify deployment in Cloudflare Dashboard
2. Test the deployed application at the Cloudflare Pages URL
3. Configure custom domain if needed (in Cloudflare Pages settings)
4. Set up environment variables in Cloudflare Pages dashboard for runtime configuration
5. Monitor application logs and performance

## Related Documentation

- [Cloudflare Deployment Instructions](./CLOUDFLARE_DEPLOYMENT_INSTRUCTIONS.md)
- [Environment Variables Template](./.env.cloudflare.template)
- [Quick Start Guide](./CLOUDFLARE_DEPLOYMENT_CHECKLIST.md)

## Changes Made

### Updated Files
- `.github/workflows/deploy-admin-cloudflare.yml`
  - Changed project name from `ibimina-admin` to `ibimina-staff-admin-pwa`
  - Updated workflow title to reflect "Staff Admin PWA" naming
  - All other configuration remains the same

### Workflow Now Uses
- **Project Name**: `ibimina-staff-admin-pwa` (matches Cloudflare Pages project)
- **Account ID**: `2209b915a85b1c11cee79b7806c6e73b`
- **API Token**: Configured via `CLOUDFLARE_API_TOKEN` secret

## Security Notes

⚠️ **Important**: 
- Never commit API tokens or secrets to the repository
- The Cloudflare API token provided in the issue should be added to GitHub Secrets only
- Rotate credentials regularly
- Use Cloudflare's token permissions to limit access scope

---

**Last Updated**: 2025-11-04
**Workflow Version**: v1.1
**Cloudflare Project**: ibimina-staff-admin-pwa

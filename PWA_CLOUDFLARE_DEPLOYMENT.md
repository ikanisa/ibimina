# PWA Cloudflare Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Ibimina PWA
applications (Admin/Staff and Client) to Cloudflare Pages.

## Apps Ready for Deployment

### 1. Admin/Staff App

- **Path**: `apps/admin`
- **Domain**: adminsacco.ikanisa.com (admin) / saccostaff.ikanisa.com (staff)
- **Framework**: Next.js 15.5.2
- **Features**: Full PWA with service worker, offline support, push
  notifications

### 2. Client App

- **Path**: `apps/client`
- **Domain**: sacco.ikanisa.com
- **Framework**: Next.js 15.5.4
- **Features**: Full PWA with service worker, offline support, mobile-first
  design

## Prerequisites

### System Requirements

- Node.js v20.x or higher
- pnpm 10.19.0
- Git
- Cloudflare account with Pages access

### Required Secrets

Generate these before deploying:

```bash
# Core security keys (generate once, use for all apps)
export BACKUP_PEPPER=$(openssl rand -hex 32)
export MFA_SESSION_SECRET=$(openssl rand -hex 32)
export TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
export HMAC_SHARED_SECRET=$(openssl rand -hex 32)
export KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)

# Web Push keys for client app
npx web-push generate-vapid-keys
# Save the public and private keys as:
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
# VAPID_PRIVATE_KEY=...
```

### External Services

1. **Supabase**: Project URL, anon key, service role key
2. **OpenAI** (optional): API key for AI features
3. **Resend** (optional): API key for emails
4. **Sentry** (optional): DSN for error tracking

## Local Testing

### Step 1: Install Dependencies

```bash
pnpm install --frozen-lockfile
```

### Step 2: Set Environment Variables

Create a `.env.local` file in each app directory with required variables:

```bash
# For apps/admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BACKUP_PEPPER=your-backup-pepper
MFA_SESSION_SECRET=your-mfa-session-secret
TRUSTED_COOKIE_SECRET=your-trusted-cookie-secret
HMAC_SHARED_SECRET=your-hmac-shared-secret
KMS_DATA_KEY_BASE64=your-kms-data-key
OPENAI_API_KEY=your-openai-key
NODE_ENV=production
```

```bash
# For apps/client/.env.local (includes web push)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BACKUP_PEPPER=your-backup-pepper
MFA_SESSION_SECRET=your-mfa-session-secret
TRUSTED_COOKIE_SECRET=your-trusted-cookie-secret
HMAC_SHARED_SECRET=your-hmac-shared-secret
KMS_DATA_KEY_BASE64=your-kms-data-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
NODE_ENV=production
```

### Step 3: Build for Cloudflare

```bash
# Admin app
cd apps/admin
CLOUDFLARE_BUILD=1 pnpm build:cloudflare

# Client app
cd apps/client
CLOUDFLARE_BUILD=1 pnpm build:cloudflare
```

### Step 4: Preview Locally

```bash
# Admin app (runs on localhost:8788)
cd apps/admin
pnpm preview:cloudflare

# Client app (runs on localhost:8789)
cd apps/client
pnpm preview:cloudflare
```

Test in your browser and verify:

- App loads correctly
- PWA install prompt appears
- Service worker registers
- Offline mode works
- All features function properly

## Cloudflare Pages Setup

### Option 1: GitHub Actions Deployment (Recommended)

#### Step 1: Configure GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

**Required for all apps:**

- `CLOUDFLARE_API_TOKEN` - From Cloudflare dashboard
- `CLOUDFLARE_ACCOUNT_ID` - From Cloudflare dashboard
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BACKUP_PEPPER`
- `MFA_SESSION_SECRET`
- `TRUSTED_COOKIE_SECRET`
- `HMAC_SHARED_SECRET`
- `KMS_DATA_KEY_BASE64`
- `OPENAI_API_KEY`

**Additional for client app:**

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

**Optional (Sentry):**

- `SENTRY_DSN_ADMIN`
- `NEXT_PUBLIC_SENTRY_DSN_ADMIN`
- `SENTRY_DSN_CLIENT`
- `NEXT_PUBLIC_SENTRY_DSN_CLIENT`

**AWS Secrets (if using AWS Secrets Manager):**

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_SECRETSMANAGER_SECRET_ID`

#### Step 2: Create Cloudflare Pages Projects

You can create projects via Cloudflare dashboard or CLI:

```bash
# Login to Cloudflare
wrangler login

# Create projects (run from repo root)
cd apps/admin
wrangler pages project create ibimina-admin

cd ../client
wrangler pages project create ibimina-client
```

#### Step 3: Deploy

Push to main branch or manually trigger workflow:

```bash
# Automatic deployment
git push origin main

# Manual deployment via GitHub UI
# Go to Actions → Deploy to Cloudflare Pages → Run workflow
# Select which app(s) to deploy
```

### Option 2: Direct Wrangler Deployment

#### Step 1: Login

```bash
wrangler login
```

#### Step 2: Deploy Admin App

```bash
cd apps/admin

# Set environment variables
export CLOUDFLARE_BUILD=1
export NEXT_PUBLIC_SUPABASE_URL=your-url
# ... set all other required env vars

# Build
pnpm build:cloudflare

# Deploy
wrangler pages deploy .vercel/output/static --project-name=ibimina-admin
```

#### Step 3: Deploy Client App

```bash
cd apps/client

# Set environment variables
export CLOUDFLARE_BUILD=1
export NEXT_PUBLIC_SUPABASE_URL=your-url
# ... set all other required env vars

# Build
pnpm build:cloudflare

# Deploy
wrangler pages deploy .vercel/output/static --project-name=ibimina-client
```

### Option 3: Cloudflare Dashboard Git Integration

1. Go to Cloudflare Dashboard → Pages
2. Click "Create application" → "Connect to Git"
3. Select your repository
4. Configure build settings:

**For Admin App:**

- Build command:
  `pnpm install --frozen-lockfile && pnpm --filter @ibimina/admin build:cloudflare`
- Build output directory: `apps/admin/.vercel/output/static`
- Root directory: `/` (monorepo root)

**For Client App:**

- Build command:
  `pnpm install --frozen-lockfile && pnpm --filter @ibimina/client build:cloudflare`
- Build output directory: `apps/client/.vercel/output/static`
- Root directory: `/` (monorepo root)

5. Add environment variables (see GitHub secrets list above)
6. Deploy

## Post-Deployment Configuration

### Step 1: Configure Custom Domains

In Cloudflare Dashboard → Pages → [Project] → Custom domains:

- Admin: `adminsacco.ikanisa.com`
- Staff: `saccostaff.ikanisa.com`
- Client: `sacco.ikanisa.com`

### Step 2: Update Supabase Configuration

Go to Supabase Dashboard → Authentication → URL Configuration

Add these URLs:

**Site URL:**

```
https://adminsacco.ikanisa.com
https://saccostaff.ikanisa.com
https://sacco.ikanisa.com
```

**Redirect URLs:**

```
https://adminsacco.ikanisa.com/auth/callback
https://saccostaff.ikanisa.com/auth/callback
https://sacco.ikanisa.com/auth/callback
```

**CORS Allowed Origins:**

```
https://adminsacco.ikanisa.com
https://saccostaff.ikanisa.com
https://sacco.ikanisa.com
```

### Step 3: Configure Environment Variables in Cloudflare

For each project, go to Settings → Environment variables

Add all required variables for both Production and Preview environments.

## Verification

### Health Checks

```bash
# Admin app
curl https://adminsacco.ikanisa.com/api/healthz

# Client app
curl https://sacco.ikanisa.com/api/health
```

Expected response: `200 OK` with JSON

### PWA Verification

1. Open app in browser
2. Check DevTools → Application → Manifest
3. Check DevTools → Application → Service Workers
4. Test offline mode (DevTools → Network → Offline)
5. Try installing PWA (install prompt should appear)

### Lighthouse Audit

```bash
# Run Lighthouse
lighthouse https://adminsacco.ikanisa.com --only-categories=performance,pwa,accessibility
lighthouse https://sacco.ikanisa.com --only-categories=performance,pwa,accessibility
```

Target scores:

- Performance: > 90
- PWA: > 90
- Accessibility: > 90

### Security Headers

```bash
curl -I https://adminsacco.ikanisa.com | grep -E "Content-Security-Policy|X-Frame-Options|Strict-Transport-Security"
```

Should see:

- Content-Security-Policy header
- X-Frame-Options: SAMEORIGIN
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options: nosniff

## Monitoring

### Cloudflare Analytics

- Access via Dashboard → Pages → [Project] → Analytics
- Monitor:
  - Page views
  - Unique visitors
  - Requests
  - Bandwidth
  - Error rates

### Error Tracking

If Sentry is configured:

- Check error rates in Sentry dashboard
- Set up alerts for critical errors

### Performance Monitoring

- Use Cloudflare Web Analytics
- Monitor Core Web Vitals
- Set up alerts for performance degradation

## Troubleshooting

### Build Fails

**Issue**: Workspace packages not found

**Solution**: Ensure packages are built first or transpiled:

```bash
# Build required packages
pnpm run build:packages

# Or use transpilePackages in next.config.ts (already configured)
```

**Issue**: Environment variables missing

**Solution**: Check all required variables are set:

```bash
bash scripts/validate-pwa-cloudflare.sh
```

### PWA Not Installing

**Issue**: Install prompt doesn't appear

**Check**:

1. Is the app served over HTTPS?
2. Is the manifest.json accessible?
3. Is the service worker registering?
4. Check browser console for errors

**Solution**: Verify manifest and service worker paths in next.config.ts

### Service Worker Errors

**Issue**: Service worker fails to register

**Check**: Browser console and Network tab for errors

**Solution**:

1. Ensure service worker is being built
2. Check CLOUDFLARE_BUILD=1 is set during build
3. Verify workbox dependencies are installed

### Deployment Succeeds But Site Doesn't Load

**Issue**: White screen or 500 error

**Check**: Cloudflare Pages logs

**Solution**:

1. Verify all environment variables are set in Cloudflare
2. Check build output directory is correct
3. Ensure nodejs_compat flag is set in wrangler.toml

## Rollback Procedure

If deployment fails or causes issues:

### Via Cloudflare Dashboard

1. Go to Pages → [Project] → Deployments
2. Find the previous working deployment
3. Click "..." menu → "Rollback to this deployment"

### Via Git

```bash
# Revert the problematic commit
git revert <commit-hash>
git push origin main

# Or create a hotfix from previous working commit
git checkout <working-commit-hash>
git checkout -b hotfix/rollback
git push origin hotfix/rollback
```

### Manual Redeployment

```bash
# Checkout working commit
git checkout <working-commit-hash>

# Deploy using wrangler
cd apps/admin
wrangler pages deploy .vercel/output/static --project-name=ibimina-admin
```

## Maintenance

### Regular Tasks

1. **Weekly**: Check error rates and performance metrics
2. **Monthly**: Review and rotate secrets (security keys)
3. **Quarterly**: Update dependencies and test deployments
4. **Annually**: Review and update SSL certificates

### Updating Dependencies

```bash
# Update Cloudflare packages
pnpm update @cloudflare/next-on-pages wrangler @cloudflare/workers-types

# Update Next.js
pnpm update next

# Test locally before deploying
pnpm run validate:cloudflare
```

### Scaling

Cloudflare Pages automatically scales. Monitor:

- Request rates
- Bandwidth usage
- Error rates
- Response times

If you exceed free tier limits, upgrade to paid plan in Cloudflare dashboard.

## Support

### Documentation

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js Docs](https://nextjs.org/docs)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

### Scripts

- `pnpm validate:cloudflare` - Validate Cloudflare setup
- `bash scripts/validate-pwa-cloudflare.sh` - Validate PWA configuration

### Getting Help

1. Check logs in Cloudflare Dashboard
2. Review TROUBLESHOOTING.md
3. Check GitHub issues
4. Contact Cloudflare support

## Appendix

### Environment Variables Reference

See `.env.cloudflare.template` for complete list with descriptions.

### Wrangler Configuration

See `apps/admin/wrangler.toml` and `apps/client/wrangler.toml` for configuration
details.

### CI/CD Workflow

See `.github/workflows/deploy-cloudflare.yml` for automated deployment
configuration.

# Cloudflare Pages Deployment Guide

This guide covers deploying all three Ibimina applications to Cloudflare Pages:

- **Client App** (Mobile): `sacco.ikanisa.com`
- **Staff App**: `saccostaff.ikanisa.com`
- **Admin Panel**: `adminsacco.ikanisa.com`

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development & Testing](#local-development--testing)
- [Cloudflare Pages Deployment](#cloudflare-pages-deployment)
- [Custom Domain Configuration](#custom-domain-configuration)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js** v20.x or higher

   ```bash
   node --version  # Should be >= 20.0.0
   ```

2. **pnpm** v10.19.0 (exact version)

   ```bash
   npm install -g pnpm@10.19.0
   pnpm --version
   ```

3. **Wrangler CLI** (Cloudflare's CLI tool)
   ```bash
   npm install -g wrangler
   wrangler --version
   ```

### Cloudflare Account Requirements

1. **Cloudflare Account** with Pages enabled
2. **Domain configured** in Cloudflare DNS (ikanisa.com)
3. **API Token** with the following permissions:
   - Account > Cloudflare Pages > Edit
   - Zone > DNS > Edit
   - Zone > Zone > Read

### External Services

- **Supabase Project**: PostgreSQL database, auth, storage, and edge functions
- **OpenAI API Key**: For AI-powered features (optional)
- **SMTP/Email Service**: For notifications (Resend recommended)

## Environment Setup

### 1. Generate Required Secrets

First, generate all required cryptographic secrets:

```bash
# Generate all secrets at once
export BACKUP_PEPPER=$(openssl rand -hex 32)
export MFA_SESSION_SECRET=$(openssl rand -hex 32)
export TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
export HMAC_SHARED_SECRET=$(openssl rand -hex 32)
export KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)
export ANALYTICS_CACHE_TOKEN=$(openssl rand -hex 32)
export REPORT_SIGNING_KEY=$(openssl rand -hex 32)

# Save these values securely - you'll need them for Cloudflare
echo "BACKUP_PEPPER=$BACKUP_PEPPER"
echo "MFA_SESSION_SECRET=$MFA_SESSION_SECRET"
echo "TRUSTED_COOKIE_SECRET=$TRUSTED_COOKIE_SECRET"
echo "HMAC_SHARED_SECRET=$HMAC_SHARED_SECRET"
echo "KMS_DATA_KEY_BASE64=$KMS_DATA_KEY_BASE64"
echo "ANALYTICS_CACHE_TOKEN=$ANALYTICS_CACHE_TOKEN"
echo "REPORT_SIGNING_KEY=$REPORT_SIGNING_KEY"
```

### 2. Environment Variables for Each App

#### Admin App Environment Variables

Create these in Cloudflare Pages dashboard for the **ibimina-admin** project:

**Build Environment Variables** (used during build):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security keys (generated above)
BACKUP_PEPPER=your-backup-pepper
MFA_SESSION_SECRET=your-mfa-session-secret
TRUSTED_COOKIE_SECRET=your-trusted-cookie-secret
HMAC_SHARED_SECRET=your-hmac-shared-secret
KMS_DATA_KEY_BASE64=your-kms-key-base64

# OpenAI (optional)
OPENAI_API_KEY=sk-your-openai-key
OPENAI_RESPONSES_MODEL=gpt-4o-mini

# Additional configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
APP_ENV=production
```

**Runtime Environment Variables** (for deployed site):

```bash
# MFA Configuration
MFA_RP_ID=adminsacco.ikanisa.com
MFA_ORIGIN=https://adminsacco.ikanisa.com
MFA_RP_NAME=SACCO+ Admin Console

# Email Configuration
MFA_EMAIL_FROM=security@ikanisa.com
MFA_EMAIL_LOCALE=en
MAIL_FROM=SACCO+ <noreply@ikanisa.com>

# Observability (optional)
LOG_DRAIN_URL=https://your-log-drain.com
LOG_DRAIN_TOKEN=your-token
LOG_DRAIN_SOURCE=admin-app
```

#### Staff App Environment Variables

Create these for the **ibimina-staff** project (same as admin with different
domain):

```bash
# Same as Admin App, but update these:
MFA_RP_ID=saccostaff.ikanisa.com
MFA_ORIGIN=https://saccostaff.ikanisa.com
MFA_RP_NAME=SACCO+ Staff Console
LOG_DRAIN_SOURCE=staff-app
```

#### Client App Environment Variables

Create these for the **ibimina-client** project:

```bash
# Supabase (same as admin)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security keys (same as admin)
BACKUP_PEPPER=your-backup-pepper
MFA_SESSION_SECRET=your-mfa-session-secret
TRUSTED_COOKIE_SECRET=your-trusted-cookie-secret
HMAC_SHARED_SECRET=your-hmac-shared-secret
KMS_DATA_KEY_BASE64=your-kms-key-base64

# Web Push Notifications (generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:support@ikanisa.com

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAG_WEB_PUSH=true
NEXT_PUBLIC_FEATURE_FLAG_BETA_FEATURES=false

# OpenAI (optional)
OPENAI_API_KEY=sk-your-openai-key

# Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
APP_ENV=production
```

## Local Development & Testing

### 1. Install Dependencies

```bash
# From repository root
pnpm install --frozen-lockfile
```

### 2. Test Cloudflare Build Locally

#### Admin/Staff App

```bash
# Build for Cloudflare
cd apps/admin
pnpm build:cloudflare

# Preview locally (requires wrangler.toml)
pnpm preview:cloudflare

# Access at: http://localhost:8788
```

#### Client App

```bash
# Build for Cloudflare
cd apps/client
pnpm build:cloudflare

# Preview locally
pnpm preview:cloudflare

# Access at: http://localhost:8789
```

### 3. Verify Build Output

The build should create a `.vercel/output/static` directory with:

- Static assets
- Edge functions (API routes converted to Cloudflare Workers)
- Routing configuration

```bash
# Check build output
ls -la .vercel/output/static/
```

## Cloudflare Pages Deployment

### Option 1: Manual Deployment via Wrangler CLI

#### First-Time Setup

1. **Authenticate with Cloudflare**:

   ```bash
   wrangler login
   ```

2. **Create Pages Projects**:

   For Admin App:

   ```bash
   cd apps/admin
   wrangler pages project create ibimina-admin
   ```

   For Staff App:

   ```bash
   cd apps/admin
   wrangler pages project create ibimina-staff --config wrangler.staff.toml
   ```

   For Client App:

   ```bash
   cd apps/client
   wrangler pages project create ibimina-client
   ```

3. **Configure Environment Variables**:

   Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment
   Variables

   Add all variables listed in [Environment Setup](#environment-setup) section.

#### Deploy

```bash
# From repository root

# Deploy Admin App
cd apps/admin
pnpm build:cloudflare
pnpm deploy:cloudflare

# Deploy Staff App (uses same build, different config)
wrangler pages deploy .vercel/output/static --project-name ibimina-staff

# Deploy Client App
cd ../client
pnpm build:cloudflare
pnpm deploy:cloudflare
```

### Option 2: GitHub Integration (Recommended)

1. **Connect Repository to Cloudflare Pages**:
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project" → "Connect to Git"
   - Select your GitHub repository
   - Authorize Cloudflare

2. **Configure Build Settings** for each app:

   **Admin App** (`ibimina-admin`):
   - **Framework preset**: Next.js
   - **Build command**:
     `pnpm install --frozen-lockfile && pnpm --filter @ibimina/admin build:cloudflare`
   - **Build output directory**: `apps/admin/.vercel/output/static`
   - **Root directory**: `/` (monorepo root)
   - **Branch**: `main`

   **Staff App** (`ibimina-staff`):
   - Same as Admin App (uses same codebase)

   **Client App** (`ibimina-client`):
   - **Framework preset**: Next.js
   - **Build command**:
     `pnpm install --frozen-lockfile && pnpm --filter @ibimina/client build:cloudflare`
   - **Build output directory**: `apps/client/.vercel/output/static`
   - **Root directory**: `/` (monorepo root)
   - **Branch**: `main`

3. **Add Environment Variables** in Cloudflare Dashboard for each project

4. **Trigger Deployment**:
   - Push to `main` branch
   - Or manually trigger in Cloudflare Dashboard

## Custom Domain Configuration

### 1. Add Custom Domains in Cloudflare Pages

For each Pages project:

1. Go to Cloudflare Dashboard → Pages → [Project] → Custom domains
2. Click "Set up a custom domain"
3. Enter the domain:
   - Admin: `adminsacco.ikanisa.com`
   - Staff: `saccostaff.ikanisa.com`
   - Client: `sacco.ikanisa.com`
4. Cloudflare will automatically create DNS records

### 2. Verify DNS Records

Go to Cloudflare Dashboard → DNS → Records and verify:

```
CNAME adminsacco.ikanisa.com → ibimina-admin.pages.dev
CNAME saccostaff.ikanisa.com → ibimina-staff.pages.dev
CNAME sacco.ikanisa.com → ibimina-client.pages.dev
```

### 3. Enable HTTPS

Cloudflare Pages automatically provisions SSL certificates. Verify:

1. Go to Pages → [Project] → Custom domains
2. Wait for SSL status to show "Active"
3. Test: `https://adminsacco.ikanisa.com/api/healthz`

### 4. Update Supabase Configuration

Add the custom domains to Supabase:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to **Site URL** and **Redirect URLs**:
   ```
   https://adminsacco.ikanisa.com
   https://saccostaff.ikanisa.com
   https://sacco.ikanisa.com
   ```
3. Add to **Additional Redirect URLs**:
   ```
   https://adminsacco.ikanisa.com/auth/callback
   https://saccostaff.ikanisa.com/auth/callback
   https://sacco.ikanisa.com/auth/callback
   ```

## CI/CD with GitHub Actions

### Option 1: Use Cloudflare's Git Integration

The simplest approach - Cloudflare automatically deploys on push to configured
branch.

### Option 2: Manual GitHub Actions Workflow

Create `.github/workflows/deploy-cloudflare.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-admin:
    name: Deploy Admin App
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.19.0

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build for Cloudflare
        run: pnpm --filter @ibimina/admin build:cloudflare
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          # Add all other required env vars from secrets

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: ibimina-admin
          directory: apps/admin/.vercel/output/static
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

  deploy-staff:
    name: Deploy Staff App
    runs-on: ubuntu-latest
    steps:
      # Same as admin but with projectName: ibimina-staff

  deploy-client:
    name: Deploy Client App
    runs-on: ubuntu-latest
    steps:
      # Similar to admin but for client app
```

### Required GitHub Secrets

Add these to GitHub → Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- All other sensitive environment variables

## Post-Deployment Verification

### 1. Health Check Endpoints

Verify all apps are running:

```bash
# Admin App
curl https://adminsacco.ikanisa.com/api/healthz

# Staff App
curl https://saccostaff.ikanisa.com/api/healthz

# Client App
curl https://sacco.ikanisa.com/api/health
```

Expected response: `200 OK` with JSON body

### 2. PWA Verification

Test Progressive Web App functionality:

1. Open each app in browser
2. Check for "Install" prompt
3. Verify offline functionality (Network tab → Offline)
4. Test service worker registration:
   ```javascript
   navigator.serviceWorker.getRegistrations();
   ```

### 3. Authentication Flow

Test complete auth flow:

1. Navigate to login page
2. Attempt to sign in with test credentials
3. Verify MFA challenge appears
4. Complete authentication
5. Check that session persists on refresh

### 4. Security Headers

Verify security headers are set:

```bash
curl -I https://adminsacco.ikanisa.com | grep -E "Content-Security-Policy|X-Frame-Options|Strict-Transport-Security"
```

### 5. Performance Check

Run Lighthouse audit:

```bash
lighthouse https://adminsacco.ikanisa.com --only-categories=performance,pwa
```

Target scores:

- Performance: > 90
- PWA: > 90

## Troubleshooting

### Build Failures

#### Error: "Module not found"

**Cause**: Missing dependencies or incorrect build path

**Solution**:

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile

# Verify build locally
pnpm build:cloudflare
```

#### Error: "Environment variable required"

**Cause**: Missing required environment variables

**Solution**:

1. Check `.env.example` for all required variables
2. Verify all variables are set in Cloudflare Pages dashboard
3. Rebuild after adding variables

### Runtime Errors

#### Error: "fetch is not defined"

**Cause**: Node.js APIs not available in edge runtime

**Solution**: Ensure `nodejs_compat` flag is enabled in `wrangler.toml`

#### Error: "Supabase connection failed"

**Cause**: Incorrect Supabase URL or missing CORS configuration

**Solution**:

1. Verify `NEXT_PUBLIC_SUPABASE_URL` in Cloudflare dashboard
2. Add custom domains to Supabase CORS settings
3. Check Supabase service status

### Performance Issues

#### Slow Initial Load

**Cause**: Large bundle size or unoptimized images

**Solution**:

```bash
# Analyze bundle
ANALYZE_BUNDLE=1 pnpm build

# Check bundle budgets
pnpm --filter @ibimina/admin assert:bundle
```

#### Service Worker Not Registering

**Cause**: Incorrect service worker path or CSP headers

**Solution**:

1. Verify `/service-worker.js` is accessible
2. Check Content-Security-Policy allows service worker
3. Test in Incognito/Private mode

### Domain Issues

#### SSL Certificate Not Provisioning

**Cause**: DNS not properly configured or CAA records blocking

**Solution**:

1. Verify CNAME records are correct
2. Wait 24 hours for propagation
3. Check Cloudflare SSL/TLS mode is "Full" or "Full (strict)"

#### 404 on Custom Domain

**Cause**: Domain not properly attached to Pages project

**Solution**:

1. Re-add custom domain in Cloudflare Pages
2. Verify DNS records in Cloudflare DNS dashboard
3. Clear browser cache and retry

## Rollback Procedure

If deployment fails or issues are detected:

### 1. Quick Rollback via Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Pages → [Project] → Deployments
2. Find the last stable deployment
3. Click "⋯" → "Rollback to this deployment"

### 2. Rollback via Wrangler CLI

```bash
# List deployments
wrangler pages deployment list --project-name ibimina-admin

# Rollback to specific deployment
wrangler pages deployment rollback <DEPLOYMENT_ID> --project-name ibimina-admin
```

### 3. Rollback via Git

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Cloudflare will auto-deploy the reverted version
```

## Monitoring and Observability

### Cloudflare Analytics

View real-time metrics:

- Cloudflare Dashboard → Analytics → [Project]
- Metrics: Requests, bandwidth, errors, latency

### Custom Metrics

The apps send metrics to configured log drain:

```bash
# Check log drain is working
pnpm --filter @ibimina/admin verify:log-drain
```

### Alerts

Set up alerts in Cloudflare Dashboard → Notifications:

- High error rate
- Increased latency
- Traffic spikes

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Supabase Documentation](https://supabase.com/docs)

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section above
2. Review existing documentation in `docs/`
3. Contact the development team
4. Open an issue in the repository

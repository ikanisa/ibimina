# Deploy Staff/Admin PWA to Cloudflare Pages - Quick Start

This guide provides step-by-step instructions to deploy the Staff/Admin PWA to Cloudflare Pages **right now**.

## Prerequisites Check

Before starting, ensure you have:

- [ ] **Cloudflare Account** with Pages access
- [ ] **Domain** configured in Cloudflare (ikanisa.com)
- [ ] **Cloudflare API Token** with Pages write permissions
- [ ] **Cloudflare Account ID** from your dashboard
- [ ] **Supabase Project** credentials (URL, anon key, service role key)
- [ ] **Node.js v20.x** or higher installed
- [ ] **pnpm 10.19.0** installed
- [ ] **Git** repository cloned locally

## Option 1: Automated Deployment (Recommended)

### Step 1: Generate Required Secrets (One-Time Setup)

```bash
# Run this once and save the output securely
echo "BACKUP_PEPPER=$(openssl rand -hex 32)"
echo "MFA_SESSION_SECRET=$(openssl rand -hex 32)"
echo "TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)"
echo "HMAC_SHARED_SECRET=$(openssl rand -hex 32)"
echo "KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)"
```

### Step 2: Set Environment Variables

Create a file `.env.production.local` in the repository root (or export in your shell):

```bash
# Supabase (required)
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Security keys (from Step 1)
export BACKUP_PEPPER="your-generated-backup-pepper"
export MFA_SESSION_SECRET="your-generated-mfa-session-secret"
export TRUSTED_COOKIE_SECRET="your-generated-trusted-cookie-secret"
export HMAC_SHARED_SECRET="your-generated-hmac-shared-secret"
export KMS_DATA_KEY_BASE64="your-generated-kms-data-key"

# OpenAI (optional but recommended)
export OPENAI_API_KEY="sk-your-openai-api-key"

# Cloudflare credentials
export CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
```

### Step 3: Run Deployment Script

```bash
# Navigate to repository root
cd /path/to/ibimina

# Install dependencies (if not already done)
pnpm install --frozen-lockfile

# Option A: Deploy both admin and staff (recommended)
./scripts/deploy-to-cloudflare.sh

# Option B: Deploy only admin
./scripts/deploy-to-cloudflare.sh --app admin

# Option C: Deploy only staff
./scripts/deploy-to-cloudflare.sh --app staff

# Option D: Dry run (test without deploying)
./scripts/deploy-to-cloudflare.sh --dry-run
```

### Step 4: Configure Custom Domains in Cloudflare

After deployment, set up custom domains:

1. Go to **Cloudflare Dashboard** → **Pages**
2. Select **ibimina-admin** project
3. Go to **Custom domains** tab
4. Add domain: `adminsacco.ikanisa.com`
5. Repeat for **ibimina-staff** project with: `saccostaff.ikanisa.com`

Cloudflare will automatically provision SSL certificates and configure DNS.

### Step 5: Configure Environment Variables in Cloudflare (Important!)

Even after deployment, you must configure environment variables in Cloudflare:

1. Go to **Cloudflare Dashboard** → **Pages** → **[Project]**
2. Navigate to **Settings** → **Environment variables**
3. Add all variables from Step 2 for both **Production** and **Preview** environments
4. **Important**: Different values for admin vs staff:
   - Admin: `MFA_RP_ID=adminsacco.ikanisa.com`, `MFA_ORIGIN=https://adminsacco.ikanisa.com`
   - Staff: `MFA_RP_ID=saccostaff.ikanisa.com`, `MFA_ORIGIN=https://saccostaff.ikanisa.com`

### Step 6: Verify Deployment

```bash
# Check admin health
curl https://adminsacco.ikanisa.com/api/healthz

# Check staff health  
curl https://saccostaff.ikanisa.com/api/healthz

# Both should return 200 OK
```

---

## Option 2: GitHub Actions Deployment

If you prefer automated deployment via GitHub Actions:

### Step 1: Configure GitHub Secrets

Go to **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
BACKUP_PEPPER
MFA_SESSION_SECRET
TRUSTED_COOKIE_SECRET
HMAC_SHARED_SECRET
KMS_DATA_KEY_BASE64
OPENAI_API_KEY
```

Optional (if using AWS Secrets Manager):
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_SECRETSMANAGER_SECRET_ID
```

Optional (if using Sentry):
```
SENTRY_DSN_ADMIN
NEXT_PUBLIC_SENTRY_DSN_ADMIN
```

### Step 2: Trigger Deployment

**Option A: Automatic** - Push to main branch:
```bash
git push origin main
```

**Option B: Manual** - Trigger workflow:
1. Go to **Actions** tab in GitHub
2. Select **Deploy to Cloudflare Pages** workflow
3. Click **Run workflow**
4. Select which app to deploy (all/admin/staff)
5. Click **Run workflow** button

### Step 3: Monitor Deployment

1. Go to **Actions** tab to see workflow progress
2. Click on the running workflow to see detailed logs
3. Verify deployment in **Cloudflare Dashboard** → **Pages**

---

## Option 3: Manual Deployment with Wrangler

For complete manual control:

### Step 1: Authenticate with Cloudflare

```bash
# Login to Cloudflare
pnpm exec wrangler login

# Or use API token
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
```

### Step 2: Build the App

```bash
cd apps/admin

# Set all required environment variables (see Option 1, Step 2)
export CLOUDFLARE_BUILD=1
export NODE_ENV=production
# ... (set all other env vars)

# Build for Cloudflare
pnpm build:cloudflare
```

### Step 3: Deploy

```bash
# Deploy admin app
pnpm exec wrangler pages deploy .vercel/output/static \
  --project-name=ibimina-admin \
  --branch=main

# Deploy staff app (same build, different project)
pnpm exec wrangler pages deploy .vercel/output/static \
  --project-name=ibimina-staff \
  --branch=main
```

---

## Post-Deployment Configuration

### 1. Update Supabase Settings

Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**

Add these URLs:

**Site URLs:**
```
https://adminsacco.ikanisa.com
https://saccostaff.ikanisa.com
```

**Redirect URLs:**
```
https://adminsacco.ikanisa.com/auth/callback
https://saccostaff.ikanisa.com/auth/callback
```

### 2. Test Authentication Flow

1. Visit https://adminsacco.ikanisa.com
2. Try signing in with test credentials
3. Verify MFA challenge appears
4. Complete authentication
5. Verify dashboard loads correctly

### 3. Enable Monitoring

Set up monitoring in Cloudflare Dashboard:

1. Go to **Analytics** → **Web Analytics**
2. Enable analytics for your site
3. Configure alerts for:
   - High error rates
   - Increased latency
   - Traffic spikes

---

## Troubleshooting

### Build Fails with "Environment variable not set"

**Solution:** Ensure all required environment variables are exported before running the build command. See `.env.cloudflare.template` for the complete list.

### Deployment Fails with "Authentication error"

**Solution:** 
1. Run `pnpm exec wrangler whoami` to verify authentication
2. If not authenticated, run `pnpm exec wrangler login`
3. Or set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` environment variables

### Site Shows 500 Error After Deployment

**Solution:**
1. Check Cloudflare Pages logs in the dashboard
2. Verify all environment variables are set in Cloudflare (not just locally)
3. Ensure `nodejs_compat` flag is enabled in wrangler.toml
4. Check build output directory is correct: `.vercel/output/static`

### Authentication Doesn't Work

**Solution:**
1. Verify Supabase redirect URLs are configured correctly
2. Check that `MFA_RP_ID` and `MFA_ORIGIN` match your domain
3. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
4. Verify cookies are not being blocked by browser

### Custom Domain Not Working

**Solution:**
1. Verify domain is added to Cloudflare (Websites section)
2. Check DNS is pointing to Cloudflare nameservers
3. Add custom domain in Pages project settings
4. Wait for SSL certificate provisioning (can take up to 24 hours)

---

## Verification Checklist

After deployment, verify:

- [ ] Site loads at https://adminsacco.ikanisa.com
- [ ] Site loads at https://saccostaff.ikanisa.com
- [ ] Health endpoint returns 200: `/api/healthz`
- [ ] Can access login page
- [ ] Authentication flow works
- [ ] MFA challenge appears and works
- [ ] Dashboard loads after login
- [ ] PWA install prompt appears
- [ ] Service worker registers successfully
- [ ] Offline mode works (test in DevTools)
- [ ] No console errors
- [ ] Security headers are present (check with browser DevTools)
- [ ] Lighthouse PWA score > 90

---

## Rollback Procedure

If deployment causes issues:

### Via Cloudflare Dashboard

1. Go to **Pages** → **[Project]** → **Deployments**
2. Find the last working deployment
3. Click **...** menu → **Rollback to this deployment**

### Via Git

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or redeploy specific commit
git checkout <working-commit-hash>
./scripts/deploy-to-cloudflare.sh
```

---

## Next Steps After Successful Deployment

1. **Monitor Performance**: Watch Cloudflare Analytics for the first 24 hours
2. **Test Thoroughly**: Run through all critical user flows
3. **Update Documentation**: Document any deployment-specific configurations
4. **Set Up Alerts**: Configure Cloudflare alerts for errors and performance
5. **Plan Maintenance**: Schedule regular dependency updates and security patches

---

## Support and Resources

- **Deployment Checklist**: `CLOUDFLARE_DEPLOYMENT_CHECKLIST.md`
- **Full Documentation**: `PWA_CLOUDFLARE_DEPLOYMENT.md`
- **Environment Template**: `.env.cloudflare.template`
- **Validation Script**: `scripts/validate-pwa-cloudflare.sh`
- **GitHub Workflow**: `.github/workflows/deploy-cloudflare.yml`
- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler/

---

## Quick Command Reference

```bash
# Build locally
cd apps/admin && CLOUDFLARE_BUILD=1 pnpm build:cloudflare

# Preview locally
cd apps/admin && pnpm preview:cloudflare

# Deploy (automated)
./scripts/deploy-to-cloudflare.sh

# Deploy (manual)
cd apps/admin && pnpm deploy:cloudflare

# Check wrangler auth
pnpm exec wrangler whoami

# View deployments
pnpm exec wrangler pages deployment list --project-name=ibimina-admin

# Validate setup
bash scripts/validate-pwa-cloudflare.sh
```

---

**Last Updated**: November 4, 2025  
**Status**: ✅ Ready for deployment

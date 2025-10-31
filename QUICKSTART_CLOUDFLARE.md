# Quick Start: Deploy to Cloudflare Pages

This is a condensed guide for experienced developers. For complete
documentation, see
[`docs/CLOUDFLARE_DEPLOYMENT.md`](docs/CLOUDFLARE_DEPLOYMENT.md).

## Prerequisites

```bash
# Install tools
npm install -g pnpm@10.19.0 wrangler

# Clone and install dependencies
git clone <repo-url>
cd ibimina
pnpm install --frozen-lockfile
```

## 1. Generate Secrets (5 minutes)

```bash
# Generate all required secrets
export BACKUP_PEPPER=$(openssl rand -hex 32)
export MFA_SESSION_SECRET=$(openssl rand -hex 32)
export TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
export HMAC_SHARED_SECRET=$(openssl rand -hex 32)
export KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)

# For client app web push
npx web-push generate-vapid-keys

# Save all values securely - you'll need them in Cloudflare
```

## 2. Cloudflare Setup (10 minutes)

### Create Projects

```bash
wrangler login

# Create projects
cd apps/admin && wrangler pages project create ibimina-admin
cd ../client && wrangler pages project create ibimina-client
```

### Add Environment Variables

Go to: **Cloudflare Dashboard → Pages → [Project] → Settings → Environment
Variables**

**Required for all apps:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BACKUP_PEPPER=<from step 1>
MFA_SESSION_SECRET=<from step 1>
TRUSTED_COOKIE_SECRET=<from step 1>
HMAC_SHARED_SECRET=<from step 1>
KMS_DATA_KEY_BASE64=<from step 1>
OPENAI_API_KEY=sk-your-key
NODE_ENV=production
```

**Admin/Staff specific:**

```bash
MFA_RP_ID=adminsacco.ikanisa.com  # or saccostaff.ikanisa.com
MFA_ORIGIN=https://adminsacco.ikanisa.com
MFA_RP_NAME=SACCO+ Admin Console
```

**Client specific:**

```bash
MFA_RP_ID=sacco.ikanisa.com
MFA_ORIGIN=https://sacco.ikanisa.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<from step 1>
VAPID_PRIVATE_KEY=<from step 1>
```

## 3. Local Build Test (5 minutes)

```bash
# Test admin app
cd apps/admin
pnpm build:cloudflare
pnpm preview:cloudflare  # Visit http://localhost:8788

# Test client app
cd apps/client
pnpm build:cloudflare
pnpm preview:cloudflare  # Visit http://localhost:8789
```

## 4. Deploy (2 minutes per app)

### Option A: Manual Deploy

```bash
# Admin app
cd apps/admin
pnpm build:cloudflare
pnpm deploy:cloudflare

# Staff app (uses admin build)
wrangler pages deploy .vercel/output/static --project-name ibimina-staff

# Client app
cd apps/client
pnpm build:cloudflare
pnpm deploy:cloudflare
```

### Option B: GitHub Actions

1. Add GitHub secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - All environment variables

2. Push to `main` branch - automatic deployment!

## 5. Configure Custom Domains (5 minutes)

In Cloudflare Dashboard → Pages → [Project] → Custom domains:

- Admin: `adminsacco.ikanisa.com`
- Staff: `saccostaff.ikanisa.com`
- Client: `sacco.ikanisa.com`

Cloudflare auto-creates DNS records and SSL certificates.

## 6. Update Supabase (2 minutes)

**Supabase Dashboard → Authentication → URL Configuration:**

Add to Site URL and Redirect URLs:

```
https://adminsacco.ikanisa.com
https://saccostaff.ikanisa.com
https://sacco.ikanisa.com
```

Add callback URLs:

```
https://adminsacco.ikanisa.com/auth/callback
https://saccostaff.ikanisa.com/auth/callback
https://sacco.ikanisa.com/auth/callback
```

## 7. Verify (2 minutes)

```bash
# Health checks
curl https://adminsacco.ikanisa.com/api/healthz
curl https://saccostaff.ikanisa.com/api/healthz
curl https://sacco.ikanisa.com/api/health

# Security headers
curl -I https://adminsacco.ikanisa.com | grep CSP

# PWA
# Open in browser, check for install prompt
```

## Rollback

If issues occur:

```bash
# Via Dashboard: Pages → [Project] → Deployments → ⋯ → Rollback

# Via CLI:
wrangler pages deployment list --project-name ibimina-admin
wrangler pages deployment rollback <ID> --project-name ibimina-admin
```

## Common Issues

**Build fails:** Check all environment variables are set **Auth fails:** Verify
domains in Supabase configuration **SSL pending:** Wait 24 hours for DNS
propagation **404 errors:** Verify custom domain is attached to project

## Total Time: ~30 minutes

From zero to three deployed apps on Cloudflare Pages.

## Next Steps

- [ ] Set up monitoring/alerts
- [ ] Configure preview deployments
- [ ] Test authentication flow
- [ ] Run Lighthouse audits
- [ ] Review logs in Cloudflare Dashboard

## Full Documentation

- **Complete Guide:**
  [`docs/CLOUDFLARE_DEPLOYMENT.md`](docs/CLOUDFLARE_DEPLOYMENT.md)
- **Checklist:**
  [`CLOUDFLARE_DEPLOYMENT_CHECKLIST.md`](CLOUDFLARE_DEPLOYMENT_CHECKLIST.md)
- **Environment Variables:**
  [`.env.cloudflare.template`](.env.cloudflare.template)

# Cloudflare Deployment Checklist

Use this checklist to ensure all prerequisites are met before deploying to
Cloudflare Pages.

## Prerequisites

### 1. Cloudflare Account Setup

- [ ] Cloudflare account created and verified
- [ ] Domain `ikanisa.com` added to Cloudflare
- [ ] DNS records migrated to Cloudflare nameservers
- [ ] API Token created with required permissions:
  - Account > Cloudflare Pages > Edit
  - Zone > DNS > Edit
  - Zone > Zone > Read
- [ ] Account ID retrieved from Cloudflare dashboard

### 2. Dependencies Installed

- [ ] Node.js v20.x or higher installed
- [ ] pnpm v10.19.0 installed globally
- [ ] Wrangler CLI installed: `npm install -g wrangler`
- [ ] All project dependencies installed: `pnpm install --frozen-lockfile`

### 3. Environment Variables Generated

Run these commands and save the output securely:

```bash
export BACKUP_PEPPER=$(openssl rand -hex 32)
export MFA_SESSION_SECRET=$(openssl rand -hex 32)
export TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
export HMAC_SHARED_SECRET=$(openssl rand -hex 32)
export KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)
export ANALYTICS_CACHE_TOKEN=$(openssl rand -hex 32)
export REPORT_SIGNING_KEY=$(openssl rand -hex 32)
```

- [ ] All security keys generated
- [ ] VAPID keys generated for web push: `npx web-push generate-vapid-keys`
- [ ] Keys stored securely (password manager, secrets vault)

### 4. External Services Configured

- [ ] Supabase project created
- [ ] Supabase URL and anon key retrieved
- [ ] Supabase service role key retrieved
- [ ] OpenAI API key obtained (if using AI features)
- [ ] Resend API key obtained (for emails)
- [ ] WhatsApp Business API configured (optional)

## Pre-Deployment Testing

### 5. Local Build Verification

Test each app builds successfully for Cloudflare:

```bash
# Admin App
cd apps/admin
pnpm build:cloudflare
# Verify: .vercel/output/static directory created

# Client App
cd apps/client
pnpm build:cloudflare
# Verify: .vercel/output/static directory created
```

- [ ] Admin app builds without errors
- [ ] Client app builds without errors
- [ ] Build output directories contain expected files
- [ ] No sensitive data in build output

### 6. Local Preview Testing

Test apps work locally with Cloudflare runtime:

```bash
# Admin App
cd apps/admin
pnpm preview:cloudflare
# Visit: http://localhost:8788

# Client App
cd apps/client
pnpm preview:cloudflare
# Visit: http://localhost:8789
```

- [ ] Admin app loads in browser
- [ ] Client app loads in browser
- [ ] No console errors
- [ ] API routes respond correctly
- [ ] Authentication flow works

## Cloudflare Pages Setup

### 7. Create Projects in Cloudflare

#### Admin App (adminsacco.ikanisa.com)

- [ ] Project created: `ibimina-admin`
- [ ] Build command set:
      `pnpm install --frozen-lockfile && pnpm --filter @ibimina/admin build:cloudflare`
- [ ] Build output directory set: `apps/admin/.vercel/output/static`
- [ ] Root directory set: `/` (monorepo root)
- [ ] All environment variables added
- [ ] Production branch set to: `main`

#### Staff App (saccostaff.ikanisa.com)

- [ ] Project created: `ibimina-staff`
- [ ] Build command set:
      `pnpm install --frozen-lockflare && pnpm --filter @ibimina/admin build:cloudflare`
- [ ] Build output directory set: `apps/admin/.vercel/output/static`
- [ ] Root directory set: `/` (monorepo root)
- [ ] All environment variables added (with staff-specific values)
- [ ] Production branch set to: `main`

#### Client App (sacco.ikanisa.com)

- [ ] Project created: `ibimina-client`
- [ ] Build command set:
      `pnpm install --frozen-lockfile && pnpm --filter @ibimina/client build:cloudflare`
- [ ] Build output directory set: `apps/client/.vercel/output/static`
- [ ] Root directory set: `/` (monorepo root)
- [ ] All environment variables added
- [ ] Production branch set to: `main`

### 8. Custom Domains Configuration

- [ ] Admin domain added: `adminsacco.ikanisa.com`
- [ ] Staff domain added: `saccostaff.ikanisa.com`
- [ ] Client domain added: `sacco.ikanisa.com`
- [ ] DNS CNAME records created automatically
- [ ] SSL certificates provisioned (status: Active)
- [ ] All domains accessible via HTTPS

### 9. GitHub Integration (Optional)

If using GitHub Actions for deployment:

- [ ] GitHub secrets added:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - All environment variables from `.env.cloudflare.template`
- [ ] Workflow file reviewed: `.github/workflows/deploy-cloudflare.yml`
- [ ] Test workflow triggered manually
- [ ] Deployments successful

If using Cloudflare Git Integration:

- [ ] Repository connected to Cloudflare
- [ ] Build triggers configured
- [ ] Preview deployments enabled

## Supabase Configuration

### 10. Update Supabase Settings

- [ ] Add custom domains to Site URL:
  ```
  https://adminsacco.ikanisa.com
  https://saccostaff.ikanisa.com
  https://sacco.ikanisa.com
  ```
- [ ] Add redirect URLs:
  ```
  https://adminsacco.ikanisa.com/auth/callback
  https://saccostaff.ikanisa.com/auth/callback
  https://sacco.ikanisa.com/auth/callback
  ```
- [ ] Add to CORS allowed origins:
  ```
  https://adminsacco.ikanisa.com
  https://saccostaff.ikanisa.com
  https://sacco.ikanisa.com
  ```
- [ ] Verify email templates include new domains

## Post-Deployment Verification

### 11. Health Checks

Test all deployment URLs:

```bash
# Admin App
curl https://adminsacco.ikanisa.com/api/healthz
# Expected: 200 OK with JSON response

# Staff App
curl https://saccostaff.ikanisa.com/api/healthz
# Expected: 200 OK with JSON response

# Client App
curl https://sacco.ikanisa.com/api/health
# Expected: 200 OK with JSON response
```

- [ ] Admin app health check passes
- [ ] Staff app health check passes
- [ ] Client app health check passes

### 12. Security Headers Verification

```bash
curl -I https://adminsacco.ikanisa.com | grep -E "Content-Security-Policy|X-Frame-Options|Strict-Transport-Security"
```

- [ ] Content-Security-Policy header present
- [ ] X-Frame-Options set to SAMEORIGIN
- [ ] Strict-Transport-Security header present (HSTS)
- [ ] X-Content-Type-Options set to nosniff

### 13. PWA Functionality

- [ ] Admin app shows install prompt
- [ ] Client app shows install prompt
- [ ] Service workers register successfully
- [ ] Offline mode works (test in DevTools Network → Offline)
- [ ] App manifests load correctly

### 14. Authentication Flow

- [ ] Can access login page
- [ ] Can sign in with test credentials
- [ ] MFA challenge appears
- [ ] Can complete MFA flow
- [ ] Session persists on page refresh
- [ ] Can sign out successfully

### 15. Performance Testing

Run Lighthouse audits:

```bash
lighthouse https://adminsacco.ikanisa.com --only-categories=performance,pwa
lighthouse https://sacco.ikanisa.com --only-categories=performance,pwa
```

- [ ] Admin app Performance score > 90
- [ ] Admin app PWA score > 90
- [ ] Client app Performance score > 90
- [ ] Client app PWA score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s

### 16. Monitoring Setup

- [ ] Cloudflare Analytics enabled for all projects
- [ ] Custom metrics dashboard configured
- [ ] Error tracking enabled
- [ ] Alert notifications configured:
  - High error rate
  - Increased latency
  - Traffic spikes
- [ ] Log drain verified: `pnpm --filter @ibimina/admin verify:log-drain`

## Production Readiness

### 17. Documentation

- [ ] Deployment guide reviewed: `docs/CLOUDFLARE_DEPLOYMENT.md`
- [ ] Environment variables documented: `.env.cloudflare.template`
- [ ] Team trained on deployment procedures
- [ ] Rollback procedures documented and tested
- [ ] Incident response plan created

### 18. Backup & Recovery

- [ ] Database backup strategy confirmed
- [ ] Backup restoration tested
- [ ] Rollback procedure documented
- [ ] Contact information for on-call support

### 19. Compliance & Legal

- [ ] Privacy policy updated with new domains
- [ ] Terms of service reviewed
- [ ] Cookie consent working correctly
- [ ] GDPR compliance verified
- [ ] Data retention policies implemented

## Go-Live Checklist

### 20. Final Checks

- [ ] All team members notified of go-live
- [ ] Support team briefed on new deployment
- [ ] Monitoring dashboard open and ready
- [ ] Rollback plan reviewed and ready
- [ ] Communication plan for any issues

### 21. DNS Cutover (If applicable)

If migrating from existing deployment:

- [ ] DNS TTL reduced 24 hours before cutover
- [ ] Old deployment still accessible as backup
- [ ] DNS records updated to point to Cloudflare Pages
- [ ] Wait for DNS propagation (check with: `dig adminsacco.ikanisa.com`)
- [ ] Verify old deployment no longer receiving traffic

### 22. Post-Launch Monitoring

First 24 hours:

- [ ] Monitor error rates in Cloudflare dashboard
- [ ] Check application logs for issues
- [ ] Verify authentication working for real users
- [ ] Monitor performance metrics
- [ ] Check for any user-reported issues

First week:

- [ ] Review analytics for unusual patterns
- [ ] Check Supabase usage limits
- [ ] Verify all scheduled jobs running
- [ ] Review costs and optimize if needed

## Troubleshooting Reference

If issues occur, refer to:

- `docs/CLOUDFLARE_DEPLOYMENT.md` - Troubleshooting section
- `docs/TROUBLESHOOTING.md` - General troubleshooting
- Cloudflare Support: https://dash.cloudflare.com/support
- Supabase Support: https://supabase.com/support

## Sign-Off

- [ ] Technical lead approved: **\*\***\_\_\_\_**\*\*** Date: **\_\_\_\_**
- [ ] Security review completed: **\*\***\_\_**\*\*** Date: **\_\_\_\_**
- [ ] Product owner approved: **\*\***\_\_\_\_**\*\*** Date: **\_\_\_\_**

---

**Deployment Date**: **\*\***\_\_\_\_**\*\***  
**Deployed By**: **\*\***\_\_\_\_**\*\***  
**Deployment ID**: **\*\***\_\_\_\_**\*\***  
**Notes**: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

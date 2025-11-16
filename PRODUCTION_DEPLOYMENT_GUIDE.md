# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration ✅

#### Required Environment Variables

```bash
# Runtime
APP_ENV=production
NODE_ENV=production

# URLs
NEXT_PUBLIC_SITE_URL=https://admin.yourdomain.com
SITE_URL=https://admin.yourdomain.com

# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Security Secrets (Generate with: openssl rand -hex 32)
HMAC_SHARED_SECRET=
BACKUP_PEPPER=
MFA_SESSION_SECRET=
TRUSTED_COOKIE_SECRET=
KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)

# Optional
OPENAI_API_KEY=
LOG_DRAIN_URL=
SENTRY_DSN=
```

### 2. Build Validation ✅

```bash
# Clean build
rm -rf apps/pwa/staff-admin/.next
rm -rf apps/pwa/staff-admin/out

# Production build
NODE_ENV=production pnpm --filter @ibimina/staff-admin-pwa build

# Expected output:
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization
```

### 3. Security Checklist

- [ ] All secrets generated (never commit!)
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Authentication working
- [ ] RLS policies validated
- [ ] No sensitive data in logs

### 4. Performance Baseline

```bash
# Run Lighthouse
pnpm lighthouse

# Expected scores:
# Performance: >90
# Accessibility: >90
# Best Practices: >90
# SEO: >90
```

### 5. Database Migrations

```bash
# Ensure migrations are up to date
cd supabase
supabase db push

# Verify RLS policies
pnpm test:rls
```

## Deployment Options

### Option A: Cloudflare Pages (Recommended)

```bash
# 1. Build
pnpm build

# 2. Deploy
npx wrangler pages deploy apps/pwa/staff-admin/out
```

### Option B: Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd apps/pwa/staff-admin
vercel --prod
```

### Option C: Docker

```bash
# 1. Build Docker image
docker build -t ibimina-admin .

# 2. Run
docker run -p 3000:3000 --env-file .env.production ibimina-admin
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Test endpoints
curl https://admin.yourdomain.com/api/health
curl https://admin.yourdomain.com/api/healthz
```

### 2. Monitoring

- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (PostHog)
- [ ] Uptime monitoring
- [ ] Log aggregation

### 3. Smoke Tests

- [ ] Homepage loads
- [ ] Authentication works
- [ ] Dashboard accessible
- [ ] API routes respond
- [ ] Database queries work

## Rollback Procedure

```bash
# Revert to previous deployment
git revert HEAD
pnpm build
# Deploy again
```

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Contact: Your support channel

---

**Status:** ✅ Ready for production deployment **Last Updated:** 2025-11-14
**Version:** 1.0.0

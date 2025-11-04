# PWA Cloudflare Deployment - Quick Reference

## 🚀 Quick Deploy Checklist

### ✅ Pre-Flight Check

```bash
# Validate everything is ready
pnpm validate:pwa
```

### 📝 Generate Secrets (Do Once)

```bash
export BACKUP_PEPPER=$(openssl rand -hex 32)
export MFA_SESSION_SECRET=$(openssl rand -hex 32)
export TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
export HMAC_SHARED_SECRET=$(openssl rand -hex 32)
export KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)

# For client app - Web Push
npx web-push generate-vapid-keys
```

### 🔐 GitHub Secrets Required

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
NEXT_PUBLIC_VAPID_PUBLIC_KEY (client only)
VAPID_PRIVATE_KEY (client only)
```

### 🧪 Local Testing

#### Admin App

```bash
cd apps/admin
export CLOUDFLARE_BUILD=1
# Set all required env vars
pnpm build:cloudflare
pnpm preview:cloudflare  # Opens on localhost:8788
```

#### Client App

```bash
cd apps/client
export CLOUDFLARE_BUILD=1
# Set all required env vars
pnpm build:cloudflare
pnpm preview:cloudflare  # Opens on localhost:8789
```

### 🌐 Deploy

#### Option 1: GitHub Actions (Recommended)

```bash
# Automatic on push to main
git push origin main

# Or manually via GitHub UI:
# Actions → Deploy to Cloudflare Pages → Run workflow
```

#### Option 2: Wrangler CLI

```bash
# Login
wrangler login

# Deploy admin
cd apps/admin
CLOUDFLARE_BUILD=1 pnpm build:cloudflare
wrangler pages deploy .vercel/output/static --project-name=ibimina-admin

# Deploy client
cd apps/client
CLOUDFLARE_BUILD=1 pnpm build:cloudflare
wrangler pages deploy .vercel/output/static --project-name=ibimina-client
```

### ✅ Post-Deploy Verification

#### Health Checks

```bash
curl https://adminsacco.ikanisa.com/api/healthz
curl https://sacco.ikanisa.com/api/health
```

#### Lighthouse Audit

```bash
lighthouse https://adminsacco.ikanisa.com --only-categories=performance,pwa
lighthouse https://sacco.ikanisa.com --only-categories=performance,pwa
```

#### PWA Features

- [ ] Open in browser
- [ ] Check for install prompt
- [ ] Verify service worker registers (DevTools → Application → Service Workers)
- [ ] Test offline mode (DevTools → Network → Offline)
- [ ] Check manifest (DevTools → Application → Manifest)

### 🔧 Troubleshooting

#### Build Fails

```bash
# Build packages first
pnpm run build:packages

# Then build app
cd apps/admin && CLOUDFLARE_BUILD=1 pnpm build:cloudflare
```

#### Environment Variables Missing

```bash
# Check template for all required variables
cat .env.cloudflare.template

# Set in Cloudflare Dashboard:
# Pages → [Project] → Settings → Environment variables
```

#### Service Worker Not Registering

- Verify HTTPS (required for PWA)
- Check browser console for errors
- Ensure service-worker.js is accessible

### 📊 Performance Targets

| Metric                         | Target  |
| ------------------------------ | ------- |
| Lighthouse Performance         | > 90    |
| Lighthouse PWA                 | > 90    |
| Lighthouse Accessibility       | > 90    |
| LCP (Largest Contentful Paint) | < 2.5s  |
| FID (First Input Delay)        | < 100ms |
| CLS (Cumulative Layout Shift)  | < 0.1   |

### 🔄 Rollback

#### Via Cloudflare Dashboard

1. Pages → [Project] → Deployments
2. Find previous working deployment
3. Click "..." → "Rollback to this deployment"

#### Via Git

```bash
git revert <commit-hash>
git push origin main
```

### 📚 Documentation

| Document                             | Purpose                         |
| ------------------------------------ | ------------------------------- |
| `PWA_CLOUDFLARE_DEPLOYMENT.md`       | Complete deployment guide       |
| `PWA_CLOUDFLARE_READY.md`            | Implementation summary          |
| `CLOUDFLARE_DEPLOYMENT_CHECKLIST.md` | Step-by-step checklist          |
| `.env.cloudflare.template`           | Environment variables reference |

### 🛠️ Useful Commands

```bash
# Validate setup
pnpm validate:pwa
pnpm validate:cloudflare

# Build for Cloudflare
cd apps/admin && CLOUDFLARE_BUILD=1 pnpm build:cloudflare
cd apps/client && CLOUDFLARE_BUILD=1 pnpm build:cloudflare

# Preview locally
cd apps/admin && pnpm preview:cloudflare
cd apps/client && pnpm preview:cloudflare

# Deploy manually
wrangler pages deploy .vercel/output/static --project-name=<project-name>

# Check wrangler version
wrangler --version

# Login to Cloudflare
wrangler login

# List projects
wrangler pages project list
```

### 🔗 Quick Links

- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [GitHub Actions](https://github.com/ikanisa/ibimina/actions)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

### ⚡ One-Liner Deploy

```bash
# Full deployment process
pnpm validate:pwa && \
cd apps/admin && CLOUDFLARE_BUILD=1 pnpm build:cloudflare && \
wrangler pages deploy .vercel/output/static --project-name=ibimina-admin && \
cd ../client && CLOUDFLARE_BUILD=1 pnpm build:cloudflare && \
wrangler pages deploy .vercel/output/static --project-name=ibimina-client
```

### 🎯 Success Indicators

✅ All validation checks pass  
✅ Build completes without errors  
✅ Preview loads in browser  
✅ PWA install prompt appears  
✅ Service worker registers  
✅ Offline mode works  
✅ Health checks return 200  
✅ Lighthouse scores > 90  
✅ No console errors

### 🆘 Support

- Check logs in Cloudflare Dashboard → Pages → [Project] → Logs
- Run validation: `pnpm validate:pwa`
- Review `PWA_CLOUDFLARE_DEPLOYMENT.md` for detailed troubleshooting
- Check GitHub issues or create new issue

---

**Status**: ✅ READY FOR DEPLOYMENT  
**Last Validated**: November 4, 2025  
**All Checks**: PASSED ✅

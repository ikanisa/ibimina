# Cloudflare Deployment Instructions

## 🚀 Quick Deploy - Admin App (Recommended)

The admin app is **production-ready** and can be deployed immediately to
Cloudflare Pages.

### Option 1: Automatic Deployment via GitHub Actions (Recommended)

**Prerequisites:**

- Cloudflare account with Pages enabled
- GitHub repository secrets configured

**Steps:**

1. **Configure GitHub Secrets** (Settings → Secrets and variables → Actions):

   ```
   CLOUDFLARE_API_TOKEN=<your-cloudflare-api-token>
   CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   BACKUP_PEPPER=<your-backup-pepper>
   MFA_SESSION_SECRET=<your-mfa-session-secret>
   TRUSTED_COOKIE_SECRET=<your-trusted-cookie-secret>
   OPENAI_API_KEY=<your-openai-key>
   HMAC_SHARED_SECRET=<your-hmac-secret>
   KMS_DATA_KEY_BASE64=<your-kms-key>
   ```

2. **Get Cloudflare Credentials:**
   - API Token: Cloudflare Dashboard → My Profile → API Tokens → Create Token
     - Use template: "Edit Cloudflare Workers"
     - Or create custom token with permissions: Account.Cloudflare Pages (Edit)
   - Account ID: Cloudflare Dashboard → Select Account → Copy Account ID from
     URL or sidebar

3. **Trigger Deployment:**

   ```bash
   git push origin main
   ```

   Or manually trigger via GitHub:
   - Go to Actions → Deploy Admin to Cloudflare Pages → Run workflow

4. **Monitor Deployment:**
   - Check GitHub Actions tab for build progress
   - Check Cloudflare Dashboard → Pages → ibimina-admin for deployment status

### Option 2: Manual Deployment via Cloudflare Dashboard

**Steps:**

1. **Go to Cloudflare Dashboard**
   - Navigate to Pages
   - Click "Create a project"
   - Select "Connect to Git"

2. **Connect Repository:**
   - Select your GitHub account
   - Choose repository: `ikanisa/ibimina`
   - Click "Begin setup"

3. **Configure Build Settings:**

   ```
   Project name: ibimina-admin
   Production branch: main
   Framework preset: Next.js
   Build command: cd apps/admin && pnpm install --frozen-lockfile && pnpm build
   Build output directory: apps/admin/.next
   Root directory: /
   Node version: 20
   ```

4. **Add Environment Variables:** Click "Add variable" for each:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   BACKUP_PEPPER
   MFA_SESSION_SECRET
   TRUSTED_COOKIE_SECRET
   OPENAI_API_KEY
   HMAC_SHARED_SECRET
   KMS_DATA_KEY_BASE64
   NODE_VERSION=20
   ```

5. **Deploy:**
   - Click "Save and Deploy"
   - Wait for build to complete (3-5 minutes)

6. **Configure Custom Domain (Optional):**
   - Go to Pages → ibimina-admin → Custom domains
   - Click "Set up a custom domain"
   - Enter: `admin.sacco.ikanisa.com`
   - Follow DNS configuration instructions

### Option 3: Manual CLI Deployment

**Prerequisites:**

- Wrangler CLI installed: `npm install -g wrangler`
- Authenticated: `wrangler login`

**Steps:**

```bash
# 1. Navigate to admin app
cd apps/admin

# 2. Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=<your-url>
export NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
export SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
export BACKUP_PEPPER=<your-pepper>
export MFA_SESSION_SECRET=<your-mfa-secret>
export TRUSTED_COOKIE_SECRET=<your-cookie-secret>
export OPENAI_API_KEY=<your-openai-key>
export HMAC_SHARED_SECRET=<your-hmac-secret>
export KMS_DATA_KEY_BASE64=<your-kms-key>

# 3. Build workspace packages
cd ../..
pnpm --filter @ibimina/config build
pnpm --filter @ibimina/lib build
pnpm --filter @ibimina/locales build
pnpm --filter @ibimina/ui build

# 4. Fix config package imports
cd packages/config/dist
for file in *.js; do
  sed -i 's|from "\./\([^"]*\)"|from "./\1.js"|g' "$file"
done
for file in data/*.js; do
  sed -i 's|from "\.\./\([^"]*\)"|from "../\1.js"|g' "$file"
done
cd ../../..

# 5. Build admin app
cd apps/admin
pnpm build

# 6. Build for Cloudflare
CLOUDFLARE_BUILD=1 npx @cloudflare/next-on-pages

# 7. Deploy
wrangler pages deploy .vercel/output/static --project-name=ibimina-admin
```

---

## 🔧 Client App Deployment (Needs Fixes)

The client app has unresolved issues and requires additional work before
deployment.

### Current Blockers:

1. **TypeScript Syntax Error:** Fixed in `lib/data/home.ts` (double `>>`
   removed)
2. **Missing Package Builds:**
   - `@ibimina/data-access` has dependency issues
   - `@ibimina/flags` import resolution problems
3. **Module Resolution:** ESM import paths need .js extensions

### To Fix Client App:

```bash
# 1. Fix data-access package dependencies
cd packages/data-access
# Resolve @ibimina/flags imports
# Rebuild package

# 2. Test client build
cd ../../apps/client
pnpm build

# 3. If build succeeds, deploy using similar steps as admin
```

---

## 📊 Deployment Status

### ✅ Ready for Production:

- **Admin App (`apps/admin`)** - Fully built and tested
  - Build time: ~3.7 minutes
  - Output: `.next/` directory with optimized production build
  - PWA: Enabled with service worker
  - Deployment: Ready for Cloudflare Pages

### ⚠️ Needs Fixes:

- **Client App (`apps/client`)** - Requires package dependency fixes
  - Issues: Module resolution, missing package builds
  - Estimated fix time: 30-60 minutes
  - Status: Blocked on @ibimina/data-access package

---

## 🔐 Security Notes

1. **Never commit secrets** to the repository
2. **Use environment variables** for all sensitive data
3. **Rotate keys regularly** in production
4. **Enable Cloudflare Access** for admin app if needed
5. **Set up monitoring** with Sentry (already configured)

---

## 🎯 Next Steps

### Immediate (Admin App):

1. ✅ Push code to GitHub (completed)
2. ⬜ Configure GitHub secrets
3. ⬜ Trigger GitHub Actions workflow OR use manual deployment
4. ⬜ Verify deployment at `ibimina-admin.pages.dev`
5. ⬜ Configure custom domain

### Short-term (Client App):

1. ⬜ Fix @ibimina/data-access package
2. ⬜ Test client build
3. ⬜ Deploy client to Cloudflare Pages
4. ⬜ Set up client custom domain

### Long-term:

1. ⬜ Set up staging environment
2. ⬜ Configure preview deployments for PRs
3. ⬜ Set up monitoring and alerting
4. ⬜ Enable Cloudflare analytics

---

## 📞 Support

**Common Issues:**

1. **Build timeout:** Increase Cloudflare Pages timeout in settings
2. **Module not found:** Ensure all workspace packages are built
3. **Environment variable missing:** Double-check all required vars are set
4. **ESM import errors:** Run the config package fix script

**Resources:**

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Wrangler CLI Docs: https://developers.cloudflare.com/workers/wrangler/
- Next.js on Cloudflare: https://nextjs.org/docs/deployment

---

## ✨ Deployment Complete Checklist

- [ ] GitHub secrets configured
- [ ] GitHub Actions workflow runs successfully
- [ ] Admin app accessible at Cloudflare URL
- [ ] Custom domain configured (optional)
- [ ] Environment variables verified in Cloudflare dashboard
- [ ] Sentry monitoring active
- [ ] PostHog analytics configured
- [ ] SSL certificate active
- [ ] Preview deployments working
- [ ] Rollback tested

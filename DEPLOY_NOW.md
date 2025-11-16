# 🚀 DEPLOY NOW - Step-by-Step Instructions

**Status:** ✅ READY TO DEPLOY  
**Platform:** Vercel  
**Time Required:** 10 minutes

---

## 🎯 DEPLOYMENT STEPS

### Step 1: Login to Vercel (2 minutes)

Open your terminal and run:

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin
vercel login
```

**This will:**

1. Open browser for authentication
2. Ask you to confirm login
3. Return you to terminal when done

---

### Step 2: Deploy to Production (5 minutes)

```bash
vercel --prod
```

**You'll be asked:**

1. **"Set up and deploy?"** → Press **Y** (Yes)
2. **"Which scope?"** → Select your account (use arrow keys)
3. **"Link to existing project?"** → Press **N** (No, new project)
4. **"Project name?"** → Type: `ibimina-admin` (or your choice)
5. **"In which directory?"** → Press Enter (use current: `.`)
6. **"Override settings?"** → Press **N** (No)

**Vercel will now:**

- ✅ Upload your code
- ✅ Install dependencies
- ✅ Build your application
- ✅ Deploy to production
- ✅ Give you a URL!

**Expected output:**

```
✓ Deployed to production
🔍 Inspect: https://vercel.com/your-name/ibimina-admin/xxx
✅ Production: https://ibimina-admin-xxx.vercel.app
```

---

### Step 3: Configure Environment Variables (3 minutes)

After deployment, you MUST add environment variables:

**Option A: Via Dashboard (Recommended)**

1. Go to: https://vercel.com/dashboard
2. Click your project: `ibimina-admin`
3. Go to: **Settings** → **Environment Variables**
4. Add these variables:

```bash
# REQUIRED - Application will break without these
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# REQUIRED - Security secrets (generate with: openssl rand -hex 32)
HMAC_SHARED_SECRET=your_secret_here
BACKUP_PEPPER=your_secret_here
MFA_SESSION_SECRET=your_secret_here
TRUSTED_COOKIE_SECRET=your_secret_here
KMS_DATA_KEY_BASE64=your_base64_key_here

# OPTIONAL but recommended
OPENAI_API_KEY=your_openai_key
SENTRY_DSN=your_sentry_dsn
LOG_DRAIN_URL=your_log_drain_url
```

**Option B: Via CLI**

```bash
# Add one by one
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste value when prompted

# Or bulk add from file
vercel env pull .env.vercel.production
# Edit .env.vercel.production
vercel env push .env.vercel.production production
```

---

### Step 4: Redeploy with Environment Variables

After adding environment variables:

```bash
vercel --prod
```

This redeploys with your environment variables included.

---

### Step 5: Verify Deployment (2 minutes)

**Test your deployed site:**

1. **Open the URL** Vercel gave you Example:
   `https://ibimina-admin-xxx.vercel.app`

2. **Check these:**
   - [ ] Page loads (no white screen)
   - [ ] CSS styles applied correctly
   - [ ] No errors in browser console (F12)
   - [ ] Can navigate between pages
   - [ ] Images/icons display

3. **Test API Routes:**

   ```bash
   curl https://your-url.vercel.app/api/health
   curl https://your-url.vercel.app/api/healthz
   ```

   **Expected:** Both return 200 OK

---

## 🔧 TROUBLESHOOTING

### If deployment fails:

**1. Check Build Logs**

```bash
vercel logs
```

**2. Common Issues:**

**"Build failed"**

- Check environment variables are set
- Verify Supabase credentials are correct

**"Module not found"**

- Run locally first: `pnpm install && pnpm build`
- If works locally, try: `vercel --force`

**"Error 500 on site"**

- Environment variables missing
- Check Vercel dashboard logs
- Add missing secrets

**3. Start Over (if needed)**

```bash
# Remove .vercel directory
rm -rf .vercel

# Deploy again
vercel --prod
```

---

## 🎯 CUSTOM DOMAIN (Optional)

### Add your own domain:

1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your domain: `admin.yourdomain.com`
6. Follow DNS configuration instructions
7. Wait for DNS propagation (5-30 minutes)

---

## 📊 POST-DEPLOYMENT

### After successful deployment:

**1. Setup Monitoring (5 minutes)**

Go to https://uptimerobot.com

- Create free account
- Add monitor for your Vercel URL
- Monitor: `https://your-url.vercel.app/api/health`
- Interval: 5 minutes
- Email alerts on downtime

**2. Add Error Tracking**

Get Sentry DSN:

- Go to https://sentry.io
- Create project
- Copy DSN
- Add to Vercel environment variables:
  ```
  SENTRY_DSN=your_sentry_dsn_here
  ```
- Redeploy: `vercel --prod`

**3. Share Your Site!**

Your app is now live at:

```
https://ibimina-admin-xxx.vercel.app
```

Or your custom domain:

```
https://admin.yourdomain.com
```

---

## ✅ SUCCESS CRITERIA

**Your deployment is successful when:**

- ✅ Site loads at Vercel URL
- ✅ HTTPS works (green padlock)
- ✅ CSS/styling applied
- ✅ No console errors
- ✅ Can navigate pages
- ✅ API routes respond (200 OK)
- ✅ Health checks pass

---

## 🎉 YOU'RE LIVE!

**Congratulations! Your application is now:**

- ✅ Deployed to production
- ✅ Accessible worldwide
- ✅ On Vercel's global CDN
- ✅ Auto-scaling
- ✅ HTTPS enabled
- ✅ Ready for users!

---

## �� SUPPORT

**If you need help:**

- Check Vercel logs: `vercel logs`
- Review: `DEPLOYMENT_READY.md`
- Review: `GO_LIVE_CHECKLIST.md`
- Vercel docs: https://vercel.com/docs

---

**Start here:**

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin
vercel login
vercel --prod
```

**Then add environment variables in Vercel dashboard.**

**You've got this! 🚀**

# Quick Start: Run Cloudflare Deployment Workflow

## Prerequisites ✅

Before running the workflow, ensure these GitHub Secrets are configured:

### Go to: Repository Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

1. **CLOUDFLARE_API_TOKEN** = `FmATZTT0qMJ8AbMz8fwo05QTivXLQ1u98hKtjqcE`
2. **CLOUDFLARE_ACCOUNT_ID** = `2209b915a85b1c11cee79b7806c6e73b`
3. **NEXT_PUBLIC_SUPABASE_URL** = (your Supabase URL)
4. **NEXT_PUBLIC_SUPABASE_ANON_KEY** = (your Supabase anon key)
5. **SUPABASE_SERVICE_ROLE_KEY** = (your Supabase service role key)
6. **BACKUP_PEPPER** = (generate with: `openssl rand -hex 32`)
7. **MFA_SESSION_SECRET** = (generate with: `openssl rand -hex 32`)
8. **TRUSTED_COOKIE_SECRET** = (generate with: `openssl rand -hex 32`)
9. **OPENAI_API_KEY** = (your OpenAI API key)
10. **HMAC_SHARED_SECRET** = (generate with: `openssl rand -hex 32`)
11. **KMS_DATA_KEY_BASE64** = (generate with: `openssl rand -base64 32`)

## How to Run the Workflow 🚀

### Method 1: Manual Trigger (Recommended)

1. Go to: https://github.com/ikanisa/ibimina/actions
2. Click on "Deploy Staff Admin PWA to Cloudflare Pages" in the left sidebar
3. Click the "Run workflow" button (top right)
4. Select branch: `copilot/run-github-workflow` (or `main` after merging)
5. Click the green "Run workflow" button

### Method 2: Automatic Trigger

The workflow will automatically run when:
- You push code to the `main` branch
- Changes are in `apps/admin/**` or `packages/**`

## What Happens During Deployment 📦

The workflow will:
1. ✅ Install Node.js and pnpm
2. ✅ Install dependencies
3. ✅ Build workspace packages
4. ✅ Build the admin app
5. ✅ Build for Cloudflare Pages
6. ✅ Deploy to project: `ibimina-staff-admin-pwa`

Expected duration: **5-10 minutes**

## Monitoring Progress 👀

### In GitHub
- Navigate to Actions tab
- Click on the running workflow
- Watch real-time logs for each step

### In Cloudflare
- Go to Cloudflare Dashboard
- Navigate to Workers & Pages
- Find project: `ibimina-staff-admin-pwa`
- View deployment status and URL

## After Successful Deployment 🎉

Your app will be available at:
- Production: `https://ibimina-staff-admin-pwa.pages.dev`
- Or your custom domain (if configured)

## Troubleshooting 🔧

### "Secret not found" error
→ Verify all secrets are added to GitHub repository settings

### "Project not found" error
→ The project will be auto-created on first deployment

### Build timeout
→ Normal for first build. Subsequent builds are faster due to caching.

### Cloudflare API error
→ Verify `CLOUDFLARE_API_TOKEN` has "Cloudflare Pages:Edit" permission

## Need Help? 📚

See detailed documentation:
- [CLOUDFLARE_WORKFLOW_SETUP.md](./CLOUDFLARE_WORKFLOW_SETUP.md)
- [CLOUDFLARE_DEPLOYMENT_INSTRUCTIONS.md](./CLOUDFLARE_DEPLOYMENT_INSTRUCTIONS.md)

---

**Ready to deploy?** Go to [GitHub Actions](https://github.com/ikanisa/ibimina/actions) and run the workflow! 🚀

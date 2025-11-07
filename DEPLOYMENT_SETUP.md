# Deployment Configuration Complete ✅

This document summarizes the deployment infrastructure setup for the Ibimina monorepo.

## What's New

### 📁 Configuration Files

- **`apps/admin/netlify.toml`** - Netlify configuration for admin app
- **`apps/client/netlify.toml`** - Netlify configuration for client app
- **`turbo.json`** - Turbo build optimization configuration
- **`.github/workflows/deploy.yml`** - GitHub Actions workflow for Netlify deployment

### 🛠️ Automation Scripts

Located in `scripts/`:

1. **`check-env.js`** - Environment variable validation
   - Checks required variables are set
   - Creates `.env` from template if missing
   - Shows commands to generate secure secrets

2. **`generate-pwa.js`** - PWA manifest generation
   - Creates `manifest.json` for both apps
   - Configures theme colors, icons, display mode
   - Validates directory structure

3. **`generate-apk.js`** - Android APK generation
   - Builds release APKs for both apps
   - Syncs Capacitor configuration
   - Copies output to `dist/` directory

4. **`netlify-deploy.js`** - Netlify deployment automation
   - Deploys both apps to Netlify
   - Supports preview and production deployments
   - Shows deployment summary

5. **`prepare.js`** - Repository preparation
   - Checks Node.js and pnpm versions
   - Validates environment configuration
   - Installs dependencies
   - Runs type checking and linting

6. **`fix-issues.sh`** - Common issues fixer
   - Normalizes line endings
   - Fixes script permissions
   - Cleans build artifacts
   - Formats code

### 📦 Package.json Scripts

New scripts added to root `package.json`:

```json
{
  "build:client": "pnpm --filter @ibimina/client build",
  "generate:pwa": "node scripts/generate-pwa.js",
  "generate:apk": "node scripts/generate-apk.js",
  "deploy:netlify": "node scripts/netlify-deploy.js",
  "check:env": "node scripts/check-env.js",
  "prepare:deploy": "node scripts/prepare.js"
}
```

### 📚 Documentation

- **`docs/NETLIFY_DEPLOYMENT.md`** - Comprehensive Netlify deployment guide
  - Prerequisites and setup instructions
  - Environment configuration
  - Multiple deployment methods
  - Troubleshooting guide
  - Security considerations

## Quick Start

### 1. Initial Setup

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Check environment
pnpm check:env

# Generate PWA manifests
pnpm generate:pwa

# Prepare for deployment
pnpm prepare:deploy
```

### 2. Build Applications

```bash
# Build workspace packages
pnpm build:packages

# Build admin app
pnpm build:admin

# Build client app
pnpm build:client

# Or build everything
pnpm build
```

### 3. Deploy to Netlify

#### Option A: Automated (GitHub Actions)

Push to `main` or `develop` branch:

```bash
git push origin main
```

The GitHub Actions workflow will automatically:
- Build both applications
- Deploy to Netlify
- Comment on PRs with deployment status

#### Option B: Manual (CLI)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy (preview)
pnpm deploy:netlify

# Deploy (production)
pnpm deploy:netlify --prod
```

## Environment Variables

### Required Variables

These must be set before building:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
BACKUP_PEPPER
MFA_SESSION_SECRET
TRUSTED_COOKIE_SECRET
HMAC_SHARED_SECRET
KMS_DATA_KEY_BASE64
```

### Generate Secrets

```bash
export BACKUP_PEPPER=$(openssl rand -hex 32)
export MFA_SESSION_SECRET=$(openssl rand -hex 32)
export TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
export HMAC_SHARED_SECRET=$(openssl rand -hex 32)
export KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)
```

### Validate Environment

```bash
pnpm check:env
```

## CI/CD Setup

### GitHub Secrets Required

Add these to your GitHub repository (Settings → Secrets):

```
NETLIFY_AUTH_TOKEN
NETLIFY_ADMIN_SITE_ID
NETLIFY_CLIENT_SITE_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
BACKUP_PEPPER
MFA_SESSION_SECRET
TRUSTED_COOKIE_SECRET
OPENAI_API_KEY
HMAC_SHARED_SECRET
KMS_DATA_KEY_BASE64
```

### Workflow Triggers

The deployment workflow runs on:
- Push to `main` or `develop` branches
- Pull requests (build only, no deployment)
- Manual trigger via `workflow_dispatch`

## Deployment Platforms

The repository supports multiple deployment platforms:

### 1. **Cloudflare Pages** (Primary)
- Configured in `.github/workflows/deploy-*-cloudflare.yml`
- Unlimited builds
- Global edge network (275+ locations)
- Free edge functions

### 2. **Netlify** (Alternative)
- Configured in `.github/workflows/deploy.yml`
- 300 build minutes/month (free tier)
- Automatic HTTPS and CDN
- Preview deployments

### 3. **Vercel** (Fallback)
- Configured via `vercel-build` script
- Optimized for Next.js
- Serverless functions
- Edge network

## Build Optimization

### Turbo Configuration

The `turbo.json` file enables:

- **Dependency-aware builds**: Only rebuilds changed packages
- **Intelligent caching**: Reuses previous build outputs
- **Parallel execution**: Builds independent packages simultaneously
- **Environment isolation**: Tracks environment variable changes

### Build Pipeline

```
packages/* → apps/admin → apps/client
    ↓           ↓              ↓
  build      build          build
    ↓           ↓              ↓
  cache      cache          cache
```

## PWA Support

### Manifest Generation

```bash
pnpm generate:pwa
```

Creates manifests with:
- App name and description
- Theme colors (blue for admin, green for client)
- Icon references (8 sizes)
- Display mode (standalone)
- Categories (finance, business)

### Required Icons

Place these in `apps/*/public/icons/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

## Android APK Generation

### Prerequisites

- Android SDK installed
- Java 17+
- Capacitor configured

### Generate APKs

```bash
pnpm generate:apk
```

This will:
1. Sync Capacitor for both apps
2. Build release APKs
3. Copy to `dist/` directory
4. Show build summary

Output files:
- `dist/admin-YYYY-MM-DD.apk`
- `dist/client-YYYY-MM-DD.apk`

## Troubleshooting

### Common Issues

#### Build fails with "environment variable required"
**Solution**: Run `pnpm check:env` and set missing variables

#### "pnpm: command not found"
**Solution**: `npm install -g pnpm@10.19.0`

#### TypeScript errors during build
**Solution**: `pnpm typecheck` to see errors, fix them before building

#### Netlify deployment fails
**Solution**: Check build logs in Netlify dashboard, ensure environment variables are set

### Fix Common Issues

Run the automated fixer:

```bash
./scripts/fix-issues.sh
```

Or with clean reinstall:

```bash
./scripts/fix-issues.sh --clean
```

## Testing

### Local Testing

```bash
# Build and test admin
cd apps/admin
pnpm build
pnpm start

# Build and test client
cd apps/client
pnpm build
pnpm start
```

### PWA Testing

1. Build the app
2. Start production server: `pnpm start`
3. Open Chrome DevTools
4. Go to Application → Manifest
5. Verify manifest and service worker

### Preview Deployments

Pull requests automatically get preview deployments on Netlify. Check the PR comments for the preview URL.

## Maintenance

### Update Dependencies

```bash
# Check for updates
pnpm outdated

# Update all dependencies
pnpm update

# Update specific package
pnpm update next --filter @ibimina/admin
```

### Rotate Secrets

Generate new secrets and update in:
1. Local `.env` file
2. Netlify dashboard (Site settings → Environment variables)
3. GitHub secrets (Settings → Secrets)

### Monitor Deployments

- **Netlify**: Dashboard → Deploys
- **GitHub Actions**: Actions tab
- **Cloudflare**: Pages dashboard

## Security

### Best Practices

1. ✅ Never commit secrets to git
2. ✅ Use different secrets per environment
3. ✅ Rotate secrets regularly (quarterly)
4. ✅ Use environment variables for all sensitive data
5. ✅ Enable security headers (configured in `netlify.toml`)
6. ✅ Use HTTPS only (automatic on Netlify)
7. ✅ Review dependency security alerts

### Security Headers

Configured in `netlify.toml`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera, microphone, geolocation)

## Support

### Documentation

- **Netlify Deployment**: `docs/NETLIFY_DEPLOYMENT.md`
- **Development Guide**: `DEVELOPMENT.md`
- **Quick Start**: `QUICK_START.md`
- **Architecture**: `docs/ARCHITECTURE.md`

### Resources

- [Netlify Documentation](https://docs.netlify.com)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Next.js Documentation](https://nextjs.org/docs)
- [pnpm Documentation](https://pnpm.io)

### Getting Help

1. Check documentation in `docs/`
2. Search existing [GitHub Issues](https://github.com/ikanisa/ibimina/issues)
3. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Environment details
   - Error logs

## Changelog

### 2025-11-07 - Initial Deployment Setup

**Added:**
- Netlify configuration files
- Deployment automation scripts
- GitHub Actions workflow
- Turbo build optimization
- PWA manifest generation
- APK generation script
- Comprehensive documentation

**Scripts:**
- `check-env.js` - Environment validation
- `generate-pwa.js` - PWA manifest generation
- `generate-apk.js` - Android APK generation
- `netlify-deploy.js` - Netlify deployment
- `prepare.js` - Repository preparation
- `fix-issues.sh` - Common issues fixer

**Documentation:**
- `docs/NETLIFY_DEPLOYMENT.md` - Deployment guide
- `DEPLOYMENT_SETUP.md` - This file

## Next Steps

1. ✅ Complete local setup
2. ✅ Configure Netlify sites
3. ✅ Add environment variables
4. ✅ Deploy to preview
5. ⬜ Test preview deployment
6. ⬜ Deploy to production
7. ⬜ Set up custom domains
8. ⬜ Configure monitoring

---

**Last Updated**: 2025-11-07  
**Maintainer**: Ibimina Development Team  
**Status**: ✅ Ready for Deployment

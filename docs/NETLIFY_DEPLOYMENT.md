# Netlify Deployment Guide

This guide covers deploying the Ibimina monorepo to Netlify as an alternative to
Cloudflare Pages.

## Overview

The Ibimina monorepo contains two main applications:

- **Admin App** (`apps/admin`) - Staff administration console
- **Client App** (`apps/client`) - Member-facing application

Both apps are configured for deployment to Netlify with full PWA support.

## Prerequisites

1. **Node.js 20+** - Required for building the applications
2. **pnpm 10.19.0** - Package manager (exact version required)
3. **Netlify CLI** - For manual deployments (optional)
4. **Environment Variables** - All required secrets configured

### Install Prerequisites

```bash
# Install Node.js 20 (using nvm)
nvm install 20
nvm use 20

# Install pnpm globally
npm install -g pnpm@10.19.0

# Install Netlify CLI (optional, for manual deployments)
npm install -g netlify-cli
```

## Environment Configuration

### Required Environment Variables

Before building or deploying, ensure these variables are set:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security Keys (generate with openssl)
BACKUP_PEPPER=$(openssl rand -hex 32)
MFA_SESSION_SECRET=$(openssl rand -hex 32)
TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
HMAC_SHARED_SECRET=$(openssl rand -hex 32)
KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)

# Optional but Recommended
OPENAI_API_KEY=sk-...
SENTRY_DSN=https://...
POSTHOG_API_KEY=phc_...
LOG_DRAIN_URL=https://...
```

### Seed Required Secrets via Netlify CLI

Remote Netlify builds do **not** read your local `.env`, so configure secrets on
the platform itself. The CLI keeps everything scoped correctly:

```bash
# Generate secure secrets (macOS/Linux)
openssl rand -base64 32 | pbcopy   # copies 32-byte secret to clipboard

# Production values (visible to Builds + Functions)
netlify env:set BACKUP_PEPPER "<32+ byte random>"        --context production --scope builds functions --secret
netlify env:set MFA_SESSION_SECRET "<32+ byte random>"    --context production --scope builds functions --secret
netlify env:set TRUSTED_COOKIE_SECRET "<32+ byte random>" --context production --scope builds functions --secret
netlify env:set HMAC_SHARED_SECRET "<32+ byte random>"    --context production --scope builds functions --secret
netlify env:set OPENAI_API_KEY "sk-..."                   --context production --scope builds functions --secret

# Optional: limited secrets for previews / branch deploys
netlify env:set BACKUP_PEPPER "<preview random>"          --context deploy-preview branch-deploy --scope builds functions --secret
netlify env:set MFA_SESSION_SECRET "<preview random>"     --context deploy-preview branch-deploy --scope builds functions --secret
netlify env:set TRUSTED_COOKIE_SECRET "<preview random>"  --context deploy-preview branch-deploy --scope builds functions --secret
netlify env:set HMAC_SHARED_SECRET "<preview random>"     --context deploy-preview branch-deploy --scope builds functions --secret
# Skip OPENAI_API_KEY or use a low-privileged key for previews
```

Verify what Netlify is storing before rerunning the build:

```bash
netlify env:list --context production --scope builds
netlify env:get OPENAI_API_KEY --context production --scope builds
```

> Windows tip: replace the `openssl` command with
> `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

### Validate Environment

Use the built-in checker to validate your environment:

```bash
pnpm check:env
```

This will:

- Check all required variables are set
- Create `.env` from `.env.example` if missing
- Show commands to generate secure secrets

## Setup Instructions

### 1. Local Setup

```bash
# Clone the repository
git clone https://github.com/ikanisa/ibimina.git
cd ibimina

# Install dependencies
pnpm install --frozen-lockfile

# Create and configure .env
cp .env.example .env
# Edit .env with your values

# Validate environment
pnpm check:env

# Generate PWA manifests
pnpm generate:pwa

# Build applications
pnpm build:packages
pnpm build:admin
pnpm build:client
```

### 2. Netlify Site Setup

#### Option A: Using Netlify CLI

```bash
# Login to Netlify
netlify login

# Create and link admin site
cd apps/admin
netlify init
netlify link

# Create and link client site
cd ../client
netlify init
netlify link
```

#### Option B: Using Netlify Dashboard

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: `apps/admin` (or `apps/client`)
   - **Build command**:
     `cd ../.. && pnpm install --frozen-lockfile && pnpm build:admin`
   - **Publish directory**: `.next`

### 3. Configure Environment Variables in Netlify

For each site, add these environment variables in the Netlify dashboard:

1. Go to Site settings → Environment variables
2. Add all required variables from the list above
3. Set `NODE_VERSION` to `20`
4. Set `NEXT_TELEMETRY_DISABLED` to `1`

### 4. Configure GitHub Secrets

For automated deployments via GitHub Actions, add these secrets:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

```
NETLIFY_AUTH_TOKEN          # Your Netlify personal access token
NETLIFY_ADMIN_SITE_ID       # Admin site ID from Netlify
NETLIFY_CLIENT_SITE_ID      # Client site ID from Netlify
NEXT_PUBLIC_SUPABASE_URL    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY   # Supabase service role key
BACKUP_PEPPER               # Generated with openssl rand -hex 32
MFA_SESSION_SECRET          # Generated with openssl rand -hex 32
TRUSTED_COOKIE_SECRET       # Generated with openssl rand -hex 32
OPENAI_API_KEY              # OpenAI API key
HMAC_SHARED_SECRET          # Generated with openssl rand -hex 32
KMS_DATA_KEY_BASE64         # Generated with openssl rand -base64 32
```

## Deployment Methods

### Method 1: Automated (GitHub Actions)

The repository includes a GitHub Actions workflow that automatically deploys to
Netlify on push to `main` or `develop` branches.

**Workflow file**: `.github/workflows/deploy.yml`

The workflow:

1. Installs dependencies
2. Builds workspace packages
3. Builds each application
4. Deploys to Netlify
5. Comments on PRs with build status

**Trigger deployment:**

```bash
git push origin main
```

### Method 2: Manual (Netlify CLI)

```bash
# Deploy admin app (preview)
cd apps/admin
pnpm build
netlify deploy --dir=.next

# Deploy admin app (production)
netlify deploy --prod --dir=.next

# Deploy client app (preview)
cd ../client
pnpm build
netlify deploy --dir=.next

# Deploy client app (production)
netlify deploy --prod --dir=.next
```

### Method 3: Using Deployment Script

```bash
# Preview deployment
pnpm deploy:netlify

# Production deployment
pnpm deploy:netlify --prod
```

The script will:

1. Check for Netlify CLI
2. Verify builds exist
3. Deploy each app
4. Show deployment summary

## Build Configuration

### netlify.toml Configuration

Each app has a `netlify.toml` configuration file that defines:

- **Build settings**: Commands, directories, environment
- **Headers**: Security headers, cache control
- **Redirects**: SPA routing support
- **Plugins**: Next.js plugin for optimization

**Admin App** (`apps/admin/netlify.toml`):

```toml
[build]
  base = "apps/admin"
  command = "cd ../.. && pnpm install --frozen-lockfile && pnpm build:admin"
  publish = ".next"
```

**Client App** (`apps/client/netlify.toml`):

```toml
[build]
  base = "apps/client"
  command = "cd ../.. && pnpm install --frozen-lockfile && pnpm build:client"
  publish = ".next"
```

### Build Optimization with Turbo

The repository includes `turbo.json` for optimized builds:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    }
  }
}
```

This enables:

- Dependency-aware build ordering
- Intelligent caching
- Parallel execution

## PWA Configuration

### Generate PWA Manifests

```bash
pnpm generate:pwa
```

This creates `manifest.json` files in each app's `public/` directory with:

- App name and description
- Theme colors
- Icon references
- Display mode

### PWA Icons

Ensure these icon sizes exist in `apps/*/public/icons/`:

- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

## Testing Deployments

### Local Testing

```bash
# Test admin app
cd apps/admin
pnpm build
pnpm start

# Test client app
cd apps/client
pnpm build
pnpm start
```

### Preview Deployments

On pull requests, Netlify automatically creates preview deployments. The GitHub
Actions workflow will comment on PRs with the preview URL.

### Production Testing

After deploying to production:

1. **Check PWA**: Open Chrome DevTools → Application → Manifest
2. **Test offline**: Disable network, verify app works
3. **Lighthouse**: Run Lighthouse audit for PWA score
4. **Security headers**: Verify headers using securityheaders.com

## Troubleshooting

### Build Fails

**Error**: `NEXT_PUBLIC_SUPABASE_URL is required` **Solution**: Set all required
environment variables in Netlify dashboard

**Error**: `pnpm: command not found` **Solution**: Add `NODE_VERSION=20` to
environment variables

**Error**: `Cannot find module '@ibimina/...'` **Solution**: Ensure build
command includes `pnpm build:packages` before app build

### Deployment Fails

**Error**: `netlify: command not found` **Solution**: Install Netlify CLI:
`npm install -g netlify-cli`

**Error**: `Site not found` **Solution**: Run `netlify link` in the app
directory

**Error**: `Build exceeded time limit` **Solution**: Use Netlify's larger build
instances (Pro plan)

### PWA Issues

**Error**: Icons not loading **Solution**: Check icons exist in `public/icons/`
and are correct sizes

**Error**: Service worker not registering **Solution**: Verify `manifest.json`
exists and is served with correct content-type

## Monitoring and Maintenance

### Build Logs

View build logs in:

- Netlify Dashboard → Deploys → Build log
- GitHub Actions → Actions tab → Workflow run

### Performance Monitoring

- **Netlify Analytics**: Built-in analytics for traffic and performance
- **Lighthouse CI**: Automated performance audits in CI/CD
- **Sentry**: Error tracking (if configured)
- **PostHog**: User analytics (if configured)

### Updates and Rollbacks

**Deploy latest changes:**

```bash
git push origin main
```

**Rollback to previous deployment:**

1. Go to Netlify Dashboard → Deploys
2. Find the previous successful deployment
3. Click "Publish deploy"

## Additional Scripts

### Fix Common Issues

```bash
pnpm run fix:issues
```

This script:

- Normalizes line endings
- Fixes permissions
- Cleans node_modules (with --clean flag)
- Installs dependencies
- Checks environment
- Generates PWA manifests
- Formats code

### Generate APK (Android)

```bash
pnpm generate:apk
```

This generates Android APK files for both apps (if Capacitor is configured).

## Security Considerations

1. **Never commit secrets**: Use environment variables for all sensitive data
2. **Rotate secrets regularly**: Generate new keys periodically
3. **Use different secrets per environment**: Separate dev/staging/production
   secrets
4. **Enable HTTPS**: Netlify provides automatic HTTPS
5. **Set security headers**: Configured in `netlify.toml`

## Support and Resources

- **Netlify Documentation**: https://docs.netlify.com
- **Next.js on Netlify**: https://docs.netlify.com/frameworks/next-js/
- **Repository Issues**: https://github.com/ikanisa/ibimina/issues
- **Ibimina Documentation**: See `docs/` directory

## Comparison: Netlify vs Cloudflare

The repository supports both Netlify and Cloudflare Pages. Here's a comparison:

| Feature               | Netlify         | Cloudflare Pages |
| --------------------- | --------------- | ---------------- |
| Build minutes/month   | 300 (free tier) | Unlimited        |
| Concurrent builds     | 1 (free tier)   | 5                |
| Edge locations        | Global          | Global (275+)    |
| Custom domains        | Unlimited       | Unlimited        |
| Deploy previews       | Yes             | Yes              |
| Environment variables | Yes             | Yes              |
| Functions             | Yes (paid)      | Yes (free)       |

**Current setup**: Repository is primarily configured for Cloudflare (see
`.github/workflows/deploy-*-cloudflare.yml`). Netlify is available as an
alternative deployment option.

## Next Steps

1. ✅ Complete local setup
2. ✅ Configure Netlify sites
3. ✅ Add environment variables
4. ✅ Deploy to preview
5. ✅ Test preview deployment
6. ✅ Deploy to production
7. ✅ Set up monitoring
8. ✅ Configure custom domains (optional)

---

**Last Updated**: 2025-11-07 **Maintainer**: Ibimina Development Team

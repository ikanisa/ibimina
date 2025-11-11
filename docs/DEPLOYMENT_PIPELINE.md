# Deployment Pipeline & Production Readiness

This document describes the deployment pipeline, production environments, and readiness procedures for the Ibimina SACCO Management Platform.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environments](#environments)
3. [Deployment Pipeline](#deployment-pipeline)
4. [Infrastructure Setup](#infrastructure-setup)
5. [Deployment Procedures](#deployment-procedures)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Rollback Procedures](#rollback-procedures)
8. [Production Readiness Checklist](#production-readiness-checklist)

## Deployment Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Source Control                            │
│                  GitHub Repository                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Push / PR Merge
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  CI/CD Pipeline                              │
│               GitHub Actions                                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Lint &     │→ │   Test       │→ │   Build      │     │
│  │   TypeCheck  │  │   Suite      │  │   Apps       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Supabase      │
│   (Apps)        │    │   (Database +   │
│                 │    │    Functions)   │
│  • Client PWA   │    │  • PostgreSQL   │
│  • Admin PWA    │    │  • Edge Funcs   │
│  • Website      │    │  • Storage      │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │   Cloudflare CDN    │
         │   (Global Edge)     │
         └─────────────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │      Users          │
         │   (Web + Mobile)    │
         └─────────────────────┘
```

### Deployment Targets

| Component | Platform | URL Pattern | Auto-Deploy |
|-----------|----------|-------------|-------------|
| Client PWA | Vercel / Cloudflare Pages | client.ibimina.rw | ✅ Yes (main) |
| Admin PWA | Vercel / Cloudflare Pages | admin.ibimina.rw | ✅ Yes (main) |
| Website | Vercel / Cloudflare Pages | ibimina.rw | ✅ Yes (main) |
| Database | Supabase | (private) | Manual migrations |
| Edge Functions | Supabase | (API endpoints) | Manual deploy |
| Mobile Apps | App Stores | - | Manual release |

## Environments

### Development (Local)

**Purpose**: Local development and testing

**Setup**:
```bash
# Clone repository
git clone https://github.com/ikanisa/ibimina.git
cd ibimina

# Install dependencies
pnpm install --frozen-lockfile

# Setup environment
cp .env.example .env
# Edit .env with your local Supabase credentials

# Start development server
pnpm dev
# Visits: http://localhost:3100 (admin) or http://localhost:5000 (client)
```

**Database**: Local Supabase instance or dev project

**Features**:
- Hot reload
- Debug logging
- Mock data
- No rate limiting

### Staging (Preview)

**Purpose**: Pre-production testing and QA

**Automatic Deployments**:
- Every pull request gets a unique preview URL
- Example: `ibimina-pr-123.vercel.app`

**Database**: Staging Supabase project (isolated)

**Features**:
- Production-like environment
- Real data structure (anonymized data)
- Full feature flags
- Performance monitoring

**Access**:
- Preview URLs in PR comments
- Requires authentication

### Production

**Purpose**: Live system serving real users

**URLs**:
- Client: https://client.ibimina.rw
- Admin: https://admin.ibimina.rw
- Website: https://ibimina.rw

**Database**: Production Supabase project

**Features**:
- Full monitoring and alerting
- Automatic backups
- Rate limiting enabled
- DDoS protection (Cloudflare)

**Access**: Public (with authentication)

## Deployment Pipeline

### Continuous Integration (CI)

**Trigger**: Every push and pull request

**Workflow**: `.github/workflows/ci.yml`

**Steps**:

1. **Code Quality**
   ```bash
   - Install dependencies
   - Run ESLint
   - Run TypeScript type checking
   - Run Prettier format check
   ```

2. **Testing**
   ```bash
   - Run unit tests
   - Run authentication tests
   - Run RLS policy tests
   - Generate coverage report
   ```

3. **Build Verification**
   ```bash
   - Build all apps
   - Check bundle sizes
   - Verify no build errors
   ```

4. **End-to-End Tests**
   ```bash
   - Start test server
   - Run Playwright tests
   - Run Lighthouse audits
   ```

5. **Security Checks**
   ```bash
   - Run npm audit
   - Check for vulnerable dependencies
   - Verify environment variables
   ```

**Duration**: ~8-12 minutes

**Pass Criteria**: All steps must pass for PR to be mergeable

### Continuous Deployment (CD)

**Trigger**: Push to `main` branch

**Automatic Deployments**:

#### Web Apps (Vercel/Cloudflare)

```bash
# Automatic on merge to main
main → Vercel/Cloudflare Build → Production

# Build steps:
1. Install dependencies (pnpm install)
2. Build app (pnpm build)
3. Deploy to edge network
4. Health check
5. Notify team (Slack/Discord)
```

**Build Configuration**:

```javascript
// vercel.json
{
  "buildCommand": "pnpm --filter @ibimina/admin build",
  "outputDirectory": "apps/admin/.next",
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

#### Supabase Components

**Database Migrations**:
```bash
# Manual deployment
supabase db push

# Or via GitHub Actions
- name: Deploy migrations
  run: supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
```

**Edge Functions**:
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy whatsapp-send-otp
```

**Workflow**: `.github/workflows/supabase-deploy.yml`

```yaml
name: Deploy Supabase

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'
      - 'supabase/migrations/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Deploy migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
      
      - name: Deploy functions
        run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## Infrastructure Setup

### Vercel/Cloudflare Setup

1. **Create Account**
   - Sign up at [vercel.com](https://vercel.com) or [cloudflare.com](https://cloudflare.com)
   - Connect GitHub repository

2. **Configure Project**
   ```bash
   # Install CLI
   npm install -g vercel

   # Link project
   cd apps/admin
   vercel link

   # Set environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # ... (add all required env vars)
   ```

3. **Custom Domain**
   - Add domain in dashboard
   - Update DNS records
   - Enable automatic HTTPS

4. **Configure Build**
   - Build command: `pnpm --filter @ibimina/admin build`
   - Output directory: `.next`
   - Install command: `pnpm install --frozen-lockfile`

### Supabase Setup

1. **Create Project**
   - Sign up at [supabase.com](https://supabase.com)
   - Create new project
   - Note project reference and credentials

2. **Configure Supabase CLI**
   ```bash
   # Install CLI
   npm install -g supabase

   # Login
   supabase login

   # Link project
   supabase link --project-ref your-project-ref
   ```

3. **Apply Migrations**
   ```bash
   # Push all migrations
   supabase db push

   # Or apply specific migration
   supabase migration up
   ```

4. **Deploy Edge Functions**
   ```bash
   # Deploy all functions
   supabase functions deploy

   # Set function secrets
   supabase secrets set OPENAI_API_KEY=your-key
   supabase secrets set HMAC_SHARED_SECRET=your-secret
   ```

### Cloudflare CDN

1. **Add Site**
   - Add domain to Cloudflare
   - Update nameservers

2. **Configure DNS**
   ```
   A    @              <vercel-ip>
   CNAME client        <vercel-client-domain>
   CNAME admin         <vercel-admin-domain>
   ```

3. **Enable Features**
   - Always Use HTTPS: ✅
   - Auto Minify: ✅ (JS, CSS, HTML)
   - Brotli Compression: ✅
   - Rocket Loader: ❌ (breaks Next.js)

4. **WAF Rules**
   ```
   - Block known bots
   - Rate limit API endpoints (100 req/min)
   - Geo-blocking (if needed)
   - Challenge suspicious requests
   ```

## Deployment Procedures

### Standard Deployment

**For main branch merge**:

1. **Pre-Deployment**
   ```bash
   # Ensure all tests pass
   pnpm check:deploy

   # Verify no breaking changes
   pnpm build
   ```

2. **Merge PR**
   - Review and approve PR
   - Merge to main
   - CI/CD automatically deploys

3. **Post-Deployment**
   - Monitor error rates in Sentry
   - Check performance metrics
   - Verify critical flows work
   - Announce deployment (Slack/Discord)

### Database Migration Deployment

**When migrations are involved**:

1. **Review Migration**
   ```bash
   # Check migration SQL
   cat supabase/migrations/YYYYMMDDHHMMSS_description.sql

   # Verify no DROP statements without backups
   # Verify RLS policies are correct
   ```

2. **Test Locally**
   ```bash
   # Apply to local Supabase
   supabase db reset

   # Run tests
   pnpm test:rls
   ```

3. **Backup Production**
   ```bash
   # Manual backup before risky migrations
   # Download from Supabase dashboard or:
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

4. **Deploy Migration**
   ```bash
   # Deploy via CLI
   supabase db push

   # Or via GitHub Actions (automatic)
   git push origin main
   ```

5. **Verify**
   ```bash
   # Check migration applied
   supabase migration list

   # Test with real queries
   psql $DATABASE_URL -c "SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5;"
   ```

### Edge Function Deployment

1. **Test Function Locally**
   ```bash
   # Start local Supabase
   supabase start

   # Test function
   supabase functions serve whatsapp-send-otp

   # Call function
   curl -X POST http://localhost:54321/functions/v1/whatsapp-send-otp \
     -H "Authorization: Bearer $ANON_KEY" \
     -d '{"phoneNumber": "+250..."}'
   ```

2. **Deploy Function**
   ```bash
   # Deploy single function
   supabase functions deploy whatsapp-send-otp

   # Deploy all functions
   supabase functions deploy
   ```

3. **Set Secrets**
   ```bash
   # Set environment variables for function
   supabase secrets set OPENAI_API_KEY=xxx
   supabase secrets set META_WHATSAPP_ACCESS_TOKEN=xxx
   ```

4. **Test in Production**
   ```bash
   # Call production function
   curl -X POST https://your-project.supabase.co/functions/v1/whatsapp-send-otp \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -d '{"phoneNumber": "+250..."}'
   ```

### Mobile App Deployment

#### Android (Google Play)

1. **Build APK/AAB**
   ```bash
   cd apps/client
   ./build-android-aab.sh
   ```

2. **Test Build**
   ```bash
   # Install on device
   adb install build/app-release.aab
   ```

3. **Upload to Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create release (internal/beta/production)
   - Upload AAB file
   - Fill in release notes
   - Submit for review

#### iOS (App Store)

1. **Archive Build**
   ```bash
   cd apps/client
   ./build-ios-ipa.sh
   ```

2. **Upload to App Store Connect**
   ```bash
   xcrun altool --upload-app -f build/App.ipa \
     --username YOUR_APPLE_ID \
     --password APP_SPECIFIC_PASSWORD
   ```

3. **Submit for Review**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Select build
   - Fill in app information
   - Submit for review

## Monitoring & Alerting

### Application Monitoring

**Sentry**: Error tracking and performance

```typescript
// Configured in sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  environment: process.env.APP_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ]
});
```

**Alerts**:
- Error rate > 1% → Slack notification
- Response time > 2s p95 → Email alert
- Crash-free rate < 99% → PagerDuty

### Infrastructure Monitoring

**Supabase Dashboard**:
- Database CPU usage
- Connection count
- Query performance
- Storage usage

**Vercel Analytics**:
- Page load times
- Core Web Vitals
- Function execution times
- Bandwidth usage

### Custom Metrics

**PostHog**: Product analytics

```typescript
// Track custom events
import { trackEvent } from '@/lib/analytics/track';

trackEvent('payment_completed', {
  amount: 5000,
  currency: 'RWF',
  method: 'momo'
});
```

**Prometheus + Grafana**: Infrastructure metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'supabase'
    static_configs:
      - targets: ['supabase:9090']
```

## Rollback Procedures

### Web App Rollback

**Vercel/Cloudflare**:

1. **Via Dashboard**
   - Go to Deployments
   - Find previous successful deployment
   - Click "Promote to Production"

2. **Via CLI**
   ```bash
   # List deployments
   vercel ls

   # Promote specific deployment
   vercel promote <deployment-url>
   ```

3. **Via Git**
   ```bash
   # Revert commit
   git revert <bad-commit-hash>
   git push origin main
   # Auto-deploys previous working version
   ```

### Database Rollback

**WARNING**: Database rollbacks are complex!

1. **Backup First**
   ```bash
   # Always have a backup before rollback
   pg_dump $DATABASE_URL > pre_rollback_backup.sql
   ```

2. **Rollback Migration**
   ```bash
   # Down migration (if available)
   supabase migration down

   # Or restore from backup
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Verify**
   ```bash
   # Check data integrity
   psql $DATABASE_URL -c "SELECT count(*) FROM members;"
   ```

### Edge Function Rollback

**Option 1**: Redeploy previous version

```bash
# Checkout previous version
git checkout <previous-commit>

# Redeploy function
supabase functions deploy whatsapp-send-otp

# Return to main
git checkout main
```

**Option 2**: Disable function temporarily

```bash
# Update function to return error
# Deploy quick hotfix
# Investigate issue
# Deploy fix
```

## Production Readiness Checklist

### Pre-Launch

#### Security
- [ ] All secrets in environment variables (not committed)
- [ ] HTTPS enforced on all domains
- [ ] RLS policies tested and verified
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Content Security Policy (CSP) headers set
- [ ] Secrets rotated from default values

#### Performance
- [ ] Lighthouse score > 90 for PWA, Performance, Accessibility
- [ ] Images optimized (WebP/AVIF)
- [ ] Code splitting implemented
- [ ] Bundle sizes within budget (<500KB initial)
- [ ] Service worker caching configured
- [ ] CDN configured and tested

#### Monitoring
- [ ] Sentry configured with correct DSN
- [ ] PostHog analytics tracking events
- [ ] Error alerting configured (Slack/email)
- [ ] Uptime monitoring enabled
- [ ] Performance budgets defined
- [ ] Log aggregation working

#### Database
- [ ] Backups configured (daily)
- [ ] Point-in-time recovery tested
- [ ] RLS policies verified
- [ ] Indexes on high-query columns
- [ ] Connection pooling configured
- [ ] Migration rollback plan documented

#### Infrastructure
- [ ] Custom domain configured
- [ ] SSL certificates valid
- [ ] DNS propagated
- [ ] Email delivery tested
- [ ] WhatsApp API credentials valid
- [ ] Push notifications working

#### Documentation
- [ ] API documentation complete
- [ ] Deployment procedures documented
- [ ] Runbooks for common issues
- [ ] Contact list for emergencies
- [ ] Architecture diagrams up to date

### Post-Launch

#### Week 1
- [ ] Monitor error rates daily
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Address critical bugs
- [ ] Update documentation with learnings

#### Month 1
- [ ] Review monitoring data
- [ ] Optimize slow queries
- [ ] Improve error handling
- [ ] Plan next iteration
- [ ] Conduct retrospective

## Emergency Procedures

### Critical Bug in Production

1. **Assess Impact**
   - How many users affected?
   - Is data at risk?
   - Can we rollback safely?

2. **Quick Fix Options**
   ```bash
   # Option A: Hotfix branch
   git checkout -b hotfix/critical-bug
   # Fix bug, test locally
   git commit -m "fix: critical bug"
   git push origin hotfix/critical-bug
   # Fast-track merge to main

   # Option B: Rollback
   # See Rollback Procedures above
   ```

3. **Communication**
   - Post status to #incidents channel
   - Update status page
   - Notify affected users (if needed)

### Database Corruption

1. **Stop Writes**
   ```bash
   # Temporarily disable write operations
   # Put app in read-only mode
   ```

2. **Assess Damage**
   ```sql
   -- Check data integrity
   SELECT * FROM pg_stat_database;
   
   -- Find corrupted tables
   VACUUM ANALYZE;
   ```

3. **Restore from Backup**
   ```bash
   # Restore latest backup
   psql $DATABASE_URL < latest_backup.sql
   ```

### Service Outage

1. **Check Status Pages**
   - Vercel: https://vercel-status.com
   - Supabase: https://status.supabase.com
   - Cloudflare: https://cloudflarestatus.com

2. **Notify Users**
   - Update status page
   - Post on social media
   - Send email if extended

3. **Document Incident**
   - What happened?
   - What was the impact?
   - What did we learn?
   - How do we prevent it?

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Documentation](https://developers.cloudflare.com)
- [GitHub Actions Documentation](https://docs.github.com/actions)

## Support

For deployment issues:

- Check deployment logs in dashboard
- Review error messages in Sentry
- Consult runbooks for common problems
- Contact DevOps team: devops@ibimina.rw
- Emergency: On-call engineer (PagerDuty)

# Production Deployment Guide - Ibimina SACCO+ Platform

## Overview

This guide covers deploying all Ibimina applications to production hosting
platforms.

**Applications**:

- **Admin PWA** (apps/admin) - Staff administration console → staff.ibimina.rw
- **Client PWA** (apps/client) - Member-facing app → app.ibimina.rw
- **Website** (apps/website) - Public marketing site → ibimina.rw
- **Android Apps** - Mobile versions of Admin and Client apps

**Recommended Stack**:

- Hosting: Cloudflare Pages (primary) or Vercel
- Database: Supabase (PostgreSQL + Edge Functions)
- CDN: Cloudflare
- Mobile: Google Play Store

## Prerequisites

✅ All 89 database migrations run on Supabase production database  
✅ Production Supabase project created and configured  
✅ Domain names registered and DNS accessible  
✅ Production environment variables ready (see below)  
✅ Code tested in staging environment  
✅ SSL certificates (auto-handled by platforms)

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/ikanisa/ibimina.git
cd ibimina

# 2. Install dependencies
pnpm install

# 3. Build shared packages (only those with build scripts)
pnpm --filter @ibimina/core run build
pnpm --filter @ibimina/config run build
pnpm --filter @ibimina/ui run build

# 4. Deploy each app (see detailed instructions below)
# Admin: See "Admin App" section
# Client: See "Client App" section
# Website: See "Website" section
```

## Environment Variables

### Required for All Apps

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Encryption (generate: openssl rand -base64 32)
KMS_DATA_KEY=xxx
BACKUP_PEPPER=xxx
MFA_SESSION_SECRET=xxx
TRUSTED_COOKIE_SECRET=xxx
HMAC_SHARED_SECRET=xxx

# Environment
NODE_ENV=production
```

### App-Specific

```bash
# Admin App
NEXT_PUBLIC_APP_URL=https://staff.ibimina.rw
MFA_RP_ID=staff.ibimina.rw
MFA_RP_NAME="Ibimina Staff Console"

# Client App
NEXT_PUBLIC_APP_URL=https://app.ibimina.rw
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx

# Website
NEXT_PUBLIC_APP_URL=https://ibimina.rw
```

## Deployment to Cloudflare Pages

### Admin App

```bash
# 1. Build for Cloudflare (uses @cloudflare/next-on-pages)
cd apps/admin
pnpm run build:cloudflare

# 2. Deploy to Cloudflare Pages
pnpm run deploy:cloudflare
# OR manually:
# npx wrangler pages deploy .vercel/output/static --project-name=ibimina-admin

# 3. Add custom domain in Cloudflare dashboard
# Pages → ibimina-admin → Custom domains → Add: staff.ibimina.rw
```

### Client App

```bash
# 1. Build for Cloudflare (uses @cloudflare/next-on-pages)
cd apps/client
pnpm run build:cloudflare

# 2. Deploy to Cloudflare Pages
pnpm run deploy:cloudflare
# OR manually:
# npx wrangler pages deploy .vercel/output/static --project-name=ibimina-client

# 3. Configure domain in Cloudflare dashboard: app.ibimina.rw
```

### Website

```bash
# 1. Build static export
cd apps/website
pnpm run build

# 2. Deploy to Cloudflare Pages
npx wrangler pages deploy out --project-name=ibimina-website

# 3. Configure apex domain: ibimina.rw
```

## Deployment to Vercel

### All Apps at Once

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel --prod

# Vercel auto-detects the monorepo and deploys all apps
```

### Individual Apps

```bash
# Admin
cd apps/admin && vercel --prod

# Client
cd apps/client && vercel --prod

# Website
cd apps/website && vercel --prod
```

### Vercel Configuration

Create `vercel.json` in root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/admin/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "apps/client/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "apps/website/package.json",
      "use": "@vercel/next"
    }
  ]
}
```

## Android App Builds

### Prerequisites

- Java 17+
- Android SDK
- Gradle 8+
- Local machine (not Replit)

### Build Script Usage

```bash
# 1. Run automated build script
./build-android.sh

# 2. Select app:
#    1) Admin (Ibimina Staff)
#    2) Client (Ibimina Client)
Select: 2

# 3. Select build type:
#    1) Debug
#    2) Release
Select: 2

# 4. Enter production URL
URL: https://app.ibimina.rw

# 5. APK generated at:
# apps/client/android/app/build/outputs/apk/release/app-release.apk
```

### Manual Build (if script fails)

```bash
# First: Install dependencies and build shared packages
cd /path/to/ibimina
pnpm install
pnpm --filter @ibimina/core run build
pnpm --filter @ibimina/config run build
pnpm --filter @ibimina/ui run build

# Then: Admin App
cd apps/admin
pnpm run build
npx cap sync android
cd android
./gradlew clean assembleRelease

# OR: Client App
cd /path/to/ibimina/apps/client
pnpm run build
npx cap sync android
cd android
./gradlew clean assembleRelease
```

### Play Store Submission

1. Sign APKs with your keystore
2. Create app listings
3. Upload to internal testing track
4. Beta test with SACCO staff
5. Production release after validation

See `BUILD_ANDROID.md` for detailed instructions.

## Database Migration

### Production Migration Workflow

```bash
# 1. BACKUP PRODUCTION FIRST
npx supabase db dump --db-url "$PROD_URL" > backup.sql

# 2. Test on staging
npx supabase db push --db-url "$STAGING_URL"

# 3. Verify staging works
# Run smoke tests

# 4. Apply to production (maintenance window)
npx supabase db push --db-url "$PROD_URL"

# 5. Verify production
# Test critical flows

# 6. Rollback if needed
psql "$PROD_URL" < backup.sql
```

## Deployment Checklist

### Pre-Deployment

- [ ] Tests passing (E2E, unit, database)
- [ ] Code reviewed
- [ ] Security audit done
- [ ] Performance benchmarks met
- [ ] Migrations tested in staging
- [ ] Environment variables set
- [ ] Backup strategy ready
- [ ] Rollback plan documented

### Deployment

- [ ] Run database migrations
- [ ] Deploy Admin app
- [ ] Deploy Client app
- [ ] Deploy Website
- [ ] Configure DNS/domains
- [ ] Enable monitoring
- [ ] Test critical flows
- [ ] Verify analytics
- [ ] Check error logging

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Performance normal
- [ ] Error rates acceptable
- [ ] Database optimized
- [ ] CDN caching works
- [ ] Mobile apps functional
- [ ] Support team notified
- [ ] Documentation updated

## Monitoring

### Supabase Analytics

```typescript
// Track custom events
supabase.from("analytics_events").insert({
  event_type: "loan_application",
  user_id: userId,
  metadata: { amount, duration },
});
```

### Error Tracking

Recommended tools:

- Sentry - Error tracking
- LogRocket - Session replay
- Datadog - Infrastructure monitoring

### Performance Monitoring

```typescript
// apps/admin/middleware.ts
export function middleware(req: NextRequest) {
  const start = Date.now();

  return NextResponse.next({
    headers: {
      "X-Response-Time": `${Date.now() - start}ms`,
    },
  });
}
```

## Rollback Procedures

### Cloudflare Pages

```bash
# CLI rollback
npx wrangler pages rollback ibimina-admin

# Or use dashboard:
# Pages → Deployments → Previous → Rollback
```

### Vercel

```bash
# Rollback to previous deployment
vercel rollback <previous-deployment-url>

# Or promote in dashboard
```

### Database Rollback

```bash
# Restore from backup
psql "$DATABASE_URL" < backup-20251031.sql
```

## Performance Optimization

### CDN Caching

```typescript
// next.config.mjs
export default {
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, immutable",
          },
        ],
      },
    ];
  },
};
```

### Database Indexing

```sql
-- Add indexes for common queries
CREATE INDEX idx_members_sacco ON ikimina_members(sacco_id);
CREATE INDEX idx_payments_date ON payments(created_at DESC);
CREATE INDEX idx_loans_status ON loans(status) WHERE status = 'pending';
```

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/images/logo.png"
  width={200}
  height={50}
  alt="Logo"
  priority
  quality={85}
/>
```

## Security Hardening

### Content Security Policy

```typescript
// middleware.ts
response.headers.set(
  "Content-Security-Policy",
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
);
```

### Rate Limiting

Use Cloudflare Rate Limiting rules or implement custom:

```typescript
// API route
export async function POST(req: Request) {
  const ip = req.headers.get("CF-Connecting-IP");

  // Check rate limit
  const allowed = await checkRateLimit(ip, "10/minute");
  if (!allowed) {
    return new Response("Too many requests", { status: 429 });
  }

  // Process request
}
```

### Secrets Rotation

Schedule regular rotation:

- Supabase keys: Every 90 days
- Encryption keys: Every 180 days
- Service role key: After security incidents
- OAuth secrets: Every 90 days

## Troubleshooting

### Build Failures

```bash
# Clear caches
pnpm run clean
rm -rf node_modules .next out
pnpm install
pnpm run build
```

### Environment Variable Issues

```bash
# Verify required vars
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

### Database Connection Issues

```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Check RLS policies
psql "$DATABASE_URL" -c "SELECT * FROM pg_policies;"
```

## Support

- Documentation: `/docs` directory
- GitHub: https://github.com/ikanisa/ibimina
- Supabase: https://supabase.com/support

---

**Last Updated**: 2025-10-31  
**Version**: 1.0  
**Environment**: Production

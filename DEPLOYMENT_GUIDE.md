# SACCO+ Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying and accessing all
three applications in the Ibimina/SACCO+ system:

1. **Admin/Staff App** - Port 3000
2. **Client App** - Port 3001
3. **Platform API** - Background workers

## Prerequisites

### System Requirements

- **Node.js**: v18.18.0 or higher (use `nvm use` to switch)
- **pnpm**: v10.19.0 exactly
- **Docker**: Latest version (optional, for containerized deployment)
- **Supabase CLI**: Latest version (for local database)

### External Services

- **Supabase Project**: Database, Auth, Storage, Edge Functions
- **Domain/SSL**: HTTPS required for production (PWA requirement)
- **OCR Service**: Google Vision API or AWS Textract (optional for client app)
- **WhatsApp Business API**: Meta direct integration for notifications

---

## Environment Configuration

### Shared Variables (All Apps)

Create a root `.env` file with shared configuration:

```bash
# Supabase Configuration (shared)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

# Environment
NODE_ENV=production
APP_ENV=production

# Security Keys (generate with: openssl rand -hex 32 or openssl rand -base64 32)
KMS_DATA_KEY_BASE64=your-base64-32-byte-key
BACKUP_PEPPER=your-backup-pepper-hex
MFA_SESSION_SECRET=your-mfa-session-secret-hex
TRUSTED_COOKIE_SECRET=your-trusted-cookie-secret-hex
HMAC_SHARED_SECRET=your-hmac-shared-secret-hex

# Optional: Build metadata
GIT_COMMIT_SHA=${GITHUB_SHA:-local}
NEXT_PUBLIC_BUILD_ID=${GIT_COMMIT_SHA}
```

### App-Specific Variables

#### Admin App (`apps/admin/.env.local`)

```bash
# Port (optional, defaults to 3000)
PORT=3100

# Admin-specific features
ADMIN_USE_STANDALONE_START=1

# MFA Configuration
MFA_RP_ID=your-domain.com
MFA_ORIGIN=https://your-domain.com
MFA_RP_NAME="SACCO+ Staff Console"

# Email OTP (if using email MFA)
EMAIL_OTP_PEPPER=your-email-otp-pepper
RESEND_API_KEY=your-resend-api-key
MFA_EMAIL_FROM=noreply@your-domain.com

# AI Features (optional)
OPENAI_API_KEY=sk-your-openai-key

# Report Signing
REPORT_SIGNING_KEY=your-report-signing-key
```

#### Client App (`apps/client/.env.local`)

```bash
# Port (required for client app)
PORT=3001

# Web Push Notifications
# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAG_WEB_PUSH=true
NEXT_PUBLIC_FEATURE_FLAG_BETA_FEATURES=false

# OCR Service (if integrated)
GOOGLE_VISION_API_KEY=your-google-vision-key
# OR
AWS_TEXTRACT_ACCESS_KEY=your-aws-access-key
AWS_TEXTRACT_SECRET_KEY=your-aws-secret-key
```

#### Platform API (`apps/platform-api/.env`)

```bash
# No port needed (workers, not HTTP server)

# Worker Configuration
MOMO_POLL_INTERVAL_MS=30000
GSM_HEARTBEAT_INTERVAL_MS=60000

# Mobile Money API
MOMO_API_URL=https://momo-api.example.com
MOMO_API_KEY=your-momo-api-key
MOMO_API_SECRET=your-momo-api-secret

# SMS Gateway
GSM_MODEM_PORT=/dev/ttyUSB0
GSM_MODEM_BAUDRATE=115200

# WhatsApp Business API (Meta direct integration)
META_WHATSAPP_ACCESS_TOKEN=your-meta-access-token
META_WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
META_WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
```

---

## Local Development

### 1. Install Dependencies

```bash
# Clone repository
git clone https://github.com/ikanisa/ibimina.git
cd ibimina

# Use correct Node version
nvm use

# Install pnpm globally
npm install -g pnpm@10.19.0

# Install all dependencies
pnpm install
```

### 2. Configure Environment

```bash
# Copy environment examples
cp .env.example .env
cp apps/admin/.env.example apps/admin/.env.local
cp apps/client/.env.example apps/client/.env.local
cp apps/platform-api/.env.example apps/platform-api/.env

# Edit files with your values
nano .env
nano apps/admin/.env.local
nano apps/client/.env.local
nano apps/platform-api/.env
```

### 3. Start Local Supabase (Optional)

```bash
# Start local Supabase instance
supabase start

# Apply migrations
supabase db reset

# Note the local URLs and update your .env files:
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
```

### 4. Run Development Servers

```bash
# Terminal 1: Admin app
pnpm --filter @ibimina/admin dev
# Access at http://localhost:3100

# Terminal 2: Client app
pnpm --filter @ibimina/client dev
# Access at http://localhost:3001

# Terminal 3: Platform API workers
pnpm --filter @ibimina/platform-api dev
# Runs in background (no HTTP interface)
```

### 5. Verify Setup

```bash
# Check admin app
curl http://localhost:3100/api/health

# Check client app
curl http://localhost:3001/api/health

# Check apps are running
ps aux | grep next
```

---

## Production Deployment

### Option 1: Traditional Server Deployment

#### Step 1: Build Applications

```bash
# Build all apps
pnpm run build

# Verify builds
ls -la apps/admin/.next
ls -la apps/client/.next
ls -la apps/platform-api/dist
```

#### Step 2: Deploy Admin App

```bash
# On production server
cd apps/admin

# Set environment variables
export NODE_ENV=production
export PORT=3100
# ... (set all required vars)

# Start app
pnpm start
# OR use standalone mode
node .next/standalone/apps/admin/server.js

# Use PM2 for process management
pm2 start pnpm --name admin-app -- start
pm2 save
pm2 startup
```

#### Step 3: Deploy Client App

```bash
# On production server
cd apps/client

# Set environment variables
export NODE_ENV=production
export PORT=3001
# ... (set all required vars)

# Start app
pnpm start

# Use PM2
pm2 start pnpm --name client-app --env production -- start
pm2 save
```

#### Step 4: Deploy Platform API Workers

```bash
# On production server
cd apps/platform-api

# Set environment variables
export NODE_ENV=production
# ... (set all required vars)

# Start workers
pm2 start npm --name platform-api-workers -- run worker:momo
pm2 start npm --name platform-api-gsm -- run worker:gsm
pm2 save
```

#### Step 5: Configure Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/sacco-plus

# Admin App
server {
    listen 443 ssl http2;
    server_name admin.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Client App
server {
    listen 443 ssl http2;
    server_name app.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site and reload Nginx
sudo ln -s /etc/nginx/sites-available/sacco-plus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2: Docker Deployment

#### Create Docker Images

Create `apps/admin/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm@10.19.0

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json apps/admin/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @ibimina/admin build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public
USER nextjs
EXPOSE 3100
ENV PORT=3100
CMD ["node", "apps/admin/server.js"]
```

Similar Dockerfiles for client and platform-api.

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  admin:
    build:
      context: .
      dockerfile: apps/admin/Dockerfile
    ports:
      - "3100:3100"
    env_file:
      - .env
      - apps/admin/.env.local
    restart: unless-stopped
    depends_on:
      - supabase

  client:
    build:
      context: .
      dockerfile: apps/client/Dockerfile
    ports:
      - "3001:3001"
    env_file:
      - .env
      - apps/client/.env.local
    restart: unless-stopped
    depends_on:
      - supabase

  platform-api:
    build:
      context: .
      dockerfile: apps/platform-api/Dockerfile
    env_file:
      - .env
      - apps/platform-api/.env
    restart: unless-stopped
    depends_on:
      - supabase

  # Optional: Local Supabase
  supabase:
    image: supabase/postgres:15.1.0.117
    ports:
      - "54321:5432"
    environment:
      POSTGRES_PASSWORD: your-postgres-password
    volumes:
      - supabase-data:/var/lib/postgresql/data

volumes:
  supabase-data:
```

```bash
# Deploy with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Scale workers if needed
docker-compose up -d --scale platform-api=3
```

### Option 3: Cloud Platform Deployment

#### Railway / Render / Fly.io

All three platforms support:

- Node.js apps
- Background workers
- Environment variables
- Custom domains

Follow their respective documentation for deployment.

---

## Access Guide

### Admin App Access

**URL**: https://admin.your-domain.com (or http://localhost:3100)

**Login Flow**:

1. Navigate to login page
2. Enter staff email and password
3. Complete MFA challenge (TOTP, Passkey, Email, or Backup code)
4. Access main dashboard

**User Roles**:

- **Staff**: Access to assigned SACCO(s) data
- **Admin**: Full system access, can manage staff and settings

**First-Time Setup**:

1. Create staff account in Supabase Auth
2. Assign role in `user_profiles` table
3. Link to SACCO in `sacco_staff` table
4. User sets up MFA on first login

### Client App Access

**URL**: https://app.your-domain.com (or http://localhost:3001)

**Onboarding Flow**:

1. Navigate to welcome page
2. Click "Get Started"
3. Enter WhatsApp and Mobile Money numbers
4. Upload ID document (if OCR integrated)
5. Review and submit
6. Access member dashboard

**Member Features**:

- View groups (ikimina)
- Make payments (USSD instructions)
- View transaction history
- Manage profile

**Mobile Installation**:

- **Android**: Use "Add to Home Screen" or TWA
- **iOS**: Use "Add to Home Screen" from Safari share menu

### Platform API Access

**No direct access** - runs as background workers.

**Monitoring**:

```bash
# Check worker status
pm2 status

# View logs
pm2 logs platform-api-workers
pm2 logs platform-api-gsm

# Restart workers
pm2 restart platform-api-workers
```

**Health Checks**:

- Workers log heartbeat to Supabase
- Monitor `worker_health` table
- Set up alerts for missed heartbeats

---

## Health Checks

### Admin App

```bash
# Health endpoint
curl https://admin.your-domain.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-10-28T13:00:00.000Z",
  "version": "0.1.2",
  "commit": "abc123"
}
```

### Client App

```bash
# Health endpoint
curl https://app.your-domain.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-10-28T13:00:00.000Z",
  "version": "0.1.0"
}
```

### Platform API

```sql
-- Query worker heartbeats in Supabase
SELECT * FROM worker_health
WHERE last_heartbeat > NOW() - INTERVAL '5 minutes'
ORDER BY last_heartbeat DESC;
```

---

## Troubleshooting

### Common Issues

#### 1. Apps won't start

```bash
# Check Node version
node --version  # Should be >= 18.18.0

# Check pnpm version
pnpm --version  # Should be 10.19.0

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

#### 2. Build failures

```bash
# Clear Next.js cache
rm -rf apps/admin/.next apps/client/.next

# Rebuild
pnpm run build
```

#### 3. Supabase connection errors

```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test Supabase connection
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/
```

#### 4. MFA not working (admin app)

```bash
# Verify MFA secrets are set
echo $MFA_SESSION_SECRET
echo $BACKUP_PEPPER

# Check MFA RP ID matches domain
echo $MFA_RP_ID  # Should match your domain
```

#### 5. Service worker not registering (client app)

- Ensure HTTPS is enabled (required for service workers)
- Check browser console for errors
- Clear browser cache and reload
- Verify `service-worker.js` is accessible

#### 6. Workers not running (platform API)

```bash
# Check PM2 status
pm2 status

# View detailed logs
pm2 logs platform-api-workers --lines 100

# Restart workers
pm2 restart all
```

---

## Security Checklist

- [ ] All secrets stored securely (not in version control)
- [ ] HTTPS enabled on all domains
- [ ] Supabase RLS policies verified
- [ ] Rate limiting configured
- [ ] CORS policies set correctly
- [ ] CSP headers configured
- [ ] Admin MFA enforced
- [ ] Service role keys protected (server-side only)
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Logs centralized and secured
- [ ] Regular security audits scheduled

---

## Monitoring and Observability

### Metrics to Track

**Admin App**:

- Request rate and latency
- Authentication success/failure rate
- MFA enrollment rate
- Database query performance
- Error rate by endpoint

**Client App**:

- Page load times
- PWA install rate
- Service worker registration success
- Offline usage patterns
- Payment flow completion rate

**Platform API**:

- Worker uptime
- Job execution time
- MoMo polling success rate
- GSM heartbeat status
- Error rate by worker

### Logging

All apps use structured logging. Configure log aggregation:

```bash
# Option 1: File-based logging (simple)
pm2 install pm2-logrotate

# Option 2: Centralized logging (recommended)
# - Grafana Loki
# - ELK Stack (Elasticsearch, Logstash, Kibana)
# - DataDog / New Relic
```

### Alerting

Set up alerts for:

- App downtime
- High error rates
- Failed authentication attempts
- Worker failures
- Database connection issues
- Disk space / memory usage

---

## Backup and Recovery

### Database Backups

```bash
# Manual backup (Supabase)
supabase db dump -f backup-$(date +%Y%m%d).sql

# Automated backups
# Configure in Supabase dashboard or use pg_dump cron job
```

### Application State

```bash
# Admin app: No local state (stateless)
# Client app: Local storage backed by service worker
# Platform API: No state (jobs are idempotent)
```

### Disaster Recovery

1. Restore database from latest backup
2. Redeploy applications from main branch
3. Verify environment variables
4. Run health checks
5. Monitor for issues

---

## Scaling Considerations

### Horizontal Scaling

**Admin App**:

- Can scale horizontally behind load balancer
- Ensure session affinity if using in-memory sessions
- Use Redis for shared session store if needed

**Client App**:

- Fully stateless, scales easily
- Use CDN for static assets
- Consider edge deployment (Cloudflare Workers, AWS Lambda@Edge)

**Platform API**:

- Workers can run in parallel
- Implement job locking to prevent duplicate processing
- Use message queue (Redis, RabbitMQ) for task distribution

### Database Scaling

- Supabase handles connection pooling
- Add read replicas for heavy read workloads
- Consider partitioning large tables (payments, audit logs)
- Implement caching layer (Redis) for frequently accessed data

---

## Maintenance

### Regular Tasks

**Daily**:

- Monitor error logs
- Check worker health
- Review performance metrics

**Weekly**:

- Review security alerts
- Check database performance
- Update dependencies (security patches)
- Test backups

**Monthly**:

- Review access logs
- Update documentation
- Performance tuning
- Capacity planning

---

## Support

For deployment issues:

1. Check this guide first
2. Review logs for error messages
3. Check GitHub Issues for known problems
4. Contact development team if needed

---

## Appendix

### Useful Commands

```bash
# Development
pnpm dev                  # Start admin app
pnpm --filter @ibimina/client dev   # Start client app
pnpm --filter @ibimina/platform-api dev  # Start workers

# Building
pnpm run build            # Build all apps
pnpm --filter @ibimina/admin build  # Build admin only

# Testing
pnpm run test            # Run all tests
pnpm run test:e2e        # E2E tests (admin)
pnpm run lint            # Lint all code
pnpm run typecheck       # Type check all code

# Production
pnpm start               # Start admin app
pnpm --filter @ibimina/client start  # Start client app

# Maintenance
pnpm install             # Install/update deps
pnpm outdated            # Check for updates
pnpm update              # Update dependencies
```

### Environment Variable Reference

See individual app `.env.example` files for complete lists:

- `/apps/admin/.env.example`
- `/apps/client/.env.example`
- `/apps/platform-api/.env.example`
- `/.env.example` (shared)

---

**Last Updated**: 2025-10-28

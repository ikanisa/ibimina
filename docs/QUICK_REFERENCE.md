# Production Deployment Quick Reference

**Version**: 1.0  
**Last Updated**: 2025-10-28

This document provides a quick reference for production deployment. For detailed
procedures, see the full documentation.

## 📚 Documentation Index

| Document                                                                       | Purpose                          | When to Use                        |
| ------------------------------------------------------------------------------ | -------------------------------- | ---------------------------------- |
| [docs/go-live/production-checklist.md](go-live/production-checklist.md)        | Comprehensive go-live checklist  | Before every production deployment |
| [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md)                          | Standard release procedures      | Regular deployments and releases   |
| [POST_DEPLOYMENT_VALIDATION.md](POST_DEPLOYMENT_VALIDATION.md)                 | Post-deploy verification         | Immediately after each deployment  |
| [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)                                   | Emergency procedures             | During incidents and disasters     |
| [SECURITY_HARDENING.md](SECURITY_HARDENING.md)                                 | Security configuration checklist | During initial setup and audits    |
| [go-live/supabase-go-live-checklist.md](go-live/supabase-go-live-checklist.md) | Supabase-specific setup          | Initial Supabase configuration     |

## 🚀 Quick Start: First Production Deployment

### Step 1: Pre-Flight Checks (30 minutes)

```bash
# Run automated validation
pnpm run validate:production

# Run comprehensive deployment checks
pnpm run check:deploy
# or
make ready
```

### Step 2: Review Checklists (60 minutes)

1. **Security First**: Review [SECURITY_HARDENING.md](SECURITY_HARDENING.md)
   - Generate all secrets
   - Configure encryption
   - Set up MFA
   - Enable audit logging

2. **Infrastructure**: Check
   [docs/go-live/production-checklist.md](go-live/production-checklist.md)
   Sections 6-8
   - Server provisioned
   - SSL configured
   - Reverse proxy set up
   - Firewall configured

3. **Database**: Review
   [go-live/supabase-go-live-checklist.md](go-live/supabase-go-live-checklist.md)
   - Migrations applied
   - Secrets set in Supabase
   - Edge functions deployed
   - RLS policies tested

### Step 3: Deploy (30-60 minutes)

```bash
# 1. Tag the release
git tag -a v1.0.0 -m "Production release v1.0.0"
git push --tags

# 2. Build the application
pnpm install --frozen-lockfile
pnpm run build

# 3. Deploy (method varies by infrastructure)
# Docker:
docker-compose up -d

# PM2:
pm2 start ecosystem.config.js

# Systemd:
sudo systemctl start ibimina-admin
```

### Step 4: Validate (30-45 minutes)

Follow [POST_DEPLOYMENT_VALIDATION.md](POST_DEPLOYMENT_VALIDATION.md):

```bash
# Quick health check
curl https://your-domain.com/api/health

# Test critical paths
# - Login
# - Dashboard
# - User operations
# - Reports
```

## 📝 Essential Commands

### Development

```bash
pnpm dev                    # Start dev server
pnpm build                  # Production build (Expected: ~5s cached, ~2min fresh)
pnpm start                  # Start production server
```

### Testing

```bash
pnpm run lint              # Lint code (Expected: ~8s)
pnpm run typecheck         # Type check (Expected: ~12s)
pnpm run test              # All tests (Expected: 84 tests pass in ~6s)
pnpm run test:unit         # Unit tests only (Expected: ~6s)
pnpm run test:e2e          # E2E tests (Expected: ~30s)
pnpm run test:rls          # RLS tests (Expected: ~10s)
pnpm run test:auth         # Auth security tests (Expected: ~5s)
```

### Validation

```bash
pnpm run validate:production  # Production readiness check (Expected: ~30s)
pnpm run check:deploy        # Comprehensive deployment check (Expected: ~5-7min)
make ready                   # Same as check:deploy
```

### Package Management

```bash
pnpm install               # Install dependencies (Expected: ~62s fresh, ~15s cached)
pnpm -r run build          # Build all packages in order (Expected: ~90s fresh)
```

### Supabase

```bash
# Link project
supabase link --project-ref $SUPABASE_PROJECT_REF

# Apply migrations
supabase migration up --linked --include-all

# Set secrets
supabase secrets set --env-file supabase/.env.production

# Deploy functions
./apps/admin/scripts/supabase-go-live.sh deploy-functions
```

## 🔑 Required Environment Variables

### Critical (Must Have)

```bash
# Application
APP_ENV=production
NODE_ENV=production
PORT=3000  # Default port, can be overridden

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security (generate with: openssl rand -base64 32 or openssl rand -hex 32)
KMS_DATA_KEY_BASE64=32-byte-base64-key
BACKUP_PEPPER=32-byte-hex
MFA_SESSION_SECRET=32-byte-hex
TRUSTED_COOKIE_SECRET=32-byte-hex
HMAC_SHARED_SECRET=32-byte-hex

# MFA Configuration
MFA_RP_ID=your-domain.com
MFA_ORIGIN=https://your-domain.com
MFA_RP_NAME=SACCO+
```

### Optional but Recommended

```bash
# Analytics
ANALYTICS_CACHE_TOKEN=random-token

# AI Features
OPENAI_API_KEY=sk-your-key

# Logging
LOG_DRAIN_URL=https://your-log-service.com
LOG_DRAIN_TOKEN=your-token

# Email
RESEND_API_KEY=your-resend-key
MFA_EMAIL_FROM=security@your-domain.com
```

## ✅ Critical Security Checklist

Before going live, verify:

- [ ] All secrets rotated from defaults
- [ ] HTTPS enforced
- [ ] MFA enabled for admins
- [ ] RLS policies tested: `pnpm run test:rls`
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Audit logging enabled
- [ ] Backups configured and tested
- [ ] Monitoring and alerts active
- [ ] Firewall configured

## 🚨 Emergency Procedures

### Application Down

```bash
# 1. Check logs
pm2 logs --lines 100
# or
docker-compose logs --tail=100

# 2. Quick restart
pm2 restart all
# or
docker-compose restart

# 3. Check health
curl https://your-domain.com/api/health
```

### Rollback Required

```bash
# 1. Stop application
pm2 stop all

# 2. Checkout previous version
git checkout [previous-tag]
pnpm install --frozen-lockfile
pnpm run build

# 3. Rollback database (if needed)
supabase migration down --linked --to-version [timestamp]

# 4. Restart
pm2 start all

# 5. Verify
curl https://your-domain.com/api/health
```

### Database Issue

```bash
# Check Supabase status
curl https://your-project.supabase.co/rest/v1/

# Restore from backup (via Supabase dashboard)
# Database → Backups → Restore

# Verify restoration
psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM saccos;"
```

## 📊 Monitoring Endpoints

| Endpoint          | Purpose                        | Expected                                                 |
| ----------------- | ------------------------------ | -------------------------------------------------------- |
| `/api/health`     | Application and service health | HTTP 200, `{"status":"ok"}`, includes version and commit |
| Supabase REST API | Database connectivity          | HTTP 200                                                 |
| Prometheus        | Metrics                        | `ibimina_*` gauges populated                             |
| Grafana           | Dashboards                     | "Ibimina Operations" showing data                        |

## 📞 Emergency Contacts Template

| Role           | Name       | Contact    | Availability |
| -------------- | ---------- | ---------- | ------------ |
| Technical Lead | **\_\_\_** | **\_\_\_** | 24/7         |
| DevOps/SRE     | **\_\_\_** | **\_\_\_** | 24/7         |
| Security Lead  | **\_\_\_** | **\_\_\_** | On-call      |
| Database Admin | **\_\_\_** | **\_\_\_** | On-call      |

## 📈 Key Performance Indicators

Monitor these metrics post-deployment:

| Metric               | Target    | Alert Threshold |
| -------------------- | --------- | --------------- |
| Application Uptime   | >99.9%    | <99%            |
| Response Time (p95)  | <2s       | >3s             |
| Error Rate           | <0.1%     | >1%             |
| Database Connections | <80% pool | >90% pool       |
| SMS Queue Backlog    | 0         | >25             |
| CPU Usage            | <50%      | >80%            |
| Memory Usage         | <70%      | >85%            |
| Disk Space Free      | >20%      | <15%            |

## 🔄 Regular Maintenance Schedule

### Daily

- [ ] Check monitoring dashboards
- [ ] Review error logs
- [ ] Verify backup completion

### Weekly

- [ ] Review security alerts
- [ ] Check dependency updates
- [ ] Test backup restoration
- [ ] Review performance metrics

### Monthly

- [ ] Security audit
- [ ] Access review
- [ ] Update documentation
- [ ] Capacity planning

### Quarterly

- [ ] Disaster recovery drill
- [ ] Secret rotation
- [ ] Security training
- [ ] Penetration testing (if required)

## 🛠️ Troubleshooting Quick Reference

| Symptom          | Likely Cause         | Quick Fix                                    |
| ---------------- | -------------------- | -------------------------------------------- |
| 502/503 errors   | App not running      | Restart application                          |
| Slow responses   | Database queries     | Check connection pool, query performance     |
| Login fails      | MFA misconfiguration | Verify MFA_RP_ID matches domain              |
| PWA not working  | HTTPS issue          | Verify SSL certificate, check service worker |
| Data not showing | RLS policies         | Run `pnpm run test:rls`, check policies      |
| High memory      | Memory leak          | Restart app, investigate with profiler       |

## 📋 Pre-Deployment Checklist Summary

From [docs/go-live/production-checklist.md](go-live/production-checklist.md):

1. ✅ Code Quality & Security
2. 🔧 Environment Configuration
3. 🗄️ Database & Supabase Setup
4. 🔄 Edge Functions & Background Jobs
5. 📦 Build & Deployment Artifacts
6. 🖥️ Server & Hosting Configuration
7. 🌐 Network & Security
8. 🔒 Reverse Proxy Configuration
9. 📊 Monitoring Setup
10. 🚨 Alerting Configuration
11. 📈 Performance Baseline
12. 🔐 Authentication & Authorization
13. 🛡️ Data Protection
14. 👥 Access Control
15. ✅ Pre-Deployment Testing
16. 🎭 Deployment Dry Run

Complete all sections before deployment.

## 📖 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Production Checklist](https://nextjs.org/docs/deployment)
- [OWASP Security Guidelines](https://owasp.org/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

## Quick Action: First Production Deployment

Use this as your minimal path to production:

```bash
# 1. Validate
pnpm run validate:production

# 2. Generate secrets
openssl rand -base64 32  # KMS_DATA_KEY_BASE64
openssl rand -hex 32     # BACKUP_PEPPER
openssl rand -hex 32     # MFA_SESSION_SECRET
openssl rand -hex 32     # TRUSTED_COOKIE_SECRET
openssl rand -hex 32     # HMAC_SHARED_SECRET

# 3. Set environment variables in .env.production

# 4. Supabase setup
supabase link --project-ref $SUPABASE_PROJECT_REF
supabase migration up --linked --include-all
supabase secrets set --env-file supabase/.env.production
./apps/admin/scripts/supabase-go-live.sh deploy-functions

# 5. Build and deploy
pnpm install --frozen-lockfile
pnpm run build
pm2 start ecosystem.config.js  # or your deployment method

# 6. Verify
curl https://your-domain.com/api/health

# 7. Complete POST_DEPLOYMENT_VALIDATION.md checklist
```

---

**Remember**: This is a quick reference. Always follow the complete checklists
for production deployments.

**Last Updated**: 2025-10-28

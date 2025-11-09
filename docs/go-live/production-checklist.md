# Production Go-Live Checklist

**Last Updated**: 2025-10-28

This comprehensive checklist consolidates all requirements for production
deployment. Complete all items in order before going live.

> 📘 **Developer onboarding**: Run through
> [`../dev/getting-started.md`](../dev/getting-started.md) to provision your
> toolchain, environment variables, database, and Supabase types before checking
> off these items.

## Pre-Deployment Phase

### 1. Code Quality & Security ✅

- [ ] All CI checks passing (`pnpm run check:deploy` or `make ready`)
- [ ] No high/critical vulnerabilities in `pnpm audit`
- [ ] Code review completed and approved
- [ ] All security scanning tools passed (CodeQL, dependency scanning)
- [ ] No secrets or credentials in code
- [ ] All TODO/FIXME comments addressed or documented

### 2. Environment Configuration 🔧

- [ ] All required environment variables defined (see `.env.production.example`)
- [ ] Production secrets generated with cryptographically secure methods:
  ```bash
  # Generate required secrets
  openssl rand -base64 32  # KMS_DATA_KEY_BASE64
  openssl rand -hex 32     # BACKUP_PEPPER
  openssl rand -hex 32     # MFA_SESSION_SECRET
  openssl rand -hex 32     # TRUSTED_COOKIE_SECRET
  openssl rand -hex 32     # HMAC_SHARED_SECRET
  openssl rand -hex 32     # ANALYTICS_CACHE_TOKEN
  ```
- [ ] Supabase project configured with production credentials
- [ ] `APP_ENV=production` set
- [ ] `NODE_ENV=production` set
- [ ] Domain names and SSL certificates configured
- [ ] MFA configuration verified:
  - [ ] `MFA_RP_ID` matches production domain
  - [ ] `MFA_ORIGIN` matches production URL
  - [ ] `MFA_RP_NAME` set appropriately
- [ ] Email configuration verified (SMTP or Resend)
- [ ] Optional services configured (OpenAI, Twilio, log drain)

### 3. Database & Supabase Setup 🗄️

- [ ] Supabase project linked:
      `supabase link --project-ref $SUPABASE_PROJECT_REF`
- [ ] All migrations applied: `supabase migration up --linked --include-all`
- [ ] Database schema matches expected state
- [ ] Row Level Security (RLS) policies verified: `pnpm run test:rls`
- [ ] Umurenge SACCO master data seeded
- [ ] Test data removed from production database
- [ ] Database backups configured (automated daily backups)
- [ ] Point-in-time recovery (PITR) enabled
- [ ] Connection pooling configured

### 4. Edge Functions & Background Jobs 🔄

- [ ] All edge functions deployed:
      `./apps/admin/scripts/supabase-go-live.sh deploy-functions`
- [ ] Supabase secrets set:
      `supabase secrets set --env-file supabase/.env.production`
- [ ] Edge function secrets validated:
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `OPENAI_API_KEY`
  - [ ] `HMAC_SHARED_SECRET`
  - [ ] `KMS_DATA_KEY_BASE64`
  - [ ] `BACKUP_PEPPER`
  - [ ] All other required secrets
- [ ] Cron jobs scheduled:
  - [ ] `scheduled-reconciliation` (hourly: `0 * * * *`)
  - [ ] Other scheduled jobs as needed
- [ ] Edge function smoke tests passed
- [ ] Rate limits configured appropriately for production load

### 5. Build & Deployment Artifacts 📦

- [ ] Production build completed: `pnpm run build`
- [ ] Build artifacts verified (`.next/standalone` directory exists)
- [ ] Bundle size within budgets (`pnpm run assert:bundle`)
- [ ] PWA assets generated correctly
- [ ] Service worker tested and functional
- [ ] Static assets optimized
- [ ] Source maps generated (but not exposed publicly)

## Infrastructure Phase

### 6. Server & Hosting Configuration 🖥️

- [ ] Production server provisioned (adequate CPU, RAM, disk)
- [ ] Node.js 20+ installed
- [ ] pnpm 10.19.0 installed
- [ ] Process manager configured (PM2, systemd, or Docker)
- [ ] Auto-restart on failure enabled
- [ ] Log rotation configured
- [ ] Disk space monitoring enabled
- [ ] Server timezone set to UTC

### 7. Network & Security 🔒

- [ ] Domain DNS configured correctly
- [ ] SSL/TLS certificates installed and valid
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] HSTS headers configured
- [ ] Firewall rules configured:
  - [ ] Port 443 (HTTPS) open
  - [ ] Port 80 (HTTP) open for redirects
  - [ ] All other ports restricted
- [ ] DDoS protection enabled (if available)
- [ ] Rate limiting configured at reverse proxy level
- [ ] Security headers verified (CSP, X-Frame-Options, etc.)

### 8. Reverse Proxy Configuration 🌐

- [ ] Nginx/Caddy/Traefik configured
- [ ] Proxy headers set correctly:
  - [ ] `X-Real-IP`
  - [ ] `X-Forwarded-For`
  - [ ] `X-Forwarded-Proto`
  - [ ] `Host`
- [ ] WebSocket support enabled (for `Upgrade` connections)
- [ ] Gzip/Brotli compression enabled
- [ ] Static asset caching configured
- [ ] Custom error pages configured
- [ ] Request timeouts set appropriately

## Monitoring & Observability Phase

### 9. Monitoring Setup 📊

- [ ] Application monitoring enabled:
  - [ ] Health check endpoint accessible: `/api/health`
  - [ ] Uptime monitoring configured
  - [ ] Response time tracking enabled
- [ ] Log aggregation configured:
  - [ ] `LOG_DRAIN_URL` set (if using external logging)
  - [ ] Log drain verified: `pnpm run verify:log-drain`
  - [ ] Structured logging enabled
  - [ ] Log retention policy defined
- [ ] Prometheus/Grafana stack deployed:
  - [ ] Metrics exporter function deployed
  - [ ] Prometheus scraping configured
  - [ ] Grafana dashboards imported
  - [ ] Default admin password changed
- [ ] Key metrics tracked:
  - [ ] Application uptime
  - [ ] Request rate and latency
  - [ ] Error rates
  - [ ] Database connection pool usage
  - [ ] Memory and CPU usage

### 10. Alerting Configuration 🚨

- [ ] Alert manager configured
- [ ] Alert rules defined:
  - [ ] Application down (>2 minutes)
  - [ ] High error rate (>5%)
  - [ ] High response time (>3s p95)
  - [ ] Database connection failures
  - [ ] SMS queue backlog (>25 pending)
  - [ ] Notification queue issues
  - [ ] Payment reconciliation backlog
  - [ ] Disk space low (<20%)
  - [ ] Memory usage high (>85%)
- [ ] Alert channels configured:
  - [ ] Email notifications
  - [ ] SMS/phone alerts (critical only)
  - [ ] Slack/Teams integration (if applicable)
- [ ] On-call schedule defined
- [ ] Escalation policy documented

### 11. Performance Baseline 📈

- [ ] Lighthouse audit completed (score >90 on all metrics)
- [ ] Core Web Vitals measured:
  - [ ] LCP (Largest Contentful Paint) <2.5s
  - [ ] FID (First Input Delay) <100ms
  - [ ] CLS (Cumulative Layout Shift) <0.1
- [ ] Load testing performed:
  - [ ] Expected peak load tested
  - [ ] Database query performance validated
  - [ ] Response times acceptable under load
- [ ] Performance budget enforced: `pnpm run assert:lighthouse`
- [ ] Baseline metrics documented for future comparison

## Security Hardening Phase

### 12. Authentication & Authorization 🔐

- [ ] MFA enforced for all admin users
- [ ] Password policies enforced (minimum length, complexity)
- [ ] Session timeout configured appropriately
- [ ] Account lockout policy configured
- [ ] Trusted device management tested
- [ ] Backup codes functionality verified
- [ ] Passkey/WebAuthn support tested
- [ ] Email OTP fallback tested
- [ ] MFA break-glass procedure documented

### 13. Data Protection 🛡️

- [ ] Field-level encryption verified for PII:
  - [ ] MSISDN encrypted
  - [ ] National ID encrypted
  - [ ] Other sensitive fields identified and encrypted
- [ ] Encryption keys securely stored (not in code)
- [ ] Key rotation procedure documented
- [ ] Data retention policies defined
- [ ] GDPR/data privacy compliance verified
- [ ] Data anonymization procedures for non-production environments

### 14. Access Control 👥

- [ ] Role-based access control (RBAC) verified
- [ ] RLS policies tested comprehensively
- [ ] Principle of least privilege applied
- [ ] Service account permissions reviewed
- [ ] Admin user list reviewed and confirmed
- [ ] Unused accounts disabled
- [ ] Access audit log enabled

## Testing & Validation Phase

### 15. Pre-Deployment Testing ✅

- [ ] All unit tests passing: `pnpm run test:unit`
- [ ] Integration tests passing
- [ ] E2E tests passing: `pnpm run test:e2e`
- [ ] RLS tests passing: `pnpm run test:rls`
- [ ] Auth security tests passing: `pnpm run test:auth`
- [ ] i18n consistency verified: `pnpm run check:i18n:consistency`
- [ ] Smoke tests completed in staging environment
- [ ] User acceptance testing (UAT) completed
- [ ] Load/stress testing completed

### 16. Deployment Dry Run 🎭

- [ ] Deployment procedure documented step-by-step
- [ ] Deployment rehearsed in staging environment
- [ ] Rollback procedure tested successfully
- [ ] Deployment window scheduled
- [ ] Stakeholders notified of deployment schedule
- [ ] Maintenance page prepared (if needed)

## Deployment Phase

### 17. Go-Live Deployment 🚀

- [ ] Maintenance mode enabled (if applicable)
- [ ] Database backup taken immediately before deployment
- [ ] Previous version tagged in Git
- [ ] Code deployed to production
- [ ] Environment variables updated
- [ ] Application restarted
- [ ] Health check verified: `curl https://your-domain.com/api/health`
- [ ] Service worker registration verified
- [ ] PWA manifest accessible
- [ ] Static assets loading correctly
- [ ] Database migrations completed (if any)

### 18. Post-Deployment Validation ✓

- [ ] Smoke tests executed:
  - [ ] Login flow (credentials + MFA)
  - [ ] Dashboard loads correctly
  - [ ] Ikimina list displays
  - [ ] Member search works
  - [ ] Payment reconciliation accessible
  - [ ] Reports generation works
  - [ ] Admin panel accessible
  - [ ] Offline mode functions
- [ ] Critical user journeys tested end-to-end
- [ ] No errors in application logs
- [ ] Monitoring dashboards showing healthy metrics
- [ ] Database connections stable
- [ ] Edge functions responding correctly

### 19. Performance Verification 🏎️

- [ ] Response times within acceptable range
- [ ] Database query performance acceptable
- [ ] Cache hit rates healthy
- [ ] CDN/static asset delivery working
- [ ] No memory leaks detected
- [ ] CPU usage within normal range

## Documentation & Handoff Phase

### 20. Documentation Updates 📚

- [ ] Production URL documented
- [ ] Deployment date and version recorded in CHANGELOG
- [ ] Known issues documented
- [ ] Configuration changes documented
- [ ] Runbook updated with production specifics:
  - [ ] Common troubleshooting procedures
  - [ ] Escalation contacts
  - [ ] Recovery procedures
  - [ ] Monitoring dashboard links
- [ ] README updated with production information

### 21. Team Handoff & Training 🎓

- [ ] Operations team briefed
- [ ] Support team trained
- [ ] Admin user accounts created and verified
- [ ] User documentation published
- [ ] Help desk procedures updated
- [ ] Incident response plan communicated

## Business Continuity Phase

### 22. Backup & Recovery 💾

- [ ] Automated database backups verified:
  - [ ] Daily full backups enabled
  - [ ] Backup retention policy: 30 days minimum
  - [ ] Backup storage location secure and redundant
- [ ] Backup restoration tested successfully
- [ ] Recovery Time Objective (RTO) documented: **\_** hours
- [ ] Recovery Point Objective (RPO) documented: **\_** hours
- [ ] Disaster recovery plan documented
- [ ] Failover procedures tested

### 23. Rollback Readiness ⏪

- [ ] Previous version artifacts retained
- [ ] Rollback procedure documented:
  ```bash
  # Quick rollback steps
  1. Stop current application
  2. Restore previous version
  3. Revert database migrations (if needed)
  4. Restart application
  5. Verify health check
  ```
- [ ] Database migration rollback tested
- [ ] Rollback tested in staging
- [ ] Rollback decision criteria defined

## Compliance & Governance Phase

### 24. Compliance Verification ⚖️

- [ ] Data protection compliance verified (GDPR, local regulations)
- [ ] Audit logging enabled for compliance
- [ ] Data residency requirements met
- [ ] Privacy policy published and accessible
- [ ] Terms of service published
- [ ] Cookie consent implemented (if applicable)
- [ ] Security audit completed
- [ ] Penetration testing completed (if required)

### 25. Final Sign-Off ✍️

- [ ] Technical lead approval
- [ ] Product owner approval
- [ ] Security team approval
- [ ] Operations team approval
- [ ] Business stakeholder approval
- [ ] Go-live decision documented
- [ ] Post-launch review scheduled (1 week, 1 month)

---

## Post-Launch Phase (First 24-48 Hours)

### 26. Active Monitoring Period 👀

- [ ] War room/monitoring session scheduled
- [ ] All key metrics monitored in real-time
- [ ] Error logs monitored continuously
- [ ] User feedback channels monitored
- [ ] Support tickets tracked and triaged
- [ ] Performance metrics compared to baseline
- [ ] No critical issues identified

### 27. Stability Assessment 📊

- [ ] Error rates within acceptable thresholds
- [ ] Response times stable
- [ ] Database performance stable
- [ ] No memory leaks or resource exhaustion
- [ ] User reports positive or neutral
- [ ] All automated alerts functioning correctly

---

## Appendices

### Appendix A: Quick Reference - Required Environment Variables

See `.env.production.example` for the complete list. Critical variables:

```bash
# Core Application
APP_ENV=production
NODE_ENV=production
PORT=3100

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Security Secrets (generate with openssl)
KMS_DATA_KEY_BASE64=
BACKUP_PEPPER=
MFA_SESSION_SECRET=
TRUSTED_COOKIE_SECRET=
HMAC_SHARED_SECRET=
ANALYTICS_CACHE_TOKEN=

# MFA Configuration
MFA_RP_ID=your-domain.com
MFA_ORIGIN=https://your-domain.com
MFA_RP_NAME=SACCO+

# Optional Services
OPENAI_API_KEY=
RESEND_API_KEY=
LOG_DRAIN_URL=
```

### Appendix B: Health Check Endpoints

```bash
# Application health
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-10-28T13:00:00.000Z",
  "version": "x.y.z",
  "commit": "abc123",
  "region": "us-east-1"
}

# Supabase health
curl https://your-project.supabase.co/rest/v1/

# Metrics endpoint (with HMAC signature)
curl https://your-project.supabase.co/functions/v1/metrics-exporter \
  -H "x-timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -H "x-signature: [HMAC_SHA256]"
```

### Appendix C: Emergency Contacts

| Role           | Name       | Contact    | Availability   |
| -------------- | ---------- | ---------- | -------------- |
| Technical Lead | **\_\_\_** | **\_\_\_** | 24/7           |
| DevOps/SRE     | **\_\_\_** | **\_\_\_** | 24/7           |
| Security Lead  | **\_\_\_** | **\_\_\_** | On-call        |
| Product Owner  | **\_\_\_** | **\_\_\_** | Business hours |
| Database Admin | **\_\_\_** | **\_\_\_** | On-call        |

### Appendix D: Common Issues & Solutions

| Issue                      | Symptoms                   | Solution                                  |
| -------------------------- | -------------------------- | ----------------------------------------- |
| App won't start            | Health check fails         | Check environment variables, logs         |
| High memory usage          | Gradual increase over time | Restart app, investigate memory leak      |
| Database connection errors | Intermittent failures      | Check connection pool settings            |
| MFA not working            | Users can't log in         | Verify MFA secrets, check domain settings |
| Service worker issues      | PWA features broken        | Clear cache, verify HTTPS                 |
| Slow response times        | >3s response               | Check database queries, connection pool   |

### Appendix E: Rollback Procedure

**When to Rollback**: Critical bug affecting >50% users, data corruption risk,
security vulnerability discovered

**Steps**:

1. Assess impact and make rollback decision (< 15 minutes)
2. Notify stakeholders immediately
3. Execute rollback:

   ```bash
   # Stop current application
   pm2 stop all  # or docker-compose down

   # Deploy previous version
   git checkout [previous-tag]
   pnpm install --frozen-lockfile
   pnpm run build

   # Revert database migrations if needed
   supabase migration down --linked --to-version [timestamp]

   # Restart application
   pnpm run start  # or docker-compose up -d
   ```

4. Verify health check and critical paths
5. Monitor for 30 minutes
6. Document incident and root cause
7. Plan forward fix

---

## Checklist Sign-Off

| Phase                      | Completed By | Date       | Sign-Off   |
| -------------------------- | ------------ | ---------- | ---------- |
| Pre-Deployment             | **\_\_\_**   | **\_\_\_** | **\_\_\_** |
| Infrastructure             | **\_\_\_**   | **\_\_\_** | **\_\_\_** |
| Monitoring & Observability | **\_\_\_**   | **\_\_\_** | **\_\_\_** |
| Security Hardening         | **\_\_\_**   | **\_\_\_** | **\_\_\_** |
| Testing & Validation       | **\_\_\_**   | **\_\_\_** | **\_\_\_** |
| Deployment                 | **\_\_\_**   | **\_\_\_** | **\_\_\_** |
| Documentation & Handoff    | **\_\_\_**   | **\_\_\_** | **\_\_\_** |
| Business Continuity        | **\_\_\_**   | **\_\_\_** | **\_\_\_** |
| Compliance & Governance    | **\_\_\_**   | **\_\_\_** | **\_\_\_** |

**Final Go-Live Approval**: \***\*\*\*\*\***\_\***\*\*\*\*\***
Date: \***\*\_\*\***

---

**Note**: This checklist should be reviewed and updated regularly. After each
deployment, conduct a retrospective and update this document with lessons
learned.

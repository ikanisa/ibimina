# Disaster Recovery Procedures

**Version**: 1.0  
**Last Updated**: 2025-10-28  
**Owner**: DevOps/SRE Team

## Table of Contents

1. [Overview](#overview)
2. [Emergency Contacts](#emergency-contacts)
3. [Recovery Objectives](#recovery-objectives)
4. [Backup Strategy](#backup-strategy)
5. [Recovery Scenarios](#recovery-scenarios)
6. [Testing & Validation](#testing--validation)
7. [Post-Recovery](#post-recovery)

---

## Overview

This document outlines procedures for recovering the SACCO+ Ibimina Staff
Console from various disaster scenarios. These procedures should be reviewed
quarterly and updated as the system evolves.

### Scope

- **Application**: Ibimina Staff Console (Next.js App)
- **Database**: Supabase PostgreSQL
- **Edge Functions**: Supabase Edge Functions
- **Static Assets**: PWA assets, icons, service worker
- **Infrastructure**: Server, reverse proxy, monitoring

---

## Emergency Contacts

### Primary Response Team

| Role               | Name       | Primary Contact | Secondary Contact | Availability |
| ------------------ | ---------- | --------------- | ----------------- | ------------ |
| Incident Commander | **\_\_\_** | **\_\_\_**      | **\_\_\_**        | 24/7         |
| Technical Lead     | **\_\_\_** | **\_\_\_**      | **\_\_\_**        | 24/7         |
| DevOps/SRE         | **\_\_\_** | **\_\_\_**      | **\_\_\_**        | 24/7         |
| Database Admin     | **\_\_\_** | **\_\_\_**      | **\_\_\_**        | On-call      |
| Security Lead      | **\_\_\_** | **\_\_\_**      | **\_\_\_**        | On-call      |

### External Contacts

| Service                  | Contact              | Purpose                 |
| ------------------------ | -------------------- | ----------------------- |
| Supabase Support         | support@supabase.com | Database/hosting issues |
| DNS Provider             | **\_\_\_**           | Domain/DNS issues       |
| SSL Certificate Provider | **\_\_\_**           | Certificate issues      |
| Cloud Infrastructure     | **\_\_\_**           | Server/VM issues        |

---

## Recovery Objectives

### Service Level Objectives (SLOs)

- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Maximum Tolerable Downtime (MTD)**: 8 hours

### Priority Classification

1. **P0 - Critical**: Complete outage, data loss, security breach
2. **P1 - High**: Major feature unavailable, performance degradation
3. **P2 - Medium**: Minor feature unavailable, limited impact
4. **P3 - Low**: Cosmetic issues, minimal impact

---

## Backup Strategy

### Database Backups

#### Automated Backups (Supabase)

Supabase provides automated backups:

- **Daily full backups**: Retained for 30 days
- **Point-in-time recovery (PITR)**: Up to 7 days (Pro plan)
- **Storage location**: Supabase managed (encrypted at rest)

#### Manual Backup Procedure

For critical operations or before major changes:

```bash
# Create manual backup
supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
ls -lh backup-*.sql

# Store securely
# Upload to secure S3 bucket or encrypted storage
```

#### Backup Verification

Run weekly backup restoration tests:

```bash
# Test restore (on staging environment)
supabase db reset --linked
psql $STAGING_DB_URL < backup-YYYYMMDD-HHMMSS.sql

# Verify data integrity
psql $STAGING_DB_URL -c "SELECT COUNT(*) FROM saccos;"
psql $STAGING_DB_URL -c "SELECT COUNT(*) FROM members;"
psql $STAGING_DB_URL -c "SELECT COUNT(*) FROM payments;"
```

### Application Backups

#### Code Repository

- **Primary**: GitHub (https://github.com/ikanisa/ibimina)
- **Backup**: Local mirrors maintained by team leads
- **Tags**: All production releases tagged (e.g., `v1.0.0`)

#### Build Artifacts

- **Storage**: Keep last 10 production builds
- **Location**: CI/CD artifact storage + S3 backup
- **Retention**: 90 days

#### Configuration Backups

```bash
# Backup environment configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
  .env.production \
  supabase/.env.production \
  nginx.conf \
  docker-compose.yml

# Store securely (encrypted)
gpg -c config-backup-$(date +%Y%m%d).tar.gz
```

### Secrets Management

- **Primary**: Secure secrets manager (AWS Secrets Manager, 1Password, etc.)
- **Backup**: Encrypted offline backup stored securely
- **Rotation**: Quarterly rotation schedule

---

## Recovery Scenarios

### Scenario 1: Complete Application Failure

**Symptoms**: Application not responding, health check fails, 502/503 errors

**Recovery Steps**:

1. **Assess the situation** (2-5 minutes)

   ```bash
   # Check application status
   curl https://your-domain.com/api/health

   # Check server resources
   ssh user@server
   top
   df -h
   free -m
   ```

2. **Check logs** (5 minutes)

   ```bash
   # Application logs
   pm2 logs --lines 100
   # or
   docker-compose logs --tail=100

   # System logs
   tail -100 /var/log/syslog
   ```

3. **Attempt quick restart** (2 minutes)

   ```bash
   # PM2
   pm2 restart all

   # Docker
   docker-compose restart

   # Systemd
   sudo systemctl restart ibimina-admin
   ```

4. **Verify recovery** (2 minutes)

   ```bash
   curl https://your-domain.com/api/health
   # Test login and critical paths
   ```

5. **If restart fails, rollback** (10-15 minutes)
   - See [Rollback Procedure](#rollback-procedure)

6. **Document incident** (ongoing)
   - Log all actions in incident tracker
   - Prepare post-mortem

**Total RTO**: 30-45 minutes

---

### Scenario 2: Database Failure or Corruption

**Symptoms**: Database connection errors, query failures, data inconsistencies

**Recovery Steps**:

1. **Assess database health** (5 minutes)

   ```bash
   # Check Supabase status
   curl https://your-project.supabase.co/rest/v1/

   # Check database connections
   psql $SUPABASE_DB_URL -c "SELECT count(*) FROM pg_stat_activity;"
   ```

2. **Identify issue type**:
   - **Connection pool exhausted**: Scale up or restart
   - **Data corruption**: Restore from backup
   - **Migration failure**: Rollback migration
   - **Performance issue**: Analyze slow queries

3. **For data corruption - Restore from backup** (30-60 minutes)

   ```bash
   # Step 1: Take snapshot of current state
   supabase db dump -f corrupted-$(date +%Y%m%d-%H%M%S).sql

   # Step 2: Restore from latest good backup
   # Via Supabase dashboard: Database → Backups → Restore

   # Step 3: Verify restoration
   psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM saccos;"
   psql $SUPABASE_DB_URL -c "SELECT MAX(created_at) FROM audit_logs;"

   # Step 4: Reapply any recent migrations if needed
   supabase migration up --linked
   ```

4. **For PITR (Point-in-Time Recovery)**:
   - Use Supabase dashboard: Database → Backups → PITR
   - Select recovery point (up to 7 days back)
   - Execute recovery
   - Wait for completion (15-45 minutes depending on size)

5. **Verify application connectivity**

   ```bash
   # Test database queries
   curl https://your-domain.com/api/health

   # Test critical user journeys
   # - Login
   # - Dashboard load
   # - Data retrieval
   ```

**Total RTO**: 1-2 hours

---

### Scenario 3: Complete Server/Infrastructure Failure

**Symptoms**: Server unreachable, hosting provider outage, hardware failure

**Recovery Steps**:

1. **Confirm infrastructure failure** (5 minutes)
   - Check hosting provider status page
   - Verify SSH connectivity
   - Check monitoring alerts

2. **Provision new infrastructure** (30-60 minutes)

   ```bash
   # Option A: Spin up new VM/container
   # Follow infrastructure-as-code playbook

   # Option B: Failover to standby server
   # Update DNS to point to standby
   ```

3. **Deploy application** (20-30 minutes)

   ```bash
   # Clone repository
   git clone https://github.com/ikanisa/ibimina.git
   cd ibimina
   git checkout [latest-production-tag]

   # Install dependencies
   nvm use
   npm install -g pnpm@10.19.0
   pnpm install --frozen-lockfile

   # Restore environment configuration
   # (from encrypted backup)
   gpg -d config-backup-YYYYMMDD.tar.gz.gpg | tar -xzf -

   # Build application
   pnpm run build

   # Start application
   pm2 start ecosystem.config.js
   # or
   docker-compose up -d
   ```

4. **Configure reverse proxy** (10 minutes)

   ```bash
   # Nginx configuration
   sudo cp nginx.conf /etc/nginx/sites-available/ibimina
   sudo ln -s /etc/nginx/sites-available/ibimina /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Update DNS if needed** (5 minutes + propagation time)
   - Update A/CNAME records to new server IP
   - Wait for DNS propagation (5-60 minutes)

6. **Verify functionality** (15 minutes)
   - Health check
   - Critical user journeys
   - Database connectivity
   - Monitoring integration

**Total RTO**: 2-4 hours (excluding DNS propagation)

---

### Scenario 4: Security Breach or Data Compromise

**Symptoms**: Unauthorized access detected, suspicious activity, data leak

**Immediate Response** (P0 Priority):

1. **Activate incident response team** (< 5 minutes)
   - Notify Security Lead
   - Notify Technical Lead
   - Notify Legal/Compliance (if PII involved)

2. **Contain the breach** (< 30 minutes)

   ```bash
   # Option 1: Take application offline temporarily
   pm2 stop all
   # or enable maintenance mode

   # Option 2: Block suspicious IPs at firewall level
   sudo ufw deny from <suspicious-ip>

   # Option 3: Revoke compromised credentials
   # Rotate all API keys, secrets, and tokens
   ```

3. **Assess scope** (30-60 minutes)
   - Review audit logs
   - Check database access logs
   - Identify compromised data
   - Determine attack vector

4. **Eradicate threat** (varies)
   - Patch vulnerabilities
   - Remove backdoors
   - Change all credentials
   - Review and tighten security policies

5. **Restore secure state** (1-2 hours)

   ```bash
   # Restore from clean backup if necessary
   # Deploy patched version
   # Verify security hardening
   ```

6. **Recovery and hardening** (2-4 hours)
   - Deploy fixed application
   - Enhanced monitoring
   - Additional security controls

7. **Notification and compliance** (ongoing)
   - Notify affected users (if PII compromised)
   - Regulatory reporting (if required)
   - Public disclosure (if appropriate)

**Total RTO**: 4-8 hours (depending on breach severity)

---

### Scenario 5: Data Center/Region Outage

**Symptoms**: Complete regional outage, natural disaster, extended provider
downtime

**Recovery Steps**:

1. **Activate DR site** (if available)
   - Failover to secondary region
   - Update DNS records
   - Verify data replication status

2. **If no DR site, provision new region** (2-4 hours)
   - Follow infrastructure provisioning procedures
   - Deploy from latest production release
   - Restore database from backup

3. **Data migration**
   - Restore from most recent backup
   - Calculate data loss (RPO)
   - Plan data reconciliation

**Total RTO**: 4-8 hours

---

## Rollback Procedure

### When to Rollback

Rollback if any of the following occur within 2 hours of deployment:

- Critical functionality broken (P0)
- Data corruption or loss
- Security vulnerability introduced
- Widespread user reports of issues
- Error rate > 5%
- Performance degradation > 50%

### Rollback Steps

1. **Make rollback decision** (< 15 minutes)
   - Assess impact
   - Get approval from Technical Lead
   - Notify stakeholders

2. **Execute rollback** (15-30 minutes)

   ```bash
   # Step 1: Stop current application
   pm2 stop all
   # or
   docker-compose down

   # Step 2: Checkout previous version
   cd /path/to/ibimina
   git fetch --tags
   git checkout [previous-production-tag]

   # Step 3: Restore dependencies
   pnpm install --frozen-lockfile

   # Step 4: Rebuild (if needed)
   pnpm run build

   # Step 5: Rollback database migrations (if applied)
   # Check migration status first
   supabase migration list --linked

   # Rollback to previous migration
   supabase migration down --linked --to-version [timestamp]

   # Step 6: Restore previous environment config
   # (if changed)
   cp .env.production.backup .env.production

   # Step 7: Restart application
   pm2 start ecosystem.config.js
   # or
   docker-compose up -d

   # Step 8: Verify health
   curl https://your-domain.com/api/health
   ```

3. **Verify rollback** (10-15 minutes)
   - Health check passes
   - Critical user journeys work
   - Error rate normalized
   - Database queries successful

4. **Monitor closely** (30 minutes)
   - Watch error logs
   - Monitor performance metrics
   - Check user reports

5. **Document and communicate** (ongoing)
   - Log rollback in incident tracker
   - Notify stakeholders
   - Update status page
   - Plan forward fix

**Total Rollback Time**: 30-60 minutes

---

## Testing & Validation

### Quarterly DR Drills

Conduct full disaster recovery drills quarterly:

1. **Q1**: Database restoration drill
2. **Q2**: Full infrastructure failover
3. **Q3**: Security incident response simulation
4. **Q4**: Regional outage scenario

### Drill Procedure

1. Schedule drill (notify team in advance)
2. Execute recovery scenario in staging environment
3. Time each step
4. Document issues and improvements
5. Update DR procedures
6. Report results to leadership

### Backup Testing

**Weekly**:

- Automated backup verification
- Random backup restoration test (staging)

**Monthly**:

- Full database restoration test
- Application rebuild from scratch
- Secrets restoration test

**Quarterly**:

- End-to-end DR drill
- Cross-region restoration (if applicable)

---

## Post-Recovery

### Immediate Post-Recovery (First 24 Hours)

1. **Verify system stability**
   - Monitor all metrics closely
   - Watch for anomalies
   - Test critical functionality repeatedly

2. **Assess data loss**
   - Calculate actual RPO
   - Identify any data gaps
   - Plan data reconciliation if needed

3. **Communicate status**
   - Update stakeholders
   - Notify users (if impacted)
   - Update status page

### Post-Incident Review (Within 1 Week)

1. **Conduct post-mortem**
   - Timeline of events
   - Root cause analysis
   - Response effectiveness
   - Areas for improvement

2. **Document lessons learned**
   - What went well
   - What could be improved
   - Action items

3. **Update procedures**
   - Update this DR document
   - Update runbooks
   - Update monitoring/alerts

4. **Implement improvements**
   - Fix root cause
   - Add preventive measures
   - Enhance monitoring
   - Update DR plan

### Reporting

**Incident Report Template**:

```markdown
# Incident Report: [Title]

**Date**: YYYY-MM-DD **Severity**: P0/P1/P2/P3 **Duration**: X hours Y minutes
**Status**: Resolved/Ongoing

## Summary

[Brief description of incident]

## Impact

- Users affected: [number/percentage]
- Services affected: [list]
- Data loss: [yes/no, details]
- Estimated cost: [if applicable]

## Timeline

- HH:MM - [Event]
- HH:MM - [Response action]
- ...
- HH:MM - [Resolution]

## Root Cause

[Detailed explanation]

## Resolution

[What was done to fix]

## Prevention

[Steps taken to prevent recurrence]

## Action Items

- [ ] [Action item 1 - Owner - Due date]
- [ ] [Action item 2 - Owner - Due date]
```

---

## Appendices

### Appendix A: Emergency Command Cheat Sheet

```bash
# Quick health checks
curl https://your-domain.com/api/health
pm2 status
docker-compose ps
systemctl status nginx

# Quick restarts
pm2 restart all
docker-compose restart
sudo systemctl restart nginx

# Database quick checks
psql $SUPABASE_DB_URL -c "SELECT version();"
psql $SUPABASE_DB_URL -c "SELECT count(*) FROM pg_stat_activity;"

# View recent logs
pm2 logs --lines 100
docker-compose logs --tail=100
tail -100 /var/log/nginx/error.log

# Emergency rollback
git checkout [previous-tag]
pnpm install && pnpm run build
pm2 restart all
```

### Appendix B: Recovery Checklist

Print and keep accessible:

```
☐ Incident detected and confirmed
☐ Incident Commander notified
☐ Response team assembled
☐ Scope and impact assessed
☐ Recovery strategy selected
☐ Stakeholders notified
☐ Recovery executed
☐ System verified operational
☐ Monitoring confirmed healthy
☐ Users notified (if applicable)
☐ Post-mortem scheduled
☐ Documentation updated
☐ Preventive measures planned
```

### Appendix C: Critical System Information

| Component                | Details                                    |
| ------------------------ | ------------------------------------------ |
| **Primary Domain**       | https://\***\*\*\*\*\***\_\***\*\*\*\*\*** |
| **Database Provider**    | Supabase                                   |
| **Hosting Provider**     | \***\*\*\*\*\***\_\***\*\*\*\*\***         |
| **DNS Provider**         | \***\*\*\*\*\***\_\***\*\*\*\*\***         |
| **SSL Certificate**      | \***\*\*\*\*\***\_\***\*\*\*\*\***         |
| **Code Repository**      | https://github.com/ikanisa/ibimina         |
| **Backup Location**      | \***\*\*\*\*\***\_\***\*\*\*\*\***         |
| **Monitoring Dashboard** | https://\***\*\*\*\*\***\_\***\*\*\*\*\*** |
| **Status Page**          | https://\***\*\*\*\*\***\_\***\*\*\*\*\*** |

---

**Document Control**:

- Next Review Date: **\*\***\_**\*\***
- Reviewed By: **\*\***\_**\*\***
- Approved By: **\*\***\_**\*\***

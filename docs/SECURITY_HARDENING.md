# Security Hardening Checklist for Production

**Version**: 1.0  
**Last Updated**: 2025-10-28  
**Purpose**: Verify all security measures before production deployment

## Critical Security Configurations

### 1. Secrets Management ✅

- [ ] All secrets rotated from default/example values
- [ ] Secrets stored in secure secret manager (not in code or .env files)
- [ ] Production secrets never committed to version control
- [ ] Different secrets for each environment (dev/staging/prod)
- [ ] Secrets rotation schedule documented (quarterly minimum)
- [ ] Emergency secret rotation procedure documented

**Verify**:

```bash
# Ensure no secrets in git history
git log --all --full-history -- .env*
# Should return no results

# Check .gitignore includes secrets
grep -E "\.env|secrets|\.pem|\.key" .gitignore
```

### 2. Encryption ✅

- [ ] KMS_DATA_KEY_BASE64 generated with cryptographic randomness
  ```bash
  openssl rand -base64 32
  ```
- [ ] BACKUP_PEPPER unique and cryptographically secure
  ```bash
  openssl rand -hex 32
  ```
- [ ] Field-level encryption active for PII:
  - [ ] MSISDN (phone numbers)
  - [ ] National ID numbers
  - [ ] Other sensitive personal data
- [ ] Encryption keys stored securely (AWS KMS, Azure Key Vault, or similar)
- [ ] Database encrypted at rest (Supabase default)
- [ ] Backups encrypted
- [ ] TLS 1.2+ enforced for all connections

**Verify**:

```sql
-- Check that sensitive fields are encrypted (appear as ciphertext)
SELECT msisdn, national_id FROM members LIMIT 5;
-- Should show encrypted values, not plaintext

-- Verify hash columns exist for lookups
SELECT msisdn_hash, national_id_hash FROM members LIMIT 5;
-- Should show hash values
```

### 3. Authentication & Authorization 🔐

- [ ] MFA enforced for all admin users
- [ ] MFA encouraged/required for staff users
- [ ] Password minimum length: 12 characters
- [ ] Password complexity requirements enabled
- [ ] Account lockout after 5 failed login attempts
- [ ] Session timeout: 12 hours maximum (MFA_SESSION_TTL_SECONDS)
- [ ] Trusted device tokens expire after 30 days (TRUSTED_DEVICE_TTL_SECONDS)
- [ ] Break-glass MFA reset procedure documented and tested
- [ ] Service accounts follow principle of least privilege
- [ ] No shared accounts (each user has unique credentials)

**Verify**:

```bash
# Check MFA configuration
echo $MFA_SESSION_SECRET | wc -c  # Should be 64 (32 bytes hex = 64 chars)
echo $MFA_SESSION_TTL_SECONDS  # Should be 43200 (12 hours)
echo $TRUSTED_DEVICE_TTL_SECONDS  # Should be 2592000 (30 days)

# Verify MFA RP configuration matches domain
echo $MFA_RP_ID  # Should be your-domain.com
echo $MFA_ORIGIN  # Should be https://your-domain.com
```

### 4. Row Level Security (RLS) 🛡️

- [ ] RLS enabled on all tables
- [ ] RLS policies tested comprehensively: `pnpm run test:rls`
- [ ] Staff users can only access assigned SACCOs
- [ ] Admin users have appropriate elevated permissions
- [ ] System accounts have service-role access only where needed
- [ ] No bypass policies in production
- [ ] Anonymous access disabled or severely restricted

**Verify**:

```sql
-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
-- Should return no results

-- Check policy count per table
SELECT schemaname, tablename, COUNT(policyname) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count;
-- All tables should have policies
```

### 5. Network Security 🌐

- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] TLS 1.2+ only (TLS 1.0/1.1 disabled)
- [ ] HSTS enabled with appropriate max-age
  ```nginx
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  ```
- [ ] SSL certificate valid and not expiring soon (>30 days)
- [ ] Certificate auto-renewal configured
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] DDoS protection enabled (if available)
- [ ] Rate limiting configured at multiple layers:
  - [ ] Application level (in code)
  - [ ] Reverse proxy level (nginx/caddy)
  - [ ] Infrastructure level (CloudFlare, AWS WAF, etc.)

**Verify**:

```bash
# Test HTTPS enforcement
curl -I http://your-domain.com
# Should return 301/302 redirect to https://

# Check SSL configuration
echo | openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates
# Should show valid dates

# Test TLS version
nmap --script ssl-enum-ciphers -p 443 your-domain.com
# Should only show TLSv1.2 and TLSv1.3
```

### 6. Security Headers 📋

All security headers must be present and properly configured:

- [ ] `Strict-Transport-Security` (HSTS)
- [ ] `X-Frame-Options: DENY` or `SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Content-Security-Policy` (CSP) with nonces
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` restricting dangerous features
- [ ] `X-XSS-Protection: 1; mode=block` (for older browsers)

**Verify**:

```bash
# Check all security headers
curl -I https://your-domain.com/ | grep -E "Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|Content-Security-Policy|Referrer-Policy|Permissions-Policy"

# Should output all required headers
```

**Expected headers**:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; ...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 7. Content Security Policy (CSP) 🔒

- [ ] CSP header present
- [ ] `default-src 'self'` as baseline
- [ ] Script sources whitelisted (no `'unsafe-inline'`)
- [ ] Nonces used for inline scripts
- [ ] `script-src` includes only trusted domains
- [ ] `img-src` restricted to expected sources
- [ ] `connect-src` limited to API endpoints
- [ ] CSP reports configured (if using report-uri or report-to)
- [ ] CSP tested in report-only mode before enforcing

**Verify**:

```bash
# Get CSP header
curl -I https://your-domain.com/ | grep Content-Security-Policy

# Test for unsafe directives (should not be present in production)
curl -I https://your-domain.com/ | grep Content-Security-Policy | grep -E "unsafe-inline|unsafe-eval"
# Should return nothing
```

### 8. Rate Limiting ⚡

- [ ] Rate limiting enabled in application code
- [ ] Rate limiting configured in reverse proxy
- [ ] Failed login attempts rate limited (5 per 5 minutes per IP)
- [ ] API endpoints rate limited appropriately:
  - [ ] Authentication: 5 requests/5 min per IP
  - [ ] General API: 120 requests/minute per user
  - [ ] SMS processing: 200/minute (configured)
- [ ] Rate limit configuration documented
- [ ] Rate limit counters monitored

**Verify**:

```bash
# Test rate limiting (should get 429 after threshold)
for i in {1..10}; do
  curl -I https://your-domain.com/api/auth/login \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  sleep 1
done
# Should eventually return 429 Too Many Requests
```

### 9. Audit Logging 📝

- [ ] Audit logging enabled for all privileged actions
- [ ] Audit logs include:
  - [ ] Timestamp
  - [ ] User ID/email
  - [ ] Action performed
  - [ ] Resource affected
  - [ ] IP address
  - [ ] User agent
  - [ ] Result (success/failure)
- [ ] Audit logs immutable (insert-only table)
- [ ] Audit logs retained for compliance period (12+ months)
- [ ] Audit log access restricted to admins only
- [ ] Anomalous activity alerts configured

**Verify**:

```sql
-- Check audit logging is working
SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '1 day';
-- Should show recent entries

-- Verify audit log includes key fields
SELECT action, actor_id, resource_type, ip_address, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 5;
-- Should show complete information

-- Check audit log retention
SELECT MIN(created_at), MAX(created_at), COUNT(*)
FROM audit_logs;
-- Should span appropriate time period
```

### 10. Dependency Security 🔍

- [ ] All dependencies up to date (critical/high vulnerabilities patched)
- [ ] `pnpm audit` returns no high/critical vulnerabilities
- [ ] Automated dependency updates configured (Renovate/Dependabot)
- [ ] Dependencies scanned in CI pipeline
- [ ] Known vulnerable packages removed or patched
- [ ] License compliance verified

**Verify**:

```bash
# Check for vulnerabilities
pnpm audit --audit-level=moderate
# Should return 0 vulnerabilities at moderate or higher

# Check for outdated packages
pnpm outdated
# Review and update as needed

# Verify Renovate/Dependabot configured
cat renovate.json
# or check .github/dependabot.yml
```

### 11. Input Validation & Sanitization 🧹

- [ ] All user inputs validated on server-side
- [ ] SQL injection protection (parameterized queries only)
- [ ] XSS protection (output encoding/escaping)
- [ ] CSRF protection enabled (tokens/same-site cookies)
- [ ] File upload restrictions:
  - [ ] File type whitelist
  - [ ] File size limits
  - [ ] Virus scanning (if applicable)
  - [ ] Files stored outside web root
- [ ] JSON payloads validated against schema
- [ ] API input size limits enforced

**Verify**:

```typescript
// Check that Supabase queries use parameterized queries
// Example: ✅ Good
supabase.from("users").select("*").eq("id", userId);

// Example: ❌ Bad (never do this)
// supabase.raw(`SELECT * FROM users WHERE id = ${userId}`)
```

### 12. Session Security 🔐

- [ ] Session cookies have `Secure` flag (HTTPS only)
- [ ] Session cookies have `HttpOnly` flag (no JavaScript access)
- [ ] Session cookies have `SameSite` attribute (`Lax` or `Strict`)
- [ ] Session tokens are cryptographically random
- [ ] Sessions expire after inactivity
- [ ] Concurrent session limits (if applicable)
- [ ] Session fixation attacks prevented
- [ ] Logout invalidates session completely

**Verify**:

```bash
# Check cookie attributes
curl -c cookies.txt https://your-domain.com/login

# Inspect cookies file for flags
cat cookies.txt
# Should show Secure, HttpOnly, SameSite attributes
```

### 13. Error Handling 🚫

- [ ] Error messages don't leak sensitive information
- [ ] Stack traces not exposed in production
- [ ] Generic error messages for users
- [ ] Detailed errors logged securely (not sent to client)
- [ ] 404/500 error pages customized (no default server pages)
- [ ] Error logging doesn't include sensitive data

**Verify**:

```bash
# Test error pages
curl https://your-domain.com/nonexistent-page
# Should return custom 404, not default server 404

# Test server error (if safe to trigger)
# Should return generic error, not stack trace
```

### 14. Database Security 🗄️

- [ ] Database credentials rotated regularly
- [ ] Database accessible only from application servers (no public access)
- [ ] Connection strings use SSL/TLS
- [ ] Database user follows principle of least privilege
- [ ] No unnecessary database extensions enabled
- [ ] Database backups encrypted
- [ ] Database backups tested regularly
- [ ] Point-in-time recovery enabled
- [ ] Database monitoring enabled

**Verify**:

```bash
# Attempt to connect to database from external IP
psql "postgresql://user:pass@your-db-host:5432/dbname"
# Should fail if properly secured

# Check SSL is enforced
psql $DATABASE_URL -c "SHOW ssl;"
# Should show "on"
```

### 15. API Security 🔌

- [ ] API authentication required (no anonymous access to sensitive endpoints)
- [ ] JWT tokens properly validated
- [ ] API tokens/keys rotated regularly
- [ ] CORS configured restrictively (specific origins, not `*`)
- [ ] API versioning in place
- [ ] GraphQL introspection disabled in production (if using GraphQL)
- [ ] Sensitive operations require additional authentication (e.g., MFA)

**Verify**:

```bash
# Test CORS configuration
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://your-domain.com/api/some-endpoint
# Should not return Access-Control-Allow-Origin: *

# Test authentication required
curl https://your-domain.com/api/protected-endpoint
# Should return 401 Unauthorized
```

### 16. Third-Party Integrations 🔗

- [ ] All third-party API keys secured (not in client-side code)
- [ ] Third-party webhooks verified (signature validation)
- [ ] HMAC signatures used for webhook verification
  ```typescript
  // Example: verify Supabase edge function webhook
  const signature = headers.get("x-signature");
  const timestamp = headers.get("x-timestamp");
  // Verify signature matches HMAC(secret, timestamp + body)
  ```
- [ ] Third-party services use minimum required permissions
- [ ] Third-party integrations monitored for suspicious activity
- [ ] Fallback/circuit breaker for third-party failures

**Verify**:

```bash
# Check webhook signature validation exists
grep -r "x-signature" apps/admin/
# Should find signature verification code

# Verify HMAC secret is set
echo $HMAC_SHARED_SECRET | wc -c
# Should be 64 characters (32 bytes hex)
```

## Production Environment Hardening

### 17. Server Hardening 🖥️

- [ ] Operating system updated with latest security patches
- [ ] Unnecessary services disabled
- [ ] SSH key-based authentication only (no passwords)
- [ ] Root login disabled
- [ ] Non-root user runs application
- [ ] File permissions restrictive (no world-writable files)
- [ ] Security updates automated (unattended-upgrades or similar)
- [ ] Server firewall (ufw, iptables) configured
- [ ] fail2ban or similar intrusion prevention installed

**Verify**:

```bash
# Check for outdated packages
sudo apt update && sudo apt list --upgradable
# Should be minimal

# Verify non-root user
ps aux | grep node
# Should not show root user

# Check file permissions
find /path/to/app -perm -002
# Should return no world-writable files
```

### 18. Docker Security (if applicable) 🐳

- [ ] Docker images scanned for vulnerabilities
- [ ] Base images from trusted sources only
- [ ] Images updated regularly
- [ ] Containers run as non-root user
- [ ] Secrets not baked into images
- [ ] Minimal images (Alpine, distroless) used where possible
- [ ] Container resource limits set
- [ ] Docker daemon secured (TLS, socket permissions)

**Verify**:

```bash
# Scan image for vulnerabilities
docker scan your-image:tag

# Check container runs as non-root
docker inspect your-container | grep User
# Should not be "root" or empty

# Verify no secrets in image
docker history your-image:tag
# Review for exposed secrets
```

### 19. Monitoring & Alerting 📊

- [ ] Security events monitored:
  - [ ] Failed login attempts
  - [ ] Privilege escalation attempts
  - [ ] Unusual access patterns
  - [ ] Database query anomalies
  - [ ] File system changes
- [ ] Security alerts configured and tested
- [ ] Alert response procedures documented
- [ ] Monitoring dashboard accessible to security team
- [ ] Logs forwarded to SIEM (if applicable)

**Verify**:

```bash
# Test security alert (trigger failed logins)
for i in {1..10}; do
  curl -X POST https://your-domain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrongpassword"}'
done
# Check if alert was triggered
```

### 20. Incident Response 🚨

- [ ] Incident response plan documented
- [ ] Incident response team identified
- [ ] Contact information for security team current
- [ ] Breach notification procedures documented
- [ ] Evidence preservation procedures defined
- [ ] Communication templates prepared
- [ ] Regular incident response drills conducted

## Compliance & Governance

### 21. Data Privacy 📄

- [ ] Privacy policy published and accessible
- [ ] Terms of service published
- [ ] Cookie consent implemented (if applicable)
- [ ] GDPR compliance verified (if applicable):
  - [ ] Right to access
  - [ ] Right to deletion
  - [ ] Right to portability
  - [ ] Data processing agreements in place
- [ ] Data retention policies defined and enforced
- [ ] PII handling documented

### 22. Access Control Review 👥

- [ ] Admin user list reviewed and approved
- [ ] Inactive accounts disabled
- [ ] Service accounts documented
- [ ] Access levels appropriate (principle of least privilege)
- [ ] Periodic access reviews scheduled (quarterly)
- [ ] Offboarding procedures include access revocation

### 23. Documentation 📚

- [ ] Security policies documented
- [ ] Incident response plan documented
- [ ] Disaster recovery plan documented
- [ ] Security architecture diagram created
- [ ] Data flow diagrams created
- [ ] Threat model documented
- [ ] Security runbook created

## Final Security Validation

### 24. Penetration Testing (Optional but Recommended)

- [ ] Vulnerability assessment completed
- [ ] Penetration test scheduled or completed
- [ ] Critical findings remediated
- [ ] High findings remediated or accepted risk documented
- [ ] Retest completed for critical findings

### 25. Security Checklist Sign-Off

| Security Domain    | Status | Verified By | Date       | Notes      |
| ------------------ | ------ | ----------- | ---------- | ---------- |
| Secrets Management | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| Encryption         | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| Authentication     | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| RLS Policies       | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| Network Security   | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| Security Headers   | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| Rate Limiting      | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| Audit Logging      | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| Dependencies       | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| Database Security  | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| API Security       | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| Server Hardening   | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| Monitoring         | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |
| Compliance         | ☐      | **\_\_\_**  | **\_\_\_** | **\_\_\_** |

**Final Security Approval**: \***\*\*\*\*\***\_\***\*\*\*\*\***
Date: \***\*\_\*\***

---

## Quick Security Verification Script

Save and run this script for a quick security check:

```bash
#!/bin/bash
# quick-security-check.sh

# Configuration - set your domain here
DOMAIN=${PRODUCTION_DOMAIN:-your-domain.com}

echo "=== Quick Security Check ==="
echo "Domain: $DOMAIN"
echo ""

echo "1. Checking SSL/TLS..."
curl -I https://$DOMAIN 2>&1 | grep -i "HTTP/2\|HTTP/1.1"

echo ""
echo "2. Checking security headers..."
curl -I https://$DOMAIN 2>&1 | grep -E "Strict-Transport|X-Frame|X-Content-Type|Content-Security-Policy"

echo ""
echo "3. Checking for vulnerabilities..."
pnpm audit --audit-level=high

echo ""
echo "4. Verifying environment variables..."
[ -z "$KMS_DATA_KEY_BASE64" ] && echo "❌ KMS_DATA_KEY_BASE64 not set" || echo "✓ KMS_DATA_KEY_BASE64 set"
[ -z "$MFA_SESSION_SECRET" ] && echo "❌ MFA_SESSION_SECRET not set" || echo "✓ MFA_SESSION_SECRET set"
[ -z "$HMAC_SHARED_SECRET" ] && echo "❌ HMAC_SHARED_SECRET not set" || echo "✓ HMAC_SHARED_SECRET set"

echo ""
echo "5. Checking RLS tests..."
pnpm run test:rls

echo ""
echo "=== Security Check Complete ==="
```

---

**Remember**: Security is an ongoing process, not a one-time checklist. Review
and update security measures regularly.

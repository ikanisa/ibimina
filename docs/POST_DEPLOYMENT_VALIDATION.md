# Post-Deployment Validation Checklist

**Purpose**: Verify production deployment health immediately after go-live  
**Duration**: 30-45 minutes  
**When to Use**: After every production deployment

## Immediate Checks (First 5 Minutes)

### 1. Application Health

- [ ] Health endpoint responds successfully
  ```bash
  curl -i https://your-domain.com/api/health
  # Expected: HTTP 200, JSON with status: "ok"
  ```
- [ ] Response includes correct version/commit

  ```bash
  curl -s https://your-domain.com/api/health | jq '.version, .commit'
  ```

- [ ] No 5xx errors in initial requests
  ```bash
  curl -I https://your-domain.com/
  # Expected: HTTP 200 or 302 (redirect to login)
  ```

### 2. Core Services

- [ ] Database connectivity verified
  - Health check includes database status
  - Query response times normal (<100ms)

- [ ] Supabase connection working

  ```bash
  curl -i https://your-project.supabase.co/rest/v1/
  # Expected: HTTP 200
  ```

- [ ] Edge functions accessible (test one)
  ```bash
  curl -I https://your-project.supabase.co/functions/v1/metrics-exporter
  # Should respond (may need auth headers)
  ```

### 3. SSL/TLS Configuration

- [ ] HTTPS enforced (HTTP redirects to HTTPS)

  ```bash
  curl -I http://your-domain.com/
  # Expected: 301 or 302 redirect to https://
  ```

- [ ] SSL certificate valid

  ```bash
  echo | openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates
  ```

- [ ] No certificate warnings in browser

## Functional Checks (Minutes 5-20)

### 4. Authentication Flow

- [ ] Login page loads
  - Visit: `https://your-domain.com/login`
  - Page renders without errors
  - Branding/logo displays correctly

- [ ] Test user login (credentials)
  - Enter valid credentials
  - No console errors
  - Redirects appropriately

- [ ] MFA challenge works
  - TOTP/authenticator code accepted
  - Email OTP (if enabled) sends and validates
  - Passkey works (if enrolled)
  - Backup codes work

- [ ] Session persists across page reload
  - Login successful
  - Refresh page
  - Still authenticated

- [ ] Logout works
  - Click logout
  - Redirects to login
  - Session cleared

### 5. Core User Journeys

#### Dashboard Access

- [ ] Dashboard loads successfully
  - Visit: `https://your-domain.com/dashboard`
  - Metrics display correctly
  - No loading errors
  - Charts/graphs render

#### SACCO Search & Navigation

- [ ] Global search works
  - Open command palette (Cmd/Ctrl + K)
  - Search for a SACCO name
  - Results display
  - Navigation works

- [ ] SACCO list loads
  - All SACCOs visible
  - Pagination works (if applicable)
  - Filters function

#### Ikimina (Groups)

- [ ] Ikimina list displays
  - Groups load correctly
  - Member counts accurate
  - Click into a group

- [ ] Group details accessible
  - Member list loads
  - Transaction history visible
  - Analytics display

#### Payments & Reconciliation

- [ ] Payment list loads
  - Recent payments visible
  - Filters work
  - Sorting functions

- [ ] Reconciliation interface accessible
  - Pending items display
  - Can view details
  - Actions available (mark posted, etc.)

#### Reports

- [ ] Reports page loads
  - Report types listed
  - Date range picker works

- [ ] Generate a test report
  - Select report type
  - Set date range
  - Click generate
  - Report downloads successfully

#### Admin Panel

- [ ] Admin section accessible (for admin users)
  - Settings load
  - User management accessible
  - Audit logs visible

### 6. PWA Features

- [ ] Service worker registered
  - Open DevTools → Application → Service Workers
  - Service worker active and running

- [ ] PWA manifest accessible

  ```bash
  curl -I https://your-domain.com/manifest.json
  # Expected: HTTP 200, Content-Type: application/json
  ```

- [ ] Install prompt appears (mobile/supported browsers)
  - Banner or prompt shows
  - Installation works

- [ ] PWA icons load correctly

  ```bash
  curl -I https://your-domain.com/icons/icon-192.png
  curl -I https://your-domain.com/icons/icon-512.png
  # Expected: HTTP 200 for both
  ```

- [ ] Offline mode functional (if implemented)
  - Go offline (DevTools → Network → Offline)
  - Navigate to offline page
  - Page displays correctly
  - Offline indicator shows

### 7. Data Integrity

- [ ] Recent data visible
  - Check latest payments/transactions
  - Verify timestamps are recent
  - Check data matches pre-deployment

- [ ] No duplicate records
  - Spot check key entities (members, payments)
  - IDs sequential/unique

- [ ] Relationships intact
  - Member → Group associations correct
  - Payment → Member links valid
  - SACCO → Staff assignments correct

## Performance Checks (Minutes 20-30)

### 8. Response Times

- [ ] Page load times acceptable
  - Dashboard: < 2 seconds
  - List views: < 1.5 seconds
  - Detail pages: < 1 second

- [ ] API response times normal

  ```bash
  time curl -s https://your-domain.com/api/health
  # Should be < 500ms
  ```

- [ ] Database queries performant
  - Check slow query log
  - No queries > 1 second
  - Connection pool healthy

### 9. Resource Utilization

- [ ] Server metrics healthy
  - CPU usage: < 50% (under normal load)
  - Memory usage: < 70%
  - Disk space: > 20% free
  - Network: No saturation

- [ ] Browser performance
  - No memory leaks (DevTools → Memory)
  - No excessive repaints
  - Lighthouse score > 90

- [ ] Application metrics
  ```bash
  # Check if metrics are being collected
  curl https://your-project.supabase.co/functions/v1/metrics-exporter \
    -H "x-timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    -H "x-signature: [HMAC]"
  ```

### 10. Error Monitoring

- [ ] No errors in application logs

  ```bash
  # Check recent logs (last 100 lines)
  pm2 logs --lines 100 | grep -i error
  # Should be minimal or zero
  ```

- [ ] No errors in browser console
  - Open DevTools → Console
  - Navigate through app
  - No red errors

- [ ] No Supabase edge function errors
  - Check Supabase dashboard logs
  - All functions executing successfully

- [ ] Error tracking working (if configured)
  - Trigger a test error
  - Verify it's captured in monitoring

## Security Checks (Minutes 30-40)

### 11. Security Headers

- [ ] Security headers present
  ```bash
  curl -I https://your-domain.com/ | grep -E "Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|Content-Security-Policy|Referrer-Policy|Permissions-Policy"
  ```

Expected headers:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: [policy]`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: [policy]`

- [ ] No sensitive data in responses
  - Check HTML source
  - Check API responses
  - No secrets, tokens, or keys exposed

### 12. Authentication Security

- [ ] Rate limiting active
  - Try multiple failed logins
  - Should be rate limited after N attempts

- [ ] Session security
  - Cookies have Secure flag
  - Cookies have HttpOnly flag
  - Cookies have SameSite attribute

- [ ] MFA enforced (if required)
  - Admin users cannot bypass MFA
  - Regular users prompted appropriately

### 13. Data Protection

- [ ] PII encrypted at rest
  - Check database (sample queries)
  - Sensitive fields encrypted
  - Hashes present for lookups

- [ ] Audit logging active
  - Perform a test action
  - Verify audit log entry created
  - Check log includes: user, action, timestamp, details

## Monitoring & Alerting (Minutes 40-45)

### 14. Monitoring Systems

- [ ] Prometheus scraping data
  - Visit: `http://your-prometheus:9090`
  - Check targets: Status → Targets
  - All targets "UP"

- [ ] Grafana dashboards functional
  - Visit: `http://your-grafana:3000`
  - Open "Ibimina Operations" dashboard
  - Data flowing (recent metrics visible)
  - No "No Data" panels

- [ ] Log aggregation working
  - Check log drain endpoint (if configured)
  - Recent logs present
  - Structured correctly

### 15. Alerting

- [ ] Alert manager configured
  - Rules loaded
  - Notification channels working

- [ ] Test critical alert (optional)
  - Trigger a test alert
  - Verify notification received
  - Acknowledge and resolve

- [ ] Silence non-critical alerts (if needed)
  - During deployment window
  - Document silences

## Final Verification

### 16. Smoke Test Summary

- [ ] All critical paths tested ✅
- [ ] Performance acceptable ✅
- [ ] Security verified ✅
- [ ] Monitoring active ✅
- [ ] No critical errors ✅

### 17. Documentation

- [ ] Deployment documented
  - Version/commit recorded
  - Deployment time noted
  - Any issues logged

- [ ] CHANGELOG updated
  - New version documented
  - Changes summarized
  - Known issues noted

- [ ] Stakeholders notified
  - Deployment complete email sent
  - Known issues communicated
  - Next steps outlined

### 18. Handoff

- [ ] Operations team briefed
  - Current status communicated
  - Any issues highlighted
  - Monitoring links shared

- [ ] On-call schedule confirmed
  - Primary on-call identified
  - Secondary on-call available
  - Escalation path clear

## Sign-Off

| Check              | Status        | Notes | Verified By | Time |
| ------------------ | ------------- | ----- | ----------- | ---- |
| Application Health | ☐ Pass ☐ Fail |       |             |      |
| Authentication     | ☐ Pass ☐ Fail |       |             |      |
| Core Features      | ☐ Pass ☐ Fail |       |             |      |
| Performance        | ☐ Pass ☐ Fail |       |             |      |
| Security           | ☐ Pass ☐ Fail |       |             |      |
| Monitoring         | ☐ Pass ☐ Fail |       |             |      |

**Overall Status**: ☐ PASS ☐ FAIL ☐ PASS WITH ISSUES

**Deployment Notes**:

```
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
```

**Action Items** (if any):

- [ ] ***
- [ ] ***
- [ ] ***

**Approved For Production**: **\*\*\*\***\_**\*\*\*\***
Date: \***\*\_\_\_\_\*\***

---

## Troubleshooting Common Issues

### Issue: Health check fails

**Solution**:

1. Check application logs
2. Verify environment variables
3. Check database connectivity
4. Restart application if needed

### Issue: Authentication not working

**Solution**:

1. Verify MFA secrets set correctly
2. Check MFA_RP_ID matches domain
3. Check Supabase credentials
4. Clear browser cache/cookies

### Issue: PWA not installing

**Solution**:

1. Verify HTTPS enabled
2. Check manifest.json accessible
3. Verify service worker registered
4. Check browser console for errors

### Issue: Slow performance

**Solution**:

1. Check database query performance
2. Verify caching working
3. Check connection pool
4. Review server resources

### Issue: Data not displaying

**Solution**:

1. Check database migrations applied
2. Verify RLS policies correct
3. Check API responses
4. Review browser console

---

## Post-Deployment Monitoring Schedule

**First Hour**:

- Check metrics every 5 minutes
- Monitor error logs continuously
- Watch for user reports

**First 24 Hours**:

- Check metrics every 30 minutes
- Review logs every 2 hours
- Monitor performance trends
- Track error rates

**First Week**:

- Daily metrics review
- Compare to baseline
- Track user feedback
- Identify any patterns

---

## Appendix: Test User Credentials

**Test Users** (for validation only - deactivate after deployment):

| Username               | Role  | Purpose                     |
| ---------------------- | ----- | --------------------------- |
| test.staff@example.com | Staff | Basic staff access testing  |
| test.admin@example.com | Admin | Admin functionality testing |

**Note**: Deactivate or remove test accounts after validation is complete.

---

**Last Updated**: 2025-10-28  
**Checklist Version**: 1.0

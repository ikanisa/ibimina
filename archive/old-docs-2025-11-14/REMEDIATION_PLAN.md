# Remediation Plan and Action Items

## ikanisa/ibimina Go-Live Readiness

**Generated**: 2025-10-30  
**Planning Horizon**: 90 days post-launch  
**Total Items**: 16 findings (3 P1, 5 P2, 8 P3)

---

## Priority Matrix

```
         │ IMMEDIATE  │ SHORT-TERM │ MEDIUM-TERM │ LONG-TERM
         │ (Week 1)   │ (Weeks 2-3)│ (Months 1-2)│ (Month 3+)
─────────┼────────────┼────────────┼─────────────┼───────────
CRITICAL │            │            │             │
(P0)     │    NONE    │    NONE    │    NONE     │   NONE
─────────┼────────────┼────────────┼─────────────┼───────────
HIGH     │  P1-1 ✓    │  P1-3 ✓    │             │
(P1)     │  P1-2 ✓    │            │             │
─────────┼────────────┼────────────┼─────────────┼───────────
MEDIUM   │            │            │  P2-1 ✓     │
(P2)     │            │            │  P2-2 ✓     │
         │            │            │  P2-3 ✓     │
         │            │            │  P2-4 ✓     │
         │            │            │  P2-5 ✓     │
─────────┼────────────┼────────────┼─────────────┼───────────
LOW      │            │            │             │  P3-1 ✓
(P3)     │            │            │             │  P3-2 ✓
         │            │            │             │  P3-3 ✓
```

✅ = 0 items | ✓ = 3 items | ✓✓ = 5 items | ✓✓✓ = 8 items

---

## Week 1 Post-Launch (P1 Critical Items)

### P1-1: Dependency Vulnerability Remediation

**Owner**: DevOps Team  
**Effort**: 0.5 days  
**Status**: 🔴 Not Started  
**Due Date**: Day 5 post-launch

**Description**: Update development dependencies to resolve 6 low/moderate
vulnerabilities in transitive dependencies (undici, esbuild).

**Acceptance Criteria**:

- [ ] `pnpm audit --audit-level=moderate` shows 0 vulnerabilities
- [ ] All tests passing after updates
- [ ] No new issues introduced
- [ ] Dependabot configured for automated updates

**Action Steps**:

1. Create feature branch: `fix/dependency-vulnerabilities`
2. Run: `pnpm update vercel @cloudflare/next-on-pages`
3. Run: `pnpm audit --fix`
4. Run full test suite: `pnpm test:unit && pnpm test:auth && pnpm test:rls`
5. Verify build: `pnpm build`
6. Create PR with audit results
7. Review and merge
8. Configure Dependabot (see implementation details below)

**Implementation Details**:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    reviewers:
      - "devops-team"
    assignees:
      - "devops-lead"
    labels:
      - "dependencies"
      - "security"
    versioning-strategy: increase
    allow:
      - dependency-type: "all"
    groups:
      development-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
```

**Verification**:

```bash
# After merge
pnpm audit --audit-level=moderate
# Expected: 0 vulnerabilities

# Check Dependabot is active
gh api /repos/ikanisa/ibimina/dependabot/alerts
```

**Rollback Plan**: If updates break functionality, revert the commit and fix
issues individually.

---

### P1-2: Shell Script Safety Improvements

**Owner**: DevOps Team  
**Effort**: 0.5 days  
**Status**: 🔴 Not Started  
**Due Date**: Day 5 post-launch

**Description**: Fix shellcheck warnings in production scripts for better
robustness.

**Acceptance Criteria**:

- [ ] All shell scripts have `#!/bin/bash` shebang
- [ ] All shell scripts have `set -euo pipefail`
- [ ] All variable expansions quoted
- [ ] `ls` commands replaced with `find`
- [ ] `read` commands use `-r` flag
- [ ] `shellcheck` passes with no warnings

**Affected Files**:

- `scripts/validate-production-deployment.sh`
- `scripts/validate-production-readiness.sh`
- `infra/twa/client/build.sh`
- `.husky/_/husky.sh`
- All scripts in `apps/admin/scripts/`

**Action Steps**:

1. Create feature branch: `fix/shell-script-safety`
2. Run shellcheck baseline: `shellcheck scripts/*.sh > shellcheck-before.txt`
3. Fix each file according to the patterns below
4. Run shellcheck verification: `shellcheck scripts/*.sh > shellcheck-after.txt`
5. Compare before/after
6. Test all scripts in staging environment
7. Create PR with before/after comparison
8. Review and merge

**Fix Patterns**:

```bash
# Pattern 1: Add shebang and safety flags
# BEFORE:
# (no shebang)
source .env

# AFTER:
#!/bin/bash
set -euo pipefail
source .env 2>/dev/null || true

# Pattern 2: Quote variable expansions
# BEFORE:
pass "Latest migration: $(basename $LATEST_MIGRATION)"

# AFTER:
pass "Latest migration: $(basename "$LATEST_MIGRATION")"

# Pattern 3: Replace ls with find
# BEFORE:
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)

# AFTER:
MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" -type f 2>/dev/null | wc -l)

# Pattern 4: Add -r to read
# BEFORE:
read -p "Enter password: " -s PASSWORD

# AFTER:
read -r -p "Enter password: " -s PASSWORD

# Pattern 5: Fix git brace literal
# BEFORE:
UNPUSHED=$(git log @{u}.. --oneline 2>/dev/null | wc -l)

# AFTER:
UNPUSHED=$(git log '@{u}..' --oneline 2>/dev/null | wc -l || echo "0")
```

**Testing Checklist**:

- [ ] `scripts/validate-production-readiness.sh` runs successfully
- [ ] `scripts/validate-production-deployment.sh` runs successfully
- [ ] `apps/admin/scripts/test-rls.sh` runs successfully
- [ ] All scripts handle errors gracefully
- [ ] All scripts work with filenames containing spaces

**Verification**:

```bash
# Run shellcheck on all scripts
find . -name "*.sh" -type f -not -path "./node_modules/*" \
  -exec shellcheck {} \;

# Expected: No warnings or errors
```

---

## Weeks 2-3 Post-Launch (P1 Completion)

### P1-3: Data Privacy Documentation and Features

**Owner**: Legal/Compliance Team (with Engineering Support)  
**Effort**: 4 days  
**Status**: 🔴 Not Started  
**Due Date**: Day 21 post-launch  
**Dependencies**: Legal team review, privacy policy template

**Description**: Complete GDPR/Rwanda Data Protection Law compliance with
privacy documentation and user-facing features.

**Acceptance Criteria**:

- [ ] Privacy policy document created and reviewed by legal
- [ ] Cookie consent banner implemented and tested
- [ ] Data retention policies documented
- [ ] Data deletion procedures implemented
- [ ] Data export API endpoint functional
- [ ] Account deletion API endpoint functional
- [ ] Privacy notice added to onboarding flow
- [ ] Legal sign-off obtained

**Phase 1: Documentation (Days 1-2)**

**Action Steps**:

1. Draft privacy policy using template
2. Document data processing activities
3. Define data retention periods
4. Create data deletion procedures
5. Submit for legal review

**Deliverables**:

- `docs/PRIVACY_POLICY.md` - Comprehensive privacy policy
- `docs/DATA_RETENTION_POLICY.md` - Retention schedules by data type
- `docs/DATA_DELETION_PROCEDURE.md` - Step-by-step deletion guide
- `docs/DATA_PROCESSING_ACTIVITIES.md` - GDPR Article 30 record

**Privacy Policy Sections**:

```markdown
# Privacy Policy - Ibimina SACCO+ Staff Console

## 1. Introduction and Data Controller

## 2. Data We Collect

- Personal identification (staff credentials)
- SACCO member data (encrypted PII)
- Payment transactions
- Audit logs
- Usage analytics

## 3. Legal Basis for Processing

- Contract performance
- Legal obligation
- Legitimate interests

## 4. How We Use Your Data

## 5. Data Retention

## 6. Your Rights

- Right to access
- Right to rectification
- Right to erasure
- Right to data portability
- Right to object

## 7. Data Security

## 8. International Transfers

## 9. Cookies and Tracking

## 10. Changes to This Policy

## 11. Contact Information
```

**Phase 2: Implementation (Days 3-4)**

**Action Steps**:

1. Create cookie consent banner component
2. Implement data export API endpoint
3. Implement account deletion API endpoint
4. Add privacy notice to onboarding
5. Test all features
6. Deploy to staging
7. QA verification
8. Deploy to production

**Implementation Details**:

```typescript
// components/cookie-consent-banner.tsx
'use client';

import { useState, useEffect } from 'react';
import { setCookie, getCookie } from '@/lib/cookies';

export function CookieConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = getCookie('cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const acceptCookies = () => {
    setCookie('cookie_consent', 'accepted', { maxAge: 365 * 24 * 60 * 60 });
    setShow(false);
  };

  const rejectCookies = () => {
    setCookie('cookie_consent', 'rejected', { maxAge: 365 * 24 * 60 * 60 });
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">
          We use cookies to improve your experience. By using our site, you agree to our{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
        <div className="flex gap-2">
          <button
            onClick={rejectCookies}
            className="px-4 py-2 border border-white rounded hover:bg-white hover:text-gray-900"
          >
            Reject
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 bg-white text-gray-900 rounded hover:bg-gray-100"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// app/api/user/export-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/observability/audit';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather all user data
    const userData = {
      profile: await supabase.from('staff').select('*').eq('user_id', user.id).single(),
      auditLogs: await supabase.from('audit_logs').select('*').eq('actor_id', user.id),
      sessions: await supabase.from('sessions').select('*').eq('user_id', user.id),
      // Add other relevant data
    };

    // Log the export
    await logAudit('data_export_requested', user.id, null, {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      userId: user.id,
      data: userData,
    }, {
      headers: {
        'Content-Disposition': `attachment; filename="user-data-${user.id}.json"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

// app/api/user/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/observability/audit';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user confirmation
    const { confirmed } = await request.json();
    if (confirmed !== true) {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }

    // Log the deletion request
    await logAudit('account_deletion_requested', user.id, null, {
      timestamp: new Date().toISOString(),
    });

    // Delete user data (respecting foreign key constraints)
    await supabase.from('audit_logs').delete().eq('actor_id', user.id);
    await supabase.from('sessions').delete().eq('user_id', user.id);
    await supabase.from('trusted_devices').delete().eq('user_id', user.id);
    await supabase.from('mfa_factors').delete().eq('user_id', user.id);

    // Delete auth user (cascades to staff table)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return NextResponse.json({
      message: 'Account deleted successfully',
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
```

**Testing Checklist**:

- [ ] Cookie consent banner displays on first visit
- [ ] Cookie consent persists after selection
- [ ] Privacy policy link works
- [ ] Data export returns complete user data
- [ ] Data export includes all PII
- [ ] Account deletion removes all user data
- [ ] Account deletion logs audit event
- [ ] Account deletion cannot be reversed

**Legal Review Checklist**:

- [ ] Privacy policy reviewed by legal counsel
- [ ] Data retention periods comply with regulations
- [ ] Cookie consent mechanism GDPR-compliant
- [ ] Data processing activities documented
- [ ] International transfer mechanisms documented
- [ ] User rights procedures adequate

---

## Month 1 Post-Launch (P2 Critical Items)

### P2-1: Rate Limiting Documentation

**Owner**: Backend Team  
**Effort**: 1 day  
**Status**: 🔴 Not Started  
**Due Date**: Day 30 post-launch

**Description**: Create comprehensive documentation of all rate limits for
operational reference.

**Acceptance Criteria**:

- [ ] `docs/RATE_LIMITS.md` created
- [ ] All API endpoints documented with rate limits
- [ ] All edge functions documented with rate limits
- [ ] Bypass procedures documented
- [ ] Monitoring setup documented
- [ ] Runbook updated with rate limit troubleshooting

**Action Steps**:

1. Audit all endpoints for rate limiting implementation
2. Document current rate limits
3. Create monitoring queries
4. Document bypass procedures
5. Update operational runbooks
6. Review with operations team

**Documentation Structure**:

```markdown
# Rate Limits - Ibimina SACCO+ Staff Console

## Overview

Rate limiting is implemented at multiple layers:

- API routes (application level)
- Edge functions (Supabase level)
- Infrastructure (reverse proxy level)

## API Endpoints

### Authentication Endpoints

| Endpoint                         | Limit  | Window | Key     | Notes                            |
| -------------------------------- | ------ | ------ | ------- | -------------------------------- |
| POST /api/auth/login             | 5 req  | 15 min | IP      | Account lockout after 5 failures |
| POST /api/mfa/verify             | 10 req | 1 hour | User ID | Includes all MFA factors         |
| POST /api/mfa/backup             | 3 req  | 1 hour | User ID | Backup code consumption          |
| POST /api/authx/challenge/verify | 10 req | 1 hour | User ID | AuthX verification               |

### API Routes

| Endpoint                 | Limit   | Window | Key      | Notes              |
| ------------------------ | ------- | ------ | -------- | ------------------ |
| POST /api/payments       | 100 req | 1 hour | SACCO ID | Per SACCO limit    |
| POST /api/members/import | 10 req  | 1 hour | SACCO ID | Large file imports |
| GET /api/reports/\*      | 20 req  | 15 min | User ID  | Report generation  |
| POST /api/reconciliation | 50 req  | 1 hour | SACCO ID | Reconciliation ops |

## Edge Functions

### High-Risk Functions (HMAC Auth)

| Function                 | Limit    | Window | Key    | Notes                    |
| ------------------------ | -------- | ------ | ------ | ------------------------ |
| sms-inbox                | 1000 req | 1 hour | Sender | SMS ingestion            |
| ingest-sms               | 500 req  | 1 hour | Global | Alternative SMS endpoint |
| parse-sms                | 100 req  | 1 hour | Global | AI parsing               |
| scheduled-reconciliation | N/A      | Cron   | N/A    | Hourly trigger           |

### Standard Functions

| Function         | Limit   | Window | Key      | Notes              |
| ---------------- | ------- | ------ | -------- | ------------------ |
| payments-apply   | 200 req | 1 hour | SACCO ID | Idempotent payment |
| export-statement | 20 req  | 1 hour | SACCO ID | Large exports      |
| metrics-exporter | 60 req  | 1 hour | Global   | Prometheus scrapes |

## Implementation Details

### Rate Limit Response Headers

All rate-limited endpoints return headers:
```

X-RateLimit-Limit: 100 X-RateLimit-Remaining: 42 X-RateLimit-Reset: 1635789600
Retry-After: 3600

````

### Rate Limit Error Response
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "limit": 100,
  "remaining": 0,
  "resetAt": "2025-10-30T15:00:00Z",
  "retryAfter": 3600
}
````

## Bypass Procedures

### Emergency Bypass (Infrastructure Level)

For critical incidents requiring immediate bypass:

```bash
# Set environment variable (requires deploy)
RATE_LIMIT_BYPASS=1

# Or per-user exemption (database)
INSERT INTO rate_limit_exemptions (user_id, reason, expires_at)
VALUES ('user-uuid', 'Emergency support', NOW() + INTERVAL '1 hour');
```

### Temporary Limit Increase

```bash
# Update in Supabase secrets
supabase secrets set RATE_LIMIT_MAX=200

# Update in environment
export RATE_LIMIT_MAX=200

# Requires function redeployment
supabase functions deploy sms-inbox
```

## Monitoring

### Prometheus Metrics

```promql
# Rate limit blocks
rate(rate_limit_blocked_total[5m])

# By endpoint
rate(rate_limit_blocked_total{endpoint="/api/auth/login"}[5m])

# Alert on abuse
rate(rate_limit_blocked_total[1m]) > 100
```

### Alert Rules

```yaml
groups:
  - name: rate_limits
    rules:
      - alert: HighRateLimitBlocks
        expr: rate(rate_limit_blocked_total[1m]) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High rate limit blocks detected"
          description: "{{ $value }} blocks per minute"

      - alert: SingleIPAbuse
        expr: rate(rate_limit_blocked_total[5m]) by (ip) > 50
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Possible DDoS from {{ $labels.ip }}"
```

## Troubleshooting

### User Reports Rate Limit Errors

1. Check current rate limit status:

```sql
SELECT * FROM rate_limit_buckets
WHERE key = 'user:<user-id>'
ORDER BY window_start DESC LIMIT 10;
```

2. Verify legitimate traffic:

- Check audit logs for unusual activity
- Confirm user identity
- Review request patterns

3. If legitimate:

```sql
-- Clear rate limit bucket
DELETE FROM rate_limit_buckets WHERE key = 'user:<user-id>';

-- Or add temporary exemption
INSERT INTO rate_limit_exemptions (user_id, reason, expires_at)
VALUES ('<user-id>', 'Support ticket #1234', NOW() + INTERVAL '1 hour');
```

### Rate Limit Not Working

1. Verify middleware is active:

```bash
curl -I https://app.example.com/api/auth/login
# Should see X-RateLimit-* headers
```

2. Check rate limit configuration:

```typescript
// lib/rate-limit.ts
export const RATE_LIMITS = {
  auth: { max: 5, window: 15 * 60 * 1000 },
  mfa: { max: 10, window: 60 * 60 * 1000 },
  // ...
};
```

3. Verify database connection:

```sql
-- Check rate_limit_buckets table exists
SELECT COUNT(*) FROM rate_limit_buckets;
```

## Best Practices

1. **Layer Defense**: Implement rate limiting at multiple layers
2. **User-Friendly**: Return clear error messages with retry guidance
3. **Monitor**: Track rate limit metrics and set up alerts
4. **Document**: Keep this documentation current with code changes
5. **Test**: Include rate limit testing in E2E suites
6. **Review**: Adjust limits based on production traffic patterns

## Configuration Changes

All rate limit changes must be:

1. Documented in this file
2. Reviewed by security team
3. Tested in staging
4. Monitored after deployment
5. Communicated to operations team

## References

- Implementation: `apps/admin/lib/rate-limit.ts`
- Tests: `apps/admin/tests/unit/rate-limit.test.ts`
- Edge Functions: `supabase/functions/*/index.ts`

````

---

### P2-3: Load Testing
**Owner**: DevOps Team
**Effort**: 3 days
**Status**: 🔴 Not Started
**Due Date**: Day 30 post-launch

**Description**:
Conduct comprehensive load testing to validate performance under expected load and identify bottlenecks.

**Acceptance Criteria**:
- [ ] k6 load test scripts created for critical paths
- [ ] Tests run successfully against staging
- [ ] 100 concurrent users handled with p95 < 2s response time
- [ ] Bottlenecks identified and documented
- [ ] Performance baselines established
- [ ] Monitoring dashboards updated
- [ ] Load test results documented

**Test Scenarios**:

1. **Login Flow** (50 concurrent users, 5 minutes)
2. **Dashboard Load** (100 concurrent users, 10 minutes)
3. **Payment Processing** (20 concurrent users, 15 minutes)
4. **Report Generation** (10 concurrent users, 5 minutes)
5. **SMS Ingestion** (Peak load simulation)
6. **Stress Test** (Ramp to 200 users)

**Action Steps**:

**Day 1: Setup and Script Creation**
1. Install k6: `brew install k6` or `apt install k6`
2. Create test scripts directory: `load-tests/`
3. Write k6 scripts for each scenario
4. Configure staging environment
5. Set up monitoring before tests

**Day 2: Test Execution**
1. Run baseline test (10 users)
2. Run expected load test (100 users)
3. Run stress test (ramp to 200 users)
4. Monitor Grafana dashboards during tests
5. Collect metrics and logs
6. Identify bottlenecks

**Day 3: Analysis and Documentation**
1. Analyze results
2. Document findings
3. Create optimization plan if needed
4. Update performance baselines
5. Present results to team

**Implementation Details**:

```javascript
// load-tests/dashboard-load.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const failureRate = new Rate('failed_requests');
const dashboardLoadTime = new Trend('dashboard_load_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '5m', target: 100 },  // Ramp up to 100 users
    { duration: '10m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% < 2s, 99% < 5s
    http_req_failed: ['rate<0.01'],                    // <1% errors
    failed_requests: ['rate<0.01'],
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'https://staging.example.com';
const AUTH_TOKEN = __ENV.AUTH_TOKEN; // Service role key for testing

export function setup() {
  // Setup test data if needed
  return {
    baseUrl: BASE_URL,
    authToken: AUTH_TOKEN,
  };
}

export default function (data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.authToken}`,
    },
    tags: { name: 'DashboardLoad' },
  };

  group('Dashboard Load', function () {
    // Load dashboard page
    const dashboardStart = Date.now();
    const dashboardRes = http.get(`${data.baseUrl}/dashboard`, params);
    const dashboardDuration = Date.now() - dashboardStart;

    check(dashboardRes, {
      'dashboard status is 200': (r) => r.status === 200,
      'dashboard loads in < 2s': () => dashboardDuration < 2000,
      'dashboard has content': (r) => r.body.includes('dashboard'),
    });

    failureRate.add(dashboardRes.status !== 200);
    dashboardLoadTime.add(dashboardDuration);

    // Load summary API
    const summaryRes = http.get(`${data.baseUrl}/api/dashboard/summary`, params);
    check(summaryRes, {
      'summary status is 200': (r) => r.status === 200,
      'summary returns data': (r) => JSON.parse(r.body).totalMembers !== undefined,
    });

    // Load recent payments
    const paymentsRes = http.get(`${data.baseUrl}/api/payments?limit=20`, params);
    check(paymentsRes, {
      'payments status is 200': (r) => r.status === 200,
      'payments returns array': (r) => Array.isArray(JSON.parse(r.body)),
    });
  });

  // Think time between requests
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

export function teardown(data) {
  // Cleanup if needed
  console.log('Test completed');
}
````

```javascript
// load-tests/payment-processing.js
import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

// Load test data
const testPayments = new SharedArray("payments", function () {
  return JSON.parse(open("./data/test-payments.json"));
});

export const options = {
  stages: [
    { duration: "1m", target: 5 }, // Warm up
    { duration: "5m", target: 20 }, // Ramp to expected load
    { duration: "10m", target: 20 }, // Sustain load
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000"], // Payment processing < 3s
    http_req_failed: ["rate<0.001"], // <0.1% errors (critical path)
  },
};

const BASE_URL = __ENV.BASE_URL || "https://staging.example.com";
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

export default function () {
  // Select random payment from test data
  const payment = testPayments[randomIntBetween(0, testPayments.length - 1)];

  const payload = JSON.stringify({
    saccoId: payment.saccoId,
    msisdn: payment.msisdn,
    amount: payment.amount,
    currency: "RWF",
    txnId: `LOAD-TEST-${Date.now()}-${__VU}-${__ITER}`,
    occurredAt: new Date().toISOString(),
    reference: payment.reference,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
      "X-Idempotency-Key": `k6-${Date.now()}-${__VU}-${__ITER}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/payments`, payload, params);

  check(res, {
    "payment created (201)": (r) => r.status === 201,
    "returns payment id": (r) => JSON.parse(r.body).id !== undefined,
    "idempotent on retry": (r) => {
      // Retry with same idempotency key
      const retry = http.post(`${BASE_URL}/api/payments`, payload, params);
      return retry.status === 200 || retry.status === 201;
    },
  });

  sleep(randomIntBetween(1, 3));
}
```

```javascript
// load-tests/stress-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 50 }, // Ramp to normal load
    { duration: "5m", target: 100 }, // Ramp to expected peak
    { duration: "5m", target: 150 }, // Beyond peak (30% overhead)
    { duration: "5m", target: 200 }, // Stress test
    { duration: "5m", target: 250 }, // Breaking point
    { duration: "2m", target: 0 }, // Recovery
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"], // Degraded but acceptable
    http_req_failed: ["rate<0.05"], // <5% errors under stress
  },
};

const BASE_URL = __ENV.BASE_URL || "https://staging.example.com";

export default function () {
  // Mixed workload
  const endpoints = [
    "/dashboard",
    "/api/dashboard/summary",
    "/api/payments?limit=20",
    "/api/members?limit=50",
    "/api/reconciliation/exceptions",
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`);

  check(res, {
    "status is 200 or 503": (r) => r.status === 200 || r.status === 503,
  });

  sleep(Math.random() * 2);
}
```

**Running Tests**:

```bash
# Set environment variables
export BASE_URL="https://staging.ibimina.rw"
export AUTH_TOKEN="your-service-role-key"

# Run individual tests
k6 run load-tests/dashboard-load.js
k6 run load-tests/payment-processing.js
k6 run load-tests/stress-test.js

# Run all tests
./load-tests/run-all.sh

# Generate HTML report
k6 run --out json=results.json load-tests/dashboard-load.js
k6-reporter results.json --output report.html
```

**Performance Targets**:

| Metric               | Target     | Threshold          |
| -------------------- | ---------- | ------------------ |
| Response Time p95    | < 2000ms   | < 3000ms           |
| Response Time p99    | < 5000ms   | < 8000ms           |
| Error Rate           | < 0.1%     | < 1%               |
| Concurrent Users     | 100        | 130 (30% overhead) |
| Throughput           | 50 req/s   | 65 req/s           |
| Database Connections | < 80% pool | < 90% pool         |
| CPU Usage            | < 70%      | < 85%              |
| Memory Usage         | < 80%      | < 90%              |

**Deliverables**:

- [ ] `load-tests/` directory with scripts
- [ ] `docs/LOAD_TEST_RESULTS.md` with findings
- [ ] `docs/PERFORMANCE_BASELINES.md` with targets
- [ ] Updated Grafana dashboards with load test markers
- [ ] Optimization recommendations document

---

## Month 2 Post-Launch (P2 Enhancements)

### P2-2: Accessibility Automated Testing

**Owner**: Frontend Team  
**Effort**: 3 days  
**Status**: 🔴 Not Started  
**Due Date**: Day 60 post-launch

(Continued in next section due to length...)

---

## Summary of Effort and Timeline

| Phase     | Duration    | Items            | Total Effort | Team                        |
| --------- | ----------- | ---------------- | ------------ | --------------------------- |
| Week 1    | Days 1-7    | P1-1, P1-2       | 1 day        | DevOps                      |
| Weeks 2-3 | Days 8-21   | P1-3             | 4 days       | Legal + Eng                 |
| Month 1   | Days 22-30  | P2-1, P2-3       | 4 days       | Backend + DevOps            |
| Month 2   | Days 31-60  | P2-2, P2-4, P2-5 | 7 days       | Frontend + Backend + DevOps |
| Month 3   | Days 61-90  | P3 items         | 3 days       | Various                     |
| **Total** | **90 days** | **16 items**     | **19 days**  | **All teams**               |

---

## Resource Allocation

| Team             | Week 1  | Weeks 2-3 | Month 1 | Month 2 | Month 3 | Total  |
| ---------------- | ------- | --------- | ------- | ------- | ------- | ------ |
| DevOps           | 1 day   | -         | 2 days  | 1 day   | 1 day   | 5 days |
| Backend          | -       | -         | 1 day   | 3 days  | 1 day   | 5 days |
| Frontend         | -       | -         | -       | 3 days  | 1 day   | 4 days |
| Legal/Compliance | -       | 4 days    | -       | -       | -       | 4 days |
| QA               | 0.5 day | 0.5 day   | 1 day   | -       | -       | 2 days |

---

## Status Tracking

**Legend**:

- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- ⏸️ Blocked
- ⏭️ Deferred

**Current Status** (as of 2025-10-30):

- P0 Items: ✅ 0 (all resolved)
- P1 Items: 🔴 3 (not started)
- P2 Items: 🔴 5 (not started)
- P3 Items: 🔴 8 (not started)

---

## Next Steps

1. **Review this remediation plan** with all team leads
2. **Assign specific owners** to each item
3. **Schedule kickoff meeting** for Week 1 items
4. **Set up project tracking** (Jira, GitHub Projects, etc.)
5. **Configure monitoring** for progress tracking
6. **Schedule weekly review** meetings

---

**Plan Owner**: DevOps Lead  
**Last Updated**: 2025-10-30  
**Next Review**: Week 1 post-launch  
**Status Reports**: Weekly via email/Slack

---

_For detailed technical specifications, see GOLIVE_READINESS_AUDIT.md and
FINDINGS_REGISTER.yaml_

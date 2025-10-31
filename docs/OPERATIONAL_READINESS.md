# Operational Readiness Guide - SACCO+ Platform

This document provides comprehensive guidance for operating and monitoring the
SACCO+ platform in production.

## Production Readiness Checklist

### Infrastructure

- [x] Health check endpoint implemented at `/api/health`
- [x] Database connectivity monitoring
- [x] Auth service validation
- [x] Idempotency system for sensitive operations
- [x] Audit logging for critical actions
- [x] Demo environment seeds available

### Monitoring & Observability

#### Health Checks

Run health checks regularly to validate system readiness:

```bash
# Local development
ts-node infra/scripts/health-checks.ts

# Staging environment
ts-node infra/scripts/health-checks.ts --endpoint https://staging.sacco.rw

# Production environment
ts-node infra/scripts/health-checks.ts --endpoint https://admin.sacco.rw
```

The health check validates:

- Database connectivity and latency
- Auth service availability
- Overall system health
- API responsiveness

#### Audit Logs

Monitor audit logs for security and compliance:

```sql
-- Recent audit activity
SELECT
  action,
  entity,
  actor,
  created_at
FROM app.audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 100;

-- Critical operations audit
SELECT
  action,
  COUNT(*) as count,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM app.audit_logs
WHERE action IN (
  'join_request_approved',
  'join_request_rejected',
  'OCR_ACCEPTED',
  'OCR_RESCAN_REQUESTED',
  'staff_invited',
  'payment_processed'
)
GROUP BY action;
```

#### Idempotency Table Maintenance

Monitor and clean up idempotency records:

```sql
-- Check idempotency table size
SELECT COUNT(*) as total_records FROM ops.idempotency;

-- View recent idempotency usage
SELECT
  key,
  user_id,
  expires_at,
  created_at
FROM ops.idempotency
ORDER BY created_at DESC
LIMIT 20;

-- Clean up expired records (run periodically)
DELETE FROM ops.idempotency
WHERE expires_at < NOW();
```

Or use the utility function:

```typescript
import { cleanupExpiredIdempotency } from "@/lib/idempotency";

const result = await cleanupExpiredIdempotency();
console.log(`Deleted ${result.deleted} expired records`);
```

### Critical Features & Operations

#### 1. Staff Management

**Staff Directory** (`/admin/staff`)

- Searchable and filterable list of staff members
- Organization-scoped access control
- Role-based permissions

**Invite Staff**

- Email-based invitation system
- Secure random password generation
- Forced password reset on first login
- Audit logging for all invitations

**Implementation:**

- Component: `apps/admin/components/admin/staff/add-staff-drawer.tsx`
- Page: `apps/admin/app/(main)/admin/(panel)/staff/page.tsx`
- Edge Function: `supabase/functions/admin-invite-staff/`

#### 2. Approvals Queue

**Join Requests** (`/admin/approvals`)

- Approve or reject member join requests
- Record decision reasoning
- Multi-tenant scoped by SACCO
- Full audit trail

**Group Invites**

- Manage pending group invitations
- Resend or revoke invites
- SMS-based notification system

**Implementation:**

- Component: `apps/admin/components/admin/approvals/approvals-panel.tsx`
- Page: `apps/admin/app/(main)/admin/(panel)/approvals/page.tsx`
- Actions: `apps/admin/app/(main)/admin/(panel)/approvals/actions.ts`

#### 3. OCR Review Queue

**Document Verification** (`/admin/ocr`)

- Review OCR-extracted identity documents
- Confidence scoring (threshold: 82%)
- Accept or request rescan
- Audit logging for decisions

**Workflow:**

1. Member uploads identity document
2. OCR service extracts data
3. Staff reviews extraction quality
4. Decision: Accept (verify member) or Rescan (low confidence)

**Implementation:**

- Component: `apps/admin/components/admin/ocr/ocr-review-queue.tsx`
- Page: `apps/admin/app/(main)/admin/(panel)/ocr/page.tsx`
- Actions: `apps/admin/app/(main)/admin/actions.ts` (resolveOcrReview)

### Security Best Practices

#### Idempotency

Wrap sensitive operations with idempotency protection:

```typescript
import { withIdempotency } from "@/lib/idempotency";

const result = await withIdempotency({
  key: "payment-processing",
  userId: user.id,
  operation: async () => {
    // Your operation here
    return await processPayment(paymentData);
  },
  requestPayload: paymentData,
  ttlMinutes: 30,
});

if (result.fromCache) {
  console.log("Operation already executed, returned cached result");
} else {
  console.log("Operation executed and cached");
}
```

#### Audit Logging

Log all critical operations:

```typescript
import { logAudit } from "@/lib/audit";

await logAudit({
  action: "payment_processed",
  entity: "payment",
  entityId: payment.id,
  diff: {
    amount: payment.amount,
    status: "completed",
    method: payment.method,
  },
});
```

### Deployment Procedures

#### Pre-Deployment

1. **Run Health Checks**

   ```bash
   ts-node infra/scripts/health-checks.ts --endpoint <staging-url>
   ```

2. **Verify Database Migrations**

   ```bash
   supabase db push --dry-run
   ```

3. **Run Test Suite**

   ```bash
   pnpm run test
   ```

4. **Check for Breaking Changes**
   - Review API changes
   - Validate backward compatibility
   - Update documentation

#### Post-Deployment

1. **Validate Health Endpoint**

   ```bash
   curl https://admin.sacco.rw/api/health
   ```

2. **Monitor Error Rates**
   - Check application logs
   - Review error tracking system
   - Validate auth flows

3. **Test Critical Flows**
   - Staff login
   - Approval workflows
   - OCR review
   - Payment processing

### Troubleshooting

#### Health Check Failures

**Database connection issues:**

```bash
# Check connection string
echo $DATABASE_URL

# Test direct connection
psql $DATABASE_URL -c "SELECT 1;"

# Review connection pool
SELECT * FROM pg_stat_activity;
```

**Auth service issues:**

- Verify Supabase Auth is running
- Check service role key configuration
- Review JWT secret validity

#### Idempotency Issues

If operations are not being cached:

1. Check ops.idempotency table exists
2. Verify RLS policies are correct
3. Review TTL configuration
4. Check for expired records

#### Audit Log Gaps

If audit logs are not being written:

1. Verify app.audit_logs table exists
2. Check RLS policies
3. Review error logs for failed writes
4. Validate user authentication

### Demo Environment

Use the demo seed for testing and presentations:

```bash
# Load demo data
psql $DATABASE_URL -f infra/scripts/seed-demo-environment.sql
```

**Demo Users:**

- System Admin: `demo.admin@sacco.rw` / `DemoPass123!`
- District Manager: `demo.district@sacco.rw` / `DemoPass123!`
- SACCO Manager: `demo.kigali.manager@sacco.rw` / `DemoPass123!`

**Demo Data:**

- 1 District (Gasabo)
- 2 SACCOs
- 1 MFI
- 5 Groups
- 39 Members

### Support & Escalation

For production issues:

1. **Check Health Status**: Run health-checks.ts script
2. **Review Logs**: Check application and database logs
3. **Verify Configuration**: Environment variables and secrets
4. **Database Status**: Connection pool, active queries
5. **Escalate**: Contact platform team if unresolved

### Maintenance Windows

Recommended maintenance tasks:

**Daily:**

- Monitor health check status
- Review error logs
- Check idempotency table size

**Weekly:**

- Clean up expired idempotency records
- Review audit logs for anomalies
- Validate backup integrity

**Monthly:**

- Security audit of critical operations
- Performance review and optimization
- Documentation updates

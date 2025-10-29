# Ground Rules and Mandatory Best Practices

**Version**: 1.0  
**Last Updated**: 2025-10-29

This document defines mandatory ground rules and best practices that must be
followed across all services in the ibimina monorepo. These rules are enforced
through CI validation scripts and code review.

## 📦 Package Manager

### Rule: pnpm Only

**Status**: MANDATORY

- **Use pnpm exclusively** for package management
- Version: `pnpm@10.19.0` (defined in `package.json` packageManager field)
- Never use `npm` or `yarn` commands
- All CI pipelines enforce this requirement

**Rationale**: pnpm provides:

- Efficient disk space usage through content-addressable storage
- Strict dependency resolution preventing phantom dependencies
- Better monorepo support with workspace protocol
- Faster installation times

**Enforcement**:

```bash
# This is enforced in:
# - Dockerfile
# - scripts/validate-production-readiness.sh
# - CI workflows
```

**Developer Setup**:

```bash
# Install pnpm globally
npm install -g pnpm@10.19.0

# Or use corepack (Node.js 16.13+)
corepack enable
corepack prepare pnpm@10.19.0 --activate
```

## 🔒 Security Ground Rules

### 1. No Service Role Keys in Client Code

**Status**: MANDATORY

Supabase service role keys must NEVER be exposed to client-side code. These keys
bypass Row Level Security (RLS) and grant full database access.

**Enforcement**:

- Prebuild hooks scan client code for service role keys
- CI pipelines fail if violations detected
- Documented in `packages/README.md`

**Allowed**:

```javascript
// ✅ Client-side: Use anon key only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

**Forbidden**:

```javascript
// ❌ Client-side: NEVER use service role key
const supabase = createClient(
  url,
  process.env.SUPABASE_SERVICE_ROLE_KEY // FORBIDDEN in client code
);
```

### 2. Webhook Signature Verification

**Status**: MANDATORY

All incoming webhooks must verify signatures before processing.

**Implementation**:

```typescript
import { verifyWebhookSignature } from "@ibimina/lib/security";

// Required for all webhook handlers
const isValid = await verifyWebhookSignature(
  request.body,
  request.headers.get("x-webhook-signature"),
  process.env.HMAC_SHARED_SECRET
);

if (!isValid) {
  return new Response("Invalid signature", { status: 401 });
}
```

**Enforcement**:

- Security audits check all webhook endpoints
- Required for production deployment

### 3. PII Masking in Logs

**Status**: MANDATORY

Personally Identifiable Information (PII) must be masked in all logs, error
messages, and monitoring data.

**PII Categories to Mask**:

- Phone numbers
- Email addresses
- National IDs
- Bank account numbers
- Passwords and tokens
- Address information

**Implementation**:

```typescript
// Use structured logging with PII masking
import { logger } from "@ibimina/lib/logger";

// ✅ Correct: Use maskPII utility
logger.info("User login", {
  userId: user.id,
  phone: maskPII(user.phone, "phone"),
  timestamp: new Date().toISOString(),
});

// ❌ Incorrect: Raw PII in logs
console.log("User phone:", user.phone); // FORBIDDEN
```

**Masking Patterns**:

- Phone: `+250XXX...XXX789` (show country code and last 3 digits)
- Email: `us...@example.com` (show first 2 chars and domain)
- National ID: `1234...8901` (show first 4 and last 4)

### 4. Secure Secret Management

**Status**: MANDATORY

All secrets must be:

1. Generated using cryptographically secure random sources
2. Stored in environment variables, never in code
3. Rotated according to schedule (quarterly for critical secrets)
4. Never committed to version control

**Secret Generation**:

```bash
# Generate 32-byte secrets
openssl rand -base64 32  # For base64 encoded keys
openssl rand -hex 32     # For hex encoded keys
```

**Required Secrets**:

- `KMS_DATA_KEY_BASE64`: Encryption key (32 bytes base64)
- `BACKUP_PEPPER`: Backup encryption pepper
- `MFA_SESSION_SECRET`: MFA session signing
- `TRUSTED_COOKIE_SECRET`: Trusted device tokens
- `HMAC_SHARED_SECRET`: Webhook signatures

**Validation**:

- `.env.example` provides templates (never real values)
- CI checks for accidental secret commits
- Production readiness script validates presence

## 🪵 Structured Logging

**Status**: MANDATORY

Use structured logging for all production services.

**Requirements**:

1. JSON format for production logs
2. Consistent log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
3. Include context: timestamp, service, requestId, userId (when available)
4. PII masking applied automatically

**Implementation**:

```typescript
import { logger } from "@ibimina/lib/logger";

// Structured logging with context
logger.info("Processing transaction", {
  transactionId: tx.id,
  amount: tx.amount,
  userId: tx.userId,
  timestamp: new Date().toISOString(),
});
```

**Log Levels Usage**:

- `trace`: Detailed debug information (disabled in production)
- `debug`: Debug information (disabled in production)
- `info`: General information, user actions
- `warn`: Warning conditions, degraded functionality
- `error`: Error conditions, failed operations
- `fatal`: Critical errors requiring immediate attention

## 🚩 Feature Flags

**Status**: REQUIRED FOR NEW FEATURES

All new features must be behind feature flags for safe rollout and quick
rollback.

**Feature Flag Storage**:

- Stored in `public.feature_flags` table
- Managed via Admin dashboard
- Cached for performance

**Implementation**:

```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag'

function MyComponent() {
  const { enabled } = useFeatureFlag('new_dashboard_analytics')

  if (!enabled) {
    return <LegacyDashboard />
  }

  return <NewDashboard />
}
```

**Validation**:

```bash
# Check all feature flags are defined
pnpm run check:flags
```

## 🗄️ Database Standards

### 1. Always Use Transactions

**Status**: MANDATORY

All database migrations must use explicit transactions.

**Format**:

```sql
BEGIN;

-- Migration statements here
CREATE TABLE IF NOT EXISTS...
ALTER TABLE...

COMMIT;
```

**Enforcement**:

- CI validates migration format
- Documented in `docs/DB_GUIDE.md`

### 2. Row Level Security (RLS)

**Status**: MANDATORY

All tables must have RLS policies defined unless explicitly documented why not
needed.

**Requirements**:

1. RLS enabled on all user-facing tables
2. Policies tested with `pnpm run test:rls`
3. Service role bypasses RLS (be careful!)
4. Document any exceptions

**Example**:

```sql
-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own data
CREATE POLICY "Users can view their own profile"
ON members
FOR SELECT
USING (auth.uid() = user_id);
```

## 📊 Monitoring and Observability

### 1. Health Checks

**Status**: MANDATORY

All services must expose a `/api/health` endpoint.

**Response Format**:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "commit": "abc123",
  "timestamp": "2025-10-29T00:00:00Z",
  "checks": {
    "database": "ok",
    "cache": "ok"
  }
}
```

### 2. Error Tracking

**Status**: REQUIRED

- Production errors logged to structured log drain
- Critical errors trigger alerts
- Error context includes requestId for tracing

### 3. Performance Metrics

**Status**: RECOMMENDED

Track key metrics:

- Response times (p50, p95, p99)
- Error rates
- Active connections
- Queue lengths
- Cache hit rates

## 🔄 API Design Standards

### 1. Versioning

**Status**: REQUIRED

APIs must be versioned:

- URL path versioning: `/api/v1/...`
- Breaking changes require new version
- Deprecated versions supported for 6 months minimum

### 2. Rate Limiting

**Status**: MANDATORY

All public APIs must implement rate limiting:

- Default: 120 requests per minute per IP
- Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_SECONDS`
- Return `429 Too Many Requests` when exceeded
- Include `Retry-After` header

### 3. Error Responses

**Status**: MANDATORY

Standard error response format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": {
      "field": "phone",
      "value": "masked"
    },
    "requestId": "req_abc123"
  }
}
```

## 🧪 Testing Standards

### 1. Test Coverage

**Status**: REQUIRED

- Minimum 70% code coverage for business logic
- 100% coverage for security-critical paths
- Unit tests for all utility functions
- E2E tests for critical user journeys

### 2. Security Testing

**Status**: MANDATORY

Run before every deployment:

```bash
pnpm run test:auth    # Auth security tests
pnpm run test:rls     # RLS policy tests
```

### 3. CI Requirements

**Status**: MANDATORY

All PRs must pass:

- Linting: `pnpm run lint`
- Type checking: `pnpm run typecheck`
- Unit tests: `pnpm run test:unit`
- Security tests: `pnpm run test:auth` and `pnpm run test:rls`
- Build: `pnpm run build`

## 📝 Code Style and Quality

### 1. TypeScript Required

**Status**: MANDATORY

- All new code must be TypeScript
- No `any` types without explicit justification
- Strict mode enabled
- Type definitions for all exports

### 2. Formatting

**Status**: MANDATORY

- Use Prettier for formatting
- Run `pnpm format:check` in CI
- Pre-commit hooks auto-format code
- ESLint rules enforced

### 3. Code Review Requirements

**Status**: MANDATORY

All PRs must:

1. Pass CI checks
2. Have at least one approval
3. Address security review comments
4. Update documentation when needed
5. Include test coverage for new code

## 🚀 Deployment Standards

### 1. Build Verification

**Status**: MANDATORY

Before deployment, verify:

```bash
pnpm run validate:production
pnpm run check:deploy
```

### 2. Environment Variables

**Status**: MANDATORY

- Production secrets never in code
- All required vars documented in `.env.example`
- Server-side vars must NOT have `NEXT_PUBLIC_` prefix
- Client vars must have `NEXT_PUBLIC_` prefix

### 3. Zero-Downtime Deployments

**Status**: REQUIRED

- Use rolling updates
- Database migrations backward compatible
- Feature flags for gradual rollout

## 📖 Documentation Standards

### 1. README Files

**Status**: REQUIRED

Every service/package must have:

- Purpose and scope
- Setup instructions
- Development workflow
- Deployment guide
- Troubleshooting section

### 2. API Documentation

**Status**: REQUIRED

All APIs documented with:

- Endpoint descriptions
- Request/response examples
- Authentication requirements
- Error codes
- Rate limits

### 3. Change Documentation

**Status**: REQUIRED

- CHANGELOG.md updated for releases
- Migration guides for breaking changes
- Architecture decision records (ADRs) for major changes

## ⚡ Performance Standards

### 1. Response Time Targets

**Status**: REQUIRED

- API responses: p95 < 2 seconds
- Page loads: p95 < 3 seconds
- Database queries: p95 < 500ms

### 2. Bundle Size Limits

**Status**: REQUIRED

- Enforce bundle budgets: `pnpm run assert:bundle`
- Client bundle < 500KB gzipped
- Lazy load non-critical code

### 3. Caching Strategy

**Status**: REQUIRED

- Static assets with long-term caching
- API responses with appropriate Cache-Control
- Database query results cached when applicable

## 🔄 Dependency Management

### 1. Dependency Updates

**Status**: REQUIRED

- Weekly dependency update checks
- Security patches applied within 48 hours
- Major version updates tested thoroughly
- Renovate bot configured for automation

### 2. Shared Dependencies

**Status**: MANDATORY

Common dependencies in workspace root:

- TypeScript
- ESLint
- Prettier
- Testing frameworks

Service-specific dependencies in service `package.json`.

## 🚨 Incident Response

### 1. Severity Levels

- **P0 (Critical)**: Service down, data loss risk
- **P1 (High)**: Major feature broken, security issue
- **P2 (Medium)**: Minor feature broken, performance degraded
- **P3 (Low)**: Cosmetic issues, minor bugs

### 2. Response Times

- **P0**: Immediate response, fix within 1 hour
- **P1**: Response within 2 hours, fix within 24 hours
- **P2**: Response within 1 day, fix within 1 week
- **P3**: Response within 1 week, fix in next sprint

## ✅ Compliance

These ground rules ensure:

- **Security**: PII protection, secret management, auth security
- **Reliability**: Testing, monitoring, error handling
- **Maintainability**: Code quality, documentation, standards
- **Performance**: Response times, bundle size, caching
- **Compliance**: Audit logging, data protection, access control

## 🔍 Enforcement

Ground rules enforced through:

1. Pre-commit hooks (formatting, linting)
2. CI pipeline checks (tests, security, build)
3. Code review requirements
4. Production validation scripts
5. Automated security scans

Violations of mandatory rules will block PR merges and deployments.

---

**Questions or Clarifications?**

Open an issue or start a discussion for any questions about these ground rules.
Proposed changes to ground rules require team discussion and approval.

**Related Documentation**:

- [Quick Reference](QUICK_REFERENCE.md)
- [Security Hardening](SECURITY_HARDENING.md)
- [CI Workflows](CI_WORKFLOWS.md)
- [Database Guide](DB_GUIDE.md)

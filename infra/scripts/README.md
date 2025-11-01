# Infrastructure Scripts

This directory contains operational scripts for the SACCO+ platform.

## Health Checks

### health-checks.ts

Comprehensive health check script that validates the readiness of all critical
services.

**Usage:**

```bash
# Check local development environment
ts-node infra/scripts/health-checks.ts

# Check production environment
ts-node infra/scripts/health-checks.ts --endpoint https://admin.sacco.rw

# Use environment variable
HEALTH_CHECK_ENDPOINT=https://admin.sacco.rw ts-node infra/scripts/health-checks.ts
```

**What it checks:**

- Database connectivity and latency
- Auth service availability
- Overall system health
- API endpoint responsiveness

**Exit codes:**

- `0`: All checks passed
- `1`: One or more checks failed

## Demo Seeds

### seed-demo-environment.sql

Comprehensive demo data for testing and presentations.

**Usage:**

```bash
# Run against local Supabase
psql -h localhost -U postgres -d postgres -f infra/scripts/seed-demo-environment.sql

# Or via Supabase CLI
supabase db reset
psql $DATABASE_URL -f infra/scripts/seed-demo-environment.sql
```

**What it creates:**

- 1 District: Gasabo
- 2 SACCOs: Kigali Savings & Nyarugenge Cooperative
- 1 MFI: Rwanda Community Capital
- 5 Ikimina Groups with realistic names
- 39 Members with Rwandan names
- 6 Staff users with various roles

**Demo Credentials:**

- System Admin: `demo.admin@sacco.rw` / `DemoPass123!`
- District Manager: `demo.district@sacco.rw` / `DemoPass123!`
- SACCO Manager: `demo.kigali.manager@sacco.rw` / `DemoPass123!`
- SACCO Staff: `demo.kigali.staff@sacco.rw` / `DemoPass123!`
- Nyarugenge Manager: `demo.nyarugenge.manager@sacco.rw` / `DemoPass123!`
- MFI Manager: `demo.mfi.manager@sacco.rw` / `DemoPass123!`

## Production Readiness

### Pre-deployment Checklist

Before deploying to production, run the following:

1. **Health Checks**

   ```bash
   ts-node infra/scripts/health-checks.ts --endpoint https://staging.sacco.rw
   ```

2. **Database Migrations**

   ```bash
   supabase db push
   ```

3. **Verify Idempotency Table**

   ```sql
   SELECT COUNT(*) FROM ops.idempotency;
   ```

4. **Verify Audit Logging**

   ```sql
   SELECT COUNT(*) FROM app.audit_logs WHERE created_at > NOW() - INTERVAL '1 day';
   ```

5. **Test Critical Flows**
   - Staff invitation
   - Member approval
   - OCR review
   - Payment processing

### Monitoring

Set up monitoring for:

- `/api/health` endpoint (should return 200)
- Database connection pool
- Auth service availability
- Idempotency table size (cleanup old entries)
- Audit log volume

### Operational Alerts

Configure alerts for:

- Health check failures (>2 consecutive)
- Database latency >500ms
- Auth service errors
- Failed idempotency operations
- Unusual audit log patterns

## Automated Deployments

### deploy-vercel.ts

Deploys the WhatsApp OTP edge functions and the platform-api webhook to Vercel.

**Usage:**

```bash
pnpm exec tsx infra/scripts/deploy-vercel.ts
```

**Required environment variables:**

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VERCEL_TOKEN`

The script runs `supabase functions deploy whatsapp-otp-send` and
`supabase functions deploy whatsapp-otp-verify` before pushing the
`apps/platform-api` project to Vercel with production settings.

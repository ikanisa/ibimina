# TapMoMo Production Deployment Guide

## 🚀 Quick Production Deployment

This guide covers deploying TapMoMo NFC→USSD payment system to production.

### Timeline: 5-6 Hours Total

| Step | Task                      | Time    | Status     |
| ---- | ------------------------- | ------- | ---------- |
| 1    | Apply database migrations | 15 min  | ✅ Ready   |
| 2    | Deploy Edge Function      | 10 min  | ✅ Ready   |
| 3    | Build & sign Android APK  | 1 hour  | ⏳ Pending |
| 4    | Configure merchants       | 30 min  | ⏳ Pending |
| 5    | Physical device testing   | 1 hour  | ⏳ Pending |
| 6    | Staff training            | 2 hours | ⏳ Pending |
| 7    | Enable monitoring         | 1 hour  | ⏳ Pending |

---

## Step 1: Apply Database Migrations (15 min)

### What Gets Created

```sql
-- Tables
✅ tapmomo_merchants      - Merchant registry with HMAC secrets
✅ tapmomo_transactions   - Payment transaction records

-- RLS Policies
✅ User-owned merchants (CRUD)
✅ User-owned transactions (CRUD)

-- Indexes
✅ merchant_code, network, user_id
✅ transaction nonce, status, merchant_id
```

### Commands

```bash
cd /Users/jeanbosco/workspace/ibimina

# Link to remote project (if not already linked)
export SUPABASE_PROJECT_REF="your-project-ref"
supabase link --project-ref $SUPABASE_PROJECT_REF

# Push migrations
supabase db push

# Verify tables exist
supabase db execute --query "SELECT count(*) FROM tapmomo_merchants"
```

### Verification

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'tapmomo%';

-- Expected output:
-- tapmomo_merchants
-- tapmomo_transactions
```

---

## Step 2: Deploy Edge Function (10 min)

### Function: tapmomo-reconcile

**Purpose:** Update transaction status when payment is confirmed

**Endpoints:**

- POST `/tapmomo-reconcile`

**Request:**

```json
{
  "id": "tx-uuid", // OR
  "merchant_code": "123456",
  "nonce": "uuid",
  "status": "settled", // or "failed"
  "payer_hint": "+250788123456",
  "error_message": "..."
}
```

**Response:**

```json
{
  "success": true,
  "transaction": { ... }
}
```

### Deploy Command

```bash
cd /Users/jeanbosco/workspace/ibimina

# Deploy function
supabase functions deploy tapmomo-reconcile --no-verify-jwt

# Test function
curl -X POST \
  "https://YOUR_PROJECT.supabase.co/functions/v1/tapmomo-reconcile" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_code": "123456",
    "nonce": "test-nonce",
    "status": "settled"
  }'
```

### Verification

```bash
# Check function is deployed
supabase functions list

# View logs
supabase functions logs tapmomo-reconcile
```

---

## Step 3: Build & Sign Android APK (1 hour)

### Build Release APK

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin

# Sync Capacitor
pnpm exec cap sync android

# Build release APK
cd android
./gradlew assembleRelease

# APK location:
# apps/admin/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Sign APK (Production)

**Option A: Using Android Studio**

1. Open project: `pnpm exec cap open android`
2. Build > Generate Signed Bundle / APK
3. Select APK
4. Create/select keystore
5. Fill signing info
6. Build release

**Option B: Command Line**

```bash
# Generate keystore (first time only)
keytool -genkey -v -keystore ibimina-release.keystore \
  -alias ibimina -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ibimina-release.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  ibimina

# Align APK
zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  ibimina-staff-admin-v1.0.0.apk
```

### Distribution

```bash
# Test installation
adb install ibimina-staff-admin-v1.0.0.apk

# Distribute via:
# - Google Play Store (Internal Testing first)
# - Firebase App Distribution
# - Direct APK download from secure server
```

---

## Step 4: Configure Merchants (30 min)

### Create Production Merchants

```sql
-- Get staff user ID
SELECT id, email FROM auth.users WHERE email = 'staff@ibimina.rw';

-- Create merchant
INSERT INTO public.tapmomo_merchants (
    user_id,
    display_name,
    network,
    merchant_code,
    secret_key,
    active
) VALUES (
    'USER_UUID_HERE',
    'Ibimina SACCO - Gasabo Branch',
    'MTN',
    '890001',  -- Must be unique
    encode(gen_random_bytes(32), 'base64'),
    true
);

-- Verify merchant
SELECT
    merchant_code,
    display_name,
    network,
    active,
    created_at
FROM public.tapmomo_merchants
ORDER BY created_at DESC;
```

### Merchant Code Guidelines

- **MTN Format:** 6-digit code (e.g., 890001)
- **Airtel Format:** 6-digit code (e.g., 750001)
- **Unique per merchant**
- **Never reuse codes**

### Security Best Practices

```sql
-- Rotate merchant secret (if compromised)
UPDATE public.tapmomo_merchants
SET secret_key = encode(gen_random_bytes(32), 'base64'),
    updated_at = NOW()
WHERE merchant_code = '890001';

-- Disable compromised merchant
UPDATE public.tapmomo_merchants
SET active = false
WHERE merchant_code = '890001';
```

---

## Step 5: Physical Device Testing (1 hour)

### Prerequisites

- 2 Android phones with NFC
- Both phones have app installed
- NFC enabled on both
- Real SIM cards (MTN or Airtel)

### Test Flow: Get Paid (Payee)

```typescript
// Staff opens app
// Navigate to TapMoMo > Get Paid

1. Staff: Select amount (e.g., 5000 RWF)
2. Staff: Select merchant code
3. Staff: Tap "Activate NFC"
4. App: Shows "Hold device near customer"
5. App: NFC active for 60 seconds
```

### Test Flow: Pay (Payer)

```typescript
// Customer opens app
// Navigate to TapMoMo > Pay

1. Customer: Tap "Scan Payment"
2. Customer: Hold near staff device (back-to-back)
3. App: Reads payload (< 1 second)
4. App: Validates HMAC, timestamp, nonce
5. App: Shows payment details
6. Customer: Confirms payment
7. App: Launches USSD or dialer
8. Customer: Completes mobile money flow
```

### Test Scenarios

| #   | Scenario                  | Expected Result                   |
| --- | ------------------------- | --------------------------------- |
| 1   | Happy path                | Payment successful, USSD launched |
| 2   | Expired payload (>120s)   | Rejected with "Expired" error     |
| 3   | Replay (same nonce twice) | Second attempt rejected           |
| 4   | Wrong HMAC signature      | Rejected with "Invalid signature" |
| 5   | No NFC hardware           | Graceful error message            |
| 6   | NFC disabled              | Prompt to enable NFC              |
| 7   | USSD permission denied    | Falls back to dialer              |
| 8   | Dual-SIM device           | User selects SIM card             |

### Verification Checklist

```bash
# Check transactions created
supabase db execute --query "
  SELECT
    t.id,
    t.status,
    t.amount,
    t.created_at,
    m.merchant_code
  FROM tapmomo_transactions t
  JOIN tapmomo_merchants m ON t.merchant_id = m.id
  ORDER BY t.created_at DESC
  LIMIT 10
"

# Check for errors
supabase db execute --query "
  SELECT error_message, count(*)
  FROM tapmomo_transactions
  WHERE error_message IS NOT NULL
  GROUP BY error_message
"
```

---

## Step 6: Staff Training (2 hours)

### Training Agenda

#### Session 1: Overview (30 min)

- What is TapMoMo?
- Why NFC → USSD?
- Security model (HMAC, nonce, TTL)
- When to use vs traditional payment

#### Session 2: Get Paid Flow (30 min)

1. Open TapMoMo screen
2. Enter amount or use preset
3. Select merchant code
4. Activate NFC (60s window)
5. Hold device near customer
6. Wait for confirmation
7. Monitor transaction status

#### Session 3: Pay Flow (30 min)

1. Open TapMoMo scanner
2. Hold near merchant device
3. Review payment details
4. Confirm amount/merchant
5. Complete USSD flow
6. Verify SMS confirmation

#### Session 4: Troubleshooting (30 min)

**Issue:** NFC not working

- Check NFC enabled in settings
- Remove phone case (if thick)
- Hold devices closer (< 4cm)
- Align NFC coils (usually top-center)

**Issue:** USSD not launching

- Check SIM card active
- Check network coverage
- Use dialer fallback
- Manually dial USSD code

**Issue:** Payment timeout

- Check transaction status
- Retry if "initiated"
- Check SMS for confirmation
- Contact support if stuck

**Issue:** Replay detected

- Normal security feature
- Create new payment request
- Never reuse old QR/NFC payload

### Training Materials

```bash
# Prepare materials
cp docs/TAPMOMO_QUICK_START.md training/staff-guide.md
cp docs/TAPMOMO_NFC_IMPLEMENTATION.md training/technical-ref.md

# Create quick reference card
cat << 'EOF' > training/quick-ref.txt
TapMoMo Quick Reference

GET PAID:
1. TapMoMo > Get Paid
2. Enter amount
3. Activate NFC
4. Hold near customer (60s)

PAY:
1. TapMoMo > Pay
2. Scan NFC
3. Confirm details
4. Complete USSD

TROUBLESHOOTING:
- NFC: Enable in settings, remove case
- USSD: Check SIM, use dialer
- Replay: Create new payment
- Support: tapmomo@ibimina.rw
EOF
```

---

## Step 7: Enable Monitoring (1 hour)

### Supabase Dashboard Monitoring

#### 1. Transaction Monitoring

```sql
-- Create view for monitoring
CREATE OR REPLACE VIEW tapmomo_monitoring AS
SELECT
    date_trunc('hour', created_at) as hour,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration_seconds
FROM tapmomo_transactions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', created_at), status
ORDER BY hour DESC;

-- Query monitoring view
SELECT * FROM tapmomo_monitoring;
```

#### 2. Error Rate Alerts

```sql
-- Create alert function
CREATE OR REPLACE FUNCTION check_tapmomo_error_rate()
RETURNS void AS $$
DECLARE
    error_rate DECIMAL;
BEGIN
    SELECT
        CAST(COUNT(*) FILTER (WHERE status = 'failed') AS DECIMAL) /
        NULLIF(COUNT(*), 0)
    INTO error_rate
    FROM tapmomo_transactions
    WHERE created_at > NOW() - INTERVAL '1 hour';

    IF error_rate > 0.1 THEN  -- 10% error rate
        RAISE NOTICE 'High error rate: %', error_rate;
        -- Send notification (implement your notification system)
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Run every 15 minutes with pg_cron
SELECT cron.schedule(
    'check-tapmomo-errors',
    '*/15 * * * *',
    'SELECT check_tapmomo_error_rate()'
);
```

#### 3. Real-time Alerts

```typescript
// apps/admin/lib/monitoring/tapmomo-alerts.ts
import { supabase } from "@/lib/supabase/server";

export async function setupTapMoMoAlerts() {
  // Subscribe to failed transactions
  supabase
    .channel("tapmomo-failures")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "tapmomo_transactions",
        filter: "status=eq.failed",
      },
      (payload) => {
        console.error("Payment failed:", payload.new);
        // Send alert to monitoring system
      }
    )
    .subscribe();

  // Subscribe to replay attacks
  supabase
    .channel("tapmomo-security")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "tapmomo_transactions",
      },
      async (payload) => {
        // Check for suspicious patterns
        const recentTx = await checkRecentTransactions(payload.new.merchant_id);
        if (recentTx.suspiciousPattern) {
          // Alert security team
        }
      }
    )
    .subscribe();
}
```

### External Monitoring (Optional)

#### Sentry Integration

```typescript
// apps/admin/lib/sentry.ts
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enableAutoSessionTracking: true,
  tracesSampleRate: 1.0,
});

// In TapMoMo code
try {
  await launchUssd(code);
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: "tapmomo", action: "ussd-launch" },
    extra: { merchant_code, amount },
  });
}
```

#### Prometheus Metrics

```typescript
// apps/admin/lib/metrics.ts
import { Counter, Histogram } from "prom-client";

const tapmomoPayments = new Counter({
  name: "tapmomo_payments_total",
  help: "Total TapMoMo payments",
  labelNames: ["status", "network"],
});

const tapmomoNfcDuration = new Histogram({
  name: "tapmomo_nfc_duration_seconds",
  help: "NFC read duration",
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Usage
tapmomoPayments.inc({ status: "settled", network: "MTN" });
tapmomoNfcDuration.observe(duration);
```

---

## Production Checklist

### Pre-Launch

- [ ] Database migrations applied
- [ ] Edge Function deployed and tested
- [ ] Android APK signed and tested
- [ ] Test merchant created
- [ ] Two-device NFC test passed
- [ ] USSD launch verified on real SIM
- [ ] Replay protection verified
- [ ] HMAC signature validation tested
- [ ] Staff trained on all flows
- [ ] Training materials distributed
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Support process defined
- [ ] Rollback plan documented

### Launch Day

- [ ] Create production merchants
- [ ] Distribute APK to staff devices
- [ ] Enable TapMoMo in admin settings
- [ ] Monitor first 10 transactions closely
- [ ] Staff ready for support calls
- [ ] Technical team on standby

### Post-Launch (Week 1)

- [ ] Monitor error rates daily
- [ ] Review failed transactions
- [ ] Gather staff feedback
- [ ] Optimize NFC read speed if needed
- [ ] Adjust USSD codes if needed
- [ ] Document common issues
- [ ] Update training materials

---

## Support & Troubleshooting

### Common Issues

#### 1. NFC Read Fails

**Symptoms:** "Could not read payment info"

**Causes:**

- Devices too far apart
- NFC disabled
- Thick phone case
- Metal objects nearby
- Wrong device orientation

**Solutions:**

- Enable NFC in device settings
- Remove phone case
- Hold devices closer (< 4cm)
- Align NFC coils (back-to-back)
- Try different orientations

#### 2. USSD Not Launching

**Symptoms:** "USSD failed to launch"

**Causes:**

- No active SIM card
- Permission denied
- Network not supported
- USSD service down

**Solutions:**

- Check SIM card active
- Grant CALL_PHONE permission
- Use dialer fallback
- Try different SIM (dual-SIM)
- Contact network provider

#### 3. Payment Timeout

**Symptoms:** Transaction stuck in "initiated"

**Causes:**

- Customer didn't complete USSD
- Network delay
- SMS not received
- Reconciliation error

**Solutions:**

- Check transaction status
- Wait for SMS confirmation
- Manually reconcile via SMS
- Retry payment if needed

#### 4. Replay Detected

**Symptoms:** "This payment was already processed"

**Causes:**

- Same nonce used twice (security feature)
- Customer scanned old NFC payload

**Solutions:**

- This is EXPECTED behavior
- Create new payment request
- Never reuse old NFC payloads
- Explain to customer

### Support Contacts

- **Technical Issues:** tech@ibimina.rw
- **TapMoMo Specific:** tapmomo@ibimina.rw
- **Emergency (P0):** +250 788 XXX XXX
- **Documentation:** docs/TAPMOMO_NFC_IMPLEMENTATION.md

### Escalation Path

1. **Level 1:** Staff checks quick reference
2. **Level 2:** Branch manager reviews logs
3. **Level 3:** Technical support investigates
4. **Level 4:** Engineering team debugs

---

## Performance Targets

| Metric               | Target      | Measured       |
| -------------------- | ----------- | -------------- |
| NFC read time        | < 1 second  | Actual: \_\_\_ |
| USSD launch time     | < 2 seconds | Actual: \_\_\_ |
| Payment success rate | > 95%       | Actual: \_\_\_ |
| Error rate           | < 5%        | Actual: \_\_\_ |
| Replay detection     | 100%        | Actual: \_\_\_ |
| Support tickets/day  | < 5         | Actual: \_\_\_ |

---

## Rollback Plan

### If Critical Issues Arise

```bash
# 1. Disable TapMoMo in app
# Update feature flag in Supabase
UPDATE feature_flags
SET enabled = false
WHERE name = 'tapmomo_payments';

# 2. Mark all pending transactions as failed
UPDATE tapmomo_transactions
SET status = 'failed',
    error_message = 'System maintenance'
WHERE status IN ('initiated', 'pending');

# 3. Notify staff
# Send push notification or SMS

# 4. Revert to previous payment method
# Staff uses traditional USSD/bank transfer

# 5. Investigate and fix
# Check logs, review errors, deploy fix

# 6. Test fix on staging
# Create test merchant on staging
# Verify fix works

# 7. Re-enable in production
UPDATE feature_flags
SET enabled = true
WHERE name = 'tapmomo_payments';
```

---

## Success Criteria

### Week 1

- ✅ 50+ successful payments
- ✅ < 5% error rate
- ✅ No P0 incidents
- ✅ Staff confident with flows

### Month 1

- ✅ 500+ successful payments
- ✅ < 3% error rate
- ✅ SMS reconciliation integrated
- ✅ < 2 support tickets/day

### Quarter 1

- ✅ 5000+ successful payments
- ✅ < 2% error rate
- ✅ iOS support launched
- ✅ Payment processing < 30 seconds

---

## Next Phase: Enhancements

### Short Term (Q1)

1. **iOS Support**
   - CoreNFC reader implementation
   - iOS-specific USSD handling
   - Cross-platform testing

2. **QR Code Fallback**
   - Generate QR when NFC unavailable
   - Scan QR code to get payment info
   - Same HMAC security model

3. **Offline Queue**
   - Queue payments when offline
   - Sync when connection restored
   - Conflict resolution

### Medium Term (Q2)

4. **Analytics Dashboard**
   - Real-time payment stats
   - Success rate by merchant
   - Popular times/amounts
   - Network usage (MTN vs Airtel)

5. **Advanced Security**
   - Device attestation
   - Biometric confirmation
   - Velocity limits
   - Fraud detection

6. **Multi-Network**
   - Bank transfer integration
   - Equity Bank USSD
   - KCB USSD
   - Unified interface

### Long Term (Q3+)

7. **Smart Routing**
   - Auto-select best network
   - Fallback chain (NFC → QR → USSD)
   - Optimize for success rate

8. **Merchant Tools**
   - Receipt generation
   - Refund support
   - Partial payments
   - Recurring payments

9. **Platform Integration**
   - Export to accounting
   - Tax reporting
   - Audit trail
   - Reconciliation reports

---

## Documentation

- **Technical:** docs/TAPMOMO_NFC_IMPLEMENTATION.md
- **Quick Start:** docs/TAPMOMO_QUICK_START.md
- **Summary:** TAPMOMO_COMPLETE_SUMMARY.md
- **This Guide:** docs/TAPMOMO_PRODUCTION_DEPLOYMENT.md

---

## Appendix: USSD Codes

### MTN Rwanda

```
*182*8*1*[MERCHANT_CODE]*[AMOUNT]#
```

Example: `*182*8*1*890001*5000#`

### Airtel Rwanda

```
*182*8*1*[MERCHANT_CODE]*[AMOUNT]#
```

Example: `*182*8*1*750001*5000#`

### Testing USSD (Sandbox)

MTN provides sandbox for testing. Contact MTN Mobile Money team.

---

**Last Updated:** 2025-11-03  
**Version:** 1.0.0  
**Status:** Production Ready ✅

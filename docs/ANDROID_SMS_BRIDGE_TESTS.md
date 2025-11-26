# Android SMS Bridge Gateway Test Cases

This document provides test cases and sample SMS messages for validating the Android SMS Bridge Gateway integration.

## Test Data: Sample SMS Messages

### MTN Rwanda - Payment Received

```
You have received RWF 50,000 from 0781234567 (JOHN DOE). Ref: NYA.SACCO1.GRP001.M123. Balance: RWF 100,000. Txn ID: MP241126ABC
```

**Expected Parse Result:**
```json
{
  "msisdn": "+250781234567",
  "amount": 50000,
  "txn_id": "MP241126ABC",
  "timestamp": "2024-11-26T12:00:00Z",
  "payer_name": "JOHN DOE",
  "reference": "NYA.SACCO1.GRP001.M123",
  "confidence": 0.95
}
```

### MTN Rwanda - Payment Sent

```
You have sent RWF 20,000 to 0788123456. Ref: PAYMENT123. Balance: RWF 80,000. Txn ID: MP241126XYZ
```

**Expected Parse Result:**
```json
{
  "msisdn": "+250788123456",
  "amount": 20000,
  "txn_id": "MP241126XYZ",
  "timestamp": "2024-11-26T12:00:00Z",
  "reference": "PAYMENT123",
  "confidence": 0.95
}
```

### Airtel Money - Payment Received

```
Received RWF 25,000 from +250788123456. Ref: GIC.UMURENGE.ABAKUNDAKAZI. ID: AM20241126XYZ
```

**Expected Parse Result:**
```json
{
  "msisdn": "+250788123456",
  "amount": 25000,
  "txn_id": "AM20241126XYZ",
  "timestamp": "2024-11-26T12:00:00Z",
  "reference": "GIC.UMURENGE.ABAKUNDAKAZI",
  "confidence": 0.95
}
```

### M-PESA Kenya Format

```
RWF 10,000 received from 0722123456. Reference: TESTREF. Transaction: MP241126123
```

**Expected Parse Result:**
```json
{
  "msisdn": "+254722123456",
  "amount": 10000,
  "txn_id": "MP241126123",
  "timestamp": "2024-11-26T12:00:00Z",
  "reference": "TESTREF",
  "confidence": 0.95
}
```

## Unit Tests

### Test 1: Gemini Parser Format Conversion

**File:** `supabase/functions/_tests/gemini-parser.test.ts`

**Command:**
```bash
deno test supabase/functions/_tests/gemini-parser.test.ts
```

**Expected Results:**
- ✅ geminiToStandardFormat converts Gemini response to standard format
- ✅ geminiToStandardFormat handles string amounts
- ✅ geminiToStandardFormat floors decimal amounts
- ✅ geminiToStandardFormat uses default timestamp if missing

### Test 2: Integration Test with Real Gemini API

**Prerequisites:**
- Set `GEMINI_API_KEY` environment variable

**Command:**
```bash
export GEMINI_API_KEY=your-actual-key
deno test supabase/functions/_tests/gemini-parser.test.ts --allow-net --allow-env
```

**Expected Results:**
- ✅ parseWithGemini parses MTN SMS correctly
- ✅ parseWithGemini parses Airtel SMS correctly
- ✅ parseWithGemini handles invalid SMS gracefully

## Manual Testing

### Test 3: Android SMS Bridge Endpoint

**Setup:**
1. Deploy the `android-sms-bridge` edge function to Supabase
2. Set environment variables:
   - `ANDROID_BRIDGE_HMAC_SECRET`
   - `GEMINI_API_KEY` or `OPENAI_API_KEY`

**Test Request:**

```bash
#!/bin/bash

SUPABASE_URL="https://your-project.supabase.co"
HMAC_SECRET="your-secret-here"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create payload
PAYLOAD='{
  "sender_id": "MTN MobileMoney",
  "raw_message": "You have received RWF 50,000 from 0781234567 (JOHN DOE). Ref: NYA.SACCO1.GRP001.M123. Balance: RWF 100,000. Txn ID: MP241126ABC",
  "received_at": 1732617600000,
  "device_id": "test-device-123",
  "battery_level": 85,
  "network_type": "4G",
  "signal_strength": 4,
  "app_version": "1.0.0"
}'

# Generate HMAC signature (requires openssl)
MESSAGE="${TIMESTAMP}POST:/functions/v1/android-sms-bridge${PAYLOAD}"
SIGNATURE=$(echo -n "$MESSAGE" | openssl dgst -sha256 -hmac "$HMAC_SECRET" | cut -d' ' -f2)

# Send request
curl -X POST "${SUPABASE_URL}/functions/v1/android-sms-bridge" \
  -H "Content-Type: application/json" \
  -H "x-signature: ${SIGNATURE}" \
  -H "x-timestamp: ${TIMESTAMP}" \
  -d "$PAYLOAD"
```

**Expected Response:**
```json
{
  "success": true,
  "sms_log_id": "uuid-here",
  "payment_id": "uuid-here",
  "status": "POSTED",
  "parse_source": "REGEX",
  "confidence": 0.95,
  "message": "SMS processed successfully via REGEX"
}
```

**Validation Steps:**
1. Check `app.raw_sms_logs` table for new entry
2. Check `app.payments` table for created payment
3. Check `app.gateway_devices` table for device registration
4. Check `app.gateway_heartbeats` table for heartbeat entry

### Test 4: Gateway Health Check

**Setup:**
1. Deploy the `gateway-health-check` edge function
2. Create a test device with old heartbeat:

```sql
INSERT INTO app.gateway_devices (device_id, device_name, last_heartbeat_at, is_active)
VALUES ('test-offline-device', 'Test Offline Device', NOW() - INTERVAL '10 minutes', true);
```

**Test Request:**

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/gateway-health-check"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Found 1 offline devices",
  "offline_devices": [
    {
      "type": "GATEWAY_OFFLINE",
      "device_id": "test-offline-device",
      "device_name": "Test Offline Device",
      "minutes_offline": 10,
      "severity": "MEDIUM"
    }
  ],
  "checked": "2024-11-26T12:00:00Z"
}
```

**Validation Steps:**
1. Check device is marked as `is_active = false`
2. Check email alert was sent (if configured)
3. Check metrics recorded

## Edge Cases

### Test 5: Unknown Sender ID

**Payload:**
```json
{
  "sender_id": "UNKNOWN_SENDER",
  "raw_message": "Test message",
  "received_at": 1732617600000,
  "device_id": "test-device"
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "unknown_sender",
  "message": "SMS sender not recognized as a known MoMo provider"
}
```

### Test 6: Duplicate Transaction

**Setup:**
1. Send the same SMS twice (same txn_id)

**Expected:**
- First request: Creates payment
- Second request: Returns duplicate status, no new payment created

**Second Response:**
```json
{
  "success": true,
  "status": "DUPLICATE",
  "payment_id": "original-payment-uuid",
  "message": "Transaction already processed"
}
```

### Test 7: Parser Fallback Chain

**Test Scenarios:**

1. **Regex Success (70% of cases)**
   - Standard MTN/Airtel format
   - Expected: `parse_source: "REGEX"`

2. **Gemini Fallback (25% of cases)**
   - Non-standard format but valid MoMo SMS
   - Expected: `parse_source: "GEMINI"`

3. **OpenAI Fallback (5% of cases)**
   - Complex or unusual format
   - Gemini fails or not configured
   - Expected: `parse_source: "OPENAI"`

4. **All Parsers Fail**
   - Invalid/non-payment SMS
   - Expected: `status: "FAILED"` in raw_sms_logs

### Test 8: Rate Limiting

**Setup:**
Send 101 requests within 1 minute from same device

**Expected:**
- First 100 requests: Success
- 101st request: HTTP 429 (Rate limit exceeded)

## Performance Tests

### Test 9: Latency Measurement

**Metrics to Track:**
- Request processing time (target: < 2 seconds)
- Regex parsing time (target: < 10ms)
- Gemini API call time (target: < 1 second)
- OpenAI API call time (target: < 2 seconds)
- Database insert time (target: < 100ms)

**Command:**
```bash
time curl -X POST "${SUPABASE_URL}/functions/v1/android-sms-bridge" \
  -H "Content-Type: application/json" \
  -H "x-signature: ${SIGNATURE}" \
  -H "x-timestamp: ${TIMESTAMP}" \
  -d "$PAYLOAD"
```

### Test 10: Load Test

**Tool:** Apache Bench or similar

**Command:**
```bash
ab -n 100 -c 10 -T application/json \
  -H "x-signature: ${SIGNATURE}" \
  -H "x-timestamp: ${TIMESTAMP}" \
  -p payload.json \
  "${SUPABASE_URL}/functions/v1/android-sms-bridge"
```

**Expected:**
- Success rate: > 99%
- Average response time: < 2 seconds
- No database errors

## Database Validation Queries

### Query 1: Check Recent SMS Logs

```sql
SELECT 
  id,
  device_id,
  sender_id,
  status,
  parse_source,
  parse_confidence,
  error_message,
  created_at
FROM app.raw_sms_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Query 2: Check Payment Creation

```sql
SELECT 
  p.id,
  p.txn_id,
  p.amount,
  p.status,
  p.channel,
  p.ai_version,
  p.confidence,
  r.parse_source,
  r.sender_id
FROM app.payments p
LEFT JOIN app.raw_sms_logs r ON r.payment_id = p.id
WHERE p.channel = 'SMS'
ORDER BY p.created_at DESC
LIMIT 20;
```

### Query 3: Check Gateway Health

```sql
SELECT 
  d.device_id,
  d.device_name,
  d.is_active,
  d.last_heartbeat_at,
  COUNT(h.id) as heartbeat_count,
  MAX(h.created_at) as last_heartbeat
FROM app.gateway_devices d
LEFT JOIN app.gateway_heartbeats h ON h.device_id = d.device_id
  AND h.created_at > NOW() - INTERVAL '1 hour'
GROUP BY d.id
ORDER BY d.last_heartbeat_at DESC;
```

### Query 4: Parser Performance Metrics

```sql
SELECT 
  parse_source,
  COUNT(*) as total,
  AVG(parse_confidence) as avg_confidence,
  COUNT(CASE WHEN status = 'PARSED' THEN 1 END) as success_count,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failure_count
FROM app.raw_sms_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY parse_source;
```

## Security Tests

### Test 11: Invalid HMAC Signature

**Test:**
Send request with incorrect signature

**Expected:**
```json
{
  "success": false,
  "error": "invalid_signature"
}
```

### Test 12: Stale Timestamp

**Test:**
Send request with timestamp older than 5 minutes

**Expected:**
```json
{
  "success": false,
  "error": "invalid_signature"
}
```

### Test 13: Missing Required Fields

**Test:**
Send request without `device_id` or `raw_message`

**Expected:**
```json
{
  "success": false,
  "error": "missing_required_fields"
}
```

## Continuous Integration

### GitHub Actions Test Workflow

Add to `.github/workflows/test-sms-bridge.yml`:

```yaml
name: Test SMS Bridge

on:
  push:
    branches: [main, work]
    paths:
      - 'supabase/functions/android-sms-bridge/**'
      - 'supabase/functions/_shared/gemini-parser.ts'
      - 'supabase/migrations/*_android_sms_gateway.sql'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      
      - name: Run unit tests
        run: |
          cd supabase/functions
          deno test _tests/gemini-parser.test.ts
      
      - name: Validate TypeScript
        run: |
          cd supabase/functions
          deno check android-sms-bridge/index.ts
          deno check gateway-health-check/index.ts
          deno check _shared/gemini-parser.ts
```

## Test Checklist

Before deploying to production:

- [ ] All unit tests pass
- [ ] Integration tests with real API keys pass
- [ ] Manual endpoint tests successful
- [ ] Database schema migration applied
- [ ] Environment variables configured
- [ ] HMAC signature validation works
- [ ] Rate limiting enforced
- [ ] Unknown sender filtering works
- [ ] Duplicate detection works
- [ ] Parser fallback chain tested
- [ ] Gateway health check runs
- [ ] Real-time subscriptions work
- [ ] Documentation reviewed
- [ ] Security audit passed

# MoMo Webhook Setup Guide

This guide explains how to configure the MoMo SMS webhook system to receive and process Mobile Money payment notifications from Android devices.

## Overview

The MoMo webhook system enables real-time payment verification by:
1. Relaying SMS notifications from Android devices to the SACCO+ backend
2. Automatically parsing payment details (amount, sender, transaction ID)
3. Auto-matching payments to pending contributions
4. Providing manual review for unmatched payments

## Architecture

```
┌─────────────────┐
│  MomoTerminal   │  Android App
│  Android App    │  - Reads MoMo SMS
└────────┬────────┘  - Signs with HMAC
         │           - Relays to webhook
         │ HTTPS
         ▼
┌─────────────────┐
│  momo-sms-      │  Supabase Edge Function
│  webhook        │  - Verifies signature
└────────┬────────┘  - Parses SMS
         │           - Stores & matches
         ▼
┌─────────────────┐
│  momo_sms_inbox │  Database Table
│  table          │  - RLS protected
└─────────────────┘  - Auto-matching trigger
```

## Prerequisites

1. **Supabase Project**: Configured with required tables
2. **MomoTerminal App**: Installed on Android device
3. **Mobile Money Account**: Configured to receive payment notifications

## Step 1: Database Setup

The database migration creates the necessary tables automatically. To verify:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
  AND table_name IN ('momo_webhook_config', 'momo_sms_inbox');
```

## Step 2: Register a Device

Each Android device must be registered with a unique webhook secret:

```sql
-- Generate a secure random secret (do this in a secure environment)
-- Example using OpenSSL: openssl rand -hex 32

INSERT INTO app.momo_webhook_config (
  momo_phone_number,
  webhook_secret,
  device_id,
  is_active
) VALUES (
  '+233XXXXXXXXX',              -- Replace with actual MoMo phone number
  'your-64-character-hex-secret', -- Replace with generated secret
  'android-device-001',           -- Unique device identifier
  true
);
```

**Important Security Notes:**
- Generate secrets using a cryptographically secure random generator
- Store secrets securely (use environment variables or secret management)
- Never commit secrets to version control
- Rotate secrets periodically (every 90 days recommended)

## Step 3: Configure MomoTerminal App

In the MomoTerminal Android app:

1. **Navigate to Settings** → **Webhook Configuration**

2. **Enter Webhook Details:**
   - **Endpoint URL**: `https://your-project.supabase.co/functions/v1/momo-sms-webhook`
   - **Phone Number**: The registered MoMo number (e.g., `+233XXXXXXXXX`)
   - **Webhook Secret**: The secret from Step 2
   - **Device ID**: Unique identifier for this device (e.g., `android-device-001`)

3. **Test Connection:**
   - Tap "Test Webhook"
   - Verify the test succeeds
   - Check logs for any errors

4. **Enable Auto-Relay:**
   - Toggle "Auto-Relay SMS" to ON
   - Grant SMS read permissions if prompted
   - Configure which SMS senders to relay (MTN MoMo, Vodafone Cash, etc.)

## Step 4: Verify Integration

### Send Test Payment

1. Send a small Mobile Money payment to the registered number
2. Wait for the SMS notification to arrive
3. Check the MoMo Inbox in the staff dashboard:
   - Navigate to **Payments** → **MoMo Inbox**
   - Verify the SMS appears in the list
   - Check if it was auto-matched to a payment

### Check Logs

```bash
# View Edge Function logs
supabase functions logs momo-sms-webhook --tail

# Look for successful entries
# Success: "momo-sms-webhook.success"
# Errors: "momo-sms-webhook.invalid_signature", "momo-sms-webhook.stale_request"
```

### Verify Auto-Matching

```sql
-- Check recent SMS with match status
SELECT 
  id,
  parsed_amount,
  parsed_sender_name,
  processed,
  matched_payment_id,
  match_confidence,
  received_at
FROM app.momo_sms_inbox
ORDER BY received_at DESC
LIMIT 10;
```

## Step 5: Monitor & Maintain

### Dashboard Access

Staff can view and manage MoMo SMS at:
- **Path**: `/payments/momo-inbox`
- **Features**:
  - View all received SMS
  - Filter by status (matched/pending)
  - View detailed parsing results
  - Manually match unmatched payments
  - Export reports

### Key Metrics to Monitor

1. **Auto-Match Rate**: Percentage of SMS automatically matched
   - Target: > 80%
   - Alert if < 60%

2. **Signature Failures**: Invalid signatures may indicate security issues
   - Target: < 1%
   - Investigate any spikes

3. **Parsing Failures**: SMS that couldn't be parsed
   - Target: < 5%
   - Review patterns and update parsers

4. **Latency**: Time from SMS received to database insert
   - Target: < 5 seconds
   - Alert if > 30 seconds

### Troubleshooting

#### SMS Not Appearing in Inbox

1. **Check device configuration**:
   - Verify MomoTerminal app is running
   - Check network connectivity
   - Review app logs for errors

2. **Verify webhook endpoint**:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/momo-sms-webhook \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"test": "true"}'
   ```

3. **Check database permissions**:
   ```sql
   -- Verify RLS policies
   SELECT * FROM app.momo_webhook_config WHERE is_active = true;
   ```

#### Invalid Signature Errors

1. **Verify secret matches**:
   - Check secret in database
   - Verify secret in MomoTerminal app
   - Ensure no extra spaces or encoding issues

2. **Check timestamp synchronization**:
   - Device time must be accurate (within 5 minutes of server time)
   - Enable automatic time sync on Android device

#### Auto-Matching Not Working

1. **Verify payment exists**:
   ```sql
   -- Check for pending payments matching SMS amount
   SELECT * FROM app.payments 
   WHERE status = 'PENDING' 
     AND amount = 500000  -- Example: 5000.00 in minor units
     AND occurred_at > NOW() - INTERVAL '24 hours';
   ```

2. **Review trigger logic**:
   - Check if trigger is enabled
   - Review match criteria (amount, timing)

3. **Manual matching**:
   - Use dashboard to manually match
   - Review match confidence scores

## Security Best Practices

1. **HMAC Signatures**:
   - Always verify signatures
   - Use cryptographically secure secrets
   - Rotate secrets regularly

2. **Timestamp Validation**:
   - Enforce 5-minute window for replay protection
   - Sync device clocks with NTP

3. **RLS Policies**:
   - Only staff can view MoMo SMS
   - Only service role can insert
   - Audit all access

4. **Data Privacy**:
   - SMS contain sensitive information
   - Apply retention policies (e.g., auto-delete after 90 days)
   - Encrypt sensitive fields if required by regulation

5. **Rate Limiting**:
   - Implement per-device rate limits
   - Alert on suspicious activity patterns

## Advanced Configuration

### Custom SMS Parsers

To add support for new Mobile Money providers:

1. Edit `supabase/functions/momo-sms-webhook/index.ts`
2. Add new regex pattern in `parseMomoSms()` function
3. Test with sample SMS
4. Deploy updated function

### Webhook Retries

Configure retry logic in MomoTerminal app:
- **Max Retries**: 3
- **Backoff**: Exponential (1s, 2s, 4s)
- **Timeout**: 30 seconds

### Multi-Device Setup

For multiple devices per SACCO:
1. Register each device separately
2. Use unique device_id for each
3. Share same phone_number if needed
4. Monitor per-device metrics

## Support

For issues or questions:
- **Documentation**: `/docs/MOMO_WEBHOOK_SETUP.md`
- **Edge Function**: `/supabase/functions/momo-sms-webhook/README.md`
- **Dashboard**: `/payments/momo-inbox`

## Changelog

- **2025-11-26**: Initial webhook implementation
  - Added momo_webhook_config table
  - Added momo_sms_inbox table
  - Implemented auto-matching logic
  - Created staff dashboard

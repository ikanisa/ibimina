# Android SMS Bridge Gateway Setup Guide

## Overview

The Android SMS Bridge Gateway enables SACCO+ to receive Mobile Money payment SMS messages from dedicated Android devices, parse them using AI (Gemini/OpenAI), and automatically create payment records in the system.

This guide covers the **Android-based SMS gateway**, which is an alternative to the GSM modem gateway (documented in `SMS_GATEWAY_SETUP.md`).

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Android Phone  │───▶│  Supabase Edge  │───▶│  Gemini 1.5     │
│  (SMS Bridge)   │    │  Function       │    │  Flash Parser   │
└─────────────────┘    └────────┬────────┘    └────────┬────────┘
                                │                      │
                                ▼                      ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  PostgreSQL DB  │◀───│  Structured     │
                       │  (transactions) │    │  JSON           │
                       └────────┬────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Admin Dashboard │
                       │  (Real-time)    │
                       └─────────────────┘
```

## Prerequisites

### Server-Side Requirements

1. **Supabase Project** with Edge Functions enabled
2. **Database Migrations** applied (see Migration section below)
3. **Environment Variables** configured (see Configuration section)
4. **API Keys** for AI parsing:
   - Google Gemini API key (recommended)
   - OpenAI API key (fallback)

### Android Device Requirements

1. **Android 8.0 (Oreo)** or higher
2. **Active SIM card** with MoMo service (MTN, Airtel, or M-PESA)
3. **Stable internet connection** (WiFi or mobile data)
4. **SMS Bridge App** installed (to be developed separately)

## Configuration

### 1. Environment Variables

Add the following variables to your `.env` file or Supabase project secrets:

```bash
# Required: Gemini API for SMS parsing
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio
GEMINI_MODEL=gemini-1.5-flash

# Required: Android Bridge HMAC secret (generate with: openssl rand -hex 32)
ANDROID_BRIDGE_HMAC_SECRET=your-64-character-hex-secret

# Required: Gateway offline monitoring
GATEWAY_OFFLINE_ALERT_EMAIL=it-admin@yoursacco.rw
GATEWAY_OFFLINE_THRESHOLD_MINUTES=5

# Optional: OpenAI fallback (if Gemini fails)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_RESPONSES_MODEL=gpt-4.1-mini
```

### 2. Generate HMAC Secret

The Android app and edge function share an HMAC secret for request authentication:

```bash
# Generate a secure random secret
openssl rand -hex 32

# Example output:
# 8f4e3c2a1b9d7f6e5c4a3b2d1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e
```

**Important**: Keep this secret secure and add it to both:
- Supabase Edge Function secrets as `ANDROID_BRIDGE_HMAC_SECRET`
- Android SMS Bridge App configuration

### 3. Obtain Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your environment as `GEMINI_API_KEY`

**Pricing**: Gemini 1.5 Flash offers a generous free tier (15 RPM, 1 million tokens/day).

## Database Migration

Run the migration to create the required tables:

```bash
# Using Supabase CLI
supabase migration up

# Or apply manually via SQL editor
# File: supabase/migrations/20251126125320_android_sms_gateway.sql
```

This creates three tables:
- `app.gateway_devices` - Tracks registered Android devices
- `app.gateway_heartbeats` - Health monitoring data
- `app.raw_sms_logs` - Audit trail of all SMS received

## Android SMS Bridge App Setup

### Installation

1. **Download** the SMS Bridge APK (to be built separately)
2. **Enable** "Install from unknown sources" on the Android device
3. **Install** the APK
4. **Grant permissions**:
   - SMS read access
   - Internet access
   - Notification access

### Configuration

On first launch, configure the app with:

1. **Server URL**: Your Supabase Edge Function URL
   ```
   https://your-project.supabase.co/functions/v1/android-sms-bridge
   ```

2. **HMAC Secret**: The same secret configured on the server

3. **SACCO ID** (optional): Associate this device with a specific SACCO

4. **Device Name**: Friendly name for identification (e.g., "Main Office Gateway")

### Testing

Send a test SMS to verify the setup:

1. Send a small MoMo payment to the device's number
2. The app should automatically forward the SMS to the server
3. Check the Admin Dashboard for the new payment record
4. Verify in `app.raw_sms_logs` that the SMS was received

## Monitoring

### Dashboard Metrics

The admin dashboard provides real-time monitoring:

1. **Active Devices**: Number of gateways online in the last 5 minutes
2. **SMS Received**: Count of messages processed today
3. **Parse Success Rate**: Percentage successfully parsed
4. **Payment Status**: Breakdown of PENDING/POSTED/UNALLOCATED

### Health Check Alerts

The `gateway-health-check` function runs every 5 minutes:

- **Checks** all devices for recent heartbeats
- **Marks** devices as inactive if no heartbeat in threshold period
- **Sends** email alerts to configured admin address

### Real-time Subscriptions

Frontend apps can subscribe to new payments:

```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Subscribe to new SMS-sourced payments
supabase
  .channel('sms-payments')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'app',
    table: 'payments',
    filter: 'channel=eq.SMS'
  }, (payload) => {
    console.log('New SMS payment:', payload.new);
    // Show toast notification, update dashboard, etc.
  })
  .subscribe();

// Subscribe to new raw SMS logs
supabase
  .channel('sms-logs')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'app',
    table: 'raw_sms_logs'
  }, (payload) => {
    console.log('New SMS received:', payload.new);
  })
  .subscribe();
```

## Troubleshooting

### Common Issues

#### 1. SMS Not Forwarded to Server

**Symptoms**: Android app receives SMS but doesn't forward it

**Possible Causes**:
- Internet connection lost on device
- HMAC secret mismatch
- Server endpoint unreachable

**Solutions**:
- Check device network connection (WiFi/mobile data)
- Verify HMAC secret matches in app and server
- Test endpoint with curl:
  ```bash
  curl -X POST https://your-project.supabase.co/functions/v1/android-sms-bridge \
    -H "Content-Type: application/json" \
    -H "x-signature: test" \
    -H "x-timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    -d '{"sender_id":"MTN","raw_message":"Test","received_at":1234567890000,"device_id":"test"}'
  ```

#### 2. Parsing Failures

**Symptoms**: SMS received but status is "FAILED" in `raw_sms_logs`

**Possible Causes**:
- Unknown SMS format
- AI API quota exceeded
- Missing API keys

**Solutions**:
- Check `error_message` in `raw_sms_logs` table
- Verify Gemini API key is valid and has quota
- Add OpenAI API key as fallback
- Review SMS format and update regex patterns if needed

#### 3. Device Shows as Offline

**Symptoms**: Device marked as inactive in dashboard

**Possible Causes**:
- Device turned off or out of battery
- App crashed or stopped
- Network connectivity lost

**Solutions**:
- Check device power and battery level
- Restart the SMS Bridge app
- Verify network connectivity
- Check `gateway_heartbeats` table for recent entries

#### 4. Duplicate Transactions

**Symptoms**: Same transaction appearing multiple times

**Possible Causes**:
- Device sent SMS multiple times due to retry logic
- Multiple devices receiving the same SMS

**Solutions**:
- System automatically detects duplicates via `txn_id`
- Check `status` field - duplicates are marked as "DUPLICATE"
- No action needed, duplicates are safely ignored

### Log Inspection

Check edge function logs for debugging:

```bash
# Supabase CLI
supabase functions logs android-sms-bridge --tail

# Example output:
# {"level":"info","msg":"Android bridge SMS received","device_id":"abc123"}
# {"level":"info","msg":"SMS parsed successfully","parseSource":"GEMINI"}
```

### Testing Sample SMS Messages

Test the parser with various SMS formats:

**MTN Rwanda - Payment Received:**
```
You have received RWF 50,000 from 0781234567 (JOHN DOE). Ref: NYA.SACCO1.GRP001.M123. Balance: RWF 100,000. Txn ID: MP241126ABC
```

**Airtel Money - Payment Received:**
```
Received RWF 25,000 from +250788123456. Ref: GIC.UMURENGE.ABAKUNDAKAZI. ID: AM20241126XYZ
```

**M-PESA Kenya:**
```
RWF 10,000 received from 0722123456. Reference: TESTREF. Transaction: MP241126123
```

## Security Considerations

### HMAC Signature Validation

All requests from the Android app **must** include:
- `x-signature`: HMAC-SHA256 signature of the request
- `x-timestamp`: ISO 8601 timestamp

Requests are rejected if:
- Signature is invalid
- Timestamp is older than 5 minutes (replay protection)

### Sender ID Filtering

Only SMS from known MoMo providers are processed:
- MTN MobileMoney, MTN, MTN Money
- Airtel Money, Airtel
- M-PESA, MPESA

Unknown senders are logged but rejected.

### MSISDN Encryption

Phone numbers are encrypted before storage:
- `msisdn_encrypted`: AES-256-GCM encrypted
- `msisdn_hash`: SHA-256 hash for lookups
- `msisdn_masked`: Display format (e.g., `+250***1234`)

### Rate Limiting

Requests are rate-limited per device:
- **100 requests per minute** per device
- Prevents spam and abuse
- Returns HTTP 429 if exceeded

## Performance Optimization

### AI Parser Cascade

The system uses a cost-efficient fallback chain:

1. **Regex** (free, instant) - Tries first
2. **Gemini** (cheap, fast) - Falls back if regex fails
3. **OpenAI** (expensive, accurate) - Last resort

**Cost estimate** (1000 SMS/month):
- 70% parsed by regex: $0
- 25% parsed by Gemini: ~$0.50
- 5% parsed by OpenAI: ~$2.50
- **Total**: ~$3/month for AI parsing

### Database Indexes

The migration creates indexes for optimal performance:
- `idx_gateway_heartbeats_device_created` - Fast heartbeat queries
- `idx_raw_sms_logs_status` - Pending SMS filtering
- `idx_raw_sms_logs_device` - Device-specific logs

## Maintenance

### Daily Tasks

- **Monitor** device health via dashboard
- **Review** failed SMS in `raw_sms_logs` (status = 'FAILED')
- **Check** payment allocations (POSTED vs UNALLOCATED)

### Weekly Tasks

- **Verify** gateway devices are online
- **Review** AI parser accuracy metrics
- **Clean up** old heartbeat records (optional):
  ```sql
  DELETE FROM app.gateway_heartbeats 
  WHERE created_at < now() - interval '30 days';
  ```

### Monthly Tasks

- **Review** API usage and costs (Gemini + OpenAI)
- **Update** Android app if new version available
- **Rotate** HMAC secrets (if required by security policy)

## API Reference

### Android SMS Bridge Endpoint

**POST** `/functions/v1/android-sms-bridge`

**Headers:**
```
Content-Type: application/json
x-signature: <HMAC-SHA256-hex>
x-timestamp: <ISO8601-timestamp>
```

**Request Body:**
```json
{
  "sender_id": "MTN MobileMoney",
  "raw_message": "You have received RWF 50,000...",
  "received_at": 1732617600000,
  "device_id": "unique-android-device-id",
  "sacco_id": "optional-sacco-uuid",
  "battery_level": 85,
  "network_type": "4G",
  "signal_strength": 4,
  "pending_sms_count": 0,
  "app_version": "1.0.0"
}
```

**Response (Success):**
```json
{
  "success": true,
  "sms_log_id": "uuid",
  "payment_id": "uuid",
  "status": "POSTED",
  "parse_source": "GEMINI",
  "confidence": 0.95,
  "message": "SMS processed successfully via GEMINI"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "parse_failed",
  "message": "Unable to parse SMS with any available parser"
}
```

### Gateway Health Check Endpoint

**POST** `/functions/v1/gateway-health-check`

**Response:**
```json
{
  "success": true,
  "message": "Found 2 offline devices",
  "offline_devices": [
    {
      "type": "GATEWAY_OFFLINE",
      "device_id": "abc123",
      "device_name": "Main Office Gateway",
      "minutes_offline": 15,
      "severity": "MEDIUM"
    }
  ],
  "checked": "2024-11-26T12:00:00Z"
}
```

## Support

For issues or questions:
1. Check this documentation
2. Review edge function logs
3. Inspect database tables for error details
4. Contact system administrator

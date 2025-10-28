# SMS Gateway Setup Guide

This document describes the setup and configuration of the SMS gateway
infrastructure for the SACCO+ application. The gateway processes incoming SMS
messages from a GSM modem and forwards them to Supabase Edge Functions for
payment processing.

## Architecture Overview

The SMS gateway consists of three main components:

1. **Gammu SMSD**: Handles GSM modem communication and stores incoming SMS
   messages
2. **SMS Forwarder**: Monitors the SMS inbox and forwards messages to Supabase
3. **Supabase Edge Function**: Processes SMS messages, extracts payment
   information, and updates the database

```
GSM Modem → Gammu SMSD → SMS Forwarder → Supabase Edge Function → Database
```

## Prerequisites

- Docker and Docker Compose installed
- GSM modem (USB or serial) connected to the host system
- Supabase project with Edge Functions deployed
- HMAC shared secret configured in both forwarder and Edge Function

## Hardware Requirements

### Supported GSM Modems

- USB GSM modems (e.g., Huawei E3372, ZTE MF823)
- Serial GSM modems with USB-to-Serial adapter
- Multi-port GSM modem banks

### Finding Your Modem Device

```bash
# List USB devices
lsusb

# List serial devices
ls -l /dev/tty* | grep USB

# Common device paths:
# - /dev/ttyUSB0 (first USB modem)
# - /dev/ttyUSB1 (second USB modem)
# - /dev/ttyACM0 (some modems use ACM driver)
```

## Configuration

### 1. Environment Variables

Copy the example environment file and configure:

```bash
cd infra/sms-gateway
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_FUNCTION_URL=https://your-project.supabase.co/functions/v1/sms-inbox

# Security (MUST match Edge Function HMAC_SHARED_SECRET)
HMAC_SHARED_SECRET=your-secret-here

# GSM Modem
GSM_SIM_PIN=1234  # Optional, if SIM requires PIN
MODEM_PORT=/dev/ttyUSB0

# Forwarder Settings
POLL_INTERVAL=5  # Check for new messages every 5 seconds
LOG_LEVEL=info   # debug, info, warn, error
```

### 2. Gammu Configuration

Create or edit `gammu-smsd.conf`:

```ini
[gammu]
device = /dev/ttyUSB0
connection = at

[smsd]
service = files
logfile = /var/log/gammu-smsd.log
debuglevel = 1

# Storage paths
inboxpath = /var/spool/gammu/inbox/
outboxpath = /var/spool/gammu/outbox/
sentsmspath = /var/spool/gammu/sent/
errorsmspath = /var/spool/gammu/error/

# Pin code (optional)
# PIN = 1234
```

### 3. Docker Compose Configuration

Update `docker-compose.yml` if needed to match your modem device:

```yaml
services:
  gammu-smsd:
    devices:
      - "/dev/ttyUSB0:/dev/ttyUSB0" # Update this to match your modem
```

## Deployment

### Starting the Gateway

```bash
cd infra/sms-gateway
docker-compose up -d
```

### Checking Status

```bash
# View all service logs
docker-compose logs -f

# View only forwarder logs
docker-compose logs -f sms-forwarder

# View only Gammu logs
docker-compose logs -f gammu-smsd

# Check service health
docker-compose ps
```

### Stopping the Gateway

```bash
docker-compose down
```

## HMAC Authentication

The SMS forwarder uses HMAC-SHA256 to authenticate requests to the Supabase Edge
Function.

### Signature Generation

```typescript
const timestamp = new Date().toISOString();
const context = "POST:/functions/v1/sms-inbox";
const body = JSON.stringify({ text: "...", receivedAt: "..." });
const message = timestamp + context + body;
const signature = crypto
  .createHmac("sha256", hmacSecret)
  .update(message)
  .digest("hex");
```

### Request Headers

```
POST /functions/v1/sms-inbox
Content-Type: application/json
x-signature: <hmac-sha256-hex>
x-timestamp: <iso-8601-timestamp>
```

### Edge Function Verification

The Edge Function validates:

1. Signature matches expected HMAC
2. Timestamp is recent (within 5 minutes to prevent replay attacks)

## SMS Message Format

### Expected Input Format

Mobile money SMS notifications typically follow these formats:

```
You have received RWF 20,000 from 0788123456 Ref NYA.GAS.TWIZ.001 TXN 12345 at 2025-10-01 12:00
```

```
15000 AIRTEL 250788123456 REF.KIG/NYARUGENGE.G2.M001 TXN67890
```

### Parsed Fields

- **Amount**: RWF amount (e.g., 20000)
- **MSISDN**: Phone number (e.g., +250788123456)
- **Reference**: Payment reference (e.g., NYA.GAS.TWIZ.001)
- **Transaction ID**: Provider transaction ID (e.g., 12345)
- **Timestamp**: Payment timestamp

## Testing

### 1. Manual SMS Test

Send a test SMS to the modem:

```bash
# Using Gammu CLI (if installed)
gammu sendsms TEXT +250788123456 -text "Test message"
```

### 2. Check Inbox Files

```bash
# List SMS files in inbox
docker exec ibimina-gammu-smsd ls -l /var/spool/gammu/inbox/

# View SMS content
docker exec ibimina-gammu-smsd cat /var/spool/gammu/inbox/IN20251028_123456_00.txt
```

### 3. Monitor Forwarder Logs

```bash
docker-compose logs -f sms-forwarder
```

Expected output:

```json
{
  "level": "info",
  "message": "SMS forwarded successfully",
  "meta": {
    "smsId": "uuid",
    "status": "MATCHED",
    "filename": "IN20251028_123456_00.txt"
  },
  "timestamp": "2025-10-28T12:00:00.000Z"
}
```

### 4. Verify in Supabase

Check the `app.sms_inbox` table:

```sql
SELECT id, raw_text, status, confidence, created_at
FROM app.sms_inbox
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Modem Not Detected

```bash
# Check if modem is connected
lsusb | grep -i modem

# Check device permissions
ls -l /dev/ttyUSB0

# Add user to dialout group (if running without Docker)
sudo usermod -a -G dialout $USER
```

### Gammu Can't Connect to Modem

```bash
# Test modem connection
docker exec ibimina-gammu-smsd gammu identify

# Check Gammu logs
docker logs ibimina-gammu-smsd
```

### SMS Not Being Forwarded

1. **Check forwarder logs**:

   ```bash
   docker-compose logs -f sms-forwarder
   ```

2. **Verify HMAC secret matches**:
   - Check `.env` file
   - Check Supabase Edge Function secrets

3. **Test Edge Function directly**:
   ```bash
   curl -X POST "$SUPABASE_URL/functions/v1/sms-inbox" \
     -H "Content-Type: application/json" \
     -H "x-signature: test" \
     -H "x-timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
     -d '{"text":"Test message"}'
   ```

### High Latency

- Reduce `POLL_INTERVAL` in `.env` (minimum: 1 second)
- Check network latency to Supabase
- Monitor Gammu SMSD performance

## Monitoring & Maintenance

### Metrics to Monitor

1. **SMS Processing Rate**: Messages per minute
2. **Forwarding Success Rate**: Successful forwards / total messages
3. **Latency**: Time from SMS receipt to database insertion
4. **Error Rate**: Failed forwards or parse errors

### Log Rotation

Docker logs are automatically rotated:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Backup & Recovery

Important directories to backup:

- `/var/spool/gammu/sent/`: Archive of sent messages
- `/var/spool/gammu/processed/`: Archive of forwarded messages

## Production Checklist

- [ ] HMAC secret is strong (32+ characters) and matches Edge Function
- [ ] SIM card PIN is correctly configured (if required)
- [ ] Modem device path is correct in `docker-compose.yml`
- [ ] Supabase URL points to production project
- [ ] Monitoring alerts configured for service failures
- [ ] Log aggregation configured (optional: forward to ELK, Grafana)
- [ ] Backup strategy for processed messages
- [ ] Network connectivity to Supabase verified
- [ ] Rate limiting configured in Edge Function

## Security Considerations

1. **HMAC Secret**: Store securely, rotate periodically
2. **Network**: Use HTTPS for all communication
3. **Access Control**: Limit access to SMS gateway host
4. **Logs**: Mask sensitive data (phone numbers, amounts) in logs
5. **SIM Security**: Use SIM PIN to prevent unauthorized use

## Support

For issues or questions:

- Check logs: `docker-compose logs`
- Review Edge Function logs in Supabase Dashboard
- Verify configuration matches this guide
- Check hardware connections and permissions

## References

- [Gammu SMSD Documentation](https://wammu.eu/docs/manual/smsd/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [HMAC Authentication](https://en.wikipedia.org/wiki/HMAC)

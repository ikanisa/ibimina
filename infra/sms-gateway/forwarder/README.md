# SMS Forwarder Service

This service monitors the Gammu SMSD inbox directory and forwards incoming SMS
messages to the Supabase Edge Function for processing.

## Features

- 📨 Monitors Gammu inbox for new SMS files
- 🔐 HMAC-SHA256 signature authentication
- 📝 Structured JSON logging
- ♻️ Automatic retry on failures
- 🐳 Docker containerized
- ✅ Comprehensive test coverage

## Architecture

```
Gammu SMSD → Inbox Directory → SMS Forwarder → Supabase Edge Function
```

The forwarder:

1. Polls the inbox directory every N seconds (configurable)
2. Parses SMS files from Gammu format
3. Generates HMAC signature for authentication
4. Forwards to Supabase Edge Function via HTTPS
5. Moves processed files to processed directory

## Configuration

Environment variables:

- `INBOX_PATH`: Path to Gammu inbox directory (default:
  `/var/spool/gammu/inbox`)
- `PROCESSED_PATH`: Path to processed messages directory (default:
  `/var/spool/gammu/processed`)
- `SUPABASE_FUNCTION_URL`: Full URL to Edge Function (required)
- `HMAC_SHARED_SECRET`: Shared secret for HMAC signing (required)
- `POLL_INTERVAL`: Polling interval in seconds (default: `5`)
- `LOG_LEVEL`: Logging level - `debug`, `info`, `warn`, `error` (default:
  `info`)
- `MODEM_PORT`: Modem device path for metadata (optional)

## Development

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
npm test
```

### Build

```bash
npm run build
```

### Run Locally

```bash
npm run dev
```

## Docker

### Build Image

```bash
docker build -t sms-forwarder .
```

### Run Container

```bash
docker run -d \
  --name sms-forwarder \
  -v /var/spool/gammu/inbox:/var/spool/gammu/inbox:ro \
  -v /var/spool/gammu/processed:/var/spool/gammu/processed \
  -e SUPABASE_FUNCTION_URL=https://your-project.supabase.co/functions/v1/sms-inbox \
  -e HMAC_SHARED_SECRET=your-secret \
  sms-forwarder
```

## Testing

The service includes comprehensive tests for:

- HMAC signature generation
- SMS file parsing (Gammu format)
- Timestamp extraction
- Logger formatting
- Request payload structure

Run tests:

```bash
npm test
```

## Security

### HMAC Authentication

All requests are authenticated using HMAC-SHA256:

```typescript
const message = timestamp + context + body;
const signature = crypto
  .createHmac("sha256", secret)
  .update(message)
  .digest("hex");
```

Request headers:

- `x-signature`: HMAC-SHA256 hex signature
- `x-timestamp`: ISO 8601 timestamp
- `Content-Type`: application/json

### Best Practices

1. Use strong HMAC secret (32+ characters)
2. Rotate secrets periodically
3. Use HTTPS for all communication
4. Monitor logs for authentication failures
5. Set appropriate file permissions on inbox/processed directories

## Monitoring

The service logs structured JSON events:

```json
{
  "level": "info",
  "message": "SMS forwarded successfully",
  "meta": {
    "smsId": "uuid",
    "status": "MATCHED",
    "filename": "IN20251028_120000_00.txt"
  },
  "timestamp": "2025-10-28T12:00:00.000Z"
}
```

Key events to monitor:

- `SMS forwarded successfully` - Successful forwarding
- `SMS forwarding failed` - Failed forwarding (will retry)
- `Edge function returned error` - API error from Edge Function
- `Failed to parse SMS file` - Invalid SMS format

## Troubleshooting

### SMS Files Not Processing

1. Check inbox directory permissions
2. Verify POLL_INTERVAL is reasonable
3. Check logs for parsing errors

### Authentication Failures

1. Verify HMAC_SHARED_SECRET matches Edge Function
2. Check system clock synchronization
3. Verify SUPABASE_FUNCTION_URL is correct

### High Latency

1. Reduce POLL_INTERVAL (minimum: 1 second)
2. Check network latency to Supabase
3. Monitor Edge Function performance

## License

Part of the SACCO+ application infrastructure.

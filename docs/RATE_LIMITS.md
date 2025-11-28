# Rate Limiting Configuration

This document describes the rate limiting configurations across the Ibimina
platform.

## Overview

Rate limiting is implemented at multiple levels to prevent abuse and ensure
system stability:

- **Edge Function Level**: Using `enforceRateLimit` from `_shared/rate-limit.ts`
- **IP-based Limiting**: Prevents abuse from specific IP addresses
- **User/Phone-based Limiting**: Prevents abuse from specific users or phone
  numbers

## Configuration

Rate limits are configured via environment variables:

```bash
RATE_LIMIT_WINDOW_SECONDS=60    # Default window in seconds
RATE_LIMIT_MAX=120              # Default max hits per window
```

## Edge Function Rate Limits

### SMS Parsing (`parse-sms`)

- **Global**: 100 requests per minute
- **Purpose**: Prevent excessive AI parsing costs
- **Implementation**: Added in Phase 1 security refactoring

### WhatsApp OTP Send (`whatsapp-otp-send`)

- **Per IP**: 30 requests per hour
- **Per Phone**: 5 requests per hour
- **Purpose**: Prevent OTP spam and abuse

### WhatsApp OTP Verify (`whatsapp-otp-verify`)

- **Per IP**: 30 requests per hour
- **Per Phone**: 10 requests per hour
- **Purpose**: Prevent brute force attacks

## Database Function

Rate limiting uses the `consume_route_rate_limit` database function:

```sql
consume_route_rate_limit(
  bucket_key TEXT,      -- Unique identifier (e.g., "ip:192.168.1.1", "user:123")
  route TEXT,           -- Route name (e.g., "whatsapp_otp_send")
  max_hits INTEGER,     -- Maximum allowed hits
  window_seconds INTEGER -- Time window in seconds
) RETURNS BOOLEAN
```

## Adding Rate Limiting to New Functions

```typescript
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { createServiceClient } from "../_shared/mod.ts";

const supabase = createServiceClient();
const allowed = await enforceRateLimit(supabase, "my-route", {
  maxHits: 100,
  windowSeconds: 60,
});

if (!allowed) {
  return new Response("Rate limit exceeded", { status: 429 });
}
```

## Monitoring

Rate limit violations are logged and can be monitored via:

- Application logs (search for "rate_limit")
- Audit logs in the database
- Observability platform metrics

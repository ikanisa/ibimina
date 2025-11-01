# Android Notification Listener & SMS User Consent - Enhanced Implementation

This document describes the enhanced implementation of the Android Notification
Listener service with Edge Function integration and HMAC signing for secure MoMo
transaction detection.

## Overview

The implementation consists of two Play-compliant mechanisms:

1. **Notification Listener Service** - Reads MoMo app notifications (not SMS
   inbox)
2. **SMS User Consent API** - One-time, user-approved SMS read (no READ_SMS
   permission)

## Architecture

```
MoMo Transaction Flow:
┌─────────────────┐
│  User pays via  │
│  USSD/MoMo App  │
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
  ┌─────────────┐       ┌──────────┐
  │ MoMo sends  │       │ MoMo App │
  │     SMS     │       │  Notif   │
  └─────┬───────┘       └────┬─────┘
        │                    │
        │ (User Consent)     │ (Automatic)
        │                    │
        ▼                    ▼
  ┌──────────────────────────────┐
  │  SMS User Consent Plugin     │
  │  - Prompts user              │
  │  - One-time read             │
  └──────────┬───────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │ Notification Listener        │
  │  - Reads notification text   │
  │  - Posts to Edge Function    │
  │  - HMAC signed               │
  └──────────┬───────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │ Edge Function (ingest-sms)   │
  │  - Verifies HMAC             │
  │  - Parses transaction        │
  │  - Creates allocation row    │
  └──────────────────────────────┘
```

## Part 1: Notification Listener Service (Enhanced)

### What Changed

The `MoMoNotificationListener` service has been enhanced to:

1. **Post to Edge Function** - Automatically sends notification content to your
   Supabase Edge Function
2. **HMAC Signing** - Signs all requests with HMAC-SHA256 for security
3. **Async Processing** - Uses background thread pool to avoid blocking
   notifications
4. **BuildConfig Integration** - Reads configuration from environment variables

### Configuration

#### 1. Set Environment Variables

Before building, set these environment variables:

```bash
# Required for Edge Function posting
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export HMAC_SHARED_SECRET="your-hmac-secret-here"
```

Or add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
HMAC_SHARED_SECRET=your-hmac-secret-here
```

#### 2. Generate HMAC Secret

Generate a secure secret:

```bash
openssl rand -hex 32
```

Store this secret in:

- Environment variable `HMAC_SHARED_SECRET`
- Your Edge Function (for verification)

#### 3. Build Configuration

The `build.gradle` has been updated to inject these values:

```gradle
buildConfigField "String", "SUPABASE_URL", "\"${System.getenv('NEXT_PUBLIC_SUPABASE_URL') ?: 'https://placeholder.supabase.co'}\""
buildConfigField "String", "HMAC_SHARED_SECRET", "\"${System.getenv('HMAC_SHARED_SECRET') ?: 'placeholder-secret'}\""
```

#### 4. Build with Configuration

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export HMAC_SHARED_SECRET="your-hmac-secret-here"

# Sync Capacitor
cd apps/client
pnpm cap sync android

# Build APK
pnpm android:build:release
```

### How It Works

#### 1. Notification Detection

When a MoMo app (MTN, Airtel) posts a notification, the service:

1. Filters by package name (`rw.mtn.momo`, `com.airtel.money`)
2. Extracts title and text from notification
3. Combines into full SMS text
4. Broadcasts to app for immediate UI feedback
5. Posts to Edge Function (async)

#### 2. Edge Function Posting

The service constructs a JSON payload:

```json
{
  "country_iso2": "RW",
  "telco": "MTN",
  "sms": "MTN MoMo: You have received RWF 5000 from 0788123456. Ref: MP123456"
}
```

Then:

1. Computes HMAC-SHA256 signature of the payload
2. Sends POST request to `/functions/v1/ingest-sms`
3. Includes `x-signature` header with HMAC
4. Logs success/failure

#### 3. Error Handling

- **Missing Configuration:** Skips posting if URL/secret are placeholders
- **Network Errors:** Logs but doesn't crash
- **Async Execution:** Doesn't block notification processing

### Supported MoMo Apps

Currently configured for:

- **MTN MoMo Rwanda:** `rw.mtn.momo`
- **Airtel Money Rwanda:** `com.airtel.money`

**To add more apps:**

Edit `MoMoNotificationListener.java`:

```java
private static final String MTN_MOMO_PACKAGE = "rw.mtn.momo";
private static final String AIRTEL_MONEY_PACKAGE = "com.airtel.money";
private static final String TIGO_CASH_PACKAGE = "com.tigo.cash"; // Add new app

private boolean isMoMoApp(String packageName) {
    return MTN_MOMO_PACKAGE.equals(packageName) ||
           AIRTEL_MONEY_PACKAGE.equals(packageName) ||
           TIGO_CASH_PACKAGE.equals(packageName); // Include in check
}
```

### User Setup

Users must enable notification access:

```typescript
import { Capacitor } from "@capacitor/core";
import { registerPlugin } from "@capacitor/core";

const MoMoNotificationListener = registerPlugin<any>(
  "MoMoNotificationListener"
);

// Check if permission is granted
const { granted } = await MoMoNotificationListener.checkPermission();

if (!granted) {
  // Opens system notification settings
  await MoMoNotificationListener.requestPermission();
}
```

This opens **Settings → Notifications → Notification Access** where user must
manually enable "Ibimina".

## Part 2: SMS User Consent API

The SMS User Consent API is already implemented in `SmsUserConsentPlugin.kt` and
provides Play-compliant SMS access.

### Usage

```typescript
import { requestSmsUserConsent } from "@/lib/sms/user-consent";

// User taps "I've paid"
async function handleIvePaid() {
  try {
    // Start listening for SMS (5 min timeout)
    const result = await requestSmsUserConsent({ sender: null });

    // User approved and SMS received
    console.log("SMS content:", result.message);
    console.log("OTP extracted:", result.otp);

    // Post to Edge Function
    await postSmsToEdge(result.message);
  } catch (error) {
    if (error === "cancelled") {
      // User dismissed dialog
      console.log("User cancelled SMS consent");
    } else if (error === "timeout") {
      // No SMS received in 5 minutes
      console.log("No SMS received");
    }
  }
}
```

### Key Features

- ✅ **No SMS Permission Required** - Uses Android's consent API
- ✅ **User Approval Required** - System dialog for each SMS
- ✅ **One-Time Read** - Only reads the specific SMS user approves
- ✅ **Play Compliant** - Fully compliant with Google Play SMS policy
- ✅ **OTP Extraction** - Automatically extracts 4-8 digit codes

### Integration with Notification Listener

You can use both mechanisms together:

1. **Automatic (Notification Listener):** Background detection, posts
   automatically
2. **Manual (SMS Consent):** User-triggered, one-time explicit read

```typescript
// Automatic: Listen for notifications
useEffect(() => {
  const MoMoPlugin = registerPlugin<any>("MoMoNotificationListener");

  const listener = MoMoPlugin.addListener("smsReceived", (data: any) => {
    console.log("MoMo notification:", data.text);
    // Show toast: "Payment detected!"
  });

  return () => listener.remove();
}, []);

// Manual: User triggers consent
async function capturePaymentManually() {
  const result = await requestSmsUserConsent();
  // Process SMS...
}
```

## Edge Function Integration

### Required Edge Function

You need a Supabase Edge Function at `/functions/v1/ingest-sms` that:

1. Verifies HMAC signature
2. Parses SMS text
3. Creates allocation row

**Example Edge Function:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HMAC_SECRET = Deno.env.get("HMAC_SHARED_SECRET")!;

async function verifyHmac(
  payload: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signatureBuffer = Uint8Array.from(
    signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  return await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBuffer,
    encoder.encode(payload)
  );
}

serve(async (req) => {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-signature") || "";

    // Verify HMAC
    const valid = await verifyHmac(payload, signature);
    if (!valid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const data = JSON.parse(payload);

    // Parse SMS and create allocation
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Your parsing logic here...
    // Extract: amount, reference, sender phone

    const { error } = await supabase.from("allocations").insert({
      amount: extractedAmount,
      reference: extractedRef,
      status: "UNALLOCATED",
      // ...
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

### Deploy Edge Function

```bash
cd supabase
supabase functions deploy ingest-sms --no-verify-jwt
```

Set the HMAC secret in Supabase dashboard: **Settings → Edge Functions → Secrets
→ Add Secret**

```
HMAC_SHARED_SECRET=your-hmac-secret-here
```

## Testing

### Test Notification Listener

#### 1. Enable Notification Access

On device:

1. Settings → Notifications → Notification Access
2. Enable "Ibimina"

#### 2. Trigger Test Notification

```bash
# Send test notification (requires root or test build)
adb shell am broadcast \
  -a rw.gov.ikanisa.ibimina.SMS_RECEIVED \
  --es sms_text "MTN MoMo: You have received RWF 5000" \
  --es app_package "rw.mtn.momo"
```

#### 3. Check Logs

```bash
adb logcat | grep "MoMoNotificationListener"
```

Expected output:

```
I/MoMoNotificationListener: MoMo notification received from rw.mtn.momo
I/MoMoNotificationListener: Successfully posted to Edge Function: 200
```

### Test SMS User Consent

```typescript
// In your app
import { requestSmsUserConsent } from "@/lib/sms/user-consent";

async function testSmsConsent() {
  try {
    const result = await requestSmsUserConsent();
    console.log("SMS received:", result.message);
  } catch (error) {
    console.error("Error:", error);
  }
}
```

Then send a test SMS to the device.

## Privacy & Compliance

### Play Store Policy Compliance

✅ **No READ_SMS Permission** - Uses Notification Listener + SMS User Consent
API  
✅ **User Consent Required** - Explicit permission for notification access  
✅ **Transparent Purpose** - Clear explanation of why permission is needed  
✅ **No Background SMS Access** - Only reads notifications, not SMS inbox  
✅ **One-Time Consent** - SMS Consent API requires approval per message

### Privacy Best Practices

1. **Clear Disclosure:** Show permission rationale before requesting
2. **Minimal Data:** Only extract transaction info, discard rest
3. **Secure Transport:** Always use HTTPS + HMAC signing
4. **Log Redaction:** Never log full SMS content in production
5. **User Control:** Allow users to disable auto-detection

### Example Permission Rationale

```typescript
<Dialog>
  <DialogTitle>Enable Payment Detection</DialogTitle>
  <DialogContent>
    <p>
      To automatically detect your MoMo payments, Ibimina needs
      permission to read payment notifications from MTN MoMo and
      Airtel Money.
    </p>
    <p>
      <strong>What we access:</strong>
      • Payment notifications only (not other apps)
      • Transaction amount and reference
    </p>
    <p>
      <strong>What we DON'T access:</strong>
      • Your SMS inbox
      • Personal messages
      • Other app notifications
    </p>
    <p>
      You can disable this anytime in Settings.
    </p>
  </DialogContent>
  <DialogActions>
    <Button onClick={requestNotificationPermission}>
      Enable Payment Detection
    </Button>
  </DialogActions>
</Dialog>
```

## Troubleshooting

### Issue: Edge Function Not Receiving Requests

**Symptoms:** Notification received but no Edge Function logs

**Solutions:**

1. Check environment variables are set:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $HMAC_SHARED_SECRET
   ```
2. Rebuild app after setting env vars
3. Check logs for "Edge Function URL or HMAC secret not configured"

### Issue: HMAC Verification Failed (401)

**Symptoms:** Edge Function returns 401 Unauthorized

**Solutions:**

1. Verify HMAC secret matches in both places:
   - `HMAC_SHARED_SECRET` env var (Android build)
   - Edge Function secret (Supabase dashboard)
2. Check secret has no extra whitespace/newlines
3. Regenerate secret if needed:
   ```bash
   openssl rand -hex 32
   ```

### Issue: Notification Permission Not Granted

**Symptoms:** Notifications not detected

**Solutions:**

1. Check permission status:
   ```kotlin
   Settings.Secure.getString(
     context.contentResolver,
     "enabled_notification_listeners"
   )
   ```
2. Guide user to Settings → Notifications → Notification Access
3. Verify app appears in list and is enabled

### Issue: Wrong Package Name

**Symptoms:** Notifications not captured despite permission

**Solutions:**

1. Find actual MoMo app package:
   ```bash
   adb shell pm list packages | grep -i momo
   ```
2. Update `MoMoNotificationListener.java` with correct package name
3. Rebuild app

## References

- [Android Notification Listener Service](https://developer.android.com/reference/android/service/notification/NotificationListenerService)
- [Google Play SMS and Call Log Permissions](https://support.google.com/googleplay/android-developer/answer/9047303)
- [SMS User Consent API](https://developers.google.com/identity/sms-retriever/user-consent/overview)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

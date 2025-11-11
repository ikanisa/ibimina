# Android SMS Ingestion Implementation Guide

## Overview

This guide covers implementing SMS ingestion on Android for the SACCO+ Client
App. The app needs to read Mobile Money confirmation SMS messages and send them
to the Supabase Edge Function for processing.

## Architecture Options

### Option A: Play-Compliant (Recommended for Public Play Store)

**Components:**

1. Notification Listener Service (reads notification content)
2. SMS User Consent API (one-time user approval for specific SMS)

**Pros:**

- Play Store compliant
- No READ_SMS permission needed
- User-friendly permission flow

**Cons:**

- May miss some SMS if notifications differ
- Requires user interaction for SMS User Consent

### Option B: Full READ_SMS Permission (Enterprise/MDM)

**Components:**

1. READ_SMS and RECEIVE_SMS permissions
2. BroadcastReceiver for SMS_RECEIVED
3. Full SMS inbox access

**Pros:**

- Complete SMS capture
- No user interaction needed after initial permission

**Cons:**

- Requires Google Play permission declaration
- Strict audit requirements
- May not be approved for public Play Store

### Option C: Hybrid Approach (Recommended)

**Strategy:**

- Use Notification Listener as primary method
- Fall back to SMS User Consent API when needed
- Maintain GSM modem as universal fallback for PWA users

## Implementation Steps

### 1. Add Capacitor SMS Plugin

```bash
# Install Capacitor SMS plugin
npm install @capacitor-community/sms
npx cap sync
```

### 2. Configure Android Permissions

**For Notification Listener (Option A):**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  <uses-permission android:name="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE" />

  <application>
    <service
      android:name=".NotificationListener"
      android:exported="true"
      android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE">
      <intent-filter>
        <action android:name="android.service.notification.NotificationListenerService" />
      </intent-filter>
    </service>
  </application>
</manifest>
```

**For READ_SMS (Option B - Enterprise Only):**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  <uses-permission android:name="android.permission.READ_SMS" />
  <uses-permission android:name="android.permission.RECEIVE_SMS" />
</manifest>
```

### 3. Create Notification Listener Service

```kotlin
// android/app/src/main/java/rw/gov/ikanisa/ibimina/client/NotificationListener.kt
package rw.gov.ikanisa.ibimina.client

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import java.text.SimpleDateFormat
import java.util.*

class NotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "NotificationListener"
        private const val MTN_PACKAGE = "com.mtn.mobile.money"  // Example - verify actual package
        private const val AIRTEL_PACKAGE = "com.airtel.money"   // Example - verify actual package
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)

        sbn?.let {
            // Check if notification is from mobile money provider
            if (it.packageName == MTN_PACKAGE || it.packageName == AIRTEL_PACKAGE) {
                val extras = it.notification.extras
                val title = extras.getString("android.title") ?: ""
                val text = extras.getCharSequence("android.text")?.toString() ?: ""

                // Check if it's a transaction confirmation
                if (isTransactionConfirmation(text)) {
                    Log.d(TAG, "Transaction notification detected: $text")

                    // Send to WebView for processing
                    sendToWebView(text, it.packageName, it.postTime)
                }
            }
        }
    }

    private fun isTransactionConfirmation(text: String): Boolean {
        // Match patterns like:
        // "You have received RWF X from..."
        // "Transaction successful. Amount: RWF X..."
        val patterns = listOf(
            "received.*RWF".toRegex(RegexOption.IGNORE_CASE),
            "paid.*RWF".toRegex(RegexOption.IGNORE_CASE),
            "transaction.*successful".toRegex(RegexOption.IGNORE_CASE)
        )

        return patterns.any { it.containsMatchIn(text) }
    }

    private fun sendToWebView(text: String, source: String, timestamp: Long) {
        // Send message to WebView via bridge
        // This will be handled by Capacitor plugin
        val data = mapOf(
            "type" to "SMS_NOTIFICATION",
            "text" to text,
            "source" to source,
            "timestamp" to timestamp
        )

        // Bridge to JavaScript
        // Implementation depends on Capacitor bridge setup
    }
}
```

### 4. Create SMS Parser (Client-Side)

```typescript
// apps/client/lib/sms/parser.ts

/**
 * SMS Parser for Mobile Money Confirmations
 *
 * Parses MoMo confirmation SMS using regex patterns.
 * Supports MTN Rwanda, Airtel Money format.
 */

export interface ParsedSMS {
  amount: number;
  msisdn: string;
  reference: string;
  txnId: string;
  timestamp: string;
  provider: "MTN" | "AIRTEL" | "UNKNOWN";
  raw: string;
}

/**
 * MTN Rwanda SMS Pattern Examples:
 * - "You have received RWF 20,000 from 0788123456. Ref: NYA.GAS.KBG.001 Txn: MTN12345 at 2025-10-28 10:30"
 * - "You have paid RWF 15,000 to 0788654321. Ref: NYA.KIC.FRM.002 Txn: MTN67890 at 2025-10-28 11:45"
 */
const MTN_PATTERN =
  /(?:received|paid).*?RWF\s*(?<amount>[0-9,]+).*?(?:from|to)\s*(?<msisdn>\+?2507\d{8}|07\d{8}).*?(?:Ref:?\s*)(?<ref>[A-Z]{3}\.[A-Z]{3}\.[A-Z0-9]{3,8}\.[0-9]{3}).*?(?:Txn|TXN):?\s*(?<txn>[A-Za-z0-9]+).*?(?:at\s*)?(?<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2})?/i;

/**
 * Airtel Money SMS Pattern (adjust based on actual format)
 */
const AIRTEL_PATTERN =
  /Transaction.*?(?<amount>[0-9,]+).*?(?<msisdn>\+?2507\d{8}|07\d{8}).*?Ref[.:\s]*(?<ref>[A-Z]{3}\.[A-Z]{3}\.[A-Z0-9]{3,8}\.[0-9]{3}).*?(?:ID|TXN)[.:\s]*(?<txn>[A-Za-z0-9]+)/i;

export function parseSMS(rawText: string): ParsedSMS | null {
  // Try MTN pattern first
  let match = MTN_PATTERN.exec(rawText);
  let provider: "MTN" | "AIRTEL" | "UNKNOWN" = "MTN";

  // Fall back to Airtel pattern
  if (!match) {
    match = AIRTEL_PATTERN.exec(rawText);
    provider = "AIRTEL";
  }

  if (!match || !match.groups) {
    console.warn("Failed to parse SMS:", rawText);
    return null;
  }

  const { amount, msisdn, ref, txn, ts } = match.groups;

  // Validate required fields
  if (!amount || !ref || !txn) {
    console.warn("Incomplete SMS data:", match.groups);
    return null;
  }

  // Normalize amount (remove commas, parse to number)
  const normalizedAmount = parseInt(amount.replace(/,/g, ""), 10);

  // Normalize MSISDN (ensure +250 prefix)
  const normalizedMsisdn = msisdn.startsWith("+250")
    ? msisdn
    : msisdn.startsWith("0")
      ? "+250" + msisdn.substring(1)
      : "+250" + msisdn;

  // Parse or generate timestamp
  const timestamp = ts ? new Date(ts).toISOString() : new Date().toISOString();

  return {
    amount: normalizedAmount,
    msisdn: normalizedMsisdn,
    reference: ref,
    txnId: txn,
    timestamp,
    provider,
    raw: rawText,
  };
}

/**
 * Decode reference token to extract district, SACCO, group, member
 */
export function decodeReference(ref: string): {
  district: string;
  sacco: string;
  group: string;
  member: string;
} | null {
  const parts = ref.split(".");

  if (parts.length !== 4) {
    console.warn("Invalid reference format:", ref);
    return null;
  }

  return {
    district: parts[0],
    sacco: parts[1],
    group: parts[2],
    member: parts[3],
  };
}
```

### 5. Send SMS to Edge Function

```typescript
// apps/client/lib/sms/ingest.ts

import { parseSMS, type ParsedSMS } from "./parser";

const EDGE_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/sms/ingest-device";
const HMAC_SECRET = process.env.NEXT_PUBLIC_HMAC_SHARED_SECRET;

/**
 * Sign SMS data with HMAC for Edge Function authentication
 */
async function signPayload(
  payload: string,
  timestamp: string
): Promise<string> {
  const context = `POST:${new URL(EDGE_FUNCTION_URL).pathname}`;
  const message = `${timestamp}${context}${payload}`;

  // Use Web Crypto API
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Send parsed SMS to Edge Function
 */
export async function ingestSMS(
  rawSMS: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Parse SMS
    const parsed = parseSMS(rawSMS);

    if (!parsed) {
      return { success: false, error: "Failed to parse SMS" };
    }

    // Prepare payload
    const payload = JSON.stringify({
      rawText: parsed.raw,
      amount: parsed.amount,
      msisdn: parsed.msisdn,
      reference: parsed.reference,
      txnId: parsed.txnId,
      occurredAt: parsed.timestamp,
      provider: parsed.provider,
      deviceMeta: {
        userAgent: navigator.userAgent,
        platform: "android",
      },
    });

    // Sign payload
    const timestamp = new Date().toISOString();
    const signature = await signPayload(payload, timestamp);

    // Send to Edge Function
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signature,
        "x-timestamp": timestamp,
      },
      body: payload,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Edge Function error:", error);
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, ...result };
  } catch (error) {
    console.error("Failed to ingest SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### 6. Capacitor Plugin Integration

```typescript
// apps/client/lib/sms/listener.ts

import { Capacitor } from "@capacitor/core";
import { ingestSMS } from "./ingest";

/**
 * Initialize SMS listener for Android
 */
export async function initializeSMSListener() {
  // Only on Android
  if (Capacitor.getPlatform() !== "android") {
    console.log("SMS listener only available on Android");
    return;
  }

  // Register notification listener
  window.addEventListener("sms-notification", async (event: any) => {
    const { text } = event.detail;

    console.log("Received SMS notification:", text);

    // Ingest SMS
    const result = await ingestSMS(text);

    if (result.success) {
      console.log("SMS ingested successfully");

      // Show user notification
      showSuccessNotification();
    } else {
      console.error("Failed to ingest SMS:", result.error);
    }
  });

  // Request notification access (if not already granted)
  await requestNotificationAccess();
}

async function requestNotificationAccess() {
  // Use Android native API to request notification listener permission
  // This opens system settings for user to enable
  // Check if permission is granted
  // If not, show prompt with instructions
}

function showSuccessNotification() {
  // Show in-app notification that payment was detected
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Payment Detected", {
      body: "Your payment has been received and is being processed.",
      icon: "/icons/icon-192.png",
    });
  }
}
```

### 7. Edge Function (Server-Side)

Create new Edge Function endpoint for device-level ingestion:

```typescript
// supabase/functions/sms/ingest-device/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyHMAC } from "../_shared/hmac.ts";

serve(async (req) => {
  // Verify HMAC signature
  const signature = req.headers.get("x-signature");
  const timestamp = req.headers.get("x-timestamp");
  const body = await req.text();

  const isValid = await verifyHMAC(signature, timestamp, body, req.url);

  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse SMS data
  const data = JSON.parse(body);

  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Insert into sms_inbox
  const { data: smsRecord, error } = await supabase
    .from("sms_inbox")
    .insert({
      raw_text: data.rawText,
      source: "device",
      vendor_meta: data.deviceMeta,
      received_at: data.occurredAt,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert SMS:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse and allocate payment
  const { error: parseError } = await supabase.rpc("parse_and_allocate_sms", {
    sms_id: smsRecord.id,
    amount: data.amount,
    msisdn: data.msisdn,
    reference: data.reference,
    txn_id: data.txnId,
    occurred_at: data.occurredAt,
  });

  if (parseError) {
    console.error("Failed to allocate payment:", parseError);
  }

  return new Response(JSON.stringify({ success: true, smsId: smsRecord.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## Testing

### 1. Unit Tests

```typescript
// apps/client/tests/unit/sms-parser.test.ts

import { describe, it, expect } from "@jest/globals";
import { parseSMS, decodeReference } from "@/lib/sms/parser";

describe("SMS Parser", () => {
  it("should parse MTN confirmation SMS", () => {
    const sms =
      "You have received RWF 20,000 from 0788123456. Ref: NYA.GAS.KBG.001 Txn: MTN12345 at 2025-10-28 10:30";

    const result = parseSMS(sms);

    expect(result).not.toBeNull();
    expect(result?.amount).toBe(20000);
    expect(result?.msisdn).toBe("+250788123456");
    expect(result?.reference).toBe("NYA.GAS.KBG.001");
    expect(result?.txnId).toBe("MTN12345");
    expect(result?.provider).toBe("MTN");
  });

  it("should decode reference token", () => {
    const ref = "NYA.GAS.KBG.001";

    const result = decodeReference(ref);

    expect(result).not.toBeNull();
    expect(result?.district).toBe("NYA");
    expect(result?.sacco).toBe("GAS");
    expect(result?.group).toBe("KBG");
    expect(result?.member).toBe("001");
  });
});
```

### 2. Integration Testing

Use Android Emulator or physical device to test:

1. Send test SMS from another device
2. Verify notification appears
3. Check that SMS is parsed correctly
4. Confirm data reaches Edge Function
5. Verify allocation in database

## Google Play Store Requirements

### For Notification Listener:

No special declaration needed - standard permission.

### For READ_SMS (Enterprise Build):

Submit **Permissions Declaration Form** explaining:

- Core functionality: Financial transaction confirmations
- Alternative: GSM modem (but device-level preferred)
- User benefit: Automatic payment confirmation
- Privacy: SMS data sent only to own backend, not stored

## Security Considerations

1. **HMAC Signing**: Always sign payloads before sending to Edge Function
2. **PII Protection**: Redact sensitive data in logs
3. **Permission Prompts**: Clear explanation why SMS access is needed
4. **Data Minimization**: Only extract necessary fields
5. **Secure Storage**: Never store raw SMS on device

## Deployment

### Play Store Build:

- Use Notification Listener only
- Submit with standard permissions

### Enterprise/MDM Build:

- Include READ_SMS permission
- Distribute via MDM or sideload
- Document for IT administrators

## Fallback Strategy

If device-level SMS fails:

1. User marks payment as "Pending"
2. GSM modem picks up SMS centrally
3. Staff manually confirms via admin console

This ensures no payments are lost even if device-level ingestion fails.

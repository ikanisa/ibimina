# SACCO+ Gap Analysis and Implementation Plan

## Executive Summary

This document identifies specific gaps in the three-app system and provides
actionable implementation steps to address them. Gaps are prioritized as
CRITICAL, HIGH, or MEDIUM based on impact on production readiness.

## Critical Gaps (Must Fix Before Production)

### Gap 1: Platform API Workers Not Implemented

**Current State**:

- Worker files exist but contain placeholder code
- No actual MoMo polling logic
- No GSM heartbeat implementation
- Workers don't run on schedule

**Impact**:

- Payments won't be automatically detected
- SMS gateway health not monitored
- Manual reconciliation required

**Implementation Plan**:

```typescript
// apps/platform-api/src/workers/momo-poller.ts

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function runMomoPoller() {
  console.log("[MoMoPoller] Starting poll cycle");

  try {
    // 1. Fetch last processed timestamp
    const { data: lastRun } = await supabase
      .from("worker_state")
      .select("last_poll_at")
      .eq("worker_name", "momo-poller")
      .single();

    const lastPollAt = lastRun?.last_poll_at || new Date(Date.now() - 3600000);

    // 2. Call MoMo API
    const transactions = await fetchMomoTransactions({
      since: lastPollAt,
      apiKey: process.env.MOMO_API_KEY,
      apiUrl: process.env.MOMO_API_URL,
    });

    console.log(`[MoMoPoller] Found ${transactions.length} transactions`);

    // 3. Insert transactions
    for (const txn of transactions) {
      // Parse reference to find SACCO
      const saccoId = await resolveSaccoFromReference(txn.reference);

      // Upsert payment (idempotent)
      const { error } = await supabase.from("payments").upsert(
        {
          txn_id: txn.id,
          sacco_id: saccoId,
          amount: txn.amount,
          currency: txn.currency || "RWF",
          msisdn: txn.msisdn,
          reference: txn.reference,
          occurred_at: txn.timestamp,
          source: "momo_api",
          status: "pending",
        },
        { onConflict: "txn_id" }
      );

      if (error) {
        console.error(`[MoMoPoller] Failed to insert txn ${txn.id}:`, error);
      }
    }

    // 4. Update last poll timestamp
    await supabase.from("worker_state").upsert({
      worker_name: "momo-poller",
      last_poll_at: new Date().toISOString(),
      last_status: "success",
    });

    // 5. Trigger reconciliation
    if (transactions.length > 0) {
      await supabase.functions.invoke("scheduled-reconciliation");
    }
  } catch (error) {
    console.error("[MoMoPoller] Error:", error);

    // Update error status
    await supabase.from("worker_state").upsert({
      worker_name: "momo-poller",
      last_status: "error",
      last_error: String(error),
    });
  }
}

// Helper function
async function resolveSaccoFromReference(ref: string): Promise<string> {
  const match = ref.match(/^([A-Z]{3})\./);
  if (!match) return null;

  const code = match[1];
  const { data } = await supabase
    .from("saccos")
    .select("id")
    .eq("code", code)
    .single();

  return data?.id;
}

async function fetchMomoTransactions({ since, apiKey, apiUrl }) {
  // TODO: Replace with actual MoMo API client
  const response = await fetch(`${apiUrl}/transactions?since=${since}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`MoMo API error: ${response.status}`);
  }

  return response.json();
}

// Run on interval
if (require.main === module) {
  const interval = parseInt(process.env.MOMO_POLL_INTERVAL_MS || "30000");

  setInterval(async () => {
    await runMomoPoller();
  }, interval);

  // Initial run
  runMomoPoller();
}
```

```typescript
// apps/platform-api/src/workers/gsm-heartbeat.ts

export async function runGsmHeartbeat() {
  console.log("[GSMHeartbeat] Checking modem status");

  try {
    // 1. Check GSM modem connectivity
    const modemStatus = await checkGsmModem({
      port: process.env.GSM_MODEM_PORT,
      baudRate: parseInt(process.env.GSM_MODEM_BAUDRATE || "115200"),
    });

    // 2. Log to Supabase
    await supabase.from("worker_health").upsert({
      worker_name: "gsm-heartbeat",
      status: modemStatus.connected ? "healthy" : "degraded",
      last_heartbeat: new Date().toISOString(),
      metadata: {
        signal_strength: modemStatus.signalStrength,
        operator: modemStatus.operator,
        unread_messages: modemStatus.unreadCount,
      },
    });

    // 3. Alert if degraded
    if (!modemStatus.connected) {
      await sendAlert({
        severity: "high",
        message: "GSM modem disconnected",
        details: modemStatus,
      });
    }
  } catch (error) {
    console.error("[GSMHeartbeat] Error:", error);

    await supabase.from("worker_health").upsert({
      worker_name: "gsm-heartbeat",
      status: "error",
      last_heartbeat: new Date().toISOString(),
      metadata: { error: String(error) },
    });
  }
}

async function checkGsmModem({ port, baudRate }) {
  // TODO: Replace with actual GSM modem library (e.g., serialport + at-commands)
  // For now, return mock data
  return {
    connected: true,
    signalStrength: 85,
    operator: "MTN Rwanda",
    unreadCount: 0,
  };
}
```

**Migration Steps**:

1. Create `worker_state` and `worker_health` tables in Supabase
2. Implement worker logic as shown above
3. Set up environment variables for MoMo API
4. Test workers locally
5. Deploy with PM2 or Docker
6. Monitor logs and health table

**Completion Criteria**:

- [ ] Workers poll/check successfully
- [ ] Transactions inserted into database
- [ ] Health status logged every minute
- [ ] Errors logged and alerted
- [ ] Workers restart on failure (PM2)

---

### Gap 2: Client App OCR Upload is Stub

**Current State**:

- `/api/ocr/upload` returns mocked data
- No actual file upload to storage
- No OCR service integration
- Members can't complete identity verification

**Impact**:

- Members can't onboard fully
- Manual verification required
- Poor user experience

**Implementation Plan**:

```typescript
// apps/client/app/api/ocr/upload/route.ts

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const uploadSchema = z.object({
  id_type: z.enum(["NID", "DL", "PASSPORT"]),
});

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const idType = formData.get("id_type") as string;

    const validated = uploadSchema.parse({ id_type: idType });

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("id-documents")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // 4. Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("id-documents").getPublicUrl(fileName);

    // 5. Call OCR service
    const ocrResult = await processOcr({
      imageUrl: publicUrl,
      idType: validated.id_type,
    });

    // 6. Update member profile
    const { error: updateError } = await supabase
      .from("members_app_profiles")
      .update({
        id_type: validated.id_type,
        id_number: ocrResult.idNumber,
        id_files: {
          original: fileName,
          url: publicUrl,
          uploadedAt: new Date().toISOString(),
        },
        ocr_json: ocrResult.raw,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    // 7. Return extracted data
    return NextResponse.json({
      success: true,
      data: {
        id_type: validated.id_type,
        id_number: ocrResult.idNumber,
        full_name: ocrResult.fullName,
        date_of_birth: ocrResult.dateOfBirth,
        confidence: ocrResult.confidence,
        extracted_fields: ocrResult.fields,
      },
    });
  } catch (error) {
    console.error("OCR upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processOcr({ imageUrl, idType }) {
  // Option 1: Google Vision API
  if (process.env.GOOGLE_VISION_API_KEY) {
    return await processWithGoogleVision(imageUrl, idType);
  }

  // Option 2: AWS Textract
  if (process.env.AWS_TEXTRACT_ACCESS_KEY) {
    return await processWithAwsTextract(imageUrl, idType);
  }

  // Fallback: Return stub data (remove in production)
  console.warn("No OCR service configured, returning stub data");
  return {
    idNumber: "1199780012345678",
    fullName: "UWASE Marie",
    dateOfBirth: "1997-01-01",
    confidence: 0.95,
    fields: {},
    raw: {},
  };
}

async function processWithGoogleVision(imageUrl: string, idType: string) {
  // TODO: Implement Google Vision API call
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );

  const data = await response.json();
  const text = data.responses[0]?.fullTextAnnotation?.text || "";

  // Parse based on ID type
  return parseIdDocument(text, idType);
}

function parseIdDocument(text: string, idType: string) {
  // Rwanda National ID format: 16 digits
  const nidMatch = text.match(/\b\d{16}\b/);

  // Name (usually in caps)
  const nameMatch = text.match(/([A-Z]{2,}\s+[A-Z]{2,})/);

  // Date (DD/MM/YYYY or similar)
  const dateMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);

  return {
    idNumber: nidMatch?.[0] || "",
    fullName: nameMatch?.[0] || "",
    dateOfBirth: dateMatch?.[0]?.replace(/[\/\-]/g, "-") || "",
    confidence: 0.85,
    fields: { nidMatch, nameMatch, dateMatch },
    raw: { text },
  };
}
```

**Migration Steps**:

1. Create `id-documents` bucket in Supabase Storage
2. Configure RLS policies (users can only upload their own docs)
3. Sign up for OCR service (Google Vision recommended)
4. Add API keys to environment
5. Test upload flow end-to-end
6. Add error handling and validation
7. Remove stub data check

**Completion Criteria**:

- [ ] Files upload to Supabase Storage
- [ ] OCR extracts ID number and name
- [ ] Member profile updated with OCR data
- [ ] Errors handled gracefully
- [ ] RLS policies enforced

---

### Gap 3: Admin App Has Duplicate Auth Stacks

**Current State**:

- Two auth implementations exist:
  - Legacy: `/api/mfa/*`
  - New: `/api/authx/*`
- Inconsistent behavior between routes
- Security risk from untested code paths

**Impact**:

- Confusing for developers
- Potential security vulnerabilities
- Hard to maintain

**Implementation Plan**:

**Step 1: Audit Both Implementations**

```bash
# List all auth-related files
find apps/admin -name "*mfa*" -o -name "*authx*" | grep -E "\.(ts|tsx)$"
```

**Step 2: Choose Primary Implementation**

Based on code review:

- If AuthX is more complete and tested → Migrate to AuthX
- If legacy MFA is more stable → Remove AuthX

Recommendation: **Keep legacy MFA, remove AuthX** (appears more stable based on
architecture review).

**Step 3: Remove Duplicate Code**

```bash
# Remove AuthX routes
rm -rf apps/admin/app/api/authx

# Remove AuthX lib files
rm -rf apps/admin/lib/authx

# Update imports
# Find files importing from authx
grep -r "from.*authx" apps/admin/
# Replace with legacy mfa imports
```

**Step 4: Standardize Auth Flow**

```typescript
// apps/admin/lib/auth/index.ts
// Single source of truth for all auth operations

export async function initiateLogin(email: string) {
  // Use Supabase Auth
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password, // Or send magic link
  });

  if (!error) {
    // Redirect to MFA page
    return { redirectTo: "/mfa" };
  }
}

export async function verifyMfa(factor: MfaFactor, code: string) {
  // Unified MFA verification
  switch (factor) {
    case "totp":
      return await verifyTotp(code);
    case "passkey":
      return await verifyPasskey(code);
    case "email":
      return await verifyEmailOtp(code);
    case "backup":
      return await verifyBackupCode(code);
  }
}
```

**Completion Criteria**:

- [ ] Only one auth implementation exists
- [ ] All auth flows use same code paths
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Security audit performed

---

## High Priority Gaps

### Gap 4: Mobile Readiness Not Verified

**Current State**:

- Client app designed as PWA
- Not tested on actual mobile devices
- TWA configuration exists but not verified
- Unknown if install prompts work

**Impact**:

- May not work properly on mobile
- Poor user experience
- Can't claim "mobile-ready"

**Implementation Plan**:

**Step 1: Create Mobile Testing Checklist**

```markdown
## Mobile Testing Checklist

### Android Testing

- [ ] Install PWA from Chrome
- [ ] Verify app icon on home screen
- [ ] Check splash screen displays
- [ ] Test offline functionality
- [ ] Verify service worker updates
- [ ] Test file upload (camera)
- [ ] Check notifications
- [ ] Test in mobile Chrome
- [ ] Test in Samsung Internet
- [ ] Verify TWA launches correctly

### iOS Testing

- [ ] Install PWA from Safari
- [ ] Verify app icon on home screen
- [ ] Check splash screen displays
- [ ] Test offline functionality
- [ ] Verify service worker updates
- [ ] Test file upload (camera/photos)
- [ ] Check notifications (limited on iOS)
- [ ] Test in mobile Safari
- [ ] Test in Chrome iOS
- [ ] Verify standalone mode

### Cross-Device

- [ ] Test on various screen sizes
- [ ] Verify responsive breakpoints
- [ ] Check touch targets (min 48px)
- [ ] Test gesture navigation
- [ ] Verify keyboard behavior
- [ ] Check form autofill
- [ ] Test copy/paste
```

**Step 2: Fix PWA Manifest**

```json
// apps/client/public/manifest.json
{
  "name": "SACCO+ Member App",
  "short_name": "SACCO+",
  "description": "SACCO+ member services",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0066cc",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "My Groups",
      "url": "/groups",
      "icons": [{ "src": "/icons/groups-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Make Payment",
      "url": "/pay-sheet",
      "icons": [{ "src": "/icons/pay-96x96.png", "sizes": "96x96" }]
    }
  ]
}
```

**Step 3: Test TWA (Android)**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity
    android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
    android:label="@string/app_name">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    <meta-data
        android:name="android.support.customtabs.trusted.DEFAULT_URL"
        android:value="https://app.your-domain.com" />
    <meta-data
        android:name="android.support.customtabs.trusted.SPLASH_SCREEN_DRAWABLE"
        android:resource="@drawable/splash" />
</activity>
```

**Completion Criteria**:

- [ ] Tested on Android device (Chrome)
- [ ] Tested on iOS device (Safari)
- [ ] All checklist items pass
- [ ] Screenshots taken and documented
- [ ] Issues logged and fixed
- [ ] TWA package created (optional)

---

### Gap 5: Missing Cross-App Monitoring

**Current State**:

- Admin app has some monitoring
- Client app has limited monitoring
- Platform API has no monitoring
- No unified dashboard

**Impact**:

- Can't see system health at a glance
- Hard to debug cross-app issues
- No alerting for failures

**Implementation Plan**:

**Step 1: Add Health Check Endpoints**

```typescript
// apps/admin/app/api/health/route.ts
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    commit: process.env.GIT_COMMIT_SHA,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabase(),
    supabase: await checkSupabase(),
  };

  const healthy = checks.database && checks.supabase;

  return Response.json(checks, {
    status: healthy ? 200 : 503,
  });
}

async function checkDatabase() {
  try {
    const { error } = await supabase.from("saccos").select("count").limit(1);
    return !error;
  } catch {
    return false;
  }
}
```

**Step 2: Create Monitoring Dashboard**

```typescript
// apps/admin/app/(main)/admin/(panel)/monitoring/page.tsx
export default async function MonitoringPage() {
  // Fetch health from all apps
  const [adminHealth, clientHealth, workerHealth] = await Promise.all([
    fetch('http://localhost:3100/api/health').then(r => r.json()),
    fetch('http://localhost:3001/api/health').then(r => r.json()),
    fetchWorkerHealth(), // Query worker_health table
  ]);

  return (
    <div>
      <h1>System Health Dashboard</h1>

      <Card>
        <h2>Admin App</h2>
        <StatusBadge status={adminHealth.database ? 'healthy' : 'down'} />
        <dl>
          <dt>Uptime</dt>
          <dd>{formatUptime(adminHealth.uptime)}</dd>
          <dt>Memory</dt>
          <dd>{formatBytes(adminHealth.memory.heapUsed)}</dd>
        </dl>
      </Card>

      <Card>
        <h2>Client App</h2>
        <StatusBadge status={clientHealth.database ? 'healthy' : 'down'} />
        {/* ... */}
      </Card>

      <Card>
        <h2>Platform API Workers</h2>
        <WorkerHealthTable data={workerHealth} />
      </Card>
    </div>
  );
}
```

**Step 3: Add Alerting**

```typescript
// apps/platform-api/src/lib/alerting.ts
export async function sendAlert({ severity, message, details }) {
  console.error(`[ALERT][${severity}] ${message}`, details);

  // Option 1: Email via Supabase Edge Function
  await supabase.functions.invoke("send-alert-email", {
    body: { severity, message, details },
  });

  // Option 2: Webhook (Slack, PagerDuty, etc.)
  if (process.env.ALERT_WEBHOOK_URL) {
    await fetch(process.env.ALERT_WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify({ severity, message, details }),
    });
  }

  // Option 3: WhatsApp for critical alerts
  if (severity === "critical" && process.env.META_WHATSAPP_ACCESS_TOKEN) {
    await sendWhatsApp({
      to: process.env.ALERT_PHONE_NUMBER,
      body: `[CRITICAL] ${message}`,
    });
  }
}
```

**Completion Criteria**:

- [ ] All apps have `/api/health` endpoint
- [ ] Monitoring dashboard created
- [ ] Worker health tracked in database
- [ ] Alerts configured for failures
- [ ] Documentation updated

---

## Medium Priority Gaps

### Gap 6: Deployment Documentation Incomplete

**Status**: ✅ **RESOLVED** - Created DEPLOYMENT_GUIDE.md with comprehensive
instructions

### Gap 7: Client App Feature Parity

**Current State**:

- Missing SACCO search and linking
- No join request workflow UI
- No invite acceptance flow
- Notifications UI not implemented

**Impact**:

- Incomplete member experience
- Can't fulfill all use cases

**Implementation Plan**: See Sprint 2-4 in member-app-implementation-guide.md

**Estimated Effort**: 3-4 weeks

### Gap 8: Configuration Management

**Current State**:

- Each app has separate `.env` files
- Overlapping variables
- Risk of configuration drift

**Implementation Plan**:

Create `packages/config/src/index.ts`:

```typescript
import { z } from "zod";

const sharedConfigSchema = z.object({
  supabaseUrl: z.string().url(),
  supabaseAnonKey: z.string(),
  supabaseServiceRoleKey: z.string().optional(),
  nodeEnv: z.enum(["development", "production", "test"]),
  appEnv: z.string().default("development"),
});

const adminConfigSchema = sharedConfigSchema.extend({
  mfaRpId: z.string(),
  mfaOrigin: z.string().url(),
  mfaSessionSecret: z.string(),
});

const clientConfigSchema = sharedConfigSchema.extend({
  vapidPublicKey: z.string(),
  vapidPrivateKey: z.string().optional(),
});

export function getConfig(app: "admin" | "client" | "platform-api") {
  const shared = {
    supabaseUrl:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV,
    appEnv: process.env.APP_ENV,
  };

  switch (app) {
    case "admin":
      return adminConfigSchema.parse({
        ...shared,
        mfaRpId: process.env.MFA_RP_ID,
        mfaOrigin: process.env.MFA_ORIGIN,
        mfaSessionSecret: process.env.MFA_SESSION_SECRET,
      });
    case "client":
      return clientConfigSchema.parse({
        ...shared,
        vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
      });
    default:
      return sharedConfigSchema.parse(shared);
  }
}
```

---

## Summary of Gaps

| Gap                   | Priority | Status         | Effort    | Impact |
| --------------------- | -------- | -------------- | --------- | ------ |
| Platform API Workers  | CRITICAL | 🔴 Not Started | 1-2 weeks | HIGH   |
| Client OCR Upload     | CRITICAL | 🔴 Not Started | 1 week    | HIGH   |
| Duplicate Auth Stacks | CRITICAL | 🔴 Not Started | 3-5 days  | MEDIUM |
| Mobile Testing        | HIGH     | 🔴 Not Started | 1 week    | HIGH   |
| Cross-App Monitoring  | HIGH     | 🔴 Not Started | 1 week    | MEDIUM |
| Deployment Docs       | MEDIUM   | ✅ Complete    | N/A       | LOW    |
| Client Feature Parity | MEDIUM   | 🟡 Partial     | 3-4 weeks | MEDIUM |
| Config Management     | MEDIUM   | 🔴 Not Started | 3-5 days  | LOW    |

## Recommended Prioritization

**Week 1-2**: Critical Gaps

1. Implement Platform API workers (Gap 1)
2. Fix Client OCR upload (Gap 2)
3. Consolidate auth stacks (Gap 3)

**Week 3-4**: High Priority 4. Mobile testing and fixes (Gap 4) 5. Add
monitoring dashboard (Gap 5)

**Week 5+**: Medium Priority 6. Complete client app features (Gap 7) 7.
Centralize configuration (Gap 8)

## Success Metrics

After addressing all gaps:

- ✅ All three apps fully functional
- ✅ Workers running and monitored
- ✅ Mobile app tested and verified
- ✅ Auth consolidated and secure
- ✅ Monitoring dashboard operational
- ✅ Full deployment documentation
- ✅ Ready for production launch

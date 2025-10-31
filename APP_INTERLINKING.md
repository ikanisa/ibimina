# SACCO+ App Interlinking and Communication

## Overview

This document describes how the three applications in the Ibimina/SACCO+ system
communicate and share data.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET / PUBLIC ACCESS                        │
└───────────────────────┬─────────────────────────┬──────────────────────────┘
                        │                         │
                        │                         │
        ┌───────────────▼────────┐    ┌──────────▼──────────┐
        │   Admin/Staff App      │    │   Client App        │
        │   (Next.js 16)         │    │   (Next.js 15)      │
        │   Port: 3000           │    │   Port: 3001        │
        │   Domain: admin.*.com  │    │   Domain: app.*.com │
        └───────────┬────────────┘    └──────────┬──────────┘
                    │                            │
                    │  Supabase Auth            │  Supabase Auth
                    │  (JWT + MFA)              │  (JWT only)
                    │                            │
                    │  Service Role Key         │  Anon Key + RLS
                    │  (Elevated)               │  (Row-Level Security)
                    │                            │
        ┌───────────▼────────────────────────────▼──────────┐
        │                                                    │
        │              Supabase Backend                      │
        │  ┌──────────────────────────────────────────┐    │
        │  │  PostgreSQL Database                     │    │
        │  │  - auth.users                            │    │
        │  │  - public.* (legacy tables)              │    │
        │  │  - app.* (new schema)                    │    │
        │  │  - Row-Level Security (RLS) policies     │    │
        │  └──────────────────────────────────────────┘    │
        │  ┌──────────────────────────────────────────┐    │
        │  │  Supabase Auth                           │    │
        │  │  - JWT token issuance                    │    │
        │  │  - Session management                    │    │
        │  └──────────────────────────────────────────┘    │
        │  ┌──────────────────────────────────────────┐    │
        │  │  Supabase Storage                        │    │
        │  │  - Member ID documents                   │    │
        │  │  - Reports / exports                     │    │
        │  └──────────────────────────────────────────┘    │
        │  ┌──────────────────────────────────────────┐    │
        │  │  Edge Functions (Deno runtime)           │    │
        │  │  - sms-inbox (HMAC protected)            │    │
        │  │  - ingest-sms                            │    │
        │  │  - parse-sms                             │    │
        │  │  - payments-apply                        │    │
        │  │  - scheduled-reconciliation              │    │
        │  │  - metrics-exporter                      │    │
        │  │  - mfa-email                             │    │
        │  └──────────────────────────────────────────┘    │
        │  ┌──────────────────────────────────────────┐    │
        │  │  Real-time Subscriptions                 │    │
        │  │  - WebSocket connections                 │    │
        │  │  - Database change notifications         │    │
        │  └──────────────────────────────────────────┘    │
        └───────────────────┬──────────────────────────────┘
                            │
                            │  Service Role Key
                            │  (Background access)
                            │
        ┌───────────────────▼──────────────┐
        │   Platform API Workers           │
        │   (Node.js background jobs)      │
        │   - momo-poller                  │
        │   - gsm-heartbeat                │
        └───────────────────┬──────────────┘
                            │
        ┌───────────────────▼──────────────┐
        │   External Services              │
        │   - Mobile Money API             │
        │   - GSM Modem                    │
        │   - Twilio SMS                   │
        └──────────────────────────────────┘
```

## Communication Patterns

### 1. Admin App ↔ Supabase

**Authentication Flow**:

```typescript
// apps/admin/lib/supabase/server.ts
// Uses @supabase/ssr for server-side auth
const supabase = createSupabaseServerClient();
const {
  data: { user },
} = await supabase.auth.getUser();
```

**Data Access**:

- Uses **service role key** for administrative operations
- Bypasses RLS for elevated queries
- Enforces auth checks in application code

**Example Query**:

```typescript
// Fetch all payments for a SACCO (admin can see all)
const adminClient = createSupabaseAdminClient();
const { data: payments } = await adminClient
  .from("payments")
  .select("*")
  .eq("sacco_id", saccoId);
```

**Real-time Subscriptions**:

```typescript
// Subscribe to payment updates
const channel = supabase
  .channel("payments")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "payments" },
    (payload) => {
      /* handle new payment */
    }
  )
  .subscribe();
```

---

### 2. Client App ↔ Supabase

**Authentication Flow**:

```typescript
// apps/client/lib/supabase/client.tsx
// Uses anon key with RLS enforcement
const supabase = createBrowserClient();
const {
  data: { session },
} = await supabase.auth.getSession();
```

**Data Access**:

- Uses **anon key** with Row-Level Security (RLS)
- Can only access data the user owns
- RLS policies enforce access control

**Example Query**:

```typescript
// Fetch user's groups (RLS enforces user_id filter)
const { data: groups } = await supabase.from("user_groups").select(`
    *,
    ikimina (*)
  `);
// RLS policy: WHERE user_id = auth.uid()
```

**Onboarding API**:

```typescript
// apps/client/app/api/onboard/route.ts
export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Insert member profile
  const { data, error } = await supabase.from("members_app_profiles").insert({
    user_id: user.id,
    whatsapp_msisdn: body.whatsapp_msisdn,
    momo_msisdn: body.momo_msisdn,
  });
}
```

---

### 3. Platform API ↔ Supabase

**Worker Access**:

```typescript
// apps/platform-api/src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
```

**Mobile Money Poller**:

```typescript
// apps/platform-api/src/workers/momo-poller.ts
export async function runMomoPoller() {
  // Poll MoMo API for new transactions
  const transactions = await fetchMomoTransactions();

  // Insert into Supabase
  for (const txn of transactions) {
    await supabase.from("payments").upsert(
      {
        txn_id: txn.id,
        amount: txn.amount,
        msisdn: txn.phone,
        sacco_id: await resolveSacco(txn.reference),
        status: "pending",
      },
      { onConflict: "txn_id" }
    );
  }

  // Trigger reconciliation edge function
  await supabase.functions.invoke("scheduled-reconciliation");
}
```

**GSM Heartbeat**:

```typescript
// apps/platform-api/src/workers/gsm-heartbeat.ts
export async function runGsmHeartbeat() {
  // Check GSM modem health
  const modemStatus = await checkModemStatus();

  // Log to Supabase
  await supabase.from("worker_health").upsert({
    worker_name: "gsm-heartbeat",
    status: modemStatus.connected ? "healthy" : "degraded",
    last_heartbeat: new Date().toISOString(),
    metadata: modemStatus,
  });
}
```

---

### 4. Edge Functions ↔ Database

**HMAC Authentication**:

```typescript
// supabase/functions/sms-inbox/index.ts
// Validates HMAC signature on incoming requests
const signature = req.headers.get("x-signature");
const timestamp = req.headers.get("x-timestamp");
const body = await req.text();

const expectedSig = hmacSha256(
  `${timestamp}${context}${body}`,
  HMAC_SHARED_SECRET
);

if (signature !== expectedSig) {
  return new Response("Unauthorized", { status: 401 });
}
```

**Database Operations**:

```typescript
// Parse SMS and insert payment
const parsed = parseSmsText(body);

await supabase.from("payments").insert({
  sacco_id: parsed.saccoId,
  amount: parsed.amount,
  msisdn: parsed.phone,
  txn_id: parsed.txnId,
  reference: parsed.reference,
  source: "sms",
});
```

---

## Data Flow Examples

### Example 1: Member Onboarding

```
1. Member visits client app (app.your-domain.com/welcome)
   ↓
2. Clicks "Get Started" → /onboard
   ↓
3. Fills form with WhatsApp & MoMo numbers
   ↓
4. Client app POSTs to /api/onboard
   ↓
5. API route:
   - Validates input (Zod schema)
   - Gets authenticated user from Supabase session
   - Inserts into members_app_profiles table
   - Returns success
   ↓
6. Client redirects to dashboard
   ↓
7. Dashboard fetches user's groups (via RLS)
```

**Code Flow**:

```typescript
// Client component
const handleSubmit = async (data) => {
  const response = await fetch("/api/onboard", {
    method: "POST",
    body: JSON.stringify(data),
  });
  router.push("/");
};

// API route
export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const validated = onboardSchema.parse(body);

  const { error } = await supabase
    .from("members_app_profiles")
    .insert({ user_id: user.id, ...validated });

  return Response.json({ success: !error });
}
```

### Example 2: Payment Ingestion

```
1. SMS Gateway receives payment SMS
   ↓
2. Gateway POSTs to Edge Function (sms-inbox)
   - With HMAC signature for authentication
   ↓
3. Edge Function:
   - Validates HMAC
   - Parses SMS text (regex/AI)
   - Inserts into sms_inbox table
   - Calls payments-apply function
   ↓
4. payments-apply function:
   - Resolves SACCO from reference
   - Inserts into payments table
   - Updates member balance
   - Creates audit log
   ↓
5. Database triggers:
   - RLS policies enforce access
   - Notify subscribers via real-time
   ↓
6. Admin app receives real-time notification
   - Updates payment list
   - Shows toast notification
   ↓
7. Client app (if member is online):
   - Receives real-time notification
   - Updates transaction history
```

**Code Flow**:

```typescript
// Edge function: sms-inbox
const parsed = parseSmsText(await req.text());

await supabase.from("sms_inbox").insert({
  raw_text: req.text(),
  parsed_data: parsed,
});

await supabase.functions.invoke("payments-apply", {
  body: { parsed },
});

// Edge function: payments-apply
const { saccoId, amount, msisdn, txnId, reference } = req.body;

await supabase.from("payments").insert({
  sacco_id: saccoId,
  amount,
  msisdn,
  txn_id: txnId,
  reference,
  status: "completed",
});

// Admin app: Real-time subscription
supabase
  .channel("payments")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "payments" },
    (payload) => {
      toast.success(`New payment: ${payload.new.amount}`);
      refetchPayments();
    }
  )
  .subscribe();
```

### Example 3: Staff Reports

```
1. Staff opens admin app (/reports)
   ↓
2. Selects date range and SACCO
   ↓
3. Admin app queries Supabase:
   - Uses service role key
   - Fetches aggregated payment data
   - Bypasses RLS (staff has permission)
   ↓
4. Server component processes data
   ↓
5. Generates report (PDF/CSV)
   ↓
6. Optionally uploads to Supabase Storage
   ↓
7. Returns download link to user
```

**Code Flow**:

```typescript
// apps/admin/app/(main)/reports/page.tsx
export default async function ReportsPage({ searchParams }) {
  const adminClient = createSupabaseAdminClient();

  const { data: payments } = await adminClient
    .from('payments')
    .select('*')
    .gte('created_at', searchParams.startDate)
    .lte('created_at', searchParams.endDate)
    .eq('sacco_id', searchParams.saccoId);

  const report = generateReport(payments);

  return <ReportViewer data={report} />;
}
```

---

## Shared Resources

### 1. Supabase Database Tables

**User Management**:

- `auth.users` - Supabase Auth users (both staff and members)
- `public.user_profiles` - Staff profiles
- `public.members_app_profiles` - Member profiles

**SACCO Data**:

- `public.saccos` - SACCO organizations
- `public.sacco_staff` - Staff-to-SACCO assignments
- `public.user_saccos` - Member-to-SACCO links

**Groups**:

- `public.ikimina` - Group savings groups
- `public.ikimina_members` - Group membership
- `public.join_requests` - Pending join requests

**Payments**:

- `public.payments` - All payment records
- `public.sms_inbox` - Incoming SMS messages
- `public.reconciliation` - Payment reconciliation data

**System**:

- `public.audit_logs` - Audit trail
- `public.worker_health` - Worker status monitoring
- `public.notifications` - Push notification queue

### 2. Shared Packages

**@ibimina/config**:

```typescript
// Used by all apps
import { getConfig } from "@ibimina/config";
const config = getConfig();
console.log(config.supabaseUrl);
```

**@ibimina/ui**:

```typescript
// Shared UI components
import { Button, Card, Modal } from "@ibimina/ui";
```

**@ibimina/lib**:

```typescript
// Shared utilities
import { createSecurityHeaders } from "@ibimina/lib";
```

### 3. Environment Variables

**Shared across all apps** (set in root `.env`):

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
KMS_DATA_KEY_BASE64
HMAC_SHARED_SECRET
```

**App-specific** (set in app `.env.local`):

```bash
# Admin only
MFA_SESSION_SECRET
MFA_RP_ID

# Client only
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY

# Platform API only
MOMO_API_KEY
GSM_MODEM_PORT
```

---

## Security Boundaries

### Admin App

- **Trust Level**: High (staff only)
- **Access**: Service role key (bypasses RLS)
- **Auth**: Required (email + password + MFA)
- **Network**: Public internet with HTTPS
- **Data Scope**: All SACCOs assigned to staff

### Client App

- **Trust Level**: Medium (public members)
- **Access**: Anon key with RLS enforcement
- **Auth**: Required (email + password only)
- **Network**: Public internet with HTTPS
- **Data Scope**: Only user's own data (RLS)

### Platform API

- **Trust Level**: High (system service)
- **Access**: Service role key (bypasses RLS)
- **Auth**: Not applicable (background jobs)
- **Network**: Internal network (recommended)
- **Data Scope**: Full database access

### Edge Functions

- **Trust Level**: High (internal services)
- **Access**: Service role key (bypasses RLS)
- **Auth**: HMAC signature validation
- **Network**: Supabase internal (HTTPS)
- **Data Scope**: Full database access

---

## Cross-App Scenarios

### Scenario 1: Admin Approves Join Request

```
1. Member submits join request (Client app)
   → Inserts into join_requests table (status: 'pending')

2. Admin sees pending requests (Admin app)
   → Queries join_requests with service role key

3. Admin approves request
   → Updates join_requests.status = 'approved'
   → Inserts into ikimina_members table

4. Member sees approval (Client app)
   → Real-time subscription notifies client
   → Refetches groups list
   → Shows success notification
```

### Scenario 2: Worker Detects Payment

```
1. MoMo API has new transaction
   → Platform API worker polls API

2. Worker inserts payment
   → Uses service role key to insert into payments table

3. Edge function reconciles payment
   → Triggered by database trigger or scheduled job
   → Matches payment to member + group
   → Updates balances

4. Admin sees payment (Admin app)
   → Real-time subscription notifies
   → Payment appears in list

5. Member sees payment (Client app)
   → Real-time subscription notifies
   → Balance updated
```

### Scenario 3: Member Uploads ID Document

```
1. Member uploads ID in client app
   → POST /api/ocr/upload

2. API route uploads to Supabase Storage
   → Uses server-side Supabase client
   → Stores in 'id-documents' bucket
   → RLS policy: user can only upload their own docs

3. API calls OCR service (Google Vision)
   → Extracts name, ID number, DOB

4. API updates member profile
   → Stores OCR results in members_app_profiles.ocr_json

5. Admin can review OCR results
   → Queries members_app_profiles with service role
   → Can verify and approve identity
```

---

## Monitoring Cross-App Health

### Health Check Dashboard

Monitor all three apps from single dashboard:

```typescript
// Pseudo-code for monitoring dashboard
const healthChecks = await Promise.all([
  fetch("https://admin.your-domain.com/api/health"),
  fetch("https://app.your-domain.com/api/health"),
  checkWorkerHealth(), // Query worker_health table
]);

const allHealthy = healthChecks.every((h) => h.ok);
```

### Distributed Tracing (Future)

Implement OpenTelemetry for cross-app tracing:

```typescript
// Trace a payment from ingestion to display
const span = tracer.startSpan("process-payment");
span.setAttribute("payment_id", paymentId);

// Worker creates payment
await supabase.from("payments").insert(payment);
span.addEvent("payment_inserted");

// Edge function reconciles
await reconcilePayment(paymentId);
span.addEvent("payment_reconciled");

// Admin app displays
// (trace context passed via headers)
span.end();
```

---

## Best Practices

### 1. Use Appropriate Client

- **Admin operations**: Use service role key
- **Client operations**: Use anon key with RLS
- **Workers**: Use service role key

### 2. Respect Security Boundaries

- Don't expose service role key to frontend
- Enforce auth checks in API routes
- Trust RLS policies for client app

### 3. Handle Real-time Gracefully

```typescript
// Unsubscribe when component unmounts
useEffect(() => {
  const channel = supabase.channel("my-channel").subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### 4. Use Edge Functions for Heavy Lifting

- Don't do expensive operations in API routes
- Offload to Edge Functions or Platform API workers
- Keep API routes lightweight

### 5. Monitor Cross-App Dependencies

- Add health checks for all dependencies
- Alert on failures
- Have fallback strategies

---

## Migration Considerations

If moving from current architecture to a different model:

### Option 1: Add API Gateway

```
Admin App ──┐
            ├──> API Gateway ──> Supabase
Client App ─┘

Benefits:
- Centralized auth/rate limiting
- Better monitoring
- Easier to add caching

Cons:
- Added complexity
- More infrastructure
```

### Option 2: Microservices

```
Admin App ──> Auth Service ──┐
                              ├──> Database
Client App ─> Member Service ─┘

Benefits:
- Better separation of concerns
- Independent scaling
- Team autonomy

Cons:
- Much more complex
- Service discovery needed
- Distributed transactions
```

**Recommendation**: Stick with current Supabase-centric model unless scale
demands otherwise.

---

## Summary

The three apps communicate primarily through Supabase:

1. **Admin App**: Uses service role key for elevated access
2. **Client App**: Uses anon key with RLS for security
3. **Platform API**: Uses service role key for background jobs

This architecture:

- ✅ Separates concerns (staff vs member vs system)
- ✅ Enforces security (RLS, MFA, HMAC)
- ✅ Enables real-time updates
- ✅ Scales horizontally
- ⚠️ Has single point of failure (Supabase)
- ⚠️ Requires careful RLS policy management

For current scale (< 1000 concurrent users), this architecture is appropriate
and maintainable.

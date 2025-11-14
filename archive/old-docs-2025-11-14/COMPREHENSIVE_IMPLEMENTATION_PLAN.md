# Comprehensive Implementation Plan

## Five-System Architecture for Ibimina Platform

**Date:** November 3, 2025  
**Status:** IN PROGRESS  
**Objective:** Implement all five critical systems comprehensively

---

## 🎯 SYSTEMS TO IMPLEMENT

### 1. Staff/Admin PWA (Web Application)

- **Tech:** React 18 + TypeScript + Vite + Material UI v5
- **Features:** Login, Dashboard, Users, Orders, Tickets, Settings
- **PWA:** Offline, Service Worker, Push Notifications, Install Prompt
- **Deployment:** Docker + Nginx (HTTP/HTTPS)
- **Location:** `apps/staff-admin-pwa/`

### 2. SMS Reconciliation System

- **Tech:** OpenAI API + Supabase Edge Functions
- **Features:** Parse mobile money SMS, match payments, auto-allocate
- **Integration:** Android SMS receiver + Background processing
- **Location:** `packages/sms-parser/` + `apps/staff-mobile-android/`

### 3. TapMoMo NFC Payment

- **Tech:** Android HCE + CoreNFC (iOS) + USSD
- **Features:** NFC tap-to-pay, HMAC signing, replay protection
- **Integration:** Staff mobile app (Android) + Client app (iOS reader)
- **Location:** `feature-tapmomo/` (integrated into apps)

### 4. Client Mobile App (React Native)

- **Tech:** React Native + TypeScript + Expo
- **Platforms:** iOS + Android
- **Features:** SACCO accounts, savings groups, transactions, biometrics
- **Location:** `apps/client-mobile/`

### 5. Web-to-Mobile 2FA Authentication

- **Tech:** QR codes + Challenge-Response + Biometrics
- **Flow:** Web PWA generates QR → Mobile scans → Biometric confirm → Login
- **Integration:** Staff PWA + Staff Mobile Android
- **Location:** Integrated into both apps

---

## 📋 IMPLEMENTATION SEQUENCE

### Phase 1: Staff PWA (PRIORITY 1)

**Duration:** 2-3 hours with AI assistance  
**Status:** STARTING NOW

#### Files to Create:

```
apps/staff-admin-pwa/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   ├── Orders.tsx
│   │   ├── Tickets.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── Layout/AppShell.tsx
│   │   ├── Layout/TopBar.tsx
│   │   ├── Layout/NavDrawer.tsx
│   │   ├── DataTable/DataTable.tsx
│   │   ├── StatCard/StatCard.tsx
│   │   └── Forms/FormFields.tsx
│   ├── lib/
│   │   ├── api/axiosClient.ts
│   │   ├── api/schemas.ts
│   │   ├── auth/authStore.ts
│   │   ├── pwa/registerSW.ts
│   │   └── theme/theme.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useUsers.ts
│   │   └── useOffline.ts
│   └── services/
│       ├── userService.ts
│       ├── orderService.ts
│       └── ticketService.ts
├── public/
│   ├── manifest.json
│   ├── offline.html
│   └── assets/icons/
├── deploy/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx/
│       ├── nginx.conf
│       └── nginx-ssl.conf
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.development
├── .env.production
└── README.md
```

### Phase 2: SMS Reconciliation

**Duration:** 2 hours  
**Dependencies:** OpenAI API key, Supabase setup

#### Components:

1. **SMS Parser Package** (`packages/sms-parser/`)
2. **Android SMS Receiver** (in staff mobile)
3. **Supabase Edge Function** (reconciliation logic)
4. **Database Schema** (sms_transactions table)

#### Files to Create:

```
packages/sms-parser/
├── src/
│   ├── index.ts
│   ├── parsers/
│   │   ├── mtnParser.ts
│   │   ├── airtelParser.ts
│   │   └── openaiParser.ts
│   ├── matchers/
│   │   └── paymentMatcher.ts
│   └── types/
│       └── sms.types.ts
├── tests/
│   └── sms.test.ts
└── package.json

apps/staff-mobile-android/src/main/java/rw/ibimina/staff/
├── sms/
│   ├── SmsReceiver.kt
│   ├── SmsParser.kt
│   └── ReconciliationService.kt
└── data/
    └── SmsTransaction.kt

supabase/functions/reconcile-sms/
├── index.ts
└── matcher.ts

supabase/migrations/
└── 20251103_sms_transactions.sql
```

### Phase 3: Web-to-Mobile 2FA

**Duration:** 1.5 hours  
**Integration:** Staff PWA + Staff Mobile

#### Components:

1. **Web: QR Code Generation**
2. **Mobile: QR Scanner**
3. **Challenge-Response Protocol**
4. **Biometric Confirmation**

#### Files to Create:

```
apps/staff-admin-pwa/src/
├── components/Auth/QRLogin.tsx
└── lib/auth/qrAuth.ts

apps/staff-mobile-android/src/main/java/rw/ibimina/staff/
├── auth/
│   ├── QRScanner.kt
│   ├── BiometricAuth.kt
│   └── ChallengeHandler.kt
└── ui/
    └── auth/QRScanScreen.kt

packages/types/src/
└── auth.types.ts (shared challenge types)
```

### Phase 4: TapMoMo NFC

**Duration:** 2-3 hours  
**Complexity:** High (NFC + USSD + Security)

#### Components (as per spec):

1. **Android HCE Payee**
2. **Android/iOS NFC Reader**
3. **USSD Integration**
4. **HMAC Security**
5. **Supabase Reconciliation**

#### Files (from spec):

```
apps/staff-mobile-android/src/main/java/rw/ibimina/staff/tapmomo/
├── model/Payload.kt
├── crypto/
│   ├── Hmac.kt
│   └── Canonical.kt
├── data/
│   ├── SeenNonce.kt
│   └── TapMoMoDb.kt
├── nfc/
│   ├── PayeeCardService.kt
│   └── Reader.kt
├── core/Ussd.kt
├── verify/Verifier.kt
└── ui/TapMoMoScreens.kt

apps/client-mobile/ios/TapMoMo/
├── TapMoMoReader.swift
├── MerchantKeyProvider.swift
└── CryptoHelpers.swift

supabase/functions/tapmomo-reconcile/
└── index.ts

supabase/migrations/
└── 20251103_tapmomo.sql
```

### Phase 5: Client Mobile App

**Duration:** 3-4 hours  
**Tech:** React Native + Expo

#### Features:

- SACCO account management
- Savings groups (Ikimina)
- Mobile money integration
- Transaction history
- Biometric login
- Push notifications
- Offline sync

#### Files:

```
apps/client-mobile/
├── src/
│   ├── App.tsx
│   ├── navigation/
│   ├── screens/
│   │   ├── Home.tsx
│   │   ├── Account.tsx
│   │   ├── Groups.tsx
│   │   ├── Transactions.tsx
│   │   └── Profile.tsx
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── store/
├── ios/
├── android/
├── app.json
├── package.json
└── README.md
```

---

## 🔧 IMPLEMENTATION DETAILS

### Staff PWA - Complete Feature List

#### Authentication

- Email/password login
- JWT access token (in-memory)
- Refresh token (httpOnly cookie)
- Token refresh interceptor
- Logout with cleanup

#### Dashboard

- KPI cards:
  - Active users count
  - Open tickets count
  - Pending orders count
  - Monthly revenue
- Charts (chart.js):
  - User growth line chart
  - Order status pie chart
  - Ticket resolution bar chart
- Quick actions:
  - Create user
  - Create order
  - Create ticket

#### Users Management

- DataTable with:
  - Search/filter/sort
  - Pagination (server-side)
  - Column visibility toggle
- Actions:
  - View details
  - Edit user
  - Activate/Deactivate
  - Delete (with confirmation)
- Create/Edit Form:
  - Name, email, role, status
  - Form validation (Zod)
  - Optimistic updates
  - Error handling with rollback

#### Orders Management

- List view with filters:
  - Status (Pending/Approved/Rejected/Shipped)
  - Date range
  - Customer search
- Detail view:
  - Order info
  - Customer details
  - Line items
  - Status history
- Actions:
  - Approve order
  - Reject order
  - Mark as shipped
  - Print invoice

#### Tickets Management

- Kanban board by status:
  - Open
  - Pending
  - Closed
- Detail view:
  - Ticket info
  - Description
  - Comment thread
  - Assignee
  - Status history
- Actions:
  - Change status
  - Assign to staff
  - Add comment
  - Close ticket

#### Settings

- Profile:
  - Name, email
  - Change password
  - Avatar upload
- Appearance:
  - Theme (light/dark/system)
  - Language (English default, i18n ready)
- Notifications:
  - Push notification toggle
  - Email notification preferences
- Environment (dev only):
  - API URL selector (dev/staging/prod)
- About:
  - App version
  - Build info
  - Privacy policy
  - Terms of service

#### PWA Features

- Service Worker:
  - App shell precaching
  - API GET: NetworkFirst with cache fallback
  - Static assets: StaleWhileRevalidate
  - Images: CacheFirst with expiration
  - Offline page fallback
- Background Sync:
  - Queue API writes when offline
  - Replay on reconnect
  - Show sync status toast
- Push Notifications:
  - VAPID setup
  - Notification permission prompt
  - Handle push events
  - Notification click handling
- Install Prompt:
  - beforeinstallprompt handling
  - Custom install button in Settings
  - Install success feedback
- Offline Indicator:
  - Network status detector
  - Offline banner
  - Retry actions

### SMS Reconciliation - Complete Flow

#### 1. SMS Reception (Android)

```kotlin
class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            for (sms in messages) {
                if (isMobileMoneyProvider(sms.originatingAddress)) {
                    processSms(sms)
                }
            }
        }
    }
}
```

#### 2. SMS Parsing (OpenAI)

```typescript
// packages/sms-parser/src/parsers/openaiParser.ts
export async function parseWithOpenAI(smsText: string): Promise<ParsedSMS> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Extract mobile money transaction details from SMS.
Return JSON: { provider, amount, ref, sender, timestamp, type }`,
      },
      { role: "user", content: smsText },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(completion.choices[0].message.content);
}
```

#### 3. Payment Matching

```typescript
// Match SMS transaction with user payments
async function matchPayment(parsed: ParsedSMS): Promise<Match | null> {
  // 1. Find pending payment with matching amount and timestamp
  const pendingPayments = await supabase
    .from("payments")
    .select("*")
    .eq("status", "pending")
    .eq("amount", parsed.amount)
    .gte("created_at", minusMinutes(parsed.timestamp, 30))
    .lte("created_at", plusMinutes(parsed.timestamp, 30));

  // 2. Match by phone number if available
  if (parsed.sender) {
    const userMatch = pendingPayments.find(
      (p) => p.user_phone === parsed.sender
    );
    if (userMatch) return { payment: userMatch, confidence: 0.95 };
  }

  // 3. Match by reference if available
  if (parsed.ref) {
    const refMatch = pendingPayments.find((p) => p.reference === parsed.ref);
    if (refMatch) return { payment: refMatch, confidence: 0.99 };
  }

  // 4. Return best match if only one pending payment
  if (pendingPayments.length === 1) {
    return { payment: pendingPayments[0], confidence: 0.8 };
  }

  return null; // Manual review needed
}
```

#### 4. Auto-Allocation

```typescript
// Allocate payment to user account
async function allocatePayment(match: Match): Promise<void> {
  await supabase.rpc("allocate_payment", {
    payment_id: match.payment.id,
    sms_transaction_id: match.smsTransaction.id,
    confidence: match.confidence,
  });

  // Send confirmation notification
  await sendPushNotification(match.payment.user_id, {
    title: "Payment Received",
    body: `Your payment of ${match.payment.amount} RWF has been confirmed.`,
  });
}
```

### Web-to-Mobile 2FA - Complete Flow

#### 1. Web: Generate Challenge

```typescript
// apps/staff-admin-pwa/src/lib/auth/qrAuth.ts
export async function generateLoginChallenge(): Promise<QRChallenge> {
  const challenge = {
    id: uuid(),
    nonce: randomBytes(32).toString('base64'),
    timestamp: Date.now(),
    expiresAt: Date.now() + 120_000, // 2 minutes
  };

  // Store challenge in Redis/Supabase
  await supabase.from('auth_challenges').insert(challenge);

  return challenge;
}

// Display QR code
function QRLogin() {
  const [challenge, setChallenge] = useState(null);
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    generateLoginChallenge().then(setChallenge);

    // Poll for authentication status
    const interval = setInterval(async () => {
      const result = await checkChallengeStatus(challenge.id);
      if (result.status === 'approved') {
        setStatus('approved');
        // Complete login with returned tokens
        loginWithTokens(result.tokens);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <QRCode value={JSON.stringify(challenge)} />
      <Typography>Scan with Staff Mobile App</Typography>
      {status === 'waiting' && <CircularProgress />}
    </Box>
  );
}
```

#### 2. Mobile: Scan and Verify

```kotlin
// apps/staff-mobile-android/src/main/java/rw/ibimina/staff/auth/QRScanner.kt
class QRScanScreen : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val scanner = rememberQRScanner()

            QRScannerView(
                onQRScanned = { qrData ->
                    handleAuthChallenge(qrData)
                }
            )
        }
    }

    private suspend fun handleAuthChallenge(qrData: String) {
        val challenge = Json.decodeFromString<QRChallenge>(qrData)

        // Verify challenge hasn't expired
        if (challenge.expiresAt < System.currentTimeMillis()) {
            showError("QR code expired")
            return
        }

        // Show biometric prompt
        val biometricResult = showBiometricPrompt(
            title = "Authenticate Login",
            subtitle = "Confirm login to Staff Admin PWA"
        )

        if (biometricResult.success) {
            // Sign response with device key
            val signature = signChallenge(challenge)

            // Send to backend
            val response = apiClient.approveAuthChallenge(
                challengeId = challenge.id,
                signature = signature,
                deviceId = getDeviceId()
            )

            showSuccess("Login approved!")
        }
    }
}
```

#### 3. Backend: Verify and Issue Tokens

```typescript
// supabase/functions/approve-auth-challenge/index.ts
serve(async (req) => {
  const { challengeId, signature, deviceId } = await req.json();

  // 1. Fetch challenge
  const { data: challenge } = await supabase
    .from("auth_challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (!challenge || challenge.expiresAt < Date.now()) {
    return new Response("Invalid or expired challenge", { status: 400 });
  }

  // 2. Verify signature with device's public key
  const { data: device } = await supabase
    .from("trusted_devices")
    .select("public_key")
    .eq("device_id", deviceId)
    .single();

  const isValid = crypto.verify(
    challenge.nonce,
    Buffer.from(signature, "base64"),
    device.public_key
  );

  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  // 3. Get user from device
  const { data: deviceUser } = await supabase
    .from("user_devices")
    .select("user_id")
    .eq("device_id", deviceId)
    .single();

  // 4. Generate tokens
  const accessToken = generateJWT(deviceUser.user_id, "15m");
  const refreshToken = generateJWT(deviceUser.user_id, "7d");

  // 5. Update challenge status
  await supabase
    .from("auth_challenges")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      tokens: { accessToken, refreshToken },
    })
    .eq("id", challengeId);

  return new Response(JSON.stringify({ success: true }));
});
```

---

## 🗄️ DATABASE SCHEMA

### SMS Transactions

```sql
CREATE TABLE sms_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  raw_sms TEXT NOT NULL,
  parsed_data JSONB,
  provider TEXT, -- 'MTN', 'Airtel'
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'RWF',
  transaction_ref TEXT,
  sender_number TEXT,
  timestamp TIMESTAMPTZ,
  matched_payment_id UUID REFERENCES payments(id),
  match_confidence DECIMAL(3,2),
  status TEXT DEFAULT 'pending', -- 'pending', 'matched', 'confirmed', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_sms_trans_status ON sms_transactions(status);
CREATE INDEX idx_sms_trans_ref ON sms_transactions(transaction_ref);
CREATE INDEX idx_sms_trans_timestamp ON sms_transactions(timestamp);
```

### Auth Challenges (2FA)

```sql
CREATE TABLE auth_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  approved_at TIMESTAMPTZ,
  approved_by_device UUID REFERENCES trusted_devices(id),
  tokens JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_challenges_status ON auth_challenges(status);
CREATE INDEX idx_auth_challenges_expires ON auth_challenges(expires_at);
```

### Trusted Devices

```sql
CREATE TABLE trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  device_name TEXT,
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  public_key TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'revoked'
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  device_id UUID NOT NULL REFERENCES trusted_devices(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);
```

### TapMoMo Tables

```sql
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  display_name TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('MTN', 'Airtel')),
  merchant_code TEXT NOT NULL,
  secret_key BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tapmomo_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  nonce UUID NOT NULL UNIQUE,
  amount INT,
  currency TEXT DEFAULT 'RWF',
  ref TEXT,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'settled', 'failed')),
  payer_hint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

CREATE TABLE seen_nonces (
  nonce TEXT PRIMARY KEY,
  seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tapmomo_merchant ON tapmomo_transactions(merchant_id);
CREATE INDEX idx_tapmomo_status ON tapmomo_transactions(status);
CREATE INDEX idx_seen_nonces_cleanup ON seen_nonces(seen_at);
```

---

## 🚀 DEPLOYMENT PLAN

### Environment Variables

#### Staff PWA (.env.production)

```bash
VITE_API_BASE_URL=https://api.ibimina.rw
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PUSH_PUBLIC_KEY=your-vapid-public-key
VITE_APP_VERSION=1.0.0
VITE_ENABLE_MOCKS=false
```

#### Staff Mobile Android (local.properties)

```properties
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key
TAPMOMO_AID=F01234567890
```

#### Supabase Edge Functions

```bash
OPENAI_API_KEY=sk-...
SERVICE_ROLE_KEY=your-service-role-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### CI/CD Pipelines

#### Staff PWA

```yaml
# .github/workflows/staff-pwa.yml
name: Staff PWA Deploy
on:
  push:
    branches: [main]
    paths: ["apps/staff-admin-pwa/**"]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm --filter @ibimina/staff-admin-pwa build
      - run: docker build -t staff-admin-pwa apps/staff-admin-pwa
      - run: docker push ghcr.io/ibimina/staff-admin-pwa:latest
```

#### Staff Mobile Android

```yaml
# .github/workflows/staff-android.yml
name: Staff Android Build
on:
  push:
    branches: [main]
    paths: ["apps/staff-mobile-android/**"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: 17
      - name: Build APK
        run: |
          cd apps/staff-mobile-android
          ./gradlew assembleRelease
      - name: Upload to Firebase
        uses: wzieba/Firebase-Distribution-Github-Action@v1
        with:
          appId: ${{ secrets.FIREBASE_APP_ID }}
          token: ${{ secrets.FIREBASE_TOKEN }}
          file: apps/staff-mobile-android/app/build/outputs/apk/release/app-release.apk
```

---

## ✅ TESTING STRATEGY

### Unit Tests

- [ ] SMS parser with sample SMS messages
- [ ] Payment matcher with various scenarios
- [ ] HMAC canonicalization (golden vectors)
- [ ] Auth challenge generation and verification
- [ ] Token refresh logic

### Integration Tests

- [ ] SMS → Parse → Match → Allocate flow
- [ ] QR auth complete flow
- [ ] NFC tap → USSD → Payment flow
- [ ] API client with auth interceptors
- [ ] Service worker caching strategies

### E2E Tests (Playwright)

- [ ] Staff PWA: Login → Dashboard → CRUD operations
- [ ] Offline mode: Queue writes → Go offline → Come online → Sync
- [ ] 2FA: Generate QR → Scan (mocked) → Approve → Login

### Manual Testing Checklist

- [ ] Android: Build and install on physical device
- [ ] iOS: Build and test on physical device
- [ ] SMS: Test with real mobile money SMS
- [ ] NFC: Test on NFC-enabled devices
- [ ] Push: Test notifications on both platforms

---

## 📚 DOCUMENTATION TO CREATE

1. **Staff PWA README** - Setup, features, deployment
2. **Staff Mobile README** - Build instructions, permissions
3. **Client Mobile README** - React Native setup
4. **SMS Reconciliation Guide** - How it works, troubleshooting
5. **TapMoMo Integration Guide** - NFC setup, USSD codes
6. **2FA Setup Guide** - Device registration, security
7. **Deployment Guide** - Production deployment steps
8. **API Documentation** - Endpoints, schemas, examples

---

## 🎯 SUCCESS CRITERIA

### MVP Complete When:

- [ ] Staff can log into PWA on any browser
- [ ] Staff can log into mobile app with biometrics
- [ ] 2FA works between web and mobile
- [ ] Mobile money SMS are automatically parsed
- [ ] Payments are matched and users notified
- [ ] NFC tap payment works on test devices
- [ ] Client app installed on iOS and Android
- [ ] All apps can work offline and sync later
- [ ] Push notifications work on all platforms

### Production Ready When:

- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit completed
- [ ] Load testing passed (1000 concurrent users)
- [ ] Error monitoring active (Sentry)
- [ ] Analytics tracking implemented
- [ ] User documentation complete
- [ ] Support team trained
- [ ] Rollback plan documented

---

## 🚨 RISKS AND MITIGATIONS

### Technical Risks

1. **SMS Permission Denial**: Mitigated by clear UX explanation
2. **OpenAI API Costs**: Mitigated by hybrid regex + AI approach
3. **NFC Hardware Limitations**: Mitigated by USSD fallback
4. **Offline Sync Conflicts**: Mitigated by last-write-wins + manual review
5. **Token Refresh Failures**: Mitigated by retry logic + logout fallback

### Business Risks

1. **Low Staff Adoption**: Mitigated by training + simple UX
2. **Payment Matching Errors**: Mitigated by confidence scores + manual review
3. **Security Breaches**: Mitigated by encryption + audit logs
4. **Scalability Issues**: Mitigated by load testing + CDN

---

## 📞 IMPLEMENTATION NOTES

### Current Status

- Android build: ✅ FIXED (Capacitor 7 compatible)
- Staff PWA: 🚧 STARTING NOW
- SMS Reconciliation: 📋 PLANNED
- TapMoMo NFC: 📋 PLANNED
- Client Mobile: 📋 PLANNED
- 2FA: 📋 PLANNED

### Blockers

- None identified

### Questions

1. OpenAI API key ready? → Need to confirm
2. USSD codes for MTN/Airtel Rwanda? → Need exact formats
3. NFC testing devices available? → Need list
4. Firebase project set up? → Need credentials

---

**Next Action:** Begin Staff PWA implementation with complete file generation.

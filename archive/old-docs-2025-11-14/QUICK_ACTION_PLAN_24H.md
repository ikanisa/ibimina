# QUICK ACTION PLAN - NEXT 24 HOURS

**Priority:** Get system to working MVP state  
**Goal:** All backend deployed + Android app running  
**Time Budget:** 24 hours

---

## HOUR 0-2: COMPLETE CURRENT DEPLOYMENT ✅ IN PROGRESS

**Status:** Deployment script running  
**Script:** `./scripts/deploy-complete-system.sh`  
**Log:** `.logs/deployment-*.log`

**Actions:**

```bash
# Monitor deployment
tail -f .logs/deployment-*.log

# When complete, verify:
supabase migration list           # All migrations applied?
supabase functions list           # All functions deployed?
psql $DATABASE_URL -c "\dt public.*"  # Tables created?
```

**Checklist:**

- [ ] 43 migrations applied
- [ ] 41 Edge Functions deployed
- [ ] Test merchant created
- [ ] Test transaction created
- [ ] All tables exist
- [ ] All functions accessible

---

## HOUR 2-6: FIX ANDROID BUILD

**Problem:** Capacitor dependency conflicts, SDK version issues

**File:** `apps/admin/android/app/build.gradle.kts`

**Changes Needed:**

```kotlin
// 1. Update SDK versions
android {
    namespace = "rw.ibimina.staff"
    compileSdk = 35  // was 34

    defaultConfig {
        minSdk = 26
        targetSdk = 35  // was 34
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// 2. Fix Capacitor BOM
dependencies {
    // Remove old BOM reference
    // Add correct version
    implementation(platform("com.capacitorjs:capacitor-bom:7.4.4"))
    implementation("com.getcapacitor:core")
    implementation("com.getcapacitor:android")

    // Fix AndroidX versions explicitly
    implementation("androidx.core:core:1.15.0")
    implementation("androidx.activity:activity:1.9.2")
    implementation("androidx.fragment:fragment:1.8.4")
    implementation("androidx.coordinatorlayout:coordinatorlayout:1.2.0")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.biometric:biometric:1.2.0-alpha05")
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    // Google dependencies
    implementation("com.google.android.material:material:1.12.0")
    implementation("com.google.firebase:firebase-messaging:24.1.0")

    // Image loading
    implementation("androidx.exifinterface:exifinterface:1.3.7")
}

// 3. Add repository if missing
repositories {
    google()
    mavenCentral()
}
```

**File:** `apps/admin/android/settings.gradle.kts`

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        mavenCentral()
    }
}
```

**Build & Test:**

```bash
cd apps/admin
pnpm exec cap sync android
cd android

# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# If successful, install
adb devices  # Ensure device connected
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Launch app
adb shell am start -n rw.ibimina.staff/.MainActivity
```

**Checklist:**

- [ ] Gradle sync successful
- [ ] Build completes without errors
- [ ] APK generated
- [ ] App installs on device
- [ ] App launches without crashes

---

## HOUR 6-8: TEST TAPMOMO END-TO-END

**Prerequisites:**

- [ ] Database deployed
- [ ] Edge Functions deployed
- [ ] Android app installed

**Test Flow:**

### 1. Verify Backend

```bash
# Check merchant exists
psql $DATABASE_URL << EOF
SELECT id, merchant_code, display_name, network, status
FROM public.tapmomo_merchants
WHERE merchant_code = 'TEST001';
EOF

# Check reconcile function
curl -X POST \
  https://vacltfdslodqybxojytc.supabase.co/functions/v1/tapmomo-reconcile \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_code": "TEST001",
    "nonce": "test-nonce-123",
    "status": "settled",
    "notes": "Test payment from curl"
  }'
```

### 2. Test Android NFC (requires 2 devices)

**Device A (Payee):**

1. Open admin app
2. Navigate to TapMoMo
3. Tap "Get Paid"
4. Enter amount: 5000 RWF
5. Tap "Activate NFC" (60-second window)
6. Keep screen on, device unlocked

**Device B (Payer):**

1. Open admin app (or use iOS device with reader)
2. Navigate to TapMoMo
3. Tap "Pay"
4. Hold near Device A's NFC coil
5. Should receive payment details
6. Verify HMAC signature
7. Confirm payment
8. USSD should launch automatically

**Verify:**

```bash
# Check transaction created
psql $DATABASE_URL << EOF
SELECT id, amount, currency, status, ref, created_at
FROM public.tapmomo_transactions
ORDER BY created_at DESC
LIMIT 5;
EOF
```

**Checklist:**

- [ ] NFC activation works
- [ ] NFC reader detects card
- [ ] Payload received and parsed
- [ ] HMAC verification passes
- [ ] USSD code generated correctly
- [ ] USSD launches (or dialer opens)
- [ ] Transaction recorded in database

---

## HOUR 8-12: TEST QR AUTH END-TO-END

**Prerequisites:**

- [ ] Edge Functions deployed
- [ ] Android app installed
- [ ] Web app accessible

### 1. Generate QR Code

```bash
# Call generate function
QR_RESPONSE=$(curl -X POST \
  https://vacltfdslodqybxojytc.supabase.co/functions/v1/auth-qr-generate \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user"}')

echo $QR_RESPONSE | jq .

# Extract challenge_id
CHALLENGE_ID=$(echo $QR_RESPONSE | jq -r .challenge_id)
QR_DATA=$(echo $QR_RESPONSE | jq -r .qr_data)

echo "Challenge ID: $CHALLENGE_ID"
echo "QR Data: $QR_DATA"
```

### 2. Implement QR Scanner in Android

**File:**
`apps/admin/android/app/src/main/java/rw/ibimina/staff/QRScannerActivity.kt`

```kotlin
// Use existing QRScannerActivity.kt stub
// Add ZXing library to scan QR codes
// On scan success, call auth-qr-verify function
```

### 3. Test Flow

**Web App (simulated with curl):**

```bash
# Poll for verification
for i in {1..30}; do
  POLL_RESPONSE=$(curl -X GET \
    "https://vacltfdslodqybxojytc.supabase.co/functions/v1/auth-qr-poll/$CHALLENGE_ID" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY")

  echo "Poll $i: $POLL_RESPONSE"

  STATUS=$(echo $POLL_RESPONSE | jq -r .status)
  if [ "$STATUS" = "approved" ]; then
    echo "✅ AUTH APPROVED!"
    TOKEN=$(echo $POLL_RESPONSE | jq -r .auth_token)
    echo "Auth Token: $TOKEN"
    break
  fi

  sleep 2
done
```

**Mobile App:**

1. Open admin app
2. Navigate to QR Scanner
3. Scan QR code (or paste $QR_DATA)
4. App calls auth-qr-verify
5. Biometric prompt (if available)
6. Approve authentication

**Checklist:**

- [ ] QR code generated
- [ ] Mobile app scans QR
- [ ] Verification call succeeds
- [ ] Polling receives approval
- [ ] Auth token returned
- [ ] Session created

---

## HOUR 12-16: TEST SMS RECONCILIATION

**Prerequisites:**

- [ ] Edge Functions deployed
- [ ] OpenAI API key set

### 1. Send Test SMS

```bash
# Simulate SMS from mobile money provider
curl -X POST \
  https://vacltfdslodqybxojytc.supabase.co/functions/v1/ingest-sms \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+250788123456",
    "body": "You have received 5000 RWF from JEAN BOSCO NIYOMWUNGERE. Transaction ID: MTN123456789. Ref: INV-2025-001. New balance: 25000 RWF. Thank you for using MTN Mobile Money.",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

### 2. Verify Processing

```bash
# Check SMS inbox
psql $DATABASE_URL << EOF
SELECT id, sender, body, status, created_at
FROM public.sms_inbox
ORDER BY created_at DESC
LIMIT 5;
EOF

# Check parsed SMS
psql $DATABASE_URL << EOF
SELECT
  s.id,
  s.sender,
  p.amount,
  p.currency,
  p.reference,
  p.sender_name,
  p.transaction_id,
  p.network,
  p.confidence_score,
  p.parsing_method
FROM public.sms_inbox s
LEFT JOIN public.sms_parsed p ON p.sms_id = s.id
ORDER BY s.created_at DESC
LIMIT 5;
EOF

# Check payment allocations
psql $DATABASE_URL << EOF
SELECT
  pa.id,
  pa.amount,
  pa.reference,
  pa.status,
  pa.matched_user_id,
  pa.confidence_score,
  pa.created_at
FROM public.payment_allocations pa
ORDER BY pa.created_at DESC
LIMIT 5;
EOF
```

### 3. Test AI Parsing

```bash
# Send complex SMS that needs AI
curl -X POST \
  https://vacltfdslodqybxojytc.supabase.co/functions/v1/ingest-sms \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+250788999888",
    "body": "Muraho! Mwakiriye amafaranga 12500 FRW kuva kuri Mukamana Claudine. Ref: SACCO-2025-OCT-1234. ID yemeza: AML67890. Balance yawe: 47500 FRW. Murakoze gukoresha Airtel Money!",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# Wait 5 seconds for AI processing
sleep 5

# Check if AI parsed it
psql $DATABASE_URL << EOF
SELECT
  p.amount,
  p.currency,
  p.reference,
  p.sender_name,
  p.network,
  p.parsing_method,
  p.confidence_score,
  p.ai_raw_response
FROM public.sms_parsed p
WHERE p.parsing_method = 'ai'
ORDER BY p.created_at DESC
LIMIT 1;
EOF
```

**Checklist:**

- [ ] SMS ingested successfully
- [ ] Rule-based parsing works
- [ ] AI parsing works (for complex SMS)
- [ ] Payment allocated to user
- [ ] Confidence scores calculated
- [ ] Transaction created

---

## HOUR 16-20: CONNECT STAFF ADMIN PWA

**Current State:** Using MSW mocks  
**Goal:** Connect to real Supabase

### 1. Remove MSW

**File:** `apps/staff-admin-pwa/src/main.tsx`

```typescript
// Remove these lines:
// import { worker } from './mocks/browser'
// if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
//   worker.start()
// }
```

### 2. Add Supabase Client

**File:** `apps/staff-admin-pwa/src/lib/supabase/client.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. Update API Client

**File:** `apps/staff-admin-pwa/src/lib/api/client.ts`

```typescript
import { supabase } from "../supabase/client";

// Replace axios calls with Supabase calls
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  },

  users: {
    list: async (params: any) => {
      const { data, error } = await supabase
        .from("users_complete")
        .select("*")
        .range(params.offset, params.offset + params.limit - 1);
      if (error) throw error;
      return data;
    },
  },
  // ... etc
};
```

### 4. Update Environment

**File:** `apps/staff-admin-pwa/.env.production`

```bash
VITE_SUPABASE_URL=https://vacltfdslodqybxojytc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ENABLE_MOCKS=false
```

### 5. Rebuild & Test

```bash
cd apps/staff-admin-pwa
pnpm install @supabase/supabase-js
pnpm build
pnpm preview

# Open http://localhost:4173
# Test login
# Test user list
# Test creating user
```

**Checklist:**

- [ ] MSW removed
- [ ] Supabase client configured
- [ ] Auth works (login/logout)
- [ ] User list loads from DB
- [ ] CRUD operations work
- [ ] No console errors

---

## HOUR 20-24: INTEGRATION TESTING & FIXES

### Test Matrix

| Feature         | Test Case                        | Pass/Fail | Notes |
| --------------- | -------------------------------- | --------- | ----- |
| TapMoMo NFC     | Activate HCE                     | [ ]       |       |
|                 | Read payload from another device | [ ]       |       |
|                 | Verify HMAC signature            | [ ]       |       |
|                 | Launch USSD                      | [ ]       |       |
|                 | Record transaction               | [ ]       |       |
| QR Auth         | Generate QR code                 | [ ]       |       |
|                 | Scan with mobile                 | [ ]       |       |
|                 | Approve authentication           | [ ]       |       |
|                 | Web receives token               | [ ]       |       |
| SMS Recon       | Ingest SMS                       | [ ]       |       |
|                 | Parse (rule-based)               | [ ]       |       |
|                 | Parse (AI)                       | [ ]       |       |
|                 | Allocate payment                 | [ ]       |       |
| Staff Admin PWA | Login                            | [ ]       |       |
|                 | View dashboard                   | [ ]       |       |
|                 | List users                       | [ ]       |       |
|                 | Create user                      | [ ]       |       |
|                 | Offline mode                     | [ ]       |       |

### Known Issues to Fix

1. **Android Build:**
   - Capacitor BOM dependency
   - SDK version mismatches
   - AndroidX conflicts

2. **TapMoMo:**
   - Test nonce replay prevention
   - Test TTL expiration
   - Test signature verification failure handling

3. **QR Auth:**
   - Implement biometric prompt
   - Handle expired challenges
   - Test multiple concurrent sessions

4. **SMS:**
   - Test Kinyarwanda SMS
   - Test malformed SMS
   - Test duplicate SMS

5. **Staff Admin PWA:**
   - Fix auth token refresh
   - Test offline sync
   - Test background sync

---

## SUCCESS CRITERIA

After 24 hours, you should have:

**Deployed ✅**

- [x] All database migrations
- [x] All Edge Functions
- [x] Test data

**Working 🔄**

- [ ] Admin Android app builds and installs
- [ ] TapMoMo NFC tap works end-to-end
- [ ] QR auth works end-to-end
- [ ] SMS reconciliation processes payments
- [ ] Staff Admin PWA connects to Supabase

**Tested ✅**

- [ ] All critical paths tested
- [ ] Known issues documented
- [ ] Integration test matrix completed

**Ready for Next Phase 🚀**

- [ ] System stable enough for demo
- [ ] Clear list of remaining work
- [ ] Prioritized backlog for mobile apps

---

## COMMAND CHEAT SHEET

```bash
# Monitor deployment
tail -f .logs/deployment-*.log

# Check migrations
supabase migration list

# Check functions
supabase functions list

# Query database
psql $DATABASE_URL -c "YOUR QUERY HERE"

# Build Android
cd apps/admin && pnpm exec cap sync android && cd android && ./gradlew assembleDebug

# Install APK
adb install -r app/build/outputs/apk/debug/app-debug.apk

# View Android logs
adb logcat | grep -i "ibimina\|tapmomo\|capacitor"

# Test Edge Function
curl -X POST https://vacltfdslodqybxojytc.supabase.co/functions/v1/FUNCTION_NAME \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Build PWA
cd apps/staff-admin-pwa && pnpm build && pnpm preview
```

---

## WHAT TO DO IF...

**Deployment fails:**

1. Check `.logs/deployment-*.log`
2. Identify failing migration or function
3. Fix issue
4. Re-run: `./scripts/deploy-complete-system.sh`

**Android build fails:**

1. Clean: `./gradlew clean`
2. Check SDK version in `build.gradle.kts`
3. Sync dependencies: `pnpm exec cap sync android`
4. Rebuild: `./gradlew assembleDebug`

**NFC doesn't work:**

1. Check NFC is enabled on device
2. Check app has NFC permission
3. Check HCE service is registered in manifest
4. Check AID matches in both payee and payer
5. Try different device positions (coil locations vary)

**Function returns error:**

1. Check function logs: `supabase functions logs FUNCTION_NAME`
2. Check environment variables are set
3. Test with curl to isolate issue
4. Check database RLS policies

**Database query fails:**

1. Check table exists: `\dt public.TABLE_NAME`
2. Check RLS policies allow access
3. Check user is authenticated
4. Try with service role key

---

**Ready to start? Begin with Hour 0-2: Monitor the deployment!**

```bash
cd /Users/jeanbosco/workspace/ibimina
tail -f .logs/deployment-*.log
```

# 🧪 Ibimina System Testing Guide

**Complete testing workflow for all applications**

## 📋 Testing Order

Test in this sequence to identify issues early:

1. **Backend/Supabase** (Foundation) - 30 minutes
2. **Staff Admin PWA** (Web) - 45 minutes
3. **Staff Mobile Android** (with TapMoMo & SMS) - 60 minutes
4. **Client Mobile App** (iOS/Android) - 60 minutes
5. **Integration Tests** (E2E workflows) - 45 minutes

**Total Time:** ~4 hours for complete system test

---

## 🎯 Phase 1: Backend/Supabase Testing (30 min)

### Prerequisites

```bash
export SUPABASE_URL="https://vacltfdslodqybxojytc.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

### 1.1 Database Schema (10 min)

```bash
cd /Users/jeanbosco/workspace/ibimina

# List all deployed functions
supabase functions list

# Check key tables exist (run this command)
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const tables = [
    'users', 'accounts', 'transactions', 'groups',
    'momo_transactions', 'tapmomo_merchants', 'tapmomo_transactions',
    'whatsapp_otp_verifications', 'device_auth_challenges',
    'push_tokens', 'notification_queue', 'loan_applications'
  ];

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(\`✓ \${table}: \${error ? 'ERROR' : count + ' rows'}\`);
  }
}

test();
"
```

### 1.2 Edge Functions (10 min)

```bash
# Test WhatsApp OTP
curl -X POST "$SUPABASE_URL/functions/v1/whatsapp-send-otp" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+250788123456"}'

# Expected: {"success":true,"verificationId":"..."}

# Test SMS parsing
curl -X POST "$SUPABASE_URL/functions/v1/parse-sms" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "You have received 5000 RWF from JOHN DOE. Your new balance is 15000 RWF. Ref: MP123456",
    "sender": "MTN"
  }'

# Expected: {"success":true,"parsed":{...}}
```

### 1.3 Quick Health Check

```bash
# Run automated health check
cd /Users/jeanbosco/workspace/ibimina
node scripts/health-check.js
```

---

## 🖥️ Phase 2: Staff Admin PWA Testing (45 min)

### 2.1 Start the Application

```bash
cd /Users/jeanbosco/workspace/ibimina

# Start development server
pnpm --filter @ibimina/admin dev

# Open in browser
open http://localhost:3000
```

### 2.2 Manual Test Checklist

#### Login & Authentication (5 min)

- [ ] Load login page (http://localhost:3000)
- [ ] Enter email: `admin@example.com`, password: `password123`
- [ ] Click "Sign In"
- [ ] Should redirect to `/dashboard`
- [ ] If MFA enabled, complete MFA challenge

#### Dashboard (5 min)

- [ ] Dashboard loads within 2 seconds
- [ ] KPI cards show data:
  - Active Users
  - Open Tickets
  - Pending Orders
  - Total Revenue
- [ ] Charts render (no errors in console)
- [ ] Quick actions clickable

#### Users Management (10 min)

- [ ] Navigate to "Users" menu
- [ ] List displays with pagination
- [ ] Search by name: type "john" → filters results
- [ ] Filter by status: select "Active" → shows only active
- [ ] Click "Create User" button
- [ ] Fill form: name, email, role, status
- [ ] Submit → new user appears in list
- [ ] Click user row → detail view opens
- [ ] Edit user details
- [ ] Save → changes persist
- [ ] Deactivate user → status changes to "Suspended"

#### Orders (5 min)

- [ ] Navigate to "Orders"
- [ ] List displays orders
- [ ] Filter by status: "Pending", "Approved", etc.
- [ ] Click order → detail view
- [ ] Change status: "Pending" → "Approved"
- [ ] Optimistic UI updates immediately
- [ ] Refresh page → status persisted

#### Tickets (5 min)

- [ ] Navigate to "Tickets"
- [ ] List by status works
- [ ] Click "New Ticket"
- [ ] Create ticket with subject + description
- [ ] Submit → appears in list
- [ ] Open ticket → add comment
- [ ] Change status: "Open" → "Closed"
- [ ] Assign to user

#### Settings (5 min)

- [ ] Navigate to "Settings"
- [ ] Toggle theme: Light ↔ Dark (persists after refresh)
- [ ] Edit profile: change name
- [ ] Save → updates in top bar
- [ ] Toggle notifications
- [ ] View app version

### 2.3 PWA Features (10 min)

```bash
# Build production version
pnpm --filter @ibimina/admin build

# Preview
pnpm --filter @ibimina/admin preview
# Opens on http://localhost:4173
```

#### Installation

- [ ] Open http://localhost:4173 in Chrome
- [ ] Install prompt appears (or check address bar)
- [ ] Click "Install"
- [ ] App installs as standalone
- [ ] Icon appears on desktop/home screen
- [ ] Launch from icon → opens in standalone window

#### Offline Mode

- [ ] With app open, open DevTools → Network tab
- [ ] Select "Offline" from throttling dropdown
- [ ] Reload page → app shell loads from cache
- [ ] Offline indicator shows (top bar or toast)
- [ ] Navigate between cached routes → works
- [ ] Try to create user → queued for sync
- [ ] Go back online
- [ ] Queued action replays automatically

#### Service Worker

- [ ] Open DevTools → Application → Service Workers
- [ ] Should show "activated and running"
- [ ] Update app code slightly (change text)
- [ ] Rebuild: `pnpm --filter @ibimina/admin build`
- [ ] Reload page → update notification appears
- [ ] Click "Reload to Update"
- [ ] New version loads

---

## 📱 Phase 3: Staff Mobile Android Testing (60 min)

### 3.1 Build & Install (15 min)

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin

# Sync Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android

# Build debug APK
cd android
./gradlew assembleDebug

# Install on connected device
adb devices  # Verify device connected
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 3.2 QR Code Authentication (10 min)

**Setup:** You need both web PWA and mobile app

1. **On Desktop:**
   - Open http://localhost:3000
   - Should see QR code on login screen
   - Or after login, Settings → "Link Mobile Device" → QR code

2. **On Android Device:**
   - Open Ibimina Staff app
   - Tap "Scan QR to Login"
   - Grant camera permission
   - Point at QR code on desktop
   - Should scan within 2 seconds
   - Mobile app logs in
   - Desktop shows "Device authenticated"

**Verify:**

- [ ] QR code displays on web
- [ ] Mobile scans successfully
- [ ] Both devices authenticated
- [ ] Can perform actions on both

### 3.3 SMS Reader (15 min)

**Prerequisites:** Real Android device with SIM card

1. **Grant Permission:**
   - Open app → SMS Reader feature
   - Tap "Enable SMS Reconciliation"
   - Grant SMS permission when prompted

2. **Test with Real SMS:**
   - Send yourself a MoMo test transaction (or have someone send)
   - SMS example: "You have received 5000 RWF from JOHN DOE. Ref: MP123456"
   - App should detect new SMS within 5 seconds
   - Notification: "New MoMo transaction detected"

3. **Check Parsing:**
   - Tap notification → opens SMS details
   - Shows parsed data:
     - Amount: 5000
     - Sender: JOHN DOE
     - Reference: MP123456
     - Network: MTN (auto-detected from sender)
   - Tap "Confirm & Send to Backend"

4. **Verify Backend:**
   - Open Staff PWA → Reconciliation dashboard
   - New transaction appears in "Pending" list
   - Shows all parsed details
   - Can match to user account

**Test Checklist:**

- [ ] SMS permission granted
- [ ] App detects incoming MoMo SMS
- [ ] Parses amount correctly
- [ ] Parses sender name
- [ ] Parses reference number
- [ ] Sends to backend API
- [ ] Shows success confirmation

### 3.4 TapMoMo NFC (20 min)

**Prerequisites:** 2 Android devices with NFC (API 26+), both unlocked

#### Merchant Mode (Payee - Get Paid)

1. **On Device A (Merchant):**
   - Open app → TapMoMo → "Get Paid"
   - Enter amount: `2500` RWF
   - Select network: `MTN`
   - Merchant code: (should auto-fill from profile)
   - Tap "Activate NFC"
   - Screen says: "Ready to receive payment. Keep device unlocked and close to
     payer."
   - Countdown timer: 60 seconds

2. **On Device B (Customer/Payer):**
   - Open app → TapMoMo → "Pay"
   - OR use iOS device with client app
   - Tap "Scan to Pay"
   - Hold devices back-to-back (NFC coils aligned)
   - Usually coils are center-top of device

3. **What Should Happen:**
   - Within 2 seconds: "Payment details received"
   - Device B shows confirmation:
     ```
     Amount: 2500 RWF
     Merchant: [Name]
     Network: MTN
     ```
   - Tap "Confirm & Pay"
   - **Android:** USSD auto-launches: `*182*8*1*<merchant_code>*2500#`
   - **iOS:** USSD copied, Phone app opens, user pastes code

4. **Complete Payment:**
   - Dial USSD (or already dialing)
   - Enter MoMo PIN
   - Confirm payment
   - MoMo processes → SMS sent to merchant device

5. **Reconciliation:**
   - Merchant device receives SMS
   - SMS auto-detected and parsed
   - Transaction status updated to "Paid"
   - Both devices show success notification

**Test Checklist:**

- [ ] Merchant activates NFC successfully
- [ ] Payer reads payload within 2 seconds
- [ ] Amount, merchant, network display correctly
- [ ] USSD launches (Android) or copies (iOS)
- [ ] Payment completes via USSD
- [ ] SMS received and parsed
- [ ] Transaction marked as paid

#### Security Tests (5 min)

1. **Expired Payload:**
   - Activate NFC on merchant device
   - Wait 3 minutes (TTL = 2 min)
   - Try to read with payer device
   - Should show: "Payment request expired"

2. **Replay Attack:**
   - Activate NFC, read once successfully
   - Try to read again with same payload
   - Should show: "This payment was already processed"

3. **Invalid Signature:**
   - (Requires code modification to test)
   - Modify HMAC key
   - Try to read payload
   - Should show: "Payment verification failed" (with warning)

---

## 📲 Phase 4: Client Mobile App Testing (60 min)

### 4.1 Build & Run (10 min)

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/client-mobile

# Install dependencies
npm install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios
# Or: Open ios/ClientMobile.xcworkspace in Xcode → Run

# Android
npx react-native run-android
```

### 4.2 Onboarding & Authentication (15 min)

#### First Launch (Browse Mode)

1. **Onboarding Screens:**
   - Launch app
   - See 3 intro slides:
     1. "Welcome to Ibimina" - Save & grow together
     2. "Mobile Money Integration" - Easy deposits
     3. "Track Your Progress" - Real-time updates
   - Swipe through all 3
   - Bottom: "Skip" and "Get Started" buttons

2. **Browse Without Login:**
   - Tap "Skip" on onboarding
   - See home screen with sample data
   - Shows features: Deposit, Withdraw, Transfer, Loans, Groups
   - Can navigate through screens
   - Data is placeholder/demo mode

3. **Auth Guard:**
   - Try to tap "Deposit"
   - Should show: "Sign in to continue"
   - "Sign in with WhatsApp" button

#### WhatsApp OTP Authentication

1. **Enter Phone:**
   - Tap "Sign in with WhatsApp"
   - Enter phone: `+250788123456` (use your real number)
   - Tap "Send Code"
   - Loading indicator

2. **Check WhatsApp:**
   - Open WhatsApp on same device (or another)
   - Should receive message from business:
     ```
     123456 is your verification code. For your security, do not share this code.
     ```
   - **Note:** Code is 6 digits, changes each time

3. **Enter Code:**
   - Switch back to app
   - OTP input field auto-focused
   - Type the 6-digit code (or paste if copied)
   - Tap "Verify"
   - Shows: "Verifying..."

4. **Success:**
   - Screen changes to "Loading your profile..."
   - Dashboard loads with real user data
   - Top bar shows user name + photo
   - No more demo mode indicator

**Test Checklist:**

- [ ] Onboarding slides display
- [ ] Can skip onboarding
- [ ] Browse mode works (sample data)
- [ ] Auth guard blocks real actions
- [ ] WhatsApp OTP sent successfully
- [ ] OTP code received in WhatsApp
- [ ] Code verification works
- [ ] User profile loads
- [ ] Session persists (close and reopen app)

### 4.3 Core Features Testing (35 min)

#### Dashboard (5 min)

- [ ] Account balance displays (real number)
- [ ] Recent 5 transactions listed
- [ ] Quick actions: Deposit, Withdraw, Transfer, Loans
- [ ] Pull to refresh updates data

#### Accounts Screen (3 min)

- [ ] Navigate to "Accounts" tab
- [ ] Shows list of accounts (Savings, Shares, etc.)
- [ ] Each card shows balance
- [ ] Tap account → detail view
- [ ] Shows transaction history for that account

#### Deposit Flow (8 min)

1. **Initiate:**
   - Tap "Deposit" from home
   - See form: Amount, Network, Account

2. **Fill Form:**
   - Account: Select "Savings Account"
   - Amount: Enter `5000`
   - Network: Select "MTN MoMo"
   - Review summary

3. **Confirm:**
   - Tap "Confirm Deposit"
   - Shows: "Redirecting to Mobile Money..."
   - USSD dialer opens: `*182*1#` (or network-specific)
   - **OR** if TapMoMo enabled: "Tap staff device to complete"

4. **Complete USSD:**
   - Follow MoMo prompts
   - Enter PIN
   - Confirm payment
   - Return to app

5. **Track Status:**
   - App shows: "Waiting for confirmation..."
   - When staff SMS received and parsed:
   - Status changes to: "Deposit confirmed"
   - Balance updates
   - Notification sent

**Test Checklist:**

- [ ] Form validation (min amount, required fields)
- [ ] USSD launches correctly
- [ ] Can complete MoMo flow
- [ ] Status updates automatically
- [ ] Balance increases after confirmation

#### Withdraw Flow (5 min)

- [ ] Similar to deposit
- [ ] Validates sufficient balance
- [ ] Can't withdraw more than available
- [ ] USSD launches for withdrawal
- [ ] Balance decreases after confirmation

#### Transfer Flow (7 min)

1. **Search Recipient:**
   - Tap "Transfer"
   - Search bar: type recipient name or phone
   - Results show matching users
   - Select recipient

2. **Enter Amount:**
   - Amount field
   - Validates against balance
   - Shows fee if applicable

3. **Confirm:**
   - Review details
   - Tap "Confirm Transfer"
   - Biometric prompt (if enabled)
   - Enter PIN/fingerprint/face
   - "Processing..."

4. **Success:**
   - "Transfer successful"
   - Balance updated
   - Transaction appears in history
   - Recipient receives notification

**Test Checklist:**

- [ ] Recipient search works
- [ ] Amount validation
- [ ] Biometric auth works
- [ ] Transfer completes
- [ ] Both parties see transaction

#### Loans (4 min)

- [ ] Navigate to "Loans" tab
- [ ] See available loan products
- [ ] Tap "Apply for Loan"
- [ ] Fill application:
  - Loan type
  - Amount requested
  - Purpose
  - Upload documents (ID, payslip)
- [ ] Submit application
- [ ] Appears in "My Applications"
- [ ] Status: "Pending Review"

#### Groups/Ikimina (3 min)

- [ ] Navigate to "Groups" tab
- [ ] List of groups user belongs to
- [ ] Tap group → detail view
- [ ] Shows: members, total contributions, next meeting
- [ ] Tap "Make Contribution"
- [ ] Enter amount
- [ ] Confirm → USSD or transfer flow
- [ ] Contribution appears in group history

---

## 🔄 Phase 5: Integration Testing (45 min)

### 5.1 End-to-End: SMS Reconciliation (20 min)

**Participants:**

- Client app (on device A)
- Staff Android app (on device B with SIM)
- Staff PWA (on desktop)

**Scenario:** Client deposits money, staff receives SMS, system auto-reconciles

#### Steps:

1. **Client Initiates Deposit (Device A):**

   ```
   - Open client app
   - Tap "Deposit"
   - Amount: 5000 RWF
   - Network: MTN
   - Account: Savings
   - Tap "Confirm"
   - USSD launches: *182*1*...*5000#
   ```

2. **Client Completes MoMo:**

   ```
   - Dial USSD on phone
   - Select: Send Money → [SACCO Account]
   - Enter amount: 5000
   - Enter PIN
   - Confirm
   - MoMo shows: "Transaction successful. Ref: MP789012"
   ```

3. **MoMo Sends SMS (to merchant/SACCO phone):**

   ```
   SMS arrives on Device B (staff phone):
   "You have received 5000 RWF from 250788123456 (John Doe).
   New balance: 150,000 RWF. Ref: MP789012. 2024-11-04 14:23"
   ```

4. **Staff App Reads SMS (Device B):**

   ```
   - App detects new SMS within 5 seconds
   - Shows notification: "New transaction detected"
   - Auto-parses SMS:
     {
       "amount": 5000,
       "sender_phone": "250788123456",
       "sender_name": "John Doe",
       "reference": "MP789012",
       "timestamp": "2024-11-04T14:23:00Z",
       "network": "MTN"
     }
   - Sends to backend: POST /functions/v1/parse-sms
   ```

5. **Backend Reconciles:**

   ```
   - Edge function receives parsed SMS
   - Queries `momo_transactions` table:
     - Match by amount: 5000
     - Match by phone: +250788123456
     - Match by timeframe: last 10 minutes
   - Finds matching pending deposit
   - Updates transaction:
     - status: 'pending' → 'completed'
     - reference: 'MP789012'
     - confirmed_at: now()
   - Updates account balance: +5000
   - Sends push notification to client
   ```

6. **Client Sees Confirmation (Device A):**

   ```
   - Push notification: "Your deposit of 5,000 RWF has been confirmed"
   - Balance updates from 10,000 → 15,000 RWF
   - Transaction status: "Completed" ✓
   ```

7. **Staff Reviews (Desktop PWA):**
   ```
   - Open Reconciliation dashboard
   - New row appears: 5000 RWF from John Doe
   - Status: Matched ✓
   - Click row → see details:
     - Client: John Doe (+250788123456)
     - Amount: 5,000 RWF
     - Reference: MP789012
     - Matched: Yes
     - Account: Savings
   ```

#### Expected Timing:

- MoMo completion → SMS: 5-30 seconds
- SMS → Backend parse: < 5 seconds
- Backend → Client notification: < 2 seconds
- **Total: < 1 minute**

**Test Checklist:**

- [ ] Client deposit initiates correctly
- [ ] USSD completes successfully
- [ ] SMS received on staff device
- [ ] SMS auto-detected by app
- [ ] Parsing extracts all fields correctly
- [ ] Backend matches transaction
- [ ] Client balance updates
- [ ] Staff dashboard shows matched transaction
- [ ] End-to-end time < 2 minutes

---

### 5.2 End-to-End: TapMoMo NFC Payment (25 min)

**Participants:**

- Merchant (staff app on device A)
- Customer (client app on device B, or iOS device)

**Scenario:** Customer pays merchant via NFC tap

#### Steps:

1. **Merchant Prepares (Device A - Android):**

   ```
   - Open staff app
   - Navigate to: TapMoMo → Get Paid
   - Enter amount: 2500 RWF
   - Select network: MTN
   - Merchant code: Auto-filled (e.g., "123456")
   - Tap "Activate NFC"
   - Screen shows:
     "Ready to receive payment"
     "Keep device unlocked"
     Timer: 60 seconds
   ```

2. **Customer Initiates (Device B):**

   ```
   Android:
   - Open client app → TapMoMo → Pay
   - Tap "Scan to Pay"
   - Hold devices back-to-back (NFC coils touching)

   iOS:
   - Open client app → TapMoMo → Pay
   - Tap "Scan to Pay" → CoreNFC session starts
   - Hold devices back-to-back
   ```

3. **NFC Exchange (<2 seconds):**

   ```
   - Device B reads AID: F01234567890
   - Receives JSON payload:
     {
       "ver": 1,
       "network": "MTN",
       "merchantId": "123456",
       "currency": "RWF",
       "amount": 2500,
       "ts": 1730742523000,
       "nonce": "550e8400-e29b-41d4-a716-446655440000",
       "sig": "base64_hmac_signature"
     }
   ```

4. **Customer Reviews & Confirms:**

   ```
   - Device B shows:
     "Payment Request"
     Merchant: [Name from merchantId lookup]
     Amount: 2,500 RWF
     Network: MTN MoMo
   - Tap "Confirm & Pay"
   ```

5. **USSD Launch:**

   ```
   Android (Device B):
   - Auto-dials USSD: *182*8*1*123456*2500#
   - User enters PIN
   - Confirms payment

   iOS (Device B):
   - USSD copied: *182*8*1*123456*2500#
   - Phone app opens (blank)
   - User pastes code
   - Dials USSD
   - Enters PIN, confirms
   ```

6. **MoMo Processes Payment:**

   ```
   - MoMo deducts from customer account
   - Sends SMS to merchant (Device A):
     "You have received 2500 RWF from [Customer]. Ref: MP456789"
   ```

7. **SMS Reconciliation (Device A):**

   ```
   - Staff app detects SMS
   - Parses: amount=2500, ref=MP456789
   - Sends to backend
   - Backend finds matching TapMoMo transaction by:
     - merchantId: 123456
     - amount: 2500
     - nonce: 550e8400...
     - timestamp: within 10 min
   - Updates tapmomo_transactions:
     - status: 'initiated' → 'settled'
     - momo_ref: 'MP456789'
     - settled_at: now()
   ```

8. **Both Devices Notified:**

   ```
   Device A (Merchant):
   - Push notification: "Payment received: 2,500 RWF"
   - Transaction list updates

   Device B (Customer):
   - Push notification: "Payment completed: 2,500 RWF to [Merchant]"
   - Balance updated
   ```

#### Expected Timing:

- NFC tap → Payload read: < 2 seconds
- Confirmation → USSD dial: < 5 seconds
- USSD → MoMo completion: 10-30 seconds
- SMS → Reconciliation: < 5 seconds
- **Total: < 1 minute**

**Test Checklist:**

- [ ] Merchant activates NFC successfully
- [ ] Customer device reads payload quickly
- [ ] Payload validates (HMAC, TTL, nonce)
- [ ] Customer sees correct amount & merchant
- [ ] USSD launches (Android) or copies (iOS)
- [ ] MoMo payment completes
- [ ] SMS received and parsed
- [ ] Transaction marked as settled
- [ ] Both parties notified
- [ ] Balances updated correctly

**Security Tests:**

- [ ] Expired payload rejected (wait 3 min, try again)
- [ ] Replay rejected (read same payload twice)
- [ ] Invalid HMAC shows warning
- [ ] Device must be unlocked (test with locked device)

---

## 📊 Testing Results Template

Use this to track your testing session:

```markdown
# Ibimina Testing Results

**Date:** 2025-11-04  
**Tester:** [Your Name]  
**Environment:** Staging / Production

---

## ✅ Backend/Supabase

**Time:** 30 min

- [x] All tables accessible
- [x] Edge functions responding
- [x] WhatsApp OTP working
- [x] SMS parsing working
- [ ] RLS policies tested

**Issues Found:**

1. None

**Status:** PASS ✅

---

## ✅ Staff Admin PWA

**Time:** 45 min

- [x] Login successful
- [x] Dashboard loads
- [x] Users CRUD works
- [x] Orders management works
- [x] Tickets system works
- [x] Settings persist
- [x] PWA installs
- [x] Offline mode works
- [ ] Service worker updates

**Issues Found:**

1. None

**Status:** PASS ✅

---

## ✅ Staff Mobile Android

**Time:** 60 min

- [x] QR auth works
- [x] SMS reader detects messages
- [x] SMS parsing accurate
- [x] TapMoMo merchant mode works
- [x] TapMoMo payer mode works
- [x] USSD launches correctly
- [ ] NFC security tests

**Issues Found:**

1. None

**Status:** PASS ✅

---

## ✅ Client Mobile App

**Time:** 60 min

- [x] Onboarding displays
- [x] Browse mode works
- [x] WhatsApp OTP working
- [x] Dashboard loads
- [x] Deposit flow works
- [x] Withdraw flow works
- [x] Transfer flow works
- [x] Loans application works
- [x] Groups feature works
- [ ] Biometric auth tested

**Issues Found:**

1. None

**Status:** PASS ✅

---

## ✅ Integration Tests

**Time:** 45 min

- [x] SMS reconciliation E2E (< 2 min)
- [x] TapMoMo payment E2E (< 1 min)
- [x] Security tests pass
- [ ] Load testing

**Issues Found:**

1. None

**Status:** PASS ✅

---

## 🎯 Summary

**Total Time:** 4 hours  
**Tests Passed:** 45/50  
**Tests Failed:** 0  
**Critical Issues:** 0  
**Minor Issues:** 0

**Go/No-Go Decision:** ✅ GO FOR PRODUCTION

---

## 🚀 Next Steps

1. Fix remaining minor issues
2. Performance optimization
3. User acceptance testing
4. Production deployment

**Signed Off By:**

- Technical Lead: ****\_\_\_****
- Product Owner: ****\_\_\_****
- QA Lead: ****\_\_\_****
```

---

## 🚨 Common Issues & Solutions

### 1. WhatsApp OTP Not Received

**Symptoms:**

- Code request succeeds but no message received
- Edge function returns success

**Solutions:**

```bash
# Check Meta Business Manager
open https://business.facebook.com/

# Verify:
- Phone number verified
- WhatsApp Business API active
- Template approved
- Account balance > $0

# Check logs
supabase functions logs whatsapp-send-otp --tail

# Test with curl
curl -X POST "$SUPABASE_URL/functions/v1/whatsapp-send-otp" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"phone":"+250788123456"}'
```

### 2. NFC Not Working

**Symptoms:**

- "No NFC detected"
- Devices don't communicate

**Solutions:**

```bash
# Check device support
adb shell "dumpsys nfc | grep 'mIsNfcEnabled'"

# Enable NFC
Settings → Connected devices → Connection preferences → NFC → ON

# Check API level
adb shell getprop ro.build.version.sdk
# Must be >= 26

# Device must be UNLOCKED
# Hold devices back-to-back (not side-to-side)
# Find NFC coil location (usually center-top)
```

### 3. SMS Not Auto-Detected

**Symptoms:**

- SMS received but app doesn't detect
- Permission granted

**Solutions:**

```bash
# Check permission
adb shell dumpsys package [your.package] | grep READ_SMS

# Check SMS filter
# Edit: apps/admin/android/.../SmsReader.kt
# Verify sender numbers: "MTN", "AIRTEL", etc.

# Test with adb
adb shell service call isms 5 s16 "+250788999999" s16 "null" s16 "Test MoMo message: 5000 RWF"
```

### 4. Build Failures

**Android:**

```bash
cd apps/admin/android
./gradlew clean
./gradlew assembleDebug --stacktrace
```

**iOS:**

```bash
cd apps/client-mobile/ios
pod deintegrate
pod install
```

**React Native:**

```bash
cd apps/client-mobile
rm -rf node_modules
npm install
npx react-native start --reset-cache
```

---

## 📞 Support & Resources

- **Documentation:** `/docs` folder
- **API Reference:** `/docs/API.md`
- **Architecture:** `/docs/ARCHITECTURE.md`
- **Issues:** [GitHub Issues](https://github.com/your-org/ibimina/issues)

---

**Last Updated:** 2025-11-04  
**Version:** 1.0.0  
**Maintained By:** Ibimina Platform Team

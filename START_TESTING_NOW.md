# 🧪 START TESTING - Ibimina System

**Complete testing guide in 5 phases | Total time: ~4.5 hours**

---

## ⚡ Setup (2 minutes)

```bash
cd /Users/jeanbosco/workspace/ibimina

# Set environment variables
export SUPABASE_URL="https://vacltfdslodqybxojytc.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY2x0ZmRzbG9kcXlieG9qeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzI3MzUsImV4cCI6MjA3NTU0ODczNX0.XBJckvtgeWHYbKSnd1ojRd7mBKjdk5OSe0VDqS1PapM"

# Verify
echo "✅ URL: $SUPABASE_URL"
echo "✅ Key: ${SUPABASE_ANON_KEY:0:20}..."
```

---

## 📋 Testing Phases

| #   | Component          | Time  | Status |
| --- | ------------------ | ----- | ------ |
| 1   | Backend (Supabase) | 30min | ⬜     |
| 2   | Staff/Admin PWA    | 45min | ⬜     |
| 3   | Staff Android App  | 60min | ⬜     |
| 4   | Client Mobile App  | 60min | ⬜     |
| 5   | Integration Tests  | 90min | ⬜     |

---

## 1️⃣ Phase 1: Backend (30 min)

### Test Database

```bash
cd /Users/jeanbosco/workspace/ibimina

# Run RLS policy tests
pnpm test:rls

# Expected: ✓ All tests pass
```

### Check Edge Functions

```bash
# List deployed functions
supabase functions list

# Expected 6 functions:
# ✓ sms-reconcile
# ✓ tapmomo-reconcile
# ✓ send-whatsapp-otp
# ✓ verify-whatsapp-otp
# ✓ qr-auth-init
# ✓ qr-auth-verify
```

### Test Authentication

```bash
# Quick auth test
curl -X POST "${SUPABASE_URL}/auth/v1/signup" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Expected: 200 OK with user object
```

**✅ Backend Checklist:**

- [ ] RLS tests pass
- [ ] All 6 Edge Functions deployed
- [ ] Auth endpoint responds 200 OK

---

## 2️⃣ Phase 2: Staff/Admin PWA (45 min)

### Start the App

```bash
cd /Users/jeanbosco/workspace/ibimina

# Build
pnpm --filter @ibimina/admin build

# Run dev server
pnpm --filter @ibimina/admin dev

# Opens at: http://localhost:3100
```

### Test Authentication

1. Navigate to http://localhost:3100/login
2. Enter credentials:
   - Email: `admin@ibimina.rw`
   - Password: `SecurePass123!`
3. Click "Login"

**Expected:**

- ✅ Redirects to `/dashboard`
- ✅ User info in header

### Test Dashboard

1. View KPI cards (Users, Tickets, Orders)
2. Check charts load

**Expected:**

- ✅ Numbers display
- ✅ Charts render
- ✅ No console errors

### Test Users CRUD

1. Navigate to `/users`
2. Click "Add User"
3. Fill: Name=Test User, Email=test@test.com, Role=Staff
4. Submit

**Expected:**

- ✅ User created
- ✅ Appears in list
- ✅ Toast notification

5. Edit user → Change name
6. Click delete → Confirm

**Expected:**

- ✅ Updates work
- ✅ Delete sets status=Suspended

### Test SMS Reconciliation

1. Navigate to `/sms`
2. Click "Parse New SMS"
3. Paste:
   ```
   You have received RWF 5,000 from 0788123456.
   Ref: MP123456789. Balance: RWF 50,000
   ```
4. Click "Parse with AI"

**Expected:**

- ✅ OpenAI extracts:
  - Amount: 5000
  - Sender: 0788123456
  - Reference: MP123456789
- ✅ Matches user
- ✅ Can approve/reject

### Test PWA Features

1. Open DevTools → Network → Offline
2. Refresh page

**Expected:**

- ✅ App loads (service worker)
- ✅ "You're offline" banner
- ✅ Cached content displays

3. Create user while offline
4. Go online

**Expected:**

- ✅ Action queued
- ✅ Auto-syncs
- ✅ Toast confirms

**✅ Admin PWA Checklist:**

- [ ] Build succeeds
- [ ] Login works
- [ ] Dashboard loads
- [ ] Users CRUD works
- [ ] SMS parsing works
- [ ] Offline mode works
- [ ] Background sync works

---

## 3️⃣ Phase 3: Staff Android (60 min)

### Build & Install

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin/android

# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Install on connected device (USB debugging enabled)
adb devices  # Check device connected
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Test QR Scanner Authentication

**On Admin PWA:**

1. Open http://localhost:3100/login
2. QR code displays

**On Staff Android:**

1. Launch app
2. Camera permission → Grant
3. Scan QR code
4. Shows: "Approve Login for [Browser] on [Device]?"
5. Tap "Approve"
6. Biometric prompt (if enabled) → Authenticate

**On Admin PWA:** 7. QR disappears 8. Auto-logs in 9. Redirects to dashboard

**Expected:**

- ✅ QR scans successfully
- ✅ Device info shown
- ✅ PWA logs in automatically
- ✅ Cannot reuse QR
- ✅ QR expires after 60s

### Test TapMoMo NFC - Payee (Get Paid)

**Requirements:**

- Android device with NFC
- Device unlocked
- Screen on

**Steps:**

1. Open Staff Android app
2. Navigate to "Get Paid"
3. Enter amount: `5000 RWF`
4. Select network: `MTN`
5. Tap "Activate NFC"

**Expected:**

- ✅ Shows "Hold device near reader"
- ✅ HCE service activated

**Verify with second device:**

1. Use another Android as reader
2. Hold back-to-back near NFC coil
3. Reader receives JSON payload
4. Payload contains: network, amount, merchant, signature

### Test TapMoMo NFC - Payer (Pay)

**Steps:**

1. Open Staff Android (as payer)
2. Navigate to "Pay"
3. Tap "Scan NFC"
4. Hold near payee device (from above)
5. Payload received
6. Shows confirmation: MTN, 5000 RWF, Merchant 123456
7. Tap "Pay"

**Expected:**

- ✅ USSD dialed: `*182*8*1*123456*5000#`
- ✅ Phone USSD dialog appears
- ✅ If blocked, dialer opens with code
- ✅ # encoded as %23

### Test SMS Reconciliation

**Requirements:**

- SMS permission granted
- SIM card active

**Steps:**

1. Send test SMS to device:
   ```
   You have received RWF 5,000 from 0788123456.
   Ref: MP123456789. Balance: RWF 50,000
   ```
2. App detects automatically

**Expected:**

- ✅ Notification: "New payment detected"
- ✅ Tap → opens reconciliation
- ✅ OpenAI parses SMS
- ✅ Matches user (with confidence %)
- ✅ Can approve/reject
- ✅ Approval updates database

**✅ Staff Android Checklist:**

- [ ] App builds
- [ ] Installs on device
- [ ] QR scanner works
- [ ] Web auth succeeds
- [ ] NFC payee activates
- [ ] NFC payer reads payload
- [ ] USSD launches
- [ ] SMS reader works
- [ ] OpenAI parsing works

---

## 4️⃣ Phase 4: Client Mobile (60 min)

### Build & Run

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/client-mobile

# Install dependencies
npm install

# iOS (Mac only)
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

### Test Onboarding

**Steps:**

1. Launch app (first time)
2. View 3 slides:
   - Slide 1: "Save Smarter Together"
   - Slide 2: "Access Loans Instantly"
   - Slide 3: "Track Every Franc"
3. Swipe through
4. Tap "Get Started"

**Expected:**

- ✅ 3 slides display with animations
- ✅ Swipe gestures smooth
- ✅ Skip button works
- ✅ Get Started → auth screen

### Test WhatsApp OTP Authentication

**Sign Up:**

1. Enter phone: `+250788123456`
2. Tap "Send OTP"
3. Check WhatsApp for message
4. Code format: `123456 is your verification code...`
5. Enter 6-digit code
6. Tap "Verify"

**Expected:**

- ✅ WhatsApp message within 30s
- ✅ OTP auto-fills (iOS)
- ✅ OTP paste works (Android)
- ✅ Account created
- ✅ Redirects to home

**Login:**

1. Logout from settings
2. Enter phone
3. Send OTP
4. Verify

**Expected:**

- ✅ Logs in successfully
- ✅ Code expires after 5 min
- ✅ Cannot reuse OTP
- ✅ Rate limit: 3 OTP/hour

### Test Home Screen (Revolut-style)

**Steps:**

1. View account cards
2. Swipe between cards
3. Tap quick actions (Deposit/Withdraw/Transfer)
4. Scroll recent transactions
5. Pull to refresh

**Expected:**

- ✅ Cards swipe smoothly (60fps)
- ✅ Balance animates (count-up)
- ✅ Gradient backgrounds
- ✅ Haptic feedback on taps
- ✅ Transactions list loads
- ✅ Pull-to-refresh works
- ✅ Skeleton loaders show
- ✅ No jank

### Test Transactions

**Deposit:**

1. Tap "Deposit"
2. Amount: `10000`, Account: Savings, Network: MTN
3. Confirm

**Expected:**

- ✅ Shows USSD: `*182*1*1*10000#`
- ✅ Can copy or dial
- ✅ Transaction pending
- ✅ Balance updates optimistically

**Withdraw:**

1. Tap "Withdraw"
2. Amount: `5000`, Account: Savings, Recipient: Self
3. Confirm

**Expected:**

- ✅ Validates balance
- ✅ Transaction created
- ✅ Balance decreases

**Transfer:**

1. Tap "Transfer"
2. Recipient: `+250788999888`, Amount: `3000`
3. Note: "Test transfer"
4. Confirm

**Expected:**

- ✅ Recipient found
- ✅ Shows name/photo
- ✅ Transfer executes
- ✅ Both accounts update

### Test Loans

**Apply:**

1. Go to Loans tab
2. Tap "Apply"
3. Type: Personal, Amount: 500000, Period: 6 months
4. Submit

**Expected:**

- ✅ Calculator shows monthly payment (~86,000 RWF)
- ✅ Application submitted
- ✅ Status: Pending

**View:**

1. See active loans
2. Tap loan → details
3. View repayment schedule

**Expected:**

- ✅ Details correct
- ✅ Schedule shows installments
- ✅ Can make payment

### Test Groups (Ikimina)

**View:**

1. Go to Groups tab
2. See list: name, members, total savings

**Contribute:**

1. Tap group → "Contribute"
2. Amount: `10000`
3. Confirm

**Expected:**

- ✅ Contribution recorded
- ✅ Group balance increases
- ✅ User account decreases
- ✅ Activity feed updates

### Test Profile & Settings

**Profile:**

1. Go to Profile tab
2. Tap "Edit"
3. Change name
4. Upload photo
5. Save

**Expected:**

- ✅ Updates save
- ✅ Photo uploads to Supabase

**Settings:**

1. Toggle notifications
2. Enable biometric
3. Change theme (Light/Dark/System)
4. View Privacy, Terms, About
5. Logout

**Expected:**

- ✅ Toggles persist
- ✅ Biometric prompts next login
- ✅ Theme applies immediately
- ✅ Logout clears session

### Test Offline & Performance

**Offline:**

1. Enable airplane mode
2. View accounts
3. Try transfer

**Expected:**

- ✅ Cached data displays
- ✅ "You're offline" banner
- ✅ Actions queued

4. Go online

**Expected:**

- ✅ Auto-syncs
- ✅ Toast: "Synced N actions"

**Performance:**

- ✅ Launch < 3s
- ✅ 60fps transitions
- ✅ Smooth scrolling
- ✅ Memory < 200MB

**✅ Client Mobile Checklist:**

- [ ] iOS builds
- [ ] Android builds
- [ ] Onboarding works
- [ ] WhatsApp OTP works
- [ ] Home screen loads
- [ ] Transactions work
- [ ] Loans work
- [ ] Groups work
- [ ] Offline mode works
- [ ] Performance good (60fps, <3s launch)

---

## 5️⃣ Phase 5: Integration (90 min)

### Test 1: End-to-End User Flow

**Scenario:** New client → deposit → loan → group contribution

**1. Client Signs Up**

- App: Client Mobile
- Phone: +250788999888
- WhatsApp OTP
- ✅ Account created

**2. Admin Verifies**

- App: Admin PWA
- Go to /users
- Search: +250788999888
- ✅ User found

**3. Client Deposits**

- App: Client Mobile
- Amount: 50000 RWF, Network: MTN
- USSD: `*182*1*1*50000#`
- ✅ Transaction pending

**4. Staff Reconciles**

- App: Staff Android
- SMS received: "You have received 50000..."
- Parse with AI
- Match: +250788999888
- Approve
- ✅ Balance updated

**5. Verify Transaction**

- App: Admin PWA
- Go to /transactions
- ✅ Deposit: 50000 RWF, Approved

**6. Client Checks Balance**

- App: Client Mobile
- Pull-to-refresh
- ✅ Balance: 50000 RWF

**7. Apply for Loan**

- App: Client Mobile
- Amount: 200000 RWF, 12 months
- ✅ Status: Pending

**8. Admin Approves**

- App: Admin PWA
- Go to /loans
- Approve loan
- ✅ Loan active

**9. Client Receives Loan**

- App: Client Mobile
- Notification: "Loan approved"
- ✅ Balance: 250000 RWF (50000 + 200000)

**10. Group Contribution**

- App: Client Mobile
- Contribute: 10000 RWF
- ✅ Balance: 240000 RWF
- ✅ Group total increased

### Test 2: TapMoMo NFC Payment

**1. Merchant Setup**

- App: Staff Android
- "Get Paid": 5000 RWF, MTN
- Activate NFC

**2. Customer Pays (Android)**

- App: Client/Staff (payer)
- "Pay" → Scan NFC
- Confirm payment
- ✅ USSD dialed: `*182*8*1*123456*5000#`

**3. Customer Pays (iOS)**

- App: Client (payer)
- Scan NFC
- ✅ USSD copied to clipboard
- ✅ Phone app opens
- Paste and dial

**4. Reconcile**

- Complete USSD
- SMS received
- Staff Android auto-parses
- ✅ Payment matched

**5. Verify**

- App: Admin PWA
- ✅ Transaction recorded
- ✅ Accounts updated

### Test 3: Web-to-Mobile 2FA

**1. PWA Login**

- Open http://localhost:3100/login
- ✅ QR code displayed

**2. Mobile Scan**

- App: Staff Android
- Scan QR
- ✅ Shows: "Approve login for [Browser] on [Device]?"

**3. Approve**

- Tap "Approve"
- Biometric auth
- ✅ Shows: "Login approved ✓"

**4. PWA Auto-Login**

- ✅ QR disappears
- ✅ Redirects to /dashboard
- ✅ Session established

**5. Security Tests**

- Try reusing QR → ✅ Fails
- Wait 60s → ✅ QR expires
- Reject on mobile → ✅ PWA shows error

### Test 4: Offline Sync

**1. Client Goes Offline**

- App: Client Mobile
- Enable airplane mode
- Try transfer: 5000 RWF
- ✅ Queued locally

**2. Admin Goes Offline**

- App: Admin PWA
- DevTools → Offline
- Create user
- ✅ Queued in Background Sync

**3. Reconnect**

- Client: Disable airplane mode
- Admin: Enable network
- ✅ Both auto-sync

**4. Verify**

- Client: ✅ Transfer completed
- Admin: ✅ User created
- ✅ Database updated
- ✅ No data loss

**✅ Integration Checklist:**

- [ ] E2E flow completes
- [ ] TapMoMo NFC works (Android & iOS)
- [ ] Web 2FA succeeds
- [ ] Offline sync handles all cases

---

## 📊 Final Results

Fill this as you complete testing:

```
Date: ___________
Tester: ___________
Duration: ___________

PHASE 1 - BACKEND:
□ RLS tests: PASS / FAIL
□ Edge Functions: PASS / FAIL
□ Auth: PASS / FAIL

PHASE 2 - ADMIN PWA:
□ Build: PASS / FAIL
□ Login: PASS / FAIL
□ CRUD: PASS / FAIL
□ SMS: PASS / FAIL
□ PWA: PASS / FAIL

PHASE 3 - STAFF ANDROID:
□ Build: PASS / FAIL
□ QR Auth: PASS / FAIL
□ NFC Payee: PASS / FAIL
□ NFC Payer: PASS / FAIL
□ SMS Reader: PASS / FAIL

PHASE 4 - CLIENT MOBILE:
□ iOS Build: PASS / FAIL
□ Android Build: PASS / FAIL
□ Auth: PASS / FAIL
□ Transactions: PASS / FAIL
□ Loans: PASS / FAIL
□ Groups: PASS / FAIL
□ Performance: PASS / FAIL

PHASE 5 - INTEGRATION:
□ E2E Flow: PASS / FAIL
□ TapMoMo: PASS / FAIL
□ Web 2FA: PASS / FAIL
□ Offline: PASS / FAIL

OVERALL STATUS:
□ ✅ READY FOR PRODUCTION
□ ⚠️ NEEDS MINOR FIXES
□ ❌ NEEDS MAJOR FIXES

ISSUES FOUND:
1. [Issue description] - Severity: Critical/High/Medium/Low
2. [Issue description] - Severity: Critical/High/Medium/Low
...

NOTES:
[Additional observations]
```

---

## 🚨 Known Issues & Workarounds

### Issue 1: WhatsApp OTP Requires Meta Credentials

- **Fix:** Add to Supabase secrets:
  ```bash
  supabase secrets set WHATSAPP_ACCESS_TOKEN=your_token
  supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_id
  ```

### Issue 2: iOS NFC Requires Physical Device

- **Workaround:** Test on actual iPhone (Simulator doesn't support CoreNFC)

### Issue 3: USSD Carrier Blocking

- **Workaround:** Fallback to dialer with pre-filled code (implemented)

### Issue 4: OpenAI Rate Limits

- **Workaround:** Retry logic implemented. Upgrade to GPT-4 tier if needed.

---

## 🎯 Next Steps

### If All Tests Pass ✅

1. **Performance Optimization**
   - Run Lighthouse on PWA (target: 90+)
   - Profile mobile apps
   - Optimize bundle sizes

2. **Security Audit**
   - Review API endpoints
   - Validate RLS policies
   - Test HMAC signatures
   - Verify replay attack prevention

3. **UAT (User Acceptance Testing)**
   - Deploy to staging
   - Invite 5-10 beta testers
   - Collect feedback
   - Iterate on UX

4. **Production Deployment**
   - Configure production secrets
   - Set up monitoring (Sentry)
   - Deploy Edge Functions
   - Publish to app stores
   - **LAUNCH! 🚀**

### If Tests Fail ❌

1. **Document Issues**
   - Use template above
   - Include screenshots/videos
   - Note severity

2. **Prioritize**
   - Critical: Blocks launch
   - High: Degrades UX
   - Medium: Nice to have
   - Low: Future enhancement

3. **Fix & Retest**
   - Address critical first
   - Rerun affected tests
   - Regression test

4. **Update Docs**
   - Note workarounds
   - Update known issues
   - Add troubleshooting

---

## 📞 Need Help?

**Documentation:**

- `PRODUCTION_READY_SUMMARY.md` - System overview
- `NEXT_STEPS.md` - Deployment guide
- `QUICK_REFERENCE.md` - Command reference
- `docs/TapMoMo-Spec.md` - NFC details

**Useful Commands:**

```bash
# View logs
supabase logs
pnpm --filter @ibimina/admin dev 2>&1 | tee admin.log
adb logcat | grep -i "ibimina"

# Restart services
supabase functions deploy --no-verify-jwt
./gradlew clean

# Database
supabase db reset
psql "$SUPABASE_URL/db" -c "\dt"
```

**Debugging:**

- Browser console (F12)
- Supabase dashboard
- Network tab for API calls
- React Native Debugger
- Enable verbose logging

---

## ✅ Ready? Let's Test!

**Quick Start Commands:**

```bash
# Terminal 1: Set environment
export SUPABASE_URL="https://vacltfdslodqybxojytc.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY2x0ZmRzbG9kcXlieG9qeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzI3MzUsImV4cCI6MjA3NTU0ODczNX0.XBJckvtgeWHYbKSnd1ojRd7mBKjdk5OSe0VDqS1PapM"

# Phase 1: Backend
cd /Users/jeanbosco/workspace/ibimina
pnpm test:rls

# Terminal 2: Admin PWA
pnpm --filter @ibimina/admin dev

# Terminal 3: Staff Android
cd apps/admin/android && ./gradlew assembleDebug && adb install -r app/build/outputs/apk/debug/app-debug.apk

# Terminal 4: Client Mobile
cd apps/client-mobile && npx react-native run-android
```

**Good luck testing! 🧪✨**

---

**Document Version:** 1.0.0  
**Last Updated:** November 4, 2025  
**Maintained by:** Ibimina Engineering Team

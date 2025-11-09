# 🧪 IBIMINA COMPREHENSIVE TESTING GUIDE

**Last Updated:** 2025-11-04  
**Status:** ✅ Ready for Testing - Migration Issues Fixed

---

## 🎯 TESTING OVERVIEW

The Ibimina SACCO management system consists of 4 integrated applications:

1. **Admin PWA** - Staff console (Next.js, runs on web)
2. **Client Mobile** - Member app (React Native, iOS + Android)
3. **Staff Android** - Staff mobile tools (Capacitor + Android)
4. **Backend** - Supabase (PostgreSQL + Edge Functions)

**Testing Goal:** Validate all features work end-to-end before production
launch.

---

## ✅ PHASE 1: BACKEND TESTING (30 minutes)

### 1.1 Database Connection

```bash
cd /Users/jeanbosco/workspace/ibimina

# Set environment variables
export SUPABASE_URL="https://vacltfdslodqybxojytc.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY2x0ZmRzbG9kcXlieG9qeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzI3MzUsImV4cCI6MjA3NTU0ODczNX0.XBJckvtgeWHYbKSnd1ojRd7mBKjdk5OSe0VDqS1PapM"

# Test connection
curl -X GET "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  | jq
```

✅ **Expected:** JSON response with API version info

### 1.2 Test Edge Functions

```bash
# List deployed functions
supabase functions list

# Should see:
# - whatsapp-send-otp
# - whatsapp-verify-otp
# - tapmomo-reconcile
# - send-push-notification
# + 26 more functions
```

✅ **Expected:** 30 functions listed, all status = ACTIVE

### 1.3 Test Key Tables

```bash
# Test organizations table
curl "$SUPABASE_URL/rest/v1/organizations?select=id,name&limit=3" \
  -H "apikey: $SUPABASE_ANON_KEY" | jq

# Test user_profiles table
curl "$SUPABASE_URL/rest/v1/user_profiles?select=id&limit=1" \
  -H "apikey: $SUPABASE_ANON_KEY" | jq
```

✅ **Expected:** JSON arrays (may be empty if no data seeded yet)

---

## ✅ PHASE 2: ADMIN PWA TESTING (45 minutes)

### 2.1 Build and Start

```bash
cd /Users/jeanbosco/workspace/ibimina

# Ensure environment variables are set
cat > apps/admin/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://vacltfdslodqybxojytc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY2x0ZmRzbG9kcXlieG9qeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzI3MzUsImV4cCI6MjA3NTU0ODczNX0.XBJckvtgeWHYbKSnd1ojRd7mBKjdk5OSe0VDqS1PapM
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EOF

# Build and run
pnpm install
pnpm --filter @ibimina/admin dev
```

✅ **Expected:** App runs on http://localhost:3100

### 2.2 Manual Feature Testing

| Feature             | Steps                                                                                                     | Pass/Fail |
| ------------------- | --------------------------------------------------------------------------------------------------------- | --------- |
| **🔐 Login**        | 1. Go to http://localhost:3100<br>2. Enter test credentials<br>3. Should redirect to dashboard            | ⬜        |
| **📊 Dashboard**    | 1. View KPI cards<br>2. Check charts load<br>3. Verify quick actions                                      | ⬜        |
| **👥 Users**        | 1. Click "Users"<br>2. Search/filter<br>3. View user detail<br>4. Edit user                               | ⬜        |
| **💰 Payments**     | 1. View payment list<br>2. Filter by status<br>3. View payment detail                                     | ⬜        |
| **📨 SMS Inbox**    | 1. View SMS list<br>2. Check parsed fields<br>3. Test manual reconciliation                               | ⬜        |
| **⚙️ Settings**     | 1. Update profile<br>2. Change theme (light/dark)<br>3. Verify changes persist                            | ⬜        |
| **🌐 Offline Mode** | 1. Open DevTools > Network<br>2. Set to "Offline"<br>3. Try an action<br>4. Should show offline indicator | ⬜        |

### 2.3 PWA Testing

```bash
# Open in Chrome
open -a "Google Chrome" http://localhost:3100
```

**DevTools Checklist:**

1. Application → Service Workers → Should see "activated" ⬜
2. Application → Manifest → Should load without errors ⬜
3. Application → Icons → Should show 192px, 512px icons ⬜
4. Lighthouse → PWA score > 90 ⬜
5. Chrome menu → Install app → Should work ⬜

---

## ✅ PHASE 3: CLIENT MOBILE APP TESTING (60 minutes)

### 3.1 Setup Environment

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/client-mobile

# Create .env file
cat > .env << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://vacltfdslodqybxojytc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WHATSAPP_API_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
OPENAI_API_KEY=your_openai_key
EOF

# Install dependencies
npm install
```

### 3.2 iOS Testing

```bash
# Sync iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select target device or simulator
# 2. Press Run (⌘R)
```

### 3.3 Android Testing

```bash
# Sync Android
npx cap sync android

# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Select device or emulator
# 2. Click Run (green triangle)
```

### 3.4 Mobile Feature Testing

| Feature                   | iOS | Android | Notes                            |
| ------------------------- | --- | ------- | -------------------------------- |
| **📱 Onboarding**         | ⬜  | ⬜      | 3 slides, skip button works      |
| **📞 WhatsApp OTP**       | ⬜  | ⬜      | OTP sent, received, verified     |
| **👀 Browse Mode**        | ⬜  | ⬜      | Can view features before login   |
| **🔒 Auth Guard**         | ⬜  | ⬜      | Login prompt on protected action |
| **🏠 Dashboard**          | ⬜  | ⬜      | Balance displays, KPIs load      |
| **💸 Deposit**            | ⬜  | ⬜      | Can initiate deposit             |
| **💵 Withdraw**           | ⬜  | ⬜      | Can initiate withdrawal          |
| **↔️ Transfer**           | ⬜  | ⬜      | Can transfer between accounts    |
| **📜 Transactions**       | ⬜  | ⬜      | History displays, can filter     |
| **💳 Accounts**           | ⬜  | ⬜      | Multiple accounts shown          |
| **👤 Profile**            | ⬜  | ⬜      | Can edit profile fields          |
| **🌙 Dark Mode**          | ⬜  | ⬜      | Toggle works                     |
| **📴 Offline**            | ⬜  | ⬜      | Offline banner shows             |
| **🔔 Push Notifications** | ⬜  | ⬜      | Receives test notification       |

---

## ✅ PHASE 4: STAFF ANDROID APP TESTING (45 minutes)

### 4.1 Build APK

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin/android

# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# APK location
# apps/admin/android/app/build/outputs/apk/debug/app-debug.apk
```

### 4.2 Install on Device

```bash
# Via USB
adb devices
adb install app/build/outputs/apk/debug/app-debug.apk

# Or transfer APK file and install manually
```

### 4.3 Staff App Feature Testing

| Feature              | Status | Notes                               |
| -------------------- | ------ | ----------------------------------- |
| **📱 Launch**        | ⬜     | App opens without crash             |
| **🔐 QR Login**      | ⬜     | Scan PWA QR code                    |
| **✅ Auth Success**  | ⬜     | PWA session activates               |
| **📊 Dashboard**     | ⬜     | Staff metrics display               |
| **👥 User List**     | ⬜     | Can view SACCO members              |
| **🔍 Search**        | ⬜     | Search by name/phone works          |
| **💰 Payment Entry** | ⬜     | Can record payment manually         |
| **📲 NFC TapMoMo**   | ⬜     | Can read NFC payment (if supported) |
| **📨 SMS Reader**    | ⬜     | Reads MoMo SMS notifications        |
| **🤖 SMS Parsing**   | ⬜     | OpenAI parses SMS correctly         |
| **✅ Auto-Match**    | ⬜     | Payment matched to user             |
| **📴 Offline Queue** | ⬜     | Actions queue when offline          |
| **🔄 Sync**          | ⬜     | Queue replays when back online      |

---

## ✅ PHASE 5: INTEGRATION TESTING (30 minutes)

### 5.1 End-to-End Payment Flow

**Scenario:** Client deposits money, staff processes, balance updates

```
Step 1: Client opens mobile app                        ⬜
Step 2: Client signs up with WhatsApp OTP              ⬜
Step 3: Client sees welcome dashboard                  ⬜
Step 4: Client initiates deposit via USSD              ⬜
Step 5: Client completes MoMo payment                  ⬜
Step 6: MoMo sends SMS confirmation                    ⬜
Step 7: Staff Android app reads SMS                    ⬜
Step 8: OpenAI parses SMS (amount, phone, ref)         ⬜
Step 9: System matches payment to client               ⬜
Step 10: Client sees balance updated in mobile app     ⬜
Step 11: Staff sees transaction in Admin PWA           ⬜
```

### 5.2 Web-to-Mobile 2FA Flow

**Scenario:** Staff authenticates Admin PWA using Android app

```
Step 1: Staff opens Admin PWA in browser               ⬜
Step 2: Login page displays QR code                    ⬜
Step 3: Staff opens Staff Android app                  ⬜
Step 4: Staff taps "Scan QR" in app                    ⬜
Step 5: Camera activates, staff scans QR               ⬜
Step 6: App prompts for biometric/PIN                  ⬜
Step 7: Staff authenticates in app                     ⬜
Step 8: App sends auth token to PWA                    ⬜
Step 9: PWA session activates, shows dashboard         ⬜
```

### 5.3 TapMoMo NFC Payment Flow

**Scenario:** Merchant receives payment via NFC tap (Android only)

```
Step 1: Merchant activates "Get Paid" on Staff Android ⬜
Step 2: Merchant enters amount, shows NFC prompt       ⬜
Step 3: Client taps their Android phone to merchant    ⬜
Step 4: Payment details transferred via NFC            ⬜
Step 5: Client sees payment confirmation on screen     ⬜
Step 6: Client confirms payment                        ⬜
Step 7: USSD initiated automatically on client phone   ⬜
Step 8: Client enters PIN to complete payment          ⬜
Step 9: Transaction recorded in Supabase               ⬜
Step 10: Both client and merchant see confirmation     ⬜
```

---

## 🐛 BUG REPORTING TEMPLATE

Found an issue? Report it like this:

```markdown
### 🐛 Bug: [Short descriptive title]

**App:** Admin PWA / Client Mobile iOS / Client Mobile Android / Staff Android  
**Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low  
**Reproducible:** Always / Sometimes / Rarely

**Steps to Reproduce:**

1. Open [app name]
2. Navigate to [screen]
3. Tap/click [button]
4. Observe [issue]

**Expected Behavior:** [What should happen]

**Actual Behavior:** [What actually happens]

**Screenshots/Videos:** [Attach if available]

**Console Errors:**
```

[Paste any error messages]

```

**Device Info:**
- Device: iPhone 14 Pro / Samsung Galaxy S23 / etc.
- OS: iOS 17.1 / Android 14 / macOS Sonoma
- App Version: 0.1.0
```

---

## 📊 TESTING PROGRESS TRACKER

| Phase             | Total Tests | Passed | Failed | Completion |
| ----------------- | ----------- | ------ | ------ | ---------- |
| **Backend**       | 3           | 0      | 0      | 0%         |
| **Admin PWA**     | 7           | 0      | 0      | 0%         |
| **Client Mobile** | 14          | 0      | 0      | 0%         |
| **Staff Android** | 13          | 0      | 0      | 0%         |
| **Integration**   | 3           | 0      | 0      | 0%         |
| **OVERALL**       | **40**      | **0**  | **0**  | **0%**     |

**Target:** 95%+ pass rate before production launch

---

## 🆘 TROUBLESHOOTING

### Issue: "Cannot connect to Supabase"

```bash
# Check environment variables
echo $SUPABASE_URL
echo ${SUPABASE_ANON_KEY:0:20}...

# Test connection
curl -I $SUPABASE_URL

# Verify in Supabase Dashboard:
# https://supabase.com/dashboard/project/vacltfdslodqybxojytc
```

### Issue: "Admin PWA won't start"

```bash
cd apps/admin

# Clear cache
rm -rf .next node_modules/.cache

# Reinstall
pnpm install

# Check TypeScript
pnpm typecheck

# Try build
pnpm build
```

### Issue: "Mobile app crashes on launch"

```bash
# iOS: Clean build
cd ios
pod deintegrate && pod install
cd ..
npx react-native run-ios --clean

# Android: Clean build
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Issue: "WhatsApp OTP not sending"

```bash
# Check WhatsApp API credentials in Meta dashboard
# Verify phone number is verified
# Check Edge Function logs:
supabase functions logs whatsapp-send-otp
```

### Issue: "NFC not working"

```
Android:
1. Settings → NFC → Enable NFC
2. Check app has NFC permissions in AndroidManifest.xml
3. Test with another NFC-enabled Android device

iOS:
- NFC payment (HCE) is NOT available for third-party apps
- Only NFC reading (payer side) is possible
```

---

## ✅ TESTING COMPLETION CHECKLIST

Before marking testing as complete:

- [ ] All backend endpoints tested and documented
- [ ] All Admin PWA features manually tested
- [ ] Client Mobile tested on both iOS and Android
- [ ] Staff Android tested on physical device
- [ ] All 3 integration flows tested end-to-end
- [ ] All critical bugs fixed
- [ ] All high-priority bugs fixed or documented
- [ ] Performance tested (Lighthouse, app profiling)
- [ ] Security reviewed (auth flows, API permissions)
- [ ] User acceptance testing completed with real SACCO staff
- [ ] Documentation updated with any new findings
- [ ] Production deployment plan reviewed

---

## 🚀 NEXT STEPS AFTER TESTING

1. **Create GitHub Issues** for all bugs found
2. **Prioritize Bugs** (Critical → High → Medium → Low)
3. **Fix Critical/High Bugs** immediately
4. **Performance Optimization** based on testing results
5. **Security Audit** of authentication and API access
6. **User Acceptance Testing** with real SACCO staff
7. **Production Deployment** only after 95%+ tests pass

---

## 📞 SUPPORT

If you need help during testing:

- Check `PRODUCTION_READY_SUMMARY.md` for system overview
- Check `NEXT_STEPS.md` for development roadmap
- Check `QUICK_REFERENCE.md` for common commands
- Open a GitHub issue for bugs
- Contact the development team

---

**Happy Testing! 🧪✨**

# 🚀 Quick Start Testing Guide

**Get testing in 5 minutes**

## Option 1: Automated Testing (Recommended)

Run the comprehensive automated test suite:

```bash
cd /Users/jeanbosco/workspace/ibimina
./start-testing.sh
```

This will:

- ✅ Check all prerequisites
- ✅ Test Supabase backend
- ✅ Test Admin PWA
- ✅ Test Staff Android (if SDK configured)
- ✅ Test Client Mobile
- ✅ Run integration tests
- ⏱️ Takes ~4-5 hours

## Option 2: Quick Manual Testing

### Test Order (3 hours minimum)

1. **Backend (30 min)** → Start here, foundation for everything
2. **Admin PWA (45 min)** → Staff management interface
3. **Staff Android (60 min)** → Mobile tools + NFC payments
4. **Client Mobile (60 min)** → End-user app
5. **Integration (45 min)** → Cross-app workflows

## Step-by-Step: Start Testing Now

### 1️⃣ Backend Testing (30 min)

```bash
# Test RLS policies
cd /Users/jeanbosco/workspace/ibimina
pnpm test:rls

# List Edge Functions
supabase functions list

# Test database connection
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
```

**Expected:** All tests pass, functions listed, database accessible

### 2️⃣ Admin PWA Testing (45 min)

```bash
# Build and serve
cd apps/admin
pnpm install
pnpm build
pnpm start
```

Then open: http://localhost:3100

**Test Checklist:**

- [ ] Login works
- [ ] Dashboard loads with data
- [ ] Users CRUD works
- [ ] Transactions display
- [ ] SMS reconciliation works
- [ ] PWA installs

### 3️⃣ Staff Android Testing (60 min)

```bash
# Build APK
cd apps/admin/android
./gradlew assembleDebug

# Install on device
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

**Test Checklist:**

- [ ] App opens without crash
- [ ] QR scanner works (scan desktop login QR)
- [ ] NFC payment works (two phones)
- [ ] SMS reconciliation parses messages

**NFC Test (need 2 Android phones):**

1. Phone 1: "Get Paid" → 5000 RWF → Activate NFC
2. Phone 2: "Pay" → Scan NFC → Hold phones together
3. Should read payment details
4. Confirm → USSD launches

### 4️⃣ Client Mobile Testing (60 min)

```bash
# Build iOS
cd apps/client-mobile
npm install
npx react-native run-ios

# Build Android
npx react-native run-android
```

**Test Checklist:**

- [ ] Onboarding slides work
- [ ] WhatsApp OTP works (+250788123456)
- [ ] Browse mode accessible without login
- [ ] Deposit flow complete
- [ ] Transactions display
- [ ] Offline mode works

**WhatsApp OTP Test:**

1. Tap "Sign In"
2. Enter: +250788123456
3. Tap "Send Code"
4. Check WhatsApp for 6-digit code
5. Enter code → Should login

### 5️⃣ Integration Testing (45 min)

**End-to-End Payment Flow:**

1. **Client deposits** (mobile app)
   - Deposit 10,000 RWF via MTN
   - Complete USSD payment
   - Note transaction reference

2. **SMS arrives** (Staff Android)
   - Receive payment SMS
   - Notification appears

3. **Staff reconciles** (Staff Android)
   - Parse SMS with OpenAI
   - Match to client account
   - Approve payment

4. **Client confirmed** (mobile app)
   - Push notification received
   - Balance updated
   - Status: Completed

5. **Verify** (Admin PWA)
   - Login
   - Find transaction
   - Confirm details match

## Common Issues & Quick Fixes

### Admin PWA won't build

```bash
cd apps/admin
rm -rf .next node_modules
pnpm install
pnpm build
```

### Staff Android build fails

```bash
cd apps/admin/android
./gradlew clean
./gradlew assembleDebug
```

### Client Mobile bundle error

```bash
cd apps/client-mobile
rm -rf node_modules ios/Pods
npm install
cd ios && pod install && cd ..
npx react-native start --reset-cache
```

### Supabase functions not responding

```bash
# Check if deployed
supabase functions list

# View logs
supabase functions logs <function-name>

# Redeploy
supabase functions deploy
```

## Testing Reports

After testing, generate reports:

```bash
# Lighthouse (Admin PWA)
cd apps/admin
pnpm build
npx lighthouse http://localhost:3100 --output html --output-path ./reports/lighthouse.html

# Bundle analysis
ANALYZE_BUNDLE=1 pnpm build

# Test coverage
pnpm test:unit --coverage
```

## Documentation

Full testing documentation:

- `MANUAL_TESTING_CHECKLIST.md` - Complete manual test cases
- `TESTING_GUIDE.md` - Comprehensive testing guide
- `PRODUCTION_READY_SUMMARY.md` - System status
- `NEXT_STEPS.md` - What's remaining

## Need Help?

Check logs:

```bash
# Supabase
supabase functions logs

# Android
adb logcat | grep -i "ibimina"

# React Native
npx react-native log-ios  # or log-android
```

## Success Criteria

✅ **Ready for Production when:**

- All automated tests pass
- Manual test checklist complete
- No P0/P1 bugs
- Performance targets met
- Security audit complete
- Documentation updated

## Quick Status Check

```bash
# Check everything at once
cd /Users/jeanbosco/workspace/ibimina

echo "📊 System Status Check"
echo "====================="

echo -e "\n✅ Supabase Backend:"
pnpm test:rls && echo "  RLS tests: PASS" || echo "  RLS tests: FAIL"

echo -e "\n✅ Admin PWA:"
cd apps/admin
pnpm build > /dev/null 2>&1 && echo "  Build: PASS" || echo "  Build: FAIL"

echo -e "\n✅ Staff Android:"
cd ../admin/android
./gradlew assembleDebug > /dev/null 2>&1 && echo "  Build: PASS" || echo "  Build: FAIL"

echo -e "\n✅ Client Mobile:"
cd ../../client-mobile
npm run build > /dev/null 2>&1 && echo "  Build: PASS" || echo "  Build: FAIL"

echo -e "\n====================="
echo "Review details in logs/"
```

## Ready to Test?

Choose your path:

**Path A: Automated (4-5 hours)**

```bash
./start-testing.sh
```

**Path B: Quick Manual (3 hours minimum)** Follow the 5-step checklist above

**Path C: Specific Component**

```bash
# Just backend
pnpm test:rls

# Just Admin PWA
cd apps/admin && pnpm build && pnpm start

# Just Android
cd apps/admin/android && ./gradlew assembleDebug
```

---

**Let's Go! 🚀**

Start with Backend → PWA → Android → Mobile → Integration

Good luck! 🍀

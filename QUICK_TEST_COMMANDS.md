# ⚡ QUICK TEST COMMANDS - Copy & Paste

**Use this for rapid testing. Full guide: TESTING_GUIDE.md**

---

## 🔧 SETUP (Run Once)

```bash
cd /Users/jeanbosco/workspace/ibimina
export SUPABASE_URL="https://vacltfdslodqybxojytc.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY2x0ZmRzbG9kcXlieG9qeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzI3MzUsImV4cCI6MjA3NTU0ODczNX0.XBJckvtgeWHYbKSnd1ojRd7mBKjdk5OSe0VDqS1PapM"
pnpm install --frozen-lockfile
```

---

## 1️⃣ BACKEND (5 min)

```bash
# Test database
psql "$RLS_TEST_DATABASE_URL" -c "\dt public.*" | head -20

# Test functions
supabase functions list | grep -E "ACTIVE|NAME"

# Run RLS tests
pnpm test:rls
```

**✅ Pass:** All tables exist, 30+ functions ACTIVE, RLS tests pass

---

## 2️⃣ ADMIN PWA (10 min)

```bash
cd apps/admin

# Build
pnpm build

# Start (new terminal)
pnpm dev

# Visit: http://localhost:3000
# Login: admin@ibimina.rw / Test1234!
```

**Manual Checks:**

- ✅ Dashboard loads with KPIs
- ✅ Users page loads/search works
- ✅ Reconciliation page shows SMS
- ✅ Settings → Theme toggle works

**Automated:**

```bash
pnpm test:unit    # Unit tests
pnpm test:e2e     # E2E tests
```

---

## 3️⃣ CLIENT MOBILE (15 min)

### iOS

```bash
cd apps/client-mobile
npm install
cd ios && pod install && cd ..

# Terminal 1: Metro
npm start

# Terminal 2: Simulator
npm run ios
```

### Android

```bash
# Ensure emulator is running
npm run android
```

**Manual Checks:**

- ✅ Onboarding slides appear
- ✅ WhatsApp OTP login works (+250788123456)
- ✅ Home screen shows balance
- ✅ Transactions tab loads
- ✅ Loans tab shows products
- ✅ Groups tab loads

**Automated:**

```bash
npm test
```

---

## 4️⃣ STAFF ANDROID (15 min)

```bash
cd apps/admin/android

# Build APK
./gradlew assembleDebug

# Install on device
adb devices
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Manual Checks on Device:**

- ✅ QR scanner opens camera
- ✅ Scan QR → Web app logs in
- ✅ NFC → Get Paid → Activate works
- ✅ SMS permissions granted
- ✅ SMS reader parses messages

---

## 5️⃣ INTEGRATION TEST (20 min)

**Full Flow: Client deposits → Staff reconciles → Loan approved**

```bash
# Terminal 1: Admin PWA
cd apps/admin && pnpm dev

# Terminal 2: Client Mobile
cd apps/client-mobile && npm start && npm run ios

# Terminal 3: Logs
supabase functions logs --follow
```

### Steps:

1. **Client Mobile:**
   - Login with WhatsApp
   - Deposit 10,000 RWF
   - ✅ Shows "PENDING"

2. **Staff Android:**
   - SMS arrives: "You received 10,000 RWF..."
   - ✅ Auto-parsed and uploaded

3. **Admin PWA:**
   - Open Reconciliation
   - ✅ SMS shows with suggested match
   - Click "Approve"
   - ✅ Transaction → "COMPLETED"

4. **Client Mobile:**
   - Refresh transactions
   - ✅ Shows "COMPLETED"
   - ✅ Balance updated
   - Apply for loan (5,000 RWF)

5. **Admin PWA:**
   - Open Loans
   - ✅ New application appears
   - Approve loan
   - ✅ Status → "APPROVED"

6. **Client Mobile:**
   - Check loan status
   - ✅ Shows "APPROVED"

---

## 🔍 QUICK HEALTH CHECK (2 min)

```bash
# Backend
curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" | jq '.version'

# Admin build
cd apps/admin && pnpm build 2>&1 | tail -5

# Client build
cd apps/client-mobile && npm run build:ios 2>&1 | tail -5

# Staff Android build
cd apps/admin/android && ./gradlew assembleDebug 2>&1 | tail -10
```

**✅ All Pass:** Versions shown, no build errors

---

## 🚨 TROUBLESHOOTING

### Admin won't build

```bash
cd apps/admin
rm -rf .next node_modules
pnpm install
pnpm build
```

### Client mobile crashes

```bash
cd apps/client-mobile
npm start -- --reset-cache
# Delete app from simulator
npm run ios
```

### Android build fails

```bash
cd apps/admin/android
./gradlew clean
./gradlew --refresh-dependencies
./gradlew assembleDebug
```

### WhatsApp OTP not working

```bash
# Check function logs
supabase functions logs send-whatsapp-otp --tail 20

# Test manually
curl -X POST "$SUPABASE_URL/functions/v1/send-whatsapp-otp" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+250788123456"}'
```

---

## ✅ SUCCESS CHECKLIST

- [ ] Backend: Migrations applied (45+), Functions deployed (30+)
- [ ] Admin PWA: Builds, runs, no errors at http://localhost:3000
- [ ] Client Mobile: Runs on iOS + Android, login works
- [ ] Staff Android: APK installs, QR + NFC work
- [ ] Integration: Deposit → Reconcile → Loan flow completes
- [ ] No console errors in any app
- [ ] All automated tests pass

---

## 📝 REPORT RESULTS

After testing, update status:

```bash
echo "✅ Backend: [PASS/FAIL]" >> TEST_RESULTS.txt
echo "✅ Admin PWA: [PASS/FAIL]" >> TEST_RESULTS.txt
echo "✅ Client Mobile iOS: [PASS/FAIL]" >> TEST_RESULTS.txt
echo "✅ Client Mobile Android: [PASS/FAIL]" >> TEST_RESULTS.txt
echo "✅ Staff Android: [PASS/FAIL]" >> TEST_RESULTS.txt
echo "✅ Integration: [PASS/FAIL]" >> TEST_RESULTS.txt
cat TEST_RESULTS.txt
```

---

**Time Investment:**

- Quick health check: 5 min
- Basic testing: 45 min
- Full integration test: 2 hours

**Next:** If all pass → Production deployment. If issues → Check
TESTING_GUIDE.md for detailed debugging.

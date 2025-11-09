# 🚀 Testing Quick Start

**Get testing in under 5 minutes**

---

## Prerequisites

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Or source from .env
source .env
```

---

## Quick Test Commands

### 1. Backend (5 min)

```bash
cd /Users/jeanbosco/workspace/ibimina

# Test database
supabase db push --dry-run

# Test RLS policies
pnpm test:rls

# Test Edge Functions
supabase functions list
```

### 2. Staff Admin PWA (Quick smoke test - 5 min)

```bash
cd apps/admin
pnpm dev

# Open http://localhost:3100
# Login with test credentials
# Check dashboard loads
```

### 3. Staff Android (Quick build - 10 min)

```bash
cd apps/admin/android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 4. Client Mobile (Quick start - 5 min)

```bash
cd apps/client-mobile

# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

---

## Interactive Testing Script

```bash
cd /Users/jeanbosco/workspace/ibimina
./start-testing.sh
```

**Menu options:**

1. Backend/Supabase (30 min)
2. Staff Admin PWA (1 hour)
3. Staff Android App (2 hours)
4. Client Mobile App (2 hours)
5. Integration Testing (2 hours)
6. Production Readiness (1 hour)
7. Run all tests (9 hours)

---

## Critical Test Paths

### Path 1: Authentication Flow (10 min)

1. Open Staff PWA → Login
2. Logout → Click "QR Login"
3. Open Staff Android → Scan QR
4. Approve → PWA logs in

**Expected:** Seamless QR authentication ✅

### Path 2: Payment Flow (15 min)

1. Client app → Deposit
2. Staff Android → TapMoMo (activate NFC)
3. Client taps phone
4. Client completes USSD
5. Check transaction in both apps

**Expected:** Payment recorded in both systems ✅

### Path 3: SMS Reconciliation (10 min)

1. Make real MoMo deposit
2. Staff phone receives SMS
3. Staff app auto-detects
4. Staff confirms
5. Client balance updates

**Expected:** Automatic reconciliation ✅

---

## Test Accounts

### Staff Admin

```
Email: admin@ibimina.rw
Password: [from seed data]
```

### Client (WhatsApp OTP)

```
Phone: +250788123456
OTP: [sent via WhatsApp]
```

---

## Quick Troubleshooting

### "Supabase connection failed"

```bash
# Verify env
echo $SUPABASE_URL

# Test connection
curl "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY"
```

### "Build failed"

```bash
# Clear caches
pnpm clean
rm -rf node_modules
pnpm install
```

### "NFC not working"

```bash
# Check NFC enabled
adb shell settings get global nfc_on

# Should return: 1
```

---

## Test Status Tracking

Use this checklist as you test:

```bash
# Backend
[ ] Database tables exist
[ ] Edge Functions deployed
[ ] RLS policies pass

# Staff PWA
[ ] Login works
[ ] Dashboard loads
[ ] CRUD operations work
[ ] PWA installable

# Staff Android
[ ] QR auth works
[ ] SMS reader works
[ ] TapMoMo works

# Client Mobile
[ ] Onboarding smooth
[ ] WhatsApp OTP works
[ ] Transactions work
[ ] Offline sync works

# Integration
[ ] End-to-end payment works
[ ] SMS reconciliation works
[ ] QR auth works
```

---

## Next Steps

After quick tests pass:

1. Read full guide: `COMPREHENSIVE_TESTING_GUIDE.md`
2. Run integration tests (section 5)
3. Production readiness checks (section 6)
4. Deploy to production

---

## Support

- **Full Guide:** COMPREHENSIVE_TESTING_GUIDE.md
- **System Status:** PRODUCTION_READY_SUMMARY.md
- **Issues:** GitHub Issues

**Ready to test!** Start with: `./start-testing.sh`

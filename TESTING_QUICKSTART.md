# 🎯 Ibimina Testing - Quick Start

## Prerequisites

```bash
# Set environment variables
export SUPABASE_URL="https://vacltfdslodqybxojytc.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Quick Start

### Option 1: Interactive Script (Recommended)

```bash
cd /Users/jeanbosco/workspace/ibimina
./scripts/test-system.sh
```

This script guides you through:

1. Backend/Supabase (30 min)
2. Staff Admin PWA (45 min)
3. Staff Mobile Android (60 min)
4. Client Mobile App (60 min)
5. Integration Tests (45 min)
6. Full Suite (4 hours)
7. Quick Health Check (5 min)

### Option 2: Manual Testing

Follow the detailed guide:

```bash
cat TESTING_GUIDE.md
```

## Critical Test Paths

### 1. Backend Health Check (5 min)

```bash
# Test Supabase connection
curl "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_ANON_KEY"

# List functions
supabase functions list

# Check tables
supabase db dump --schema public > /tmp/schema.sql
```

### 2. Staff PWA (15 min)

```bash
# Start dev server
pnpm --filter @ibimina/admin dev

# Open http://localhost:3000
# Login → Dashboard → Users → Create/Edit
```

### 3. Client Mobile (20 min)

```bash
cd apps/client-mobile

# iOS
npx react-native run-ios

# Android
npx react-native run-android

# Test WhatsApp OTP login
# Test deposit flow
```

### 4. SMS Reconciliation E2E (10 min)

**Requires:**

- Client mobile (device A)
- Staff Android with SIM (device B)

**Steps:**

1. Client: Deposit 5000 RWF via MoMo
2. MoMo: Sends SMS to staff device
3. Staff app: Auto-detects SMS, parses, sends to backend
4. Backend: Reconciles transaction
5. Client: Balance updated

**Expected:** < 2 minutes from MoMo to balance update

### 5. TapMoMo NFC E2E (10 min)

**Requires:**

- 2 Android devices with NFC

**Steps:**

1. Merchant: "Get Paid" → Activate NFC (2500 RWF)
2. Customer: "Pay" → Hold devices together
3. Customer: USSD launches → Complete payment
4. MoMo: SMS to merchant → Auto-reconciled

**Expected:** < 1 minute from tap to settlement

## Success Criteria

✅ **Go Live** if:

- [ ] All backend functions deployed
- [ ] Staff PWA installable and works offline
- [ ] Staff Android scans QR and reads SMS
- [ ] Client mobile WhatsApp auth works
- [ ] SMS reconciliation E2E < 2 min
- [ ] TapMoMo E2E < 1 min
- [ ] No critical security issues

❌ **No-Go** if:

- Any critical path fails
- Security vulnerabilities found
- Performance < 2 seconds for key actions

## Troubleshooting

### Common Issues

**"Cannot connect to Supabase"**

```bash
# Check credentials
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY | cut -c1-20
```

**"NFC not working"**

- Enable NFC in Settings
- Device must be unlocked
- Hold back-to-back (center-top)
- API level >= 26

**"SMS not detected"**

- Grant SMS permission
- Test with real MoMo SMS
- Check filter: "MTN", "AIRTEL"

**"WhatsApp OTP not received"**

- Check Meta Business Manager
- Verify template approved
- Account balance > $0

## Full Documentation

- **Complete Guide:** `TESTING_GUIDE.md` (25kb, 600+ lines)
- **Architecture:** `docs/ARCHITECTURE.md`
- **Deployment:** `docs/DEPLOYMENT.md`
- **API Reference:** `docs/API.md`

## Support

- **GitHub Issues:** https://github.com/ikanisa/ibimina/issues
- **Documentation:** `/docs` folder

---

**Last Updated:** 2025-11-04  
**System Version:** 1.0.0  
**Testing Time:** 4 hours (full suite) or 1 hour (critical paths)

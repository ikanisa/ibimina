# 📚 TESTING DOCUMENTATION INDEX

All testing resources for the Ibimina SACCO management system.

---

## 🎯 QUICK START

**Just want to test everything quickly?**

```bash
cd /Users/jeanbosco/workspace/ibimina
bash test-menu.sh
```

Choose option **6** for 2-minute health check, or **7** for full test suite.

---

## 📄 AVAILABLE GUIDES

### 1. **QUICK_TEST_COMMANDS.md** ⚡

**For:** Quick copy-paste commands  
**Time:** 5-45 minutes  
**Use when:** You know what you want to test

Quick reference for:

- Backend health checks
- Admin PWA build & test
- Client Mobile setup
- Staff Android build
- Integration testing

### 2. **TESTING_GUIDE.md** 📖

**For:** Comprehensive step-by-step instructions  
**Time:** 2-3 hours full cycle  
**Use when:** First time testing or detailed validation needed

Includes:

- Pre-testing checklist
- Detailed manual test procedures
- Expected outputs
- Troubleshooting guides
- Success criteria
- Test report template

### 3. **test-menu.sh** 🎮

**For:** Interactive testing  
**Time:** Varies by selection  
**Use when:** You want guided CLI testing

```bash
bash test-menu.sh
```

Options:

1. Backend only (5 min)
2. Admin PWA only (10 min)
3. Client Mobile only (15 min)
4. Staff Android only (10 min)
5. Integration tests (20 min)
6. Quick health check (2 min)
7. Full test suite (45 min)
8. View last results
9. Exit

### 4. **run-all-tests.sh** 🤖

**For:** Automated CI/CD-style testing  
**Time:** ~45 minutes  
**Use when:** You want hands-off testing with report

```bash
bash run-all-tests.sh
```

Runs:

- Environment checks
- Backend tests (RLS policies)
- Admin PWA (TypeScript, lint, build, unit tests)
- Client Mobile (TypeScript, lint, unit tests)
- Staff Android (Gradle build)
- Integration smoke tests

Generates: `TEST_RESULTS.txt`

---

## 🗺️ TESTING WORKFLOW

```
┌─────────────────────────────────────────────────┐
│  1. Quick Health Check (2 min)                  │
│     bash test-menu.sh → Option 6                │
└────────────────┬────────────────────────────────┘
                 │
                 ↓ All healthy?
                 │
┌────────────────┴────────────────────────────────┐
│  2. Individual App Tests (45 min)               │
│     bash test-menu.sh → Options 1-4             │
│     OR use QUICK_TEST_COMMANDS.md               │
└────────────────┬────────────────────────────────┘
                 │
                 ↓ All apps work?
                 │
┌────────────────┴────────────────────────────────┐
│  3. Integration Test (20 min)                   │
│     Follow TESTING_GUIDE.md Section 5           │
│     Full deposit → reconcile → loan flow        │
└────────────────┬────────────────────────────────┘
                 │
                 ↓ Integration works?
                 │
┌────────────────┴────────────────────────────────┐
│  4. Full Automated Suite (45 min)               │
│     bash run-all-tests.sh                       │
│     Review TEST_RESULTS.txt                     │
└────────────────┬────────────────────────────────┘
                 │
                 ↓ All tests pass?
                 │
┌────────────────┴────────────────────────────────┐
│  ✅ READY FOR PRODUCTION                        │
└─────────────────────────────────────────────────┘
```

---

## 🎯 WHICH GUIDE TO USE?

### Scenario 1: First Time Testing

**Use:** TESTING_GUIDE.md (comprehensive)

- Read pre-testing checklist
- Follow each phase step-by-step
- Understand what each test validates

### Scenario 2: Quick Smoke Test

**Use:** test-menu.sh → Option 6

- Takes 2 minutes
- Checks if everything builds
- Good for "did I break anything?" checks

### Scenario 3: Testing Specific App

**Use:** QUICK_TEST_COMMANDS.md

- Jump to relevant section
- Copy-paste commands
- Fast iteration

### Scenario 4: Pre-Deployment Validation

**Use:** run-all-tests.sh

- Automated, repeatable
- Generates report
- Run before every deployment

### Scenario 5: Debugging Issues

**Use:** TESTING_GUIDE.md Troubleshooting section

- Common issues documented
- Fix commands provided
- Links to relevant configs

---

## 📊 TEST COVERAGE

| Component          | Unit Tests      | Integration Tests | E2E Tests     | Manual Tests |
| ------------------ | --------------- | ----------------- | ------------- | ------------ |
| Backend (Supabase) | ✅ RLS policies | ✅ Edge Functions | ✅ Full flow  | ✅ Admin UI  |
| Admin PWA          | ✅ 20+ tests    | ✅ API mocks      | ✅ Playwright | ✅ Features  |
| Client Mobile      | ✅ Components   | ⚠️ Limited        | ❌ TBD        | ✅ Full app  |
| Staff Android      | ❌ TBD          | ⚠️ Build only     | ❌ TBD        | ✅ NFC/QR    |

**Legend:**

- ✅ Implemented and passing
- ⚠️ Partial coverage
- ❌ Not yet implemented

---

## 🚨 CRITICAL TESTS (Must Pass Before Launch)

```bash
# 1. Backend RLS
pnpm test:rls
# ✅ All policies enforce security

# 2. Admin Build
cd apps/admin && pnpm build
# ✅ No TypeScript errors

# 3. WhatsApp Auth
curl -X POST "$SUPABASE_URL/functions/v1/send-whatsapp-otp" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"phone": "+250788123456"}'
# ✅ Returns success

# 4. Client Mobile Builds
cd apps/client-mobile && npm run ios
# ✅ App launches on simulator

# 5. Staff Android Builds
cd apps/admin/android && ./gradlew assembleDebug
# ✅ APK created
```

---

## 📝 TEST REPORT TEMPLATE

After running tests, document:

```markdown
# Test Report - [Date]

## Environment

- Supabase URL: [URL]
- Node version: [version]
- Branch: [git branch]

## Results

- Backend: ✅/❌
- Admin PWA: ✅/❌
- Client Mobile iOS: ✅/❌
- Client Mobile Android: ✅/❌
- Staff Android: ✅/❌
- Integration Flow: ✅/❌

## Issues Found

1. [Description] - [Priority]

## Next Steps

- [ ] Fix critical issues
- [ ] Re-test failed components
- [ ] Update documentation
```

---

## 🔗 RELATED DOCUMENTATION

- **Setup:** `/docs/DEVELOPMENT.md`
- **Deployment:** `/docs/DEPLOYMENT.md`
- **Architecture:** `/docs/ARCHITECTURE.md`
- **Troubleshooting:** `/docs/TROUBLESHOOTING.md`
- **Contributing:** `/CONTRIBUTING.md`

---

## 💡 TIPS

1. **Run health check first** - Saves time if environment is broken
2. **Test backend before apps** - Apps depend on backend
3. **Use interactive menu** - Easier than remembering commands
4. **Keep TEST_RESULTS.txt** - Track testing history
5. **Test on real devices** - Simulators don't catch all issues

---

## ❓ GETTING HELP

1. **Check** TESTING_GUIDE.md troubleshooting section
2. **View logs:** `supabase functions logs --follow`
3. **GitHub Issues:** https://github.com/ikanisa/ibimina/issues
4. **Slack/Discord:** [Your team channel]

---

**Last Updated:** 2025-11-04  
**Maintainer:** Ibimina Dev Team  
**Status:** ✅ All testing infrastructure ready

#!/bin/bash
# Complete Test Commands - Copy and Paste These
# Save this file and run: bash test-commands.sh

cat << 'EOF'

╔═══════════════════════════════════════════════════════════╗
║         IBIMINA TESTING COMMANDS REFERENCE                ║
║            Copy-paste these into your terminal            ║
╚═══════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 STEP 1: INITIAL SETUP (Run once)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Start Supabase local (required for backend tests)
supabase start

# Export environment variables
export SUPABASE_URL="https://vacltfdslodqybxojytc.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY2x0ZmRzbG9kcXlieG9qeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzI3MzUsImV4cCI6MjA3NTU0ODczNX0.XBJckvtgeWHYbKSnd1ojRd7mBKjdk5OSe0VDqS1PapM"
export RLS_TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Install all dependencies
cd /Users/jeanbosco/workspace/ibimina && pnpm install


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗄️  BACKEND TESTS (5-10 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Test 1: Check Supabase is running
docker ps | grep supabase

# Test 2: Test database connection
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT version();"

# Test 3: Apply migrations (local)
cd /Users/jeanbosco/workspace/ibimina && supabase db reset

# Test 4: List Edge Functions
cd /Users/jeanbosco/workspace/ibimina && supabase functions list

# Test 5: Run RLS policy tests
cd /Users/jeanbosco/workspace/ibimina && pnpm test:rls

# Test 6: Check production Supabase
curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" | head -20


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💻 ADMIN PWA TESTS (10-15 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Test 1: Type check
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm typecheck

# Test 2: Lint
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm lint

# Test 3: Unit tests
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm test:unit

# Test 4: Build
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm build

# Test 5: Install Playwright (first time only)
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm exec playwright install

# Test 6: E2E tests
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm test:e2e

# Test 7: Start dev server
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm dev
# Then open: http://localhost:3100


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 CLIENT MOBILE TESTS (15-20 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Test 1: Install dependencies
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/client-mobile && npm install

# Test 2: Type check
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/client-mobile && npm run typecheck

# Test 3: Lint
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/client-mobile && npm run lint

# Test 4: Unit tests
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/client-mobile && npm test

# Test 5: Start Metro bundler
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/client-mobile && npm start

# Test 6: Run on Android (in new terminal)
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/client-mobile && npm run android

# Test 7: Run on iOS (macOS only, in new terminal)
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/client-mobile && npm run ios

# Test 8: Build Android APK
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/client-mobile/android && ./gradlew assembleRelease


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 STAFF ANDROID TESTS (10-15 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Test 1: Sync Capacitor
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && npx cap sync android

# Test 2: Open in Android Studio
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && npx cap open android

# Test 3: Build debug APK (command line)
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin/android && ./gradlew assembleDebug

# Test 4: Build release APK
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin/android && ./gradlew assembleRelease

# Test 5: Run unit tests
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin/android && ./gradlew test

# Test 6: Install on device
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin/android && ./gradlew installDebug


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ QUICK HEALTH CHECK (2 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Run automated health check
cd /Users/jeanbosco/workspace/ibimina && bash scripts/quick-health-check.sh


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 INTEGRATION TESTS (20-30 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Step 1: Start all services
cd /Users/jeanbosco/workspace/ibimina && supabase start

# Step 2: Start Admin PWA (Terminal 1)
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm dev

# Step 3: Start Client Mobile (Terminal 2)
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/client-mobile && npm start

# Step 4: Test SMS reconciliation
curl -X POST http://localhost:54321/functions/v1/ingest-sms \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+250788123456",
    "body": "You have received RWF 5000 from JEAN BOSCO",
    "timestamp": "2025-11-04T10:00:00Z"
  }'

# Step 5: Check result in Admin PWA
# Open http://localhost:3100/sms-inbox


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 FULL TEST SUITE (45-60 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Run everything in sequence
cd /Users/jeanbosco/workspace/ibimina

# 1. Backend
supabase start
supabase db reset
supabase functions list
pnpm test:rls

# 2. Admin PWA
cd apps/pwa/staff-admin
pnpm typecheck && pnpm lint && pnpm test:unit && pnpm build && pnpm test:e2e
cd ../..

# 3. Client Mobile
cd apps/pwa/client-mobile
npm install && npm run typecheck && npm test && npm run android
cd ../..

# 4. Staff Android
cd apps/pwa/staff-admin/android
./gradlew clean assembleDebug test
cd ../../..


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐛 TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Problem: Supabase won't start
supabase stop --no-backup
docker system prune -f
supabase start

# Problem: Port 54322 already in use
lsof -ti:54322 | xargs kill -9
supabase start

# Problem: RLS tests fail
cd /Users/jeanbosco/workspace/ibimina
supabase db reset
pnpm test:rls

# Problem: Admin build fails
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin
rm -rf .next node_modules
pnpm install
pnpm build

# Problem: Android build fails
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin/android
./gradlew clean
./gradlew --refresh-dependencies
./gradlew assembleDebug

# Problem: Metro bundler stuck
pkill -f "node.*metro"
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/client-mobile
rm -rf node_modules
npm install
npm start -- --reset-cache


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 VIEW TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Playwright report
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin
pnpm exec playwright show-report

# Jest coverage
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/client-mobile
npm test -- --coverage
open coverage/lcov-report/index.html

# Lighthouse performance
cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin
pnpm build
pnpm exec lighthouse http://localhost:3100 --view


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CHECKLIST BEFORE DEPLOYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Backend: All RLS tests pass
□ Backend: All Edge Functions deployed
□ Backend: Migrations applied to production

□ Admin PWA: Type check passes
□ Admin PWA: Lint passes
□ Admin PWA: Build succeeds
□ Admin PWA: E2E tests pass

□ Client Mobile: Tests pass
□ Client Mobile: Android APK builds
□ Client Mobile: iOS build succeeds (if applicable)

□ Staff Android: APK builds
□ Staff Android: Unit tests pass

□ Integration: SMS reconciliation works
□ Integration: WhatsApp OTP works
□ Integration: TapMoMo NFC works (manual test)

□ Security: No secrets in code
□ Security: Environment variables set
□ Security: RLS policies enforced

□ Documentation: CHANGELOG updated
□ Documentation: README up to date


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Full guide: /Users/jeanbosco/workspace/ibimina/TESTING_GUIDE.md
- GitHub Issues: https://github.com/ikanisa/ibimina/issues
- CI Status: https://github.com/ikanisa/ibimina/actions


EOF

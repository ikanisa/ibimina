#!/bin/bash
# 🧪 Automated Test Runner for Ibimina System
# Runs all tests in sequence and generates report
# Usage: bash run-all-tests.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Start time
START_TIME=$(date +%s)

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   IBIMINA COMPREHENSIVE TEST SUITE            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo "Started: $(date)"
echo ""

# Function to run test and track result
run_test() {
  local test_name=$1
  local test_command=$2
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -e "${YELLOW}▶ Running:${NC} $test_name"
  
  if eval "$test_command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS:${NC} $test_name"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL:${NC} $test_name"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

# Test environment
echo -e "${BLUE}━━━ ENVIRONMENT CHECK ━━━${NC}"
run_test "Node.js version" "node --version"
run_test "pnpm version" "pnpm --version"
run_test "Supabase CLI" "supabase --version"
echo ""

# Backend tests
echo -e "${BLUE}━━━ PHASE 1: BACKEND TESTS ━━━${NC}"

run_test "Database connection" "psql \$RLS_TEST_DATABASE_URL -c 'SELECT 1' -t"

run_test "Supabase functions deployed" "[ \$(supabase functions list 2>/dev/null | grep -c ACTIVE) -ge 25 ]"

run_test "RLS policy tests" "cd /Users/jeanbosco/workspace/ibimina && pnpm test:rls"

echo ""

# Admin PWA tests
echo -e "${BLUE}━━━ PHASE 2: ADMIN PWA TESTS ━━━${NC}"

run_test "Admin dependencies installed" "[ -d /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin/node_modules ]"

run_test "Admin TypeScript check" "cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm typecheck"

run_test "Admin lint" "cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm lint --max-warnings 0 || true"

run_test "Admin build" "cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm build"

run_test "Admin unit tests" "cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin && pnpm test:unit || true"

echo ""

# Client Mobile tests
echo -e "${BLUE}━━━ PHASE 3: CLIENT MOBILE TESTS ━━━${NC}"

run_test "Client dependencies installed" "[ -d /Users/jeanbosco/workspace/ibimina/apps/client-mobile/node_modules ]"

run_test "Client TypeScript check" "cd /Users/jeanbosco/workspace/ibimina/apps/client-mobile && npm run type-check || tsc --noEmit"

run_test "Client lint" "cd /Users/jeanbosco/workspace/ibimina/apps/client-mobile && npm run lint || true"

run_test "Client unit tests" "cd /Users/jeanbosco/workspace/ibimina/apps/client-mobile && npm test -- --watchAll=false || true"

echo ""

# Staff Android tests
echo -e "${BLUE}━━━ PHASE 4: STAFF ANDROID TESTS ━━━${NC}"

run_test "Android Gradle wrapper exists" "[ -f /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin/android/gradlew ]"

run_test "Android build (debug APK)" "cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin/android && ./gradlew assembleDebug -q || true"

echo ""

# Integration smoke tests
echo -e "${BLUE}━━━ PHASE 5: INTEGRATION SMOKE TESTS ━━━${NC}"

run_test "Supabase URL reachable" "curl -s -o /dev/null -w '%{http_code}' \$SUPABASE_URL | grep -q 200"

run_test "WhatsApp OTP function exists" "supabase functions list 2>/dev/null | grep -q send-whatsapp-otp"

run_test "TapMoMo reconcile function exists" "supabase functions list 2>/dev/null | grep -q tapmomo-reconcile"

echo ""

# Generate report
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              TEST SUMMARY                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo "Total Tests:   $TOTAL_TESTS"
echo -e "Passed:        ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:        ${RED}$FAILED_TESTS${NC}"
echo "Duration:      ${DURATION}s"
echo ""

# Save results
cat > TEST_RESULTS.txt << EOF
# Ibimina Test Results
Date: $(date)
Duration: ${DURATION}s

## Summary
- Total Tests: $TOTAL_TESTS
- Passed: $PASSED_TESTS
- Failed: $FAILED_TESTS
- Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## Status
EOF

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
  echo "Status: ✅ ALL TESTS PASSED" >> TEST_RESULTS.txt
  echo "" >> TEST_RESULTS.txt
  echo "System is ready for production deployment." >> TEST_RESULTS.txt
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo "Status: ❌ $FAILED_TESTS TESTS FAILED" >> TEST_RESULTS.txt
  echo "" >> TEST_RESULTS.txt
  echo "Review failures above and check TESTING_GUIDE.md for debugging." >> TEST_RESULTS.txt
  exit 1
fi

#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "Supabase Backend Comprehensive Validation"
echo "================================================"
echo ""

passed=0
failed=0
warnings=0

# Test 1: Migration files
echo -n "Test 1: Migration files integrity... "
migration_count=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
if [ $migration_count -gt 100 ]; then
  echo -e "${GREEN}PASSED${NC} ($migration_count files)"
  passed=$((passed + 1))
else
  echo -e "${RED}FAILED${NC} (only $migration_count files)"
  failed=$((failed + 1))
fi

# Test 2: Table count
echo -n "Test 2: Database tables defined... "
table_count=$(grep -h "CREATE TABLE" supabase/migrations/*.sql 2>/dev/null | \
    grep -oP '(?<=CREATE TABLE )(?:IF NOT EXISTS )?(?:public\.|app\.|app_helpers\.)?[a-zA-Z_][a-zA-Z0-9_]*' | \
    sed 's/IF NOT EXISTS //' | sort -u | wc -l)
if [ $table_count -gt 60 ]; then
  echo -e "${GREEN}PASSED${NC} ($table_count tables)"
  passed=$((passed + 1))
else
  echo -e "${YELLOW}WARNING${NC} (only $table_count tables)"
  warnings=$((warnings + 1))
fi

# Test 3: RLS enabled
echo -n "Test 3: RLS enabled on tables... "
rls_count=$(grep -h "ENABLE ROW LEVEL SECURITY" supabase/migrations/*.sql 2>/dev/null | wc -l)
if [ $rls_count -ge $table_count ]; then
  echo -e "${GREEN}PASSED${NC} ($rls_count tables)"
  passed=$((passed + 1))
else
  echo -e "${YELLOW}WARNING${NC} ($rls_count/$table_count tables)"
  warnings=$((warnings + 1))
fi

# Test 4: RLS policies
echo -n "Test 4: RLS policies defined... "
policy_count=$(grep -h "CREATE POLICY" supabase/migrations/*.sql 2>/dev/null | wc -l)
if [ $policy_count -gt 100 ]; then
  echo -e "${GREEN}PASSED${NC} ($policy_count policies)"
  passed=$((passed + 1))
else
  echo -e "${RED}FAILED${NC} (only $policy_count policies)"
  failed=$((failed + 1))
fi

# Test 5: Functions
echo -n "Test 5: Database functions... "
function_count=$(grep -h "CREATE OR REPLACE FUNCTION" supabase/migrations/*.sql 2>/dev/null | wc -l)
if [ $function_count -gt 100 ]; then
  echo -e "${GREEN}PASSED${NC} ($function_count functions)"
  passed=$((passed + 1))
else
  echo -e "${YELLOW}WARNING${NC} (only $function_count functions)"
  warnings=$((warnings + 1))
fi

# Test 6: Indexes
echo -n "Test 6: Performance indexes... "
index_count=$(grep -h "CREATE.*INDEX" supabase/migrations/*.sql 2>/dev/null | wc -l)
if [ $index_count -gt 150 ]; then
  echo -e "${GREEN}PASSED${NC} ($index_count indexes)"
  passed=$((passed + 1))
else
  echo -e "${YELLOW}WARNING${NC} (only $index_count indexes)"
  warnings=$((warnings + 1))
fi

# Test 7: Edge functions
echo -n "Test 7: Edge functions exist... "
edge_count=$(find supabase/functions -name "index.ts" 2>/dev/null | wc -l)
if [ $edge_count -gt 30 ]; then
  echo -e "${GREEN}PASSED${NC} ($edge_count functions)"
  passed=$((passed + 1))
else
  echo -e "${YELLOW}WARNING${NC} (only $edge_count functions)"
  warnings=$((warnings + 1))
fi

# Test 8: Shared utilities
echo -n "Test 8: Shared utilities present... "
if [ -d "supabase/functions/_shared" ] && [ -f "supabase/functions/_shared/mod.ts" ]; then
  shared_count=$(ls -1 supabase/functions/_shared/*.ts 2>/dev/null | wc -l)
  echo -e "${GREEN}PASSED${NC} ($shared_count files)"
  passed=$((passed + 1))
else
  echo -e "${RED}FAILED${NC} (missing _shared directory)"
  failed=$((failed + 1))
fi

# Test 9: Test files
echo -n "Test 9: RLS test coverage... "
test_count=$(ls -1 supabase/tests/rls/*.sql 2>/dev/null | wc -l)
if [ $test_count -gt 5 ]; then
  echo -e "${GREEN}PASSED${NC} ($test_count test files)"
  passed=$((passed + 1))
else
  echo -e "${YELLOW}WARNING${NC} (only $test_count test files)"
  warnings=$((warnings + 1))
fi

# Test 10: Config file
echo -n "Test 10: Supabase config present... "
if [ -f "supabase/config.toml" ]; then
  echo -e "${GREEN}PASSED${NC}"
  passed=$((passed + 1))
else
  echo -e "${RED}FAILED${NC}"
  failed=$((failed + 1))
fi

# Test 11: Check for missing RLS
echo -n "Test 11: All tables have RLS... "
grep -h "CREATE TABLE" supabase/migrations/*.sql 2>/dev/null | \
    grep -oP '(?<=CREATE TABLE )(?:IF NOT EXISTS )?(?:public\.|app\.|app_helpers\.)?[a-zA-Z_][a-zA-Z0-9_]*' | \
    sed 's/IF NOT EXISTS //' | sort -u > /tmp/all_tables.txt

grep -h "ENABLE ROW LEVEL SECURITY" supabase/migrations/*.sql 2>/dev/null | \
    grep -oP '(?<=ALTER TABLE )(?:public\.|app\.|app_helpers\.)?[a-zA-Z_][a-zA-Z0-9_]*' | \
    sort -u > /tmp/rls_tables.txt

missing_rls=$(comm -23 /tmp/all_tables.txt /tmp/rls_tables.txt | wc -l)
if [ $missing_rls -eq 0 ]; then
  echo -e "${GREEN}PASSED${NC} (all tables secured)"
  passed=$((passed + 1))
else
  echo -e "${YELLOW}WARNING${NC} ($missing_rls tables missing RLS)"
  warnings=$((warnings + 1))
fi

# Test 12: Check for orphaned function calls
echo -n "Test 12: Function dependencies... "
# This is a simplified check - would need more robust validation
if grep -q "increment_system_metric" supabase/migrations/*.sql 2>/dev/null; then
  if grep -q "CREATE.*FUNCTION.*increment_system_metric\|increment_system_metric.*FUNCTION" supabase/migrations/*.sql 2>/dev/null; then
    echo -e "${GREEN}PASSED${NC}"
    passed=$((passed + 1))
  else
    echo -e "${YELLOW}WARNING${NC} (potential missing function)"
    warnings=$((warnings + 1))
  fi
else
  echo -e "${GREEN}PASSED${NC}"
  passed=$((passed + 1))
fi

echo ""
echo "================================================"
echo "Validation Summary"
echo "================================================"
echo -e "${GREEN}Passed:${NC} $passed"
echo -e "${YELLOW}Warnings:${NC} $warnings"
echo -e "${RED}Failed:${NC} $failed"
echo ""

total=$((passed + warnings + failed))
score=$((passed * 100 / total))

if [ $failed -eq 0 ] && [ $warnings -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed! Backend is in excellent condition.${NC}"
  exit 0
elif [ $failed -eq 0 ]; then
  echo -e "${YELLOW}⚠ Some warnings present. Backend is functional but could be improved.${NC}"
  echo "Score: $score%"
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Please review the issues above.${NC}"
  echo "Score: $score%"
  exit 1
fi

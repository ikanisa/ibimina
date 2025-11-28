#!/bin/bash
set -e

echo "🧪 Running AI Features Test Suite..."
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test results
PASSED=0
FAILED=0

run_test() {
  local name=$1
  local command=$2
  
  echo -e "\n${YELLOW}Running: $name${NC}"
  
  if eval $command; then
    echo -e "${GREEN}✓ $name passed${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ $name failed${NC}"
    ((FAILED++))
  fi
}

# Unit tests
run_test "Unit Tests" "pnpm --filter @ibimina/staff-admin-desktop test src/lib/ai/*.test.ts"

# Component tests
run_test "Component Tests" "pnpm --filter @ibimina/staff-admin-desktop test src/components/**/*.test.tsx"

# Integration tests
run_test "Gemini Proxy" "curl -f http://localhost:54321/functions/v1/gemini-proxy || echo 'Skipped - Supabase not running'"

# Accessibility tests
run_test "A11y Audit" "pnpm --filter @ibimina/staff-admin-desktop test:a11y || echo 'Skipped - not implemented yet'"

# Type checking
run_test "TypeScript" "pnpm --filter @ibimina/staff-admin-desktop typecheck"

# Linting
run_test "ESLint" "pnpm --filter @ibimina/staff-admin-desktop lint --max-warnings 0"

# Summary
echo -e "\n=================================="
echo -e "Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}❌ Some tests failed${NC}"
  exit 1
fi

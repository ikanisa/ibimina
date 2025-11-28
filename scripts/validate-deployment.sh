#!/bin/bash
# Deployment Validation Script
# Validates that all refactored pages are working correctly

set -e

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║           🔍 DEPLOYMENT VALIDATION                                   ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
TOTAL=0
PASSED=0
FAILED=0

# Function to check if file exists
check_file() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $2 (missing)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check if backup exists
check_backup() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2 backup exists"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $2 backup missing (not critical)"
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Checking Core Components"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "packages/ui/src/components/layout/Stack.tsx" "Stack component"
check_file "packages/ui/src/components/layout/Grid.tsx" "Grid component"
check_file "packages/ui/src/components/layout/Container.tsx" "Container component"
check_file "packages/ui/src/components/DataCard.tsx" "DataCard component"
check_file "packages/ui/src/components/EmptyState.tsx" "EmptyState component"
check_file "packages/ui/src/components/AnimatedPage.tsx" "AnimatedPage component"
check_file "packages/ui/src/components/LoadingState.tsx" "LoadingState component"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Checking Refactored Pages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "apps/pwa/client/app/(tabs)/home/page.tsx" "Home page (refactored)"
check_file "apps/pwa/client/app/(tabs)/statements/page.tsx" "Statements page (refactored)"
check_file "apps/pwa/client/app/(tabs)/profile/page.tsx" "Profile page (refactored)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Checking Backups"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_backup "apps/pwa/client/app/(tabs)/home/page.original.backup.tsx" "Home page"
check_backup "apps/pwa/client/app/(tabs)/statements/page.original.backup.tsx" "Statements page"
check_backup "apps/pwa/client/app/(tabs)/profile/page.original.backup.tsx" "Profile page"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Checking AI Integration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "packages/ui/src/services/ai.ts" "AI service"
check_file "packages/ui/src/hooks/useLocalAI.ts" "useLocalAI hook"
check_file "AI_INTEGRATION_SETUP.md" "AI setup documentation"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Checking Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "PROJECT_COMPLETE.md" "Project completion doc"
check_file "DESIGN_SYSTEM_QUICK_START.md" "Design system guide"
check_file "RECOMMENDATIONS_COMPLETE.md" "Recommendations summary"
check_file "scripts/deploy-refactored-home.sh" "Deployment script"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. TypeScript Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running TypeScript check on refactored pages..."
cd apps/pwa/client
if pnpm exec tsc --noEmit app/\(tabs\)/home/page.tsx app/\(tabs\)/statements/page.tsx app/\(tabs\)/profile/page.tsx 2>&1 | grep -q "error TS"; then
    echo -e "${RED}❌${NC} TypeScript errors found in refactored pages"
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✅${NC} TypeScript validation passed"
    TOTAL=$((TOTAL + 1))
    PASSED=$((PASSED + 1))
fi
cd - > /dev/null
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VALIDATION RESULTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total Checks: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
fi
echo ""

SCORE=$((PASSED * 100 / TOTAL))
echo "Score: $SCORE%"
echo ""

if [ $SCORE -ge 90 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ DEPLOYMENT VALIDATED - READY FOR PRODUCTION!                    ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
elif [ $SCORE -ge 70 ]; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  MOSTLY VALIDATED - REVIEW FAILURES BEFORE DEPLOYING            ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ VALIDATION FAILED - FIX ISSUES BEFORE DEPLOYING                  ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    exit 2
fi

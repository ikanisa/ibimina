#!/bin/bash
# 🎯 Interactive Test Menu - Choose what to test
# Usage: bash test-menu.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       IBIMINA TESTING MENU                        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo "Select what to test:"
echo ""
echo -e "${CYAN}1)${NC} 🗄️  Backend Only (Database + Functions) - 5 min"
echo -e "${CYAN}2)${NC} 💻 Admin PWA Only - 10 min"
echo -e "${CYAN}3)${NC} 📱 Client Mobile Only - 15 min"
echo -e "${CYAN}4)${NC} 🤖 Staff Android Only - 10 min"
echo -e "${CYAN}5)${NC} 🔗 Integration Tests Only - 20 min"
echo -e "${CYAN}6)${NC} ⚡ Quick Health Check (All apps) - 2 min"
echo -e "${CYAN}7)${NC} 🧪 Full Test Suite (Everything) - 45 min"
echo -e "${CYAN}8)${NC} 📊 View Last Test Results"
echo -e "${CYAN}9)${NC} 🚪 Exit"
echo ""
read -p "Enter choice [1-9]: " choice

case $choice in

  1)
    echo -e "${YELLOW}▶ Running Backend Tests...${NC}"
    echo ""
    
    echo "Testing database connection..."
    if psql "$RLS_TEST_DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
      echo -e "${GREEN}✅${NC} Database connected"
    else
      echo -e "${RED}❌${NC} Database connection failed"
    fi
    
    echo "Testing Supabase functions..."
    FUNC_COUNT=$(supabase functions list 2>/dev/null | grep -c ACTIVE || echo 0)
    if [ "$FUNC_COUNT" -ge 25 ]; then
      echo -e "${GREEN}✅${NC} $FUNC_COUNT functions deployed"
    else
      echo -e "${RED}❌${NC} Only $FUNC_COUNT functions found (expected 25+)"
    fi
    
    echo "Running RLS policy tests..."
    cd /Users/jeanbosco/workspace/ibimina
    if pnpm test:rls; then
      echo -e "${GREEN}✅${NC} RLS tests passed"
    else
      echo -e "${RED}❌${NC} RLS tests failed"
    fi
    ;;

  2)
    echo -e "${YELLOW}▶ Running Admin PWA Tests...${NC}"
    echo ""
    cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin
    
    echo "Type checking..."
    pnpm typecheck
    
    echo "Linting..."
    pnpm lint || true
    
    echo "Building..."
    pnpm build
    
    echo "Running unit tests..."
    pnpm test:unit || true
    
    echo ""
    echo -e "${GREEN}Done! Start dev server with:${NC} cd apps/pwa/staff-admin && pnpm dev"
    ;;

  3)
    echo -e "${YELLOW}▶ Running Client Mobile Tests...${NC}"
    echo ""
    cd /Users/jeanbosco/workspace/ibimina/apps/client-mobile
    
    echo "Type checking..."
    tsc --noEmit || true
    
    echo "Linting..."
    npm run lint || true
    
    echo "Running tests..."
    npm test -- --watchAll=false || true
    
    echo ""
    echo -e "${GREEN}Done! Start app with:${NC}"
    echo "  iOS:     cd apps/client-mobile && npm run ios"
    echo "  Android: cd apps/client-mobile && npm run android"
    ;;

  4)
    echo -e "${YELLOW}▶ Running Staff Android Tests...${NC}"
    echo ""
    cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin/android
    
    echo "Building debug APK..."
    ./gradlew assembleDebug
    
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$APK_PATH" ]; then
      echo -e "${GREEN}✅${NC} APK built: $APK_PATH"
      echo ""
      echo "Install with: adb install $APK_PATH"
    else
      echo -e "${RED}❌${NC} APK build failed"
    fi
    ;;

  5)
    echo -e "${YELLOW}▶ Running Integration Tests...${NC}"
    echo ""
    echo "This requires manual testing. Follow these steps:"
    echo ""
    echo "1. Start Admin PWA:"
    echo "   cd apps/pwa/staff-admin && pnpm dev"
    echo ""
    echo "2. Start Client Mobile (new terminal):"
    echo "   cd apps/client-mobile && npm start"
    echo "   npm run ios  # or android"
    echo ""
    echo "3. Follow integration test in TESTING_GUIDE.md"
    echo "   (Full deposit → reconciliation → loan approval flow)"
    ;;

  6)
    echo -e "${YELLOW}▶ Running Quick Health Check...${NC}"
    echo ""
    
    echo "✓ Checking Supabase..."
    curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" > /dev/null 2>&1 && \
      echo -e "${GREEN}✅${NC} Supabase reachable" || echo -e "${RED}❌${NC} Supabase unreachable"
    
    echo "✓ Checking Admin build..."
    cd /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin
    pnpm build > /dev/null 2>&1 && \
      echo -e "${GREEN}✅${NC} Admin builds" || echo -e "${RED}❌${NC} Admin build fails"
    
    echo "✓ Checking Client dependencies..."
    [ -d /Users/jeanbosco/workspace/ibimina/apps/client-mobile/node_modules ] && \
      echo -e "${GREEN}✅${NC} Client dependencies OK" || echo -e "${RED}❌${NC} Run: cd apps/client-mobile && npm install"
    
    echo "✓ Checking Staff Android..."
    [ -f /Users/jeanbosco/workspace/ibimina/apps/pwa/staff-admin/android/gradlew ] && \
      echo -e "${GREEN}✅${NC} Android project OK" || echo -e "${RED}❌${NC} Android project missing"
    
    echo ""
    echo -e "${GREEN}Health check complete!${NC}"
    ;;

  7)
    echo -e "${YELLOW}▶ Running Full Test Suite...${NC}"
    echo ""
    cd /Users/jeanbosco/workspace/ibimina
    bash run-all-tests.sh
    ;;

  8)
    if [ -f "TEST_RESULTS.txt" ]; then
      cat TEST_RESULTS.txt
    else
      echo "No test results found. Run tests first."
    fi
    ;;

  9)
    echo "Goodbye!"
    exit 0
    ;;

  *)
    echo -e "${RED}Invalid choice. Please select 1-9.${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo "Press Enter to return to menu..."
read
bash "$0"  # Re-run menu

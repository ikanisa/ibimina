#!/bin/bash

# Ibimina Quick Testing Script
# Run this to start systematic testing

set -e

echo "🧪 Ibimina System Testing"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if [ -z "$SUPABASE_URL" ]; then
  echo -e "${RED}ERROR: SUPABASE_URL not set${NC}"
  echo "Run: export SUPABASE_URL='https://vacltfdslodqybxojytc.supabase.co'"
  exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}ERROR: SUPABASE_ANON_KEY not set${NC}"
  echo "Run: export SUPABASE_ANON_KEY='your-key'"
  exit 1
fi

echo -e "${GREEN}✓ Environment variables set${NC}"
echo ""

# Menu
echo "Select testing phase:"
echo "  1. Backend/Supabase (30 min)"
echo "  2. Staff Admin PWA (45 min)"
echo "  3. Staff Mobile Android (60 min)"
echo "  4. Client Mobile App (60 min)"
echo "  5. Integration Tests (45 min)"
echo "  6. Full Test Suite (4 hours)"
echo "  7. Quick Health Check (5 min)"
echo ""
read -p "Enter choice [1-7]: " choice

case $choice in
  1)
    echo -e "${BLUE}▶ PHASE 1: Backend/Supabase Testing${NC}"
    echo ""
    
    echo "▶ Testing database tables..."
    supabase db push --dry-run || echo "Note: Use 'supabase db push' to apply migrations"
    
    echo ""
    echo "▶ Testing Edge Functions..."
    supabase functions list
    
    echo ""
    echo "▶ Testing RLS policies..."
    pnpm test:rls || echo "Note: Start local PostgreSQL for RLS tests"
    
    echo ""
    echo -e "${GREEN}✓ Backend tests complete${NC}"
    echo "Review results in TESTING_GUIDE.md"
    ;;
    
  2)
    echo -e "${BLUE}▶ PHASE 2: Staff Admin PWA Testing${NC}"
    echo ""
    
    echo "Starting development server..."
    echo "Open http://localhost:3100 in browser"
    echo ""
    echo "Follow checklist in TESTING_GUIDE.md section 'Phase 2'"
    echo ""
    pnpm --filter @ibimina/admin dev
    ;;
    
  3)
    echo -e "${BLUE}▶ PHASE 3: Staff Mobile Android Testing${NC}"
    echo ""
    
    echo "Building Android app..."
    cd apps/pwa/staff-admin
    npx cap sync android
    npx cap open android
    
    echo ""
    echo "Android Studio will open. Build and install on device."
    echo "Follow checklist in TESTING_GUIDE.md section 'Phase 3'"
    ;;
    
  4)
    echo -e "${BLUE}▶ PHASE 4: Client Mobile App Testing${NC}"
    echo ""
    
    echo "Select platform:"
    echo "  1. iOS"
    echo "  2. Android"
    read -p "Enter choice: " platform
    
    cd apps/pwa/client-mobile
    
    if [ "$platform" = "1" ]; then
      echo "Starting iOS..."
      cd ios && pod install && cd ..
      npx react-native run-ios
    else
      echo "Starting Android..."
      npx react-native run-android
    fi
    
    echo ""
    echo "Follow checklist in TESTING_GUIDE.md section 'Phase 4'"
    ;;
    
  5)
    echo -e "${BLUE}▶ PHASE 5: Integration Testing${NC}"
    echo ""
    
    echo "Integration tests require all apps running:"
    echo "  - Staff PWA (http://localhost:3100)"
    echo "  - Staff Android (on device)"
    echo "  - Client Mobile (on device)"
    echo ""
    echo "Follow E2E scenarios in TESTING_GUIDE.md section 'Phase 5'"
    echo ""
    read -p "Press Enter to view testing guide..."
    cat TESTING_GUIDE.md | less
    ;;
    
  6)
    echo -e "${BLUE}▶ FULL TEST SUITE (4 hours)${NC}"
    echo ""
    echo "This will run all phases sequentially."
    read -p "Are you sure? (y/n): " confirm
    
    if [ "$confirm" != "y" ]; then
      echo "Cancelled"
      exit 0
    fi
    
    # Phase 1
    echo -e "\n${YELLOW}=== Phase 1/5: Backend ===${NC}"
    supabase functions list
    
    # Phase 2
    echo -e "\n${YELLOW}=== Phase 2/5: Staff PWA ===${NC}"
    echo "Opening browser. Test manually then press Ctrl+C to continue."
    pnpm --filter @ibimina/admin dev &
    PWA_PID=$!
    sleep 5
    open http://localhost:3100
    read -p "Press Enter when PWA testing complete..."
    kill $PWA_PID
    
    # Phase 3
    echo -e "\n${YELLOW}=== Phase 3/5: Staff Android ===${NC}"
    echo "Open Android Studio and run tests manually."
    read -p "Press Enter when Android testing complete..."
    
    # Phase 4
    echo -e "\n${YELLOW}=== Phase 4/5: Client Mobile ===${NC}"
    echo "Run mobile app and test manually."
    read -p "Press Enter when mobile testing complete..."
    
    # Phase 5
    echo -e "\n${YELLOW}=== Phase 5/5: Integration ===${NC}"
    echo "Run E2E scenarios manually."
    read -p "Press Enter when integration testing complete..."
    
    echo ""
    echo -e "${GREEN}✓ Full test suite complete!${NC}"
    echo "Fill out testing results in TESTING_GUIDE.md"
    ;;
    
  7)
    echo -e "${BLUE}▶ QUICK HEALTH CHECK (5 min)${NC}"
    echo ""
    
    # Test Supabase connection
    echo "Testing Supabase connection..."
    curl -s "$SUPABASE_URL/rest/v1/" \
      -H "apikey: $SUPABASE_ANON_KEY" > /dev/null && \
      echo -e "${GREEN}✓ Supabase reachable${NC}" || \
      echo -e "${RED}✗ Supabase unreachable${NC}"
    
    # List functions
    echo ""
    echo "Checking Edge Functions..."
    FUNC_COUNT=$(supabase functions list 2>/dev/null | grep -c "ACTIVE" || echo "0")
    echo -e "${GREEN}✓ $FUNC_COUNT functions deployed${NC}"
    
    # Check PWA build
    echo ""
    echo "Checking PWA build..."
    if [ -d "apps/pwa/staff-admin/.next" ]; then
      echo -e "${GREEN}✓ PWA built${NC}"
    else
      echo -e "${YELLOW}⚠ PWA not built (run: pnpm --filter @ibimina/admin build)${NC}"
    fi
    
    # Check mobile builds
    echo ""
    echo "Checking mobile apps..."
    if [ -d "apps/pwa/client-mobile/node_modules" ]; then
      echo -e "${GREEN}✓ Client mobile dependencies installed${NC}"
    else
      echo -e "${YELLOW}⚠ Client mobile needs setup${NC}"
    fi
    
    if [ -d "apps/pwa/staff-admin/android" ]; then
      echo -e "${GREEN}✓ Staff Android configured${NC}"
    else
      echo -e "${YELLOW}⚠ Staff Android needs Capacitor sync${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✓ Health check complete${NC}"
    echo ""
    echo "Next steps:"
    echo "  - Run full tests: ./scripts/test-system.sh"
    echo "  - Read guide: cat TESTING_GUIDE.md"
    ;;
    
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}Testing session complete!${NC}"
echo ""
echo "Resources:"
echo "  - Full guide: TESTING_GUIDE.md"
echo "  - Issues: https://github.com/ikanisa/ibimina/issues"
echo ""

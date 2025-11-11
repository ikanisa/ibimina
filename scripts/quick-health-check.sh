#!/bin/bash
# Quick Health Check Script
# Verifies all systems are operational
# Run time: ~2 minutes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🏥 IBIMINA SYSTEM HEALTH CHECK"
echo "=============================="
echo ""

# Check 1: Supabase Local
echo -n "Checking Supabase local... "
if docker ps | grep -q supabase; then
  echo -e "${GREEN}✅ Running${NC}"
else
  echo -e "${YELLOW}⚠️  Not running (run 'supabase start')${NC}"
fi

# Check 2: Database Connection
echo -n "Checking database... "
if psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT 1" &>/dev/null; then
  echo -e "${GREEN}✅ Connected${NC}"
else
  echo -e "${YELLOW}⚠️  Cannot connect${NC}"
fi

# Check 3: Production Supabase
echo -n "Checking production Supabase... "
if [ -n "$SUPABASE_URL" ]; then
  if curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" | grep -q "200\|401"; then
    echo -e "${GREEN}✅ Online${NC}"
  else
    echo -e "${RED}❌ Cannot reach${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  SUPABASE_URL not set${NC}"
fi

# Check 4: Admin PWA
echo -n "Checking Admin PWA... "
cd apps/pwa/staff-admin
if pnpm typecheck --noEmit &>/dev/null; then
  echo -e "${GREEN}✅ Type-safe${NC}"
else
  echo -e "${RED}❌ Type errors${NC}"
fi
cd ../..

# Check 5: Client Mobile
echo -n "Checking Client Mobile... "
if [ -d "apps/pwa/client-mobile/node_modules" ]; then
  echo -e "${GREEN}✅ Dependencies OK${NC}"
else
  echo -e "${YELLOW}⚠️  Run 'npm install' in apps/pwa/client-mobile${NC}"
fi

# Check 6: Staff Android
echo -n "Checking Staff Android... "
if [ -f "apps/pwa/staff-admin/android/gradlew" ]; then
  echo -e "${GREEN}✅ Gradle ready${NC}"
else
  echo -e "${RED}❌ Capacitor not synced${NC}"
fi

# Check 7: Environment Variables
echo -n "Checking environment... "
missing=()
[ -z "$SUPABASE_URL" ] && missing+=("SUPABASE_URL")
[ -z "$SUPABASE_ANON_KEY" ] && missing+=("SUPABASE_ANON_KEY")

if [ ${#missing[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ All set${NC}"
else
  echo -e "${YELLOW}⚠️  Missing: ${missing[*]}${NC}"
fi

echo ""
echo "=============================="

# Summary
errors=$(grep -c "❌" <<< "$output" 2>/dev/null || echo "0")
warnings=$(grep -c "⚠️" <<< "$output" 2>/dev/null || echo "0")

if [ "$errors" -eq 0 ] && [ "$warnings" -eq 0 ]; then
  echo -e "${GREEN}✅ ALL SYSTEMS OPERATIONAL${NC}"
  exit 0
elif [ "$errors" -eq 0 ]; then
  echo -e "${YELLOW}⚠️  SOME WARNINGS - Check above${NC}"
  exit 0
else
  echo -e "${RED}❌ ERRORS FOUND - Fix before deploying${NC}"
  exit 1
fi

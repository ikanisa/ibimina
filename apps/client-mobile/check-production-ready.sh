#!/bin/bash

# Quick Production Checklist
# Run this script to verify all production requirements are met

set -e

echo "🔍 Ibimina Client Mobile - Production Readiness Check"
echo "======================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((CHECKS_FAILED++))
    fi
}

# 1. Check Node.js
echo "📦 Checking environment..."
node --version > /dev/null 2>&1
check "Node.js installed"

npm --version > /dev/null 2>&1
check "npm installed"

# 2. Check dependencies
echo ""
echo "📚 Checking dependencies..."
[ -d "node_modules" ]
check "node_modules exists"

[ -f "package-lock.json" ] || [ -f "yarn.lock" ] || [ -f "pnpm-lock.yaml" ]
check "Lock file exists"

# 3. Check Firebase config
echo ""
echo "🔥 Checking Firebase configuration..."
[ -f "android/app/google-services.json" ]
check "Android google-services.json"

[ -f "ios/GoogleService-Info.plist" ]
check "iOS GoogleService-Info.plist"

# 4. Check environment variables
echo ""
echo "🔐 Checking environment variables..."
[ -f ".env" ] || [ -f ".env.production" ]
check "Environment file exists"

if [ -f ".env" ]; then
    grep -q "SUPABASE_URL" .env
    check "SUPABASE_URL defined"
    
    grep -q "SUPABASE_ANON_KEY" .env
    check "SUPABASE_ANON_KEY defined"
fi

# 5. Check Android build setup
echo ""
echo "🤖 Checking Android build..."
[ -f "android/gradle.properties" ]
check "Android gradle.properties exists"

[ -f "android/app/build.gradle" ]
check "Android build.gradle exists"

# 6. Check iOS build setup
echo ""
echo "🍎 Checking iOS build..."
[ -d "ios" ]
check "iOS directory exists"

[ -f "ios/Podfile" ]
check "iOS Podfile exists"

# 7. Check TypeScript
echo ""
echo "📘 Checking TypeScript..."
npx tsc --noEmit > /dev/null 2>&1
check "TypeScript compilation"

# 8. Check linting
echo ""
echo "🔍 Checking code quality..."
npm run lint > /dev/null 2>&1
check "ESLint passes"

# 9. Check critical files
echo ""
echo "📄 Checking critical files..."
[ -f "src/services/firebase.ts" ]
check "Firebase service"

[ -f "src/services/supabase.ts" ]
check "Supabase service"

[ -f "src/navigation/AppNavigator.tsx" ]
check "Navigation configured"

[ -f "App.tsx" ]
check "App.tsx exists"

# 10. Check documentation
echo ""
echo "📚 Checking documentation..."
[ -f "README.md" ]
check "README.md"

[ -f "DEPLOYMENT_GUIDE.md" ]
check "DEPLOYMENT_GUIDE.md"

[ -f "FIREBASE_SETUP.md" ]
check "FIREBASE_SETUP.md"

# Summary
echo ""
echo "======================================================"
echo "Summary:"
echo -e "${GREEN}✓ Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}✗ Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! App is ready for production.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run android:bundle (Android AAB)"
    echo "2. Run: npm run ios:release (iOS Archive)"
    echo "3. Upload to Play Console & App Store Connect"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please fix issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- npm install (install dependencies)"
    echo "- Copy google-services.json to android/app/"
    echo "- Copy GoogleService-Info.plist to ios/"
    echo "- Create .env file from .env.example"
    exit 1
fi

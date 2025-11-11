#!/bin/bash
set -e

echo "🧪 IBIMINA TESTING SUITE"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check environment
print_step "Checking environment..."
if [ -z "$SUPABASE_URL" ]; then
    print_error "SUPABASE_URL not set"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    print_error "SUPABASE_ANON_KEY not set"
    exit 1
fi

print_step "Environment OK"
echo ""

# Menu
echo "Select testing phase:"
echo "1. Backend/Supabase (30 min)"
echo "2. Staff Admin PWA (1 hour)"
echo "3. Staff Android App (2 hours)"
echo "4. Client Mobile App (2 hours)"
echo "5. Integration Testing (2 hours)"
echo "6. Production Readiness (1 hour)"
echo "7. Run all tests (9 hours)"
echo ""
read -p "Enter choice [1-7]: " choice

case $choice in
    1)
        print_step "PHASE 1: Backend/Supabase Testing"
        echo ""
        
        print_step "Testing database tables..."
        supabase db push --dry-run || print_warning "Dry run failed - check migrations"
        
        print_step "Testing Edge Functions..."
        supabase functions list
        
        print_step "Testing RLS policies..."
        pnpm test:rls
        
        echo ""
        print_step "Backend testing complete! Check COMPREHENSIVE_TESTING_GUIDE.md for manual verification steps."
        ;;
        
    2)
        print_step "PHASE 2: Staff Admin PWA Testing"
        echo ""
        
        print_step "Starting development server..."
        cd apps/pwa/staff-admin
        print_warning "Server will start on http://localhost:3100"
        print_warning "Follow test cases in COMPREHENSIVE_TESTING_GUIDE.md section 2"
        pnpm dev
        ;;
        
    3)
        print_step "PHASE 3: Staff Android App Testing"
        echo ""
        
        print_step "Building Android APK..."
        cd apps/pwa/staff-admin/android
        ./gradlew assembleDebug
        
        print_warning "Install APK with: adb install app/build/outputs/apk/debug/app-debug.apk"
        print_warning "Follow test cases in COMPREHENSIVE_TESTING_GUIDE.md section 3"
        ;;
        
    4)
        print_step "PHASE 4: Client Mobile App Testing"
        echo ""
        
        cd apps/client-mobile
        echo "Select platform:"
        echo "1. iOS"
        echo "2. Android"
        read -p "Enter choice [1-2]: " platform
        
        case $platform in
            1)
                print_step "Starting iOS app..."
                npx react-native run-ios
                ;;
            2)
                print_step "Starting Android app..."
                npx react-native run-android
                ;;
        esac
        
        print_warning "Follow test cases in COMPREHENSIVE_TESTING_GUIDE.md section 4"
        ;;
        
    5)
        print_step "PHASE 5: Integration Testing"
        echo ""
        print_warning "Integration testing requires manual workflows"
        print_warning "Follow test cases in COMPREHENSIVE_TESTING_GUIDE.md section 5"
        print_warning ""
        print_warning "You'll need:"
        print_warning "- Staff Admin PWA running (http://localhost:3100)"
        print_warning "- Staff Android app installed"
        print_warning "- Client Mobile app running"
        print_warning "- 2 NFC-enabled Android devices for TapMoMo"
        ;;
        
    6)
        print_step "PHASE 6: Production Readiness Testing"
        echo ""
        
        print_step "Running performance audit..."
        cd apps/pwa/staff-admin
        pnpm build
        npx @lhci/cli@latest autorun || print_warning "Lighthouse audit completed with warnings"
        
        print_step "Running security audit..."
        cd ../..
        pnpm audit || print_warning "Found vulnerabilities - review manually"
        
        print_step "Testing production builds..."
        cd apps/pwa/staff-admin/android
        ./gradlew assembleRelease
        
        print_step "Production readiness tests complete!"
        ;;
        
    7)
        print_step "Running ALL tests (this will take ~9 hours)"
        print_warning "This is a comprehensive test suite. Are you sure? (y/n)"
        read -p "> " confirm
        
        if [ "$confirm" = "y" ]; then
            # Run phases 1 and 6 (automated)
            $0 1
            $0 6
            
            print_warning "Phases 2-5 require manual testing"
            print_warning "Follow COMPREHENSIVE_TESTING_GUIDE.md for detailed steps"
        else
            print_warning "Cancelled"
            exit 0
        fi
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_step "Testing phase complete!"
echo ""

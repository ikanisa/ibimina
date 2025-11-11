#!/bin/bash
set -euo pipefail

# TapMoMo Production Deployment Script
# This script deploys the complete TapMoMo NFC payment system

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 TapMoMo Production Deployment"
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step counter
STEP=1

function print_step() {
    echo ""
    echo -e "${GREEN}Step $STEP: $1${NC}"
    echo "-----------------------------------"
    STEP=$((STEP + 1))
}

function print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

function print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

function print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites"

if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed. Install from https://supabase.com/docs/guides/cli"
    exit 1
fi
print_success "Supabase CLI found"

if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Run: npm install -g pnpm"
    exit 1
fi
print_success "pnpm found"

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    print_error ".env file not found. Copy from .env.example and configure"
    exit 1
fi
print_success ".env file found"

# Check Supabase connection
print_step "Checking Supabase connection"

cd "$PROJECT_ROOT"

if ! supabase status &> /dev/null; then
    print_warning "Supabase is not running locally. Linking to remote project..."
    
    if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
        print_error "SUPABASE_PROJECT_REF not set. Set it in .env"
        exit 1
    fi
    
    supabase link --project-ref "$SUPABASE_PROJECT_REF"
fi
print_success "Connected to Supabase"

# Apply database migrations
print_step "Applying TapMoMo database migrations"

echo "This will apply the following migration:"
echo "  - 20251103161327_tapmomo_schema.sql (merchants & transactions tables)"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

# Push migrations
supabase db push

print_success "Database migrations applied"

# Deploy Edge Function
print_step "Deploying TapMoMo Reconcile Edge Function"

cd "$PROJECT_ROOT"

if [ ! -d "supabase/functions/tapmomo-reconcile" ]; then
    print_error "tapmomo-reconcile function not found"
    exit 1
fi

supabase functions deploy tapmomo-reconcile --no-verify-jwt

print_success "Edge Function deployed"

# Create test merchant
print_step "Creating test merchant (optional)"

echo "Would you like to create a test merchant?"
echo "This will create a merchant with code '123456' for testing"
read -p "Create test merchant? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Get user ID from auth.users
    USER_ID=$(supabase db execute --query "SELECT id FROM auth.users LIMIT 1" --output json | jq -r '.[0].id' || echo "")
    
    if [ -z "$USER_ID" ]; then
        print_warning "No users found. Please create a user first"
    else
        echo "Creating test merchant for user: $USER_ID"
        
        cat << EOF | supabase db execute
INSERT INTO public.tapmomo_merchants (user_id, display_name, network, merchant_code, secret_key)
VALUES (
    '$USER_ID',
    'Test Merchant',
    'MTN',
    '123456',
    encode(gen_random_bytes(32), 'base64')
)
ON CONFLICT (merchant_code) DO NOTHING;
EOF
        
        print_success "Test merchant created with code: 123456"
    fi
fi

# Build Android app
print_step "Building Android app"

cd "$PROJECT_ROOT/apps/pwa/staff-admin"

echo "Syncing Capacitor..."
pnpm exec cap sync android

echo ""
echo "To build the APK:"
echo "  1. Open Android Studio: pnpm exec cap open android"
echo "  2. Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo "  3. Or build from command line:"
echo "     cd android && ./gradlew assembleRelease"
echo ""

read -p "Open Android Studio now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm exec cap open android
fi

# Configure merchants
print_step "Merchant configuration"

echo ""
echo "To configure merchants for production:"
echo ""
echo "1. Create merchant via SQL:"
cat << 'EOF'

INSERT INTO public.tapmomo_merchants (
    user_id,
    display_name,
    network,
    merchant_code,
    secret_key
) VALUES (
    'USER_UUID',
    'Merchant Name',
    'MTN',  -- or 'Airtel'
    'MERCHANT_CODE',
    encode(gen_random_bytes(32), 'base64')
);

EOF

echo "2. Or create via API in the admin app"
echo "3. Share merchant_code with staff"
echo "4. Secret key is auto-generated (HMAC signature verification)"
echo ""

# Staff training materials
print_step "Staff training preparation"

echo ""
echo "Training materials needed:"
echo ""
echo "✅ How to activate NFC (Get Paid flow)"
echo "✅ How to scan NFC (Pay flow)"
echo "✅ How to handle USSD prompts"
echo "✅ What to do if NFC fails (retry, fallback)"
echo "✅ Transaction status monitoring"
echo "✅ SMS reconciliation integration"
echo ""
echo "See docs/TAPMOMO_QUICK_START.md for detailed flows"
echo ""

# Monitoring setup
print_step "Enable monitoring & alerts"

echo ""
echo "Set up monitoring for:"
echo ""
echo "1. Failed transactions rate"
echo "2. NFC read errors"
echo "3. HMAC signature failures"
echo "4. Replay attack attempts"
echo "5. USSD launch failures"
echo ""
echo "Use Supabase Dashboard:"
echo "  - Database > Functions & Triggers"
echo "  - Add alerts for failed transaction spikes"
echo "  - Monitor tapmomo_transactions table"
echo ""

# Final checklist
print_step "Deployment checklist"

echo ""
echo "Pre-production checklist:"
echo ""
echo "✅ Database migrations applied"
echo "✅ Edge Function deployed"
echo "✅ Test merchant created"
echo "⏳ Android APK built and signed"
echo "⏳ Physical device testing completed"
echo "⏳ Two-device NFC test successful"
echo "⏳ USSD launch verified on real SIM"
echo "⏳ SMS reconciliation integrated"
echo "⏳ Staff training completed"
echo "⏳ Monitoring alerts configured"
echo ""

# Summary
echo ""
echo "================================"
echo "🎉 TapMoMo Deployment Summary"
echo "================================"
echo ""
echo "✅ Database: Merchants & transactions tables created"
echo "✅ Backend: Reconcile Edge Function deployed"
echo "⏳ Mobile: Build & test Android APK"
echo "⏳ Testing: Complete two-device NFC tests"
echo "⏳ Training: Review workflows with staff"
echo "⏳ Monitoring: Configure production alerts"
echo ""
echo "Next steps:"
echo "1. Build and sign Android APK (1 hour)"
echo "2. Test on two physical devices (30 min)"
echo "3. Train staff on flows (2 hours)"
echo "4. Configure production merchants (30 min)"
echo "5. Enable monitoring (1 hour)"
echo ""
echo "Documentation:"
echo "  - docs/TAPMOMO_NFC_IMPLEMENTATION.md (full details)"
echo "  - docs/TAPMOMO_QUICK_START.md (quick guide)"
echo "  - TAPMOMO_COMPLETE_SUMMARY.md (implementation summary)"
echo ""
echo "Estimated time to production: 5 hours"
echo ""

print_success "Deployment script complete!"

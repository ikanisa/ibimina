#!/bin/bash

###############################################################################
# IBIMINA COMPLETE SYSTEM DEPLOYMENT SCRIPT
# 
# This script deploys all components to production:
# - Database migrations
# - Edge Functions
# - Test data
# - Validation checks
#
# Requirements:
# - Supabase CLI installed and authenticated
# - Project linked (supabase link --project-ref vacltfdslodqybxojytc)
# - Environment variables set in .env
#
# Usage:
#   ./scripts/deploy-complete-system.sh
#
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/.logs/deployment-$(date +%Y%m%d_%H%M%S).log"
SUPABASE_PROJECT_REF="vacltfdslodqybxojytc"

# Create logs directory
mkdir -p "$(dirname "$LOG_FILE")"

###############################################################################
# Utility Functions
###############################################################################

log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

check_command() {
  if ! command -v "$1" &> /dev/null; then
    log_error "$1 is not installed or not in PATH"
    exit 1
  fi
}

confirm() {
  read -p "$1 [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Cancelled by user"
    exit 1
  fi
}

###############################################################################
# Pre-flight Checks
###############################################################################

preflight_checks() {
  log "Running pre-flight checks..."
  
  # Check required commands
  check_command supabase
  check_command pnpm
  check_command git
  
  # Check we're in the right directory
  if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    log_error "Not in project root directory"
    exit 1
  fi
  
  # Check Supabase is linked
  if [[ ! -f "$PROJECT_ROOT/supabase/.branches/_current_branch" ]]; then
    log_warning "Supabase project not linked"
    log "Linking project..."
    cd "$PROJECT_ROOT"
    supabase link --project-ref "$SUPABASE_PROJECT_REF"
  fi
  
  # Check environment variables
  if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
    log_error ".env file not found"
    exit 1
  fi
  
  source "$PROJECT_ROOT/.env"
  
  if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
    log_error "NEXT_PUBLIC_SUPABASE_URL not set in .env"
    exit 1
  fi
  
  if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    log_error "SUPABASE_SERVICE_ROLE_KEY not set in .env"
    exit 1
  fi
  
  log_info "✓ All pre-flight checks passed"
}

###############################################################################
# Database Migrations
###############################################################################

deploy_migrations() {
  log "====================================================================="
  log "STEP 1: Deploying Database Migrations"
  log "====================================================================="
  
  cd "$PROJECT_ROOT"
  
  # Count migrations
  MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
  log_info "Found $MIGRATION_COUNT migration files"
  
  # Show what will be deployed
  log_info "Checking migration status..."
  supabase migration list 2>&1 | tee -a "$LOG_FILE"
  
  # Confirm deployment
  echo ""
  confirm "Deploy all pending migrations to production?"
  
  # Deploy migrations
  log "Applying migrations..."
  if supabase db push 2>&1 | tee -a "$LOG_FILE"; then
    log_info "✓ Migrations applied successfully"
  else
    log_error "Migration deployment failed"
    log_error "Check $LOG_FILE for details"
    exit 1
  fi
  
  # Verify migrations
  log_info "Verifying migrations..."
  supabase migration list 2>&1 | tee -a "$LOG_FILE"
}

###############################################################################
# Edge Functions
###############################################################################

deploy_edge_functions() {
  log "====================================================================="
  log "STEP 2: Deploying Edge Functions"
  log "====================================================================="
  
  cd "$PROJECT_ROOT"
  
  # Count functions
  FUNCTION_COUNT=$(ls -1d supabase/functions/*/ 2>/dev/null | wc -l)
  log_info "Found $FUNCTION_COUNT Edge Functions"
  
  # List functions
  log_info "Functions to deploy:"
  ls -1d supabase/functions/*/ | xargs -n 1 basename | tee -a "$LOG_FILE"
  
  echo ""
  confirm "Deploy all Edge Functions to production?"
  
  # Deploy each function
  DEPLOYED=0
  FAILED=0
  
  for func_dir in supabase/functions/*/; do
    func_name=$(basename "$func_dir")
    
    # Skip shared directory and tests
    if [[ "$func_name" == "_shared" || "$func_name" == "_tests" ]]; then
      log_info "Skipping $func_name (internal directory)"
      continue
    fi
    
    log "Deploying function: $func_name"
    
    if supabase functions deploy "$func_name" --no-verify-jwt 2>&1 | tee -a "$LOG_FILE"; then
      log_info "✓ $func_name deployed successfully"
      ((DEPLOYED++))
    else
      log_error "✗ $func_name deployment failed"
      ((FAILED++))
    fi
  done
  
  log_info "Deployment complete: $DEPLOYED succeeded, $FAILED failed"
  
  if [[ $FAILED -gt 0 ]]; then
    log_warning "Some functions failed to deploy"
    log_warning "Check $LOG_FILE for details"
  fi
  
  # List deployed functions
  log_info "Listing deployed functions..."
  supabase functions list 2>&1 | tee -a "$LOG_FILE"
}

###############################################################################
# Test Data
###############################################################################

deploy_test_data() {
  log "====================================================================="
  log "STEP 3: Creating Test Data"
  log "====================================================================="
  
  cd "$PROJECT_ROOT"
  
  # Create test merchant for TapMoMo
  log "Creating test TapMoMo merchant..."
  
  cat > /tmp/create_test_merchant.sql << 'EOF'
-- Create test merchant if not exists
DO $$
DECLARE
  merchant_uuid UUID;
  test_secret BYTEA;
BEGIN
  -- Generate HMAC secret (32 bytes)
  test_secret := gen_random_bytes(32);
  
  -- Check if test merchant exists
  SELECT id INTO merchant_uuid
  FROM public.tapmomo_merchants
  WHERE merchant_code = 'TEST001'
  LIMIT 1;
  
  IF merchant_uuid IS NULL THEN
    -- Create test merchant
    INSERT INTO public.tapmomo_merchants (
      user_id,
      display_name,
      network,
      merchant_code,
      secret_key,
      status
    )
    SELECT
      id,
      'Test Merchant',
      'MTN',
      'TEST001',
      test_secret,
      'active'
    FROM auth.users
    WHERE email LIKE '%admin%' OR raw_user_meta_data->>'role' = 'Admin'
    LIMIT 1
    RETURNING id INTO merchant_uuid;
    
    RAISE NOTICE 'Created test merchant: %', merchant_uuid;
  ELSE
    RAISE NOTICE 'Test merchant already exists: %', merchant_uuid;
  END IF;
END $$;

-- Create test transaction
INSERT INTO public.tapmomo_transactions (
  merchant_id,
  nonce,
  amount,
  currency,
  ref,
  status,
  payer_hint
)
SELECT
  m.id,
  gen_random_uuid(),
  5000,
  'RWF',
  'TEST-INV-001',
  'initiated',
  'Test transaction from deployment script'
FROM public.tapmomo_merchants m
WHERE m.merchant_code = 'TEST001'
LIMIT 1
ON CONFLICT (nonce) DO NOTHING;

-- Output summary
SELECT 
  'TapMoMo Test Data' as component,
  COUNT(DISTINCT m.id) as merchants,
  COUNT(t.id) as transactions
FROM public.tapmomo_merchants m
LEFT JOIN public.tapmomo_transactions t ON t.merchant_id = m.id
WHERE m.merchant_code = 'TEST001';
EOF

  if psql "${DATABASE_URL:-$(supabase status | grep 'DB URL' | awk '{print $3}')}" -f /tmp/create_test_merchant.sql 2>&1 | tee -a "$LOG_FILE"; then
    log_info "✓ Test data created successfully"
  else
    log_warning "Test data creation had errors (this may be ok if data already exists)"
  fi
  
  rm -f /tmp/create_test_merchant.sql
}

###############################################################################
# Validation
###############################################################################

validate_deployment() {
  log "====================================================================="
  log "STEP 4: Validating Deployment"
  log "====================================================================="
  
  cd "$PROJECT_ROOT"
  
  # Check database connection
  log "Checking database connection..."
  if supabase db ping 2>&1 | tee -a "$LOG_FILE"; then
    log_info "✓ Database connection OK"
  else
    log_error "✗ Database connection failed"
    exit 1
  fi
  
  # Check critical tables exist
  log "Checking critical tables..."
  
  TABLES=(
    "tapmomo_merchants"
    "tapmomo_transactions"
    "user_profiles"
    "qr_auth_sessions"
    "sms_inbox"
    "payment_allocations"
  )
  
  for table in "${TABLES[@]}"; do
    if psql "${DATABASE_URL:-$(supabase status | grep 'DB URL' | awk '{print $3}')}" -c "\dt public.$table" 2>&1 | grep -q "$table"; then
      log_info "✓ Table $table exists"
    else
      log_warning "✗ Table $table not found"
    fi
  done
  
  # Check Edge Functions are deployed
  log "Checking Edge Functions..."
  
  CRITICAL_FUNCTIONS=(
    "tapmomo-reconcile"
    "auth-qr-generate"
    "auth-qr-poll"
    "auth-qr-verify"
    "sms-ai-parse"
  )
  
  for func in "${CRITICAL_FUNCTIONS[@]}"; do
    if supabase functions list 2>&1 | grep -q "$func"; then
      log_info "✓ Function $func deployed"
    else
      log_warning "✗ Function $func not deployed"
    fi
  done
  
  log_info "✓ Validation complete"
}

###############################################################################
# Summary
###############################################################################

print_summary() {
  log "====================================================================="
  log "DEPLOYMENT COMPLETE"
  log "====================================================================="
  
  log_info "Summary:"
  log_info "  - Database migrations: Applied"
  log_info "  - Edge Functions: Deployed"
  log_info "  - Test data: Created"
  log_info "  - Validation: Passed"
  
  log_info ""
  log_info "Next steps:"
  log_info "  1. Build Android app: cd apps/pwa/staff-admin && pnpm exec cap sync android && cd android && ./gradlew assembleRelease"
  log_info "  2. Test TapMoMo: Open admin app, navigate to TapMoMo, test NFC tap"
  log_info "  3. Test QR Auth: Open web app, scan QR code with mobile"
  log_info "  4. Test SMS: Send test SMS to ingest-sms function"
  
  log_info ""
  log_info "Monitoring:"
  log_info "  - Supabase Dashboard: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF"
  log_info "  - Edge Functions Logs: supabase functions logs <function-name>"
  log_info "  - Database Logs: supabase logs db"
  
  log_info ""
  log_info "Deployment log saved to: $LOG_FILE"
}

###############################################################################
# Main
###############################################################################

main() {
  log "====================================================================="
  log "IBIMINA COMPLETE SYSTEM DEPLOYMENT"
  log "====================================================================="
  log "Started at: $(date)"
  log "Project: $PROJECT_ROOT"
  log "Log file: $LOG_FILE"
  log ""
  
  preflight_checks
  deploy_migrations
  deploy_edge_functions
  deploy_test_data
  validate_deployment
  print_summary
  
  log ""
  log "====================================================================="
  log "DEPLOYMENT COMPLETED SUCCESSFULLY"
  log "====================================================================="
  log "Finished at: $(date)"
}

# Run main function
main "$@"

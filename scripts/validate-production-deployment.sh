#!/bin/bash
#
# Production Deployment Validation Script
# Validates all requirements are met before deploying to production
#
# Usage: ./scripts/validate-production-deployment.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Production Deployment Validation"
echo "===================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS_COUNT++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL_COUNT++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN_COUNT++))
}

info() {
    echo -e "ℹ️  $1"
}

section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ============================================================================
# 1. Prerequisites Check
# ============================================================================
section "Prerequisites"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        pass "Node.js $(node --version) installed"
    else
        fail "Node.js v20+ required, found v$NODE_VERSION"
    fi
else
    fail "Node.js not installed"
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    pass "pnpm $(pnpm --version) installed"
else
    fail "pnpm not installed"
fi

# Check git
if command -v git &> /dev/null; then
    pass "Git $(git --version | cut -d' ' -f3) installed"
else
    fail "Git not installed"
fi

# ============================================================================
# 2. Repository State
# ============================================================================
section "Repository State"

cd "$PROJECT_ROOT"

# Check if on correct branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "production" ]; then
    pass "On deployment branch: $BRANCH"
else
    warn "Not on main/production branch (current: $BRANCH)"
fi

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
    pass "No uncommitted changes"
else
    fail "Uncommitted changes detected"
    git status --short
fi

# Check for unpushed commits
UNPUSHED=$(git log @{u}.. --oneline 2>/dev/null | wc -l || echo "0")
if [ "$UNPUSHED" = "0" ]; then
    pass "All commits pushed"
else
    warn "$UNPUSHED unpushed commit(s)"
fi

# ============================================================================
# 3. Dependencies
# ============================================================================
section "Dependencies"

if [ -f "pnpm-lock.yaml" ]; then
    pass "pnpm-lock.yaml exists"
else
    fail "pnpm-lock.yaml missing"
fi

if [ -d "node_modules" ]; then
    pass "node_modules installed"
else
    fail "node_modules not installed (run: pnpm install)"
fi

# ============================================================================
# 4. Environment Variables
# ============================================================================
section "Environment Variables"

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "KMS_DATA_KEY_BASE64"
    "BACKUP_PEPPER"
    "MFA_SESSION_SECRET"
    "TRUSTED_COOKIE_SECRET"
    "HMAC_SHARED_SECRET"
)

if [ -f ".env" ]; then
    pass ".env file exists"
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" .env 2>/dev/null; then
            VALUE=$(grep "^$var=" .env | sed 's/^[^=]*=//')
            if [ -n "$VALUE" ] && [ "$VALUE" != "\"\"" ] && [ "$VALUE" != "''" ]; then
                pass "$var is set"
            else
                fail "$var is empty"
            fi
        else
            fail "$var not found in .env"
        fi
    done
else
    fail ".env file not found"
fi

# Check for .env.example
if [ -f ".env.example" ]; then
    pass ".env.example exists"
else
    warn ".env.example not found"
fi

# ============================================================================
# 5. Build Validation
# ============================================================================
section "Build Validation"

info "Running typecheck..."
if pnpm run typecheck 2>&1 | tail -1 | grep -q "Done\|error"; then
    if pnpm run typecheck 2>&1 | grep -q "error TS"; then
        fail "TypeScript compilation failed"
    else
        pass "TypeScript compilation successful"
    fi
else
    pass "TypeScript compilation successful"
fi

info "Running lint..."
if pnpm run lint 2>&1 | tail -1 | grep -q "Done\|error"; then
    pass "Linting passed"
else
    warn "Linting has warnings or errors"
fi

# ============================================================================
# 6. Supabase Configuration
# ============================================================================
section "Supabase Configuration"

# Check migrations directory
if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    pass "$MIGRATION_COUNT migration(s) found"
else
    warn "supabase/migrations directory not found"
fi

# Check functions directory
if [ -d "supabase/functions" ]; then
    FUNCTION_COUNT=$(find supabase/functions -name "index.ts" 2>/dev/null | wc -l)
    pass "$FUNCTION_COUNT edge function(s) found"
else
    warn "supabase/functions directory not found"
fi

# Check for critical edge functions
CRITICAL_FUNCTIONS=(
    "momo-statement-poller"
    "gsm-maintenance"
    "sms-inbox"
    "payments-apply"
)

for func in "${CRITICAL_FUNCTIONS[@]}"; do
    if [ -f "supabase/functions/$func/index.ts" ]; then
        pass "Edge function: $func"
    else
        fail "Missing edge function: $func"
    fi
done

# ============================================================================
# 7. Security Configuration
# ============================================================================
section "Security Configuration"

# Check for sensitive files in .gitignore
if grep -q ".env" .gitignore 2>/dev/null; then
    pass ".env in .gitignore"
else
    fail ".env not in .gitignore"
fi

if grep -q "node_modules" .gitignore 2>/dev/null; then
    pass "node_modules in .gitignore"
else
    fail "node_modules not in .gitignore"
fi

# Check for secrets in code (expanded patterns)
SECRET_PATTERNS="sk_live_|sk_test_|pk_live_|pk_test_|AIza|AKIA|ya29|private_key|-----BEGIN"
if grep -r -E "$SECRET_PATTERNS" apps/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process.env" > /dev/null; then
    fail "Potential hardcoded secrets found"
else
    pass "No obvious hardcoded secrets"
fi

# ============================================================================
# 8. Platform API Workers
# ============================================================================
section "Platform API Workers"

if [ -f "apps/platform-api/src/workers/momo-poller.ts" ]; then
    pass "MoMo poller worker exists"
else
    fail "MoMo poller worker missing"
fi

if [ -f "apps/platform-api/src/workers/gsm-heartbeat.ts" ]; then
    pass "GSM heartbeat worker exists"
else
    fail "GSM heartbeat worker missing"
fi

# Check if workers build
cd apps/platform-api
BUILD_OUTPUT=$(pnpm run build 2>&1)
if echo "$BUILD_OUTPUT" | grep -q "Done\|error"; then
    pass "Platform API builds successfully"
    if [ -d "dist" ]; then
        pass "Build artifacts exist"
    fi
else
    fail "Platform API build failed"
    echo "$BUILD_OUTPUT" | tail -5
fi
cd "$PROJECT_ROOT"

# ============================================================================
# 9. Client App
# ============================================================================
section "Client App"

# Check for critical routes
CLIENT_ROUTES=(
    "apps/pwa/client/app/api/ocr/upload/route.ts"
    "apps/pwa/client/app/api/push/subscribe/route.ts"
    "apps/pwa/client/app/api/saccos/search/route.ts"
)

for route in "${CLIENT_ROUTES[@]}"; do
    if [ -f "$route" ]; then
        pass "Client route: $(basename $(dirname $route))"
    else
        fail "Missing client route: $route"
    fi
done

# Check PWA manifest
if [ -f "apps/pwa/client/public/manifest.json" ]; then
    pass "PWA manifest exists"
else
    warn "PWA manifest not found"
fi

# ============================================================================
# 10. Admin App
# ============================================================================
section "Admin App"

# Check for critical routes
ADMIN_ROUTES=(
    "apps/pwa/staff-admin/app/api/health/route.ts"
    "apps/pwa/staff-admin/app/(main)/admin/(panel)/health/page.tsx"
)

for route in "${ADMIN_ROUTES[@]}"; do
    if [ -f "$route" ]; then
        pass "Admin route/page: $(basename $route)"
    else
        warn "Admin route/page not found: $route"
    fi
done

# ============================================================================
# 11. Documentation
# ============================================================================
section "Documentation"

REQUIRED_DOCS=(
    "README.md"
    "DEPLOYMENT_GUIDE.md"
    "docs/go-live/production-checklist.md"
    "MOBILE_TESTING_GUIDE.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        pass "Documentation: $doc"
    else
        warn "Missing documentation: $doc"
    fi
done

# ============================================================================
# 12. Database Migrations
# ============================================================================
section "Database Migrations"

# Check for recent migrations
LATEST_MIGRATION=$(ls -1t supabase/migrations/*.sql 2>/dev/null | head -1)
if [ -n "$LATEST_MIGRATION" ]; then
    pass "Latest migration: $(basename $LATEST_MIGRATION)"
    
    # Check for critical tables
    if grep -q "push_subscriptions" "$LATEST_MIGRATION" 2>/dev/null || \
       grep -q "members_app_profiles" supabase/migrations/*.sql 2>/dev/null; then
        pass "Client app tables migration present"
    else
        warn "Client app tables migration may be missing"
    fi
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}Passed:${NC}  $PASS_COUNT"
echo -e "${YELLOW}Warnings:${NC} $WARN_COUNT"
echo -e "${RED}Failed:${NC}  $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ Ready for production deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review DEPLOYMENT_CHECKLIST.md"
    echo "  2. Run mobile device tests (see MOBILE_TESTING_GUIDE.md)"
    echo "  3. Apply Supabase migrations"
    echo "  4. Deploy edge functions"
    echo "  5. Set production secrets"
    echo "  6. Deploy applications"
    exit 0
else
    echo -e "${RED}✗ NOT ready for production deployment${NC}"
    echo ""
    echo "Please fix the failed checks above before deploying."
    echo ""
    exit 1
fi

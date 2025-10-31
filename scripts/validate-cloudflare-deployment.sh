#!/bin/bash
# Cloudflare Deployment Validation Script
# This script validates that the repository is ready for Cloudflare deployment

set -e

echo "🔍 Cloudflare Deployment Readiness Check"
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Function to check a condition
check() {
  local name="$1"
  local command="$2"
  
  echo -n "Checking $name... "
  
  if eval "$command" >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    return 0
  else
    echo -e "${RED}✗${NC}"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
}

# Function to check file exists
check_file() {
  local name="$1"
  local file="$2"
  
  check "$name" "test -f $file"
}

# Function to check environment variable
check_env() {
  local name="$1"
  local var="$2"
  
  if [ -z "${!var}" ]; then
    echo -e "Checking $name... ${YELLOW}⚠ (optional/will use placeholder)${NC}"
    return 0
  else
    echo -e "Checking $name... ${GREEN}✓${NC}"
    return 0
  fi
}

echo "1. Prerequisites"
echo "----------------"
check "Node.js v20+" "node --version | grep -E 'v(2[0-9]|[3-9][0-9])'"
check "pnpm v10.19.0" "pnpm --version | grep -E '^10\.19\.0'"
check "wrangler installed" "command -v wrangler || npx wrangler --version"

echo ""
echo "2. Wrangler Configurations"
echo "--------------------------"
check_file "Admin wrangler.toml" "apps/admin/wrangler.toml"
check_file "Staff wrangler.toml" "apps/admin/wrangler.staff.toml"
check_file "Client wrangler.toml" "apps/client/wrangler.toml"

echo ""
echo "3. TypeScript Configuration"
echo "---------------------------"
check_file "Base tsconfig.json" "tsconfig.base.json"
check_file "Admin tsconfig.json" "apps/admin/tsconfig.json"
check_file "Client tsconfig.json" "apps/client/tsconfig.json"

echo ""
echo "4. Build Scripts"
echo "----------------"
check "Admin build:cloudflare script" "grep -q 'build:cloudflare' apps/admin/package.json"
check "Admin preview:cloudflare script" "grep -q 'preview:cloudflare' apps/admin/package.json"
check "Client build:cloudflare script" "grep -q 'build:cloudflare' apps/client/package.json"
check "Client preview:cloudflare script" "grep -q 'preview:cloudflare' apps/client/package.json"

echo ""
echo "5. CI/CD Configuration"
echo "----------------------"
check_file "Cloudflare deploy workflow" ".github/workflows/deploy-cloudflare.yml"
check_file "Main CI workflow" ".github/workflows/ci.yml"

echo ""
echo "6. Documentation"
echo "----------------"
check_file "Cloudflare deployment guide" "docs/CLOUDFLARE_DEPLOYMENT.md"
check_file "Cloudflare quickstart" "QUICKSTART_CLOUDFLARE.md"
check_file "Cloudflare env template" ".env.cloudflare.template"

echo ""
echo "7. Environment Variables (for local testing)"
echo "---------------------------------------------"
check_env "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_URL"
check_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env "SUPABASE_SERVICE_ROLE_KEY" "SUPABASE_SERVICE_ROLE_KEY"
check_env "BACKUP_PEPPER" "BACKUP_PEPPER"
check_env "MFA_SESSION_SECRET" "MFA_SESSION_SECRET"
check_env "TRUSTED_COOKIE_SECRET" "TRUSTED_COOKIE_SECRET"
check_env "HMAC_SHARED_SECRET" "HMAC_SHARED_SECRET"
check_env "KMS_DATA_KEY_BASE64" "KMS_DATA_KEY_BASE64"

echo ""
echo "8. Dependencies"
echo "---------------"
check "@cloudflare/next-on-pages installed" "grep -q '@cloudflare/next-on-pages' package.json"
check "wrangler installed" "grep -q '\"wrangler\"' package.json"

echo ""
echo "========================================"
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Set required environment variables (see .env.cloudflare.template)"
  echo "2. Run: pnpm install --frozen-lockfile"
  echo "3. Test locally: cd apps/admin && pnpm build:cloudflare && pnpm preview:cloudflare"
  echo "4. Deploy: Push to main branch or run workflow_dispatch"
  exit 0
else
  echo -e "${RED}✗ $FAILURES check(s) failed${NC}"
  echo ""
  echo "Please fix the issues above before deploying to Cloudflare."
  exit 1
fi

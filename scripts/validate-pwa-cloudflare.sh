#!/bin/bash
# PWA Cloudflare Deployment Validation Script
# Validates PWA-specific requirements for Cloudflare Pages deployment

set -e

echo "🔍 PWA Cloudflare Deployment Readiness Check"
echo "=============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track failures and warnings
FAILURES=0
WARNINGS=0

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

# Function to check file content
check_content() {
  local name="$1"
  local file="$2"
  local pattern="$3"
  
  echo -n "Checking $name... "
  
  if [ ! -f "$file" ]; then
    echo -e "${RED}✗ (file not found)${NC}"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
  
  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠ (pattern not found)${NC}"
    WARNINGS=$((WARNINGS + 1))
    return 1
  fi
}

# Function to warn about optional items
warn() {
  local name="$1"
  local message="$2"
  
  echo -e "Checking $name... ${YELLOW}⚠ $message${NC}"
  WARNINGS=$((WARNINGS + 1))
}

echo "1. PWA Manifest Files"
echo "---------------------"
check_file "Admin PWA manifest" "apps/admin/public/manifest.json"
check_file "Client PWA manifest" "apps/client/public/manifest.json"

echo ""
echo "2. Service Workers"
echo "------------------"
check_file "Admin service worker source" "apps/admin/workers/service-worker.ts"
check_file "Client service worker source" "apps/client/workers/service-worker.ts"

echo ""
echo "3. PWA Icons"
echo "------------"
check_file "Admin icon 192x192" "apps/admin/public/icons/icon-192.png"
check_file "Admin icon 512x512" "apps/admin/public/icons/icon-512.png"
check_file "Client icon 192x192" "apps/client/public/icons/icon-192.png"
check_file "Client icon 512x512" "apps/client/public/icons/icon-512.png"

echo ""
echo "4. Next.js PWA Configuration"
echo "----------------------------"
check_content "Admin withPwa import" "apps/admin/next.config.ts" "createWithPwa"
check_content "Client withPwa import" "apps/client/next.config.ts" "createWithPwa"
check_content "Admin Cloudflare check" "apps/admin/next.config.ts" "CLOUDFLARE_BUILD"
check_content "Client Cloudflare check" "apps/client/next.config.ts" "CLOUDFLARE_BUILD"

echo ""
echo "5. Workbox Dependencies"
echo "-----------------------"
check "Admin workbox packages" "grep -q 'workbox-' apps/admin/package.json"
check "Client workbox packages" "grep -q 'workbox-' apps/client/package.json"

echo ""
echo "6. Cloudflare-Specific Configuration"
echo "-------------------------------------"
check_content "Admin output config" "apps/admin/next.config.ts" "output:"
check_content "Client output config" "apps/client/next.config.ts" "output:"
check_content "Admin turbopack config" "apps/admin/next.config.ts" "turbopack:"
check_content "Client turbopack config" "apps/client/next.config.ts" "turbopack:"
check_content "Admin experimental flags" "apps/admin/next.config.ts" "experimental:"
check_content "Client experimental flags" "apps/client/next.config.ts" "experimental:"

echo ""
echo "7. Build Scripts"
echo "----------------"
check "Admin build:cloudflare" "grep -q 'build:cloudflare' apps/admin/package.json"
check "Admin preview:cloudflare" "grep -q 'preview:cloudflare' apps/admin/package.json"
check "Client build:cloudflare" "grep -q 'build:cloudflare' apps/client/package.json"
check "Client preview:cloudflare" "grep -q 'preview:cloudflare' apps/client/package.json"

echo ""
echo "8. Wrangler Configurations"
echo "--------------------------"
check_file "Admin wrangler.toml" "apps/admin/wrangler.toml"
check_file "Client wrangler.toml" "apps/client/wrangler.toml"
check_content "Admin nodejs_compat flag" "apps/admin/wrangler.toml" "nodejs_compat"
check_content "Client nodejs_compat flag" "apps/client/wrangler.toml" "nodejs_compat"

echo ""
echo "9. PWA Dependencies"
echo "-------------------"
check "next-pwa in admin" "grep -q 'next-pwa' apps/admin/package.json"
check "next-pwa in client" "grep -q 'next-pwa' apps/client/package.json"

echo ""
echo "10. Offline Fallback Pages"
echo "---------------------------"
if [ -f "apps/admin/app/offline/page.tsx" ]; then
  echo -e "Admin offline page... ${GREEN}✓${NC}"
else
  warn "Admin offline page" "Optional - consider adding for better offline UX"
fi

if [ -f "apps/client/app/offline/page.tsx" ]; then
  echo -e "Client offline page... ${GREEN}✓${NC}"
else
  warn "Client offline page" "Optional - consider adding for better offline UX"
fi

echo ""
echo "11. Security Headers (PWA Requirements)"
echo "----------------------------------------"
check_content "Admin security headers" "apps/admin/next.config.ts" "async headers()"
check_content "Client security headers" "apps/client/next.config.ts" "async headers()"
check_content "Admin service worker cache" "apps/admin/next.config.ts" "service-worker.js"
check_content "Client service worker cache" "apps/client/next.config.ts" "service-worker.js"

echo ""
echo "12. PWA Manifest Validation"
echo "----------------------------"

# Check admin manifest structure
if [ -f "apps/admin/public/manifest.json" ]; then
  if jq empty apps/admin/public/manifest.json 2>/dev/null; then
    echo -e "Admin manifest JSON syntax... ${GREEN}✓${NC}"
    
    # Check required fields
    if jq -e '.name' apps/admin/public/manifest.json >/dev/null 2>&1; then
      echo -e "Admin manifest 'name' field... ${GREEN}✓${NC}"
    else
      echo -e "Admin manifest 'name' field... ${RED}✗${NC}"
      FAILURES=$((FAILURES + 1))
    fi
    
    if jq -e '.start_url' apps/admin/public/manifest.json >/dev/null 2>&1; then
      echo -e "Admin manifest 'start_url' field... ${GREEN}✓${NC}"
    else
      echo -e "Admin manifest 'start_url' field... ${RED}✗${NC}"
      FAILURES=$((FAILURES + 1))
    fi
    
    if jq -e '.display' apps/admin/public/manifest.json >/dev/null 2>&1; then
      echo -e "Admin manifest 'display' field... ${GREEN}✓${NC}"
    else
      echo -e "Admin manifest 'display' field... ${RED}✗${NC}"
      FAILURES=$((FAILURES + 1))
    fi
    
    if jq -e '.icons' apps/admin/public/manifest.json >/dev/null 2>&1; then
      echo -e "Admin manifest 'icons' field... ${GREEN}✓${NC}"
    else
      echo -e "Admin manifest 'icons' field... ${RED}✗${NC}"
      FAILURES=$((FAILURES + 1))
    fi
  else
    echo -e "Admin manifest JSON syntax... ${RED}✗ (invalid JSON)${NC}"
    FAILURES=$((FAILURES + 1))
  fi
fi

# Check client manifest structure
if [ -f "apps/client/public/manifest.json" ]; then
  if jq empty apps/client/public/manifest.json 2>/dev/null; then
    echo -e "Client manifest JSON syntax... ${GREEN}✓${NC}"
    
    # Check required fields
    if jq -e '.name' apps/client/public/manifest.json >/dev/null 2>&1; then
      echo -e "Client manifest 'name' field... ${GREEN}✓${NC}"
    else
      echo -e "Client manifest 'name' field... ${RED}✗${NC}"
      FAILURES=$((FAILURES + 1))
    fi
    
    if jq -e '.start_url' apps/client/public/manifest.json >/dev/null 2>&1; then
      echo -e "Client manifest 'start_url' field... ${GREEN}✓${NC}"
    else
      echo -e "Client manifest 'start_url' field... ${RED}✗${NC}"
      FAILURES=$((FAILURES + 1))
    fi
    
    if jq -e '.display' apps/client/public/manifest.json >/dev/null 2>&1; then
      echo -e "Client manifest 'display' field... ${GREEN}✓${NC}"
    else
      echo -e "Client manifest 'display' field... ${RED}✗${NC}"
      FAILURES=$((FAILURES + 1))
    fi
    
    if jq -e '.icons' apps/client/public/manifest.json >/dev/null 2>&1; then
      echo -e "Client manifest 'icons' field... ${GREEN}✓${NC}"
    else
      echo -e "Client manifest 'icons' field... ${RED}✗${NC}"
      FAILURES=$((FAILURES + 1))
    fi
  else
    echo -e "Client manifest JSON syntax... ${RED}✗ (invalid JSON)${NC}"
    FAILURES=$((FAILURES + 1))
  fi
fi

echo ""
echo "13. Cloudflare Adapter Configuration"
echo "-------------------------------------"
check "@cloudflare/next-on-pages" "grep -q '@cloudflare/next-on-pages' package.json"
check "wrangler" "grep -q '\"wrangler\"' package.json"
check "@cloudflare/workers-types" "grep -q '@cloudflare/workers-types' package.json"

echo ""
echo "=============================================="

# Summary
if [ $FAILURES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo -e "${BLUE}Your PWA apps are ready for Cloudflare deployment.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Set environment variables (see .env.cloudflare.template)"
  echo "2. Test locally:"
  echo "   cd apps/admin && pnpm build:cloudflare && pnpm preview:cloudflare"
  echo "   cd apps/client && pnpm build:cloudflare && pnpm preview:cloudflare"
  echo "3. Deploy via GitHub Actions or wrangler CLI"
  exit 0
elif [ $FAILURES -eq 0 ]; then
  echo -e "${YELLOW}✓ All critical checks passed with $WARNINGS warning(s)${NC}"
  echo ""
  echo -e "${BLUE}Your PWA apps are ready for Cloudflare deployment.${NC}"
  echo "Consider addressing the warnings above for optimal PWA experience."
  echo ""
  echo "Next steps:"
  echo "1. Set environment variables (see .env.cloudflare.template)"
  echo "2. Test locally:"
  echo "   cd apps/admin && pnpm build:cloudflare && pnpm preview:cloudflare"
  echo "   cd apps/client && pnpm build:cloudflare && pnpm preview:cloudflare"
  echo "3. Deploy via GitHub Actions or wrangler CLI"
  exit 0
else
  echo -e "${RED}✗ $FAILURES check(s) failed, $WARNINGS warning(s)${NC}"
  echo ""
  echo "Please fix the critical issues above before deploying to Cloudflare."
  echo "Refer to CLOUDFLARE_DEPLOYMENT_CHECKLIST.md for detailed instructions."
  exit 1
fi

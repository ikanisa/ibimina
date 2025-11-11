#!/usr/bin/env bash
# Production Readiness Validation Script
# Automated checks for production deployment prerequisites

set -uo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Print functions
print_header() {
  echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

print_failure() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++))
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check environment variable
check_env_var() {
  local var_name="$1"
  local required="${2:-false}"
  
  if [ -z "${!var_name:-}" ]; then
    if [ "$required" = "true" ]; then
      print_failure "Required environment variable $var_name is not set"
      return 1
    else
      print_warning "Optional environment variable $var_name is not set"
      return 0
    fi
  else
    print_success "Environment variable $var_name is set"
    return 0
  fi
}

# Check file exists
check_file_exists() {
  local file_path="$1"
  local description="$2"
  
  if [ -f "$file_path" ]; then
    print_success "$description exists: $file_path"
    return 0
  else
    print_failure "$description not found: $file_path"
    return 1
  fi
}

# Check directory exists
check_dir_exists() {
  local dir_path="$1"
  local description="$2"
  
  if [ -d "$dir_path" ]; then
    print_success "$description exists: $dir_path"
    return 0
  else
    print_failure "$description not found: $dir_path"
    return 1
  fi
}

# Main validation
main() {
  echo -e "${BLUE}"
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║      Production Readiness Validation - SACCO+             ║"
  echo "║      Ibimina Staff Console                                 ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  
  # 1. Check prerequisites
  print_header "Prerequisites"
  
  if command_exists node; then
    NODE_VERSION=$(node --version)
    if [[ "$NODE_VERSION" =~ ^v20\. ]] || [[ "$NODE_VERSION" =~ ^v[2-9][0-9]\. ]]; then
      print_success "Node.js version: $NODE_VERSION (>= v20 required)"
    else
      print_failure "Node.js version: $NODE_VERSION (>= v20 required)"
    fi
  else
    print_failure "Node.js not found"
  fi
  
  if command_exists pnpm; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm version: $PNPM_VERSION"
  else
    print_failure "pnpm not found (v10.19.0 required)"
  fi
  
  if command_exists git; then
    print_success "git is installed"
  else
    print_failure "git not found"
  fi
  
  # 2. Check repository state
  print_header "Repository State"
  
  if [ -d ".git" ]; then
    print_success "Git repository initialized"
    
    # Check for uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
      print_success "No uncommitted changes"
    else
      print_warning "Uncommitted changes detected"
    fi
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" = "main" ]; then
      print_success "On main branch"
    else
      print_warning "Not on main branch (current: $CURRENT_BRANCH)"
    fi
  else
    print_failure "Not a git repository"
  fi
  
  # 3. Check build artifacts
  print_header "Build Artifacts"
  
  check_file_exists "package.json" "Root package.json"
  check_file_exists "pnpm-lock.yaml" "pnpm lockfile"
  check_file_exists "apps/pwa/staff-admin/package.json" "Admin app package.json"
  
  if [ -f "pnpm-lock.yaml" ]; then
    if [ -d "node_modules" ]; then
      print_success "Dependencies installed"
    else
      print_warning "Dependencies not installed (run: pnpm install)"
    fi
  fi
  
  # Check for build output
  if check_dir_exists "apps/pwa/staff-admin/.next" "Next.js build output"; then
    if check_dir_exists "apps/pwa/staff-admin/.next/standalone" "Standalone build output"; then
      print_success "Production build artifacts present"
    else
      print_warning "Standalone build not found (run: pnpm run build)"
    fi
  else
    print_warning "Build output not found (run: pnpm run build)"
  fi
  
  # 4. Check environment configuration
  print_header "Environment Configuration"
  
  # Source .env if it exists
  if [ -f ".env" ]; then
    print_success ".env file exists"
    # shellcheck disable=SC1091
    set -a
    source .env 2>/dev/null || true
    set +a
  else
    print_warning ".env file not found"
  fi
  
  # Check critical environment variables
  check_env_var "APP_ENV" false
  if [ "${APP_ENV:-}" = "production" ]; then
    print_success "APP_ENV set to production"
  elif [ -n "${APP_ENV:-}" ]; then
    print_warning "APP_ENV is '${APP_ENV}' (should be 'production')"
  fi
  
  check_env_var "NODE_ENV" false
  check_env_var "NEXT_PUBLIC_SUPABASE_URL" true
  check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" true
  check_env_var "SUPABASE_SERVICE_ROLE_KEY" true
  check_env_var "KMS_DATA_KEY_BASE64" true
  check_env_var "BACKUP_PEPPER" true
  check_env_var "MFA_SESSION_SECRET" true
  check_env_var "TRUSTED_COOKIE_SECRET" true
  check_env_var "HMAC_SHARED_SECRET" true
  
  # Optional but recommended
  check_env_var "OPENAI_API_KEY" false
  check_env_var "LOG_DRAIN_URL" false
  check_env_var "MFA_RP_ID" false
  check_env_var "MFA_ORIGIN" false
  check_env_var "ANALYTICS_CACHE_TOKEN" false
  
  # 5. Check Supabase configuration
  print_header "Supabase Configuration"
  
  check_dir_exists "supabase" "Supabase directory"
  check_dir_exists "supabase/migrations" "Database migrations"
  check_dir_exists "supabase/functions" "Edge functions"
  
  if [ -f "supabase/config.toml" ]; then
    print_success "Supabase config file exists"
  else
    print_warning "supabase/config.toml not found"
  fi
  
  # Count migrations
  if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" | wc -l)
    print_info "$MIGRATION_COUNT migration files found"
  fi
  
  # Count edge functions
  if [ -d "supabase/functions" ]; then
    FUNCTION_COUNT=$(find supabase/functions -maxdepth 1 -mindepth 1 -type d | wc -l)
    print_info "$FUNCTION_COUNT edge functions found"
  fi
  
  # 6. Check security configuration
  print_header "Security Configuration"
  
  check_file_exists "next.config.ts" "Next.js configuration"
  check_file_exists "middleware.ts" "Middleware configuration"
  
  # Check for common security misconfigurations
  if [ -f ".env" ] && grep -q "password\|secret\|key" .env 2>/dev/null; then
    print_warning "Sensitive values in .env - ensure not committed"
  fi
  
  if ! grep -q "\.env" .gitignore 2>/dev/null; then
    print_failure ".env not in .gitignore"
  else
    print_success ".env is gitignored"
  fi
  
  # 7. Check documentation
  print_header "Documentation"
  
  check_file_exists "README.md" "README"
  check_file_exists "DEPLOYMENT_CHECKLIST.md" "Deployment checklist"
  check_file_exists "docs/go-live/production-checklist.md" "Production checklist"
  check_file_exists "CHANGELOG.md" "Changelog"
  check_file_exists "docs/go-live/supabase-go-live-checklist.md" "Go-live checklist"
  
  # 8. Check monitoring and observability
  print_header "Monitoring & Observability"
  
  check_dir_exists "infra/metrics" "Metrics infrastructure"
  check_file_exists "infra/metrics/docker-compose.yml" "Metrics docker-compose"
  
  if [ -f "apps/pwa/staff-admin/lib/observability/logger.ts" ]; then
    print_success "Logging infrastructure exists"
  else
    print_warning "Logging infrastructure not found"
  fi
  
  # 9. Check test infrastructure
  print_header "Test Infrastructure"
  
  check_dir_exists "apps/pwa/staff-admin/tests" "Test directory"
  check_file_exists "playwright.config.ts" "Playwright configuration"
  
  # Try to count test files
  if [ -d "apps/pwa/staff-admin/tests" ]; then
    TEST_COUNT=$(find apps/pwa/staff-admin/tests -name "*.spec.ts" -o -name "*.test.ts" | wc -l)
    print_info "$TEST_COUNT test files found"
  fi
  
  # 10. Check CI/CD configuration
  print_header "CI/CD Configuration"
  
  check_dir_exists ".github/workflows" "GitHub workflows"
  check_file_exists ".github/workflows/ci.yml" "CI workflow"
  check_file_exists ".github/workflows/supabase-deploy.yml" "Supabase deploy workflow"
  
  # 11. Check PWA assets
  print_header "PWA Configuration"
  
  check_file_exists "apps/pwa/staff-admin/public/manifest.json" "PWA manifest"
  check_file_exists "apps/pwa/staff-admin/public/service-worker.js" "Service worker"
  
  if [ -d "apps/pwa/staff-admin/public/icons" ]; then
    print_success "PWA icons directory exists"
  else
    print_warning "PWA icons directory not found"
  fi
  
  # Summary
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║                    VALIDATION SUMMARY                      ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${GREEN}Passed:${NC}   $PASSED"
  echo -e "${RED}Failed:${NC}   $FAILED"
  echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
  echo ""
  
  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Production readiness validation passed!${NC}"
    echo -e "${YELLOW}⚠ Please review warnings and complete manual checklist items.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review docs/go-live/production-checklist.md"
    echo "2. Ensure all environment variables are set"
    echo "3. Run: pnpm run check:deploy"
    echo "4. Deploy Supabase migrations and functions"
    echo "5. Perform deployment dry run"
    exit 0
  else
    echo -e "${RED}✗ Production readiness validation failed!${NC}"
    echo -e "${RED}Please fix $FAILED critical issue(s) before proceeding.${NC}"
    echo ""
    echo "Review the output above and address all failures."
    exit 1
  fi
}

# Run main function
main "$@"

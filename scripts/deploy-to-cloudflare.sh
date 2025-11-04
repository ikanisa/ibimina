#!/bin/bash
# Deploy Staff/Admin PWA to Cloudflare Pages
# This script handles the complete deployment process for both admin and staff apps

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ADMIN_APP_DIR="$REPO_ROOT/apps/admin"

# Default values
DRY_RUN=${DRY_RUN:-false}
BUILD_ONLY=${BUILD_ONLY:-false}
APP_TO_DEPLOY=${APP_TO_DEPLOY:-"both"}  # Options: admin, staff, both

# Function to print colored messages
print_header() {
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Function to check if required tools are installed
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_tools=()
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    else
        local node_version=$(node -v | cut -d'v' -f2)
        print_success "Node.js v$node_version installed"
    fi
    
    # Check for pnpm
    if ! command -v pnpm &> /dev/null; then
        missing_tools+=("pnpm")
    else
        local pnpm_version=$(pnpm -v)
        print_success "pnpm v$pnpm_version installed"
    fi
    
    # Check for wrangler
    if ! command -v wrangler &> /dev/null && ! [ -x "$(pnpm bin)/wrangler" ]; then
        missing_tools+=("wrangler")
    else
        print_success "wrangler installed"
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo ""
        echo "Please install missing tools:"
        for tool in "${missing_tools[@]}"; do
            case $tool in
                node)
                    echo "  Node.js: https://nodejs.org/ (v20.x or higher)"
                    ;;
                pnpm)
                    echo "  pnpm: npm install -g pnpm@10.19.0"
                    ;;
                wrangler)
                    echo "  wrangler: npm install -g wrangler (or use pnpm exec wrangler)"
                    ;;
            esac
        done
        exit 1
    fi
}

# Function to check required environment variables
check_environment_variables() {
    print_header "Checking Environment Variables"
    
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "BACKUP_PEPPER"
        "MFA_SESSION_SECRET"
        "TRUSTED_COOKIE_SECRET"
        "HMAC_SHARED_SECRET"
        "KMS_DATA_KEY_BASE64"
        "OPENAI_API_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        else
            # Show first 10 chars of the value for verification (except for URLs)
            if [[ $var == *"URL"* ]]; then
                print_success "$var: ${!var}"
            else
                local value_preview="${!var:0:10}..."
                print_success "$var: $value_preview"
            fi
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        print_info "Please set these environment variables before running this script."
        print_info "See .env.cloudflare.template for guidance on generating secrets."
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Function to check Cloudflare authentication
check_cloudflare_auth() {
    print_header "Checking Cloudflare Authentication"
    
    if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
        print_success "CLOUDFLARE_API_TOKEN is set"
        export WRANGLER_API_TOKEN="$CLOUDFLARE_API_TOKEN"
    fi
    
    if [ -n "$CLOUDFLARE_ACCOUNT_ID" ]; then
        print_success "CLOUDFLARE_ACCOUNT_ID is set"
        export WRANGLER_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID"
    fi
    
    # Try to verify wrangler authentication
    if [ "$DRY_RUN" = false ]; then
        if pnpm exec wrangler whoami &> /dev/null; then
            print_success "Wrangler is authenticated"
        else
            print_warning "Wrangler authentication could not be verified"
            print_info "If deployment fails, run: wrangler login"
        fi
    fi
}

# Function to build the admin app for Cloudflare
build_app() {
    print_header "Building Admin App for Cloudflare Pages"
    
    cd "$ADMIN_APP_DIR"
    
    print_info "Cleaning previous build artifacts..."
    rm -rf .vercel/output 2>/dev/null || true
    
    print_info "Running Cloudflare build..."
    export CLOUDFLARE_BUILD=1
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    
    if pnpm build:cloudflare; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
    
    # Verify build output
    if [ -d ".vercel/output/static" ]; then
        local build_size=$(du -sh .vercel/output/static | cut -f1)
        print_success "Build output created: $build_size"
        
        # List some key files
        print_info "Build artifacts:"
        ls -lh .vercel/output/static/ | head -10
    else
        print_error "Build output directory not found"
        exit 1
    fi
}

# Function to deploy to Cloudflare Pages
deploy_to_cloudflare() {
    local project_name=$1
    local app_type=$2
    
    print_header "Deploying $app_type App to Cloudflare Pages"
    
    cd "$ADMIN_APP_DIR"
    
    if [ ! -d ".vercel/output/static" ]; then
        print_error "Build output not found. Please run build first."
        exit 1
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN MODE - Skipping actual deployment"
        print_info "Would deploy to project: $project_name"
        return
    fi
    
    print_info "Deploying to Cloudflare Pages project: $project_name"
    
    # Deploy using wrangler
    if pnpm exec wrangler pages deploy .vercel/output/static \
        --project-name="$project_name" \
        --branch=main; then
        print_success "$app_type deployment completed successfully"
        print_info "Deployment URL will be shown above"
    else
        print_error "$app_type deployment failed"
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    local domain=$1
    local app_type=$2
    
    print_header "Verifying $app_type Deployment"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN MODE - Skipping verification"
        return
    fi
    
    print_info "Waiting 30 seconds for deployment to propagate..."
    sleep 30
    
    print_info "Testing health endpoint: https://$domain/api/healthz"
    
    if curl -f -s -o /dev/null -w "%{http_code}" "https://$domain/api/healthz" | grep -q "200"; then
        print_success "Health check passed for $domain"
    else
        print_warning "Health check failed or returned non-200 status"
        print_info "The deployment may still be propagating. Check manually at:"
        print_info "  https://$domain"
    fi
}

# Function to display deployment summary
display_summary() {
    print_header "Deployment Summary"
    
    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN completed - no actual deployment performed"
        return
    fi
    
    echo ""
    print_info "Deployment Status:"
    echo ""
    
    if [ "$APP_TO_DEPLOY" = "admin" ] || [ "$APP_TO_DEPLOY" = "both" ]; then
        echo "  Admin App:"
        echo "    - Project: ibimina-admin"
        echo "    - Domain: adminsacco.ikanisa.com"
        echo "    - URL: https://adminsacco.ikanisa.com"
        echo ""
    fi
    
    if [ "$APP_TO_DEPLOY" = "staff" ] || [ "$APP_TO_DEPLOY" = "both" ]; then
        echo "  Staff App:"
        echo "    - Project: ibimina-staff"
        echo "    - Domain: saccostaff.ikanisa.com"
        echo "    - URL: https://saccostaff.ikanisa.com"
        echo ""
    fi
    
    print_info "Next Steps:"
    echo "  1. Verify deployments in Cloudflare Dashboard"
    echo "  2. Test authentication flows"
    echo "  3. Monitor error logs in Cloudflare Analytics"
    echo "  4. Update DNS if using custom domains"
    echo ""
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy Staff/Admin PWA to Cloudflare Pages

OPTIONS:
    --dry-run           Simulate deployment without actually deploying
    --build-only        Only build the app, don't deploy
    --app APP_NAME      Deploy specific app: admin, staff, or both (default: both)
    --help              Show this help message

ENVIRONMENT VARIABLES:
    Required for build:
        NEXT_PUBLIC_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY
        SUPABASE_SERVICE_ROLE_KEY
        BACKUP_PEPPER
        MFA_SESSION_SECRET
        TRUSTED_COOKIE_SECRET
        HMAC_SHARED_SECRET
        KMS_DATA_KEY_BASE64
        OPENAI_API_KEY
    
    Required for deployment:
        CLOUDFLARE_API_TOKEN (or authenticate with: wrangler login)
        CLOUDFLARE_ACCOUNT_ID (optional, if not in wrangler config)

EXAMPLES:
    # Full deployment (build + deploy both apps)
    $0
    
    # Dry run to test without deploying
    $0 --dry-run
    
    # Build only (no deployment)
    $0 --build-only
    
    # Deploy only admin app
    $0 --app admin
    
    # Deploy only staff app
    $0 --app staff

For more information, see:
    - CLOUDFLARE_DEPLOYMENT_CHECKLIST.md
    - PWA_CLOUDFLARE_DEPLOYMENT.md
    - .env.cloudflare.template

EOF
}

# Main execution
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --build-only)
                BUILD_ONLY=true
                shift
                ;;
            --app)
                APP_TO_DEPLOY="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate APP_TO_DEPLOY value
    if [[ ! "$APP_TO_DEPLOY" =~ ^(admin|staff|both)$ ]]; then
        print_error "Invalid --app value: $APP_TO_DEPLOY"
        echo "Must be one of: admin, staff, both"
        exit 1
    fi
    
    print_header "Cloudflare Pages Deployment Script"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "Running in DRY RUN mode - no actual deployment will occur"
    fi
    
    # Step 1: Check prerequisites
    check_prerequisites
    
    # Step 2: Check environment variables
    check_environment_variables
    
    # Step 3: Check Cloudflare authentication (if not build-only)
    if [ "$BUILD_ONLY" = false ]; then
        check_cloudflare_auth
    fi
    
    # Step 4: Build the app
    build_app
    
    # If build-only mode, stop here
    if [ "$BUILD_ONLY" = true ]; then
        print_success "Build completed. Skipping deployment (--build-only mode)"
        exit 0
    fi
    
    # Step 5: Deploy to Cloudflare Pages
    if [ "$APP_TO_DEPLOY" = "admin" ] || [ "$APP_TO_DEPLOY" = "both" ]; then
        deploy_to_cloudflare "ibimina-admin" "Admin"
        verify_deployment "adminsacco.ikanisa.com" "Admin"
    fi
    
    if [ "$APP_TO_DEPLOY" = "staff" ] || [ "$APP_TO_DEPLOY" = "both" ]; then
        deploy_to_cloudflare "ibimina-staff" "Staff"
        verify_deployment "saccostaff.ikanisa.com" "Staff"
    fi
    
    # Step 6: Display summary
    display_summary
    
    print_success "Deployment process completed!"
}

# Run main function
main "$@"

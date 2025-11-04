#!/bin/bash
# Quick test script for Cloudflare build
# This script sets up minimal placeholder environment variables and attempts a build

set -e

echo "🧪 Testing Cloudflare Build Process"
echo "===================================="
echo ""

# Set placeholder environment variables for build test
export CLOUDFLARE_BUILD=1
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Required build-time variables (placeholders for testing)
export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-placeholder-anon-key}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-placeholder-service-role-key}"
export BACKUP_PEPPER="${BACKUP_PEPPER:-placeholder-backup-pepper-32-bytes-min}"
export MFA_SESSION_SECRET="${MFA_SESSION_SECRET:-placeholder-mfa-session-secret-32b}"
export TRUSTED_COOKIE_SECRET="${TRUSTED_COOKIE_SECRET:-placeholder-trusted-cookie-secret}"
export HMAC_SHARED_SECRET="${HMAC_SHARED_SECRET:-placeholder-hmac-shared-secret-32}"
export KMS_DATA_KEY_BASE64="${KMS_DATA_KEY_BASE64:-c3R1Yi1rbXMtZGF0YS1rZXktMzItYnl0ZXMtISEhIQ==}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-placeholder-openai-api-key}"

echo "✓ Environment variables set (using placeholders where needed)"
echo ""

# Change to admin app directory
cd "$(dirname "$0")/../apps/admin"

echo "📦 Installing dependencies..."
# Disable husky in CI/production builds
export HUSKY=0
export CI=true
if pnpm install --frozen-lockfile --ignore-scripts; then
    echo "✓ Dependencies installed"
else
    echo "✗ Failed to install dependencies"
    exit 1
fi
echo ""

echo "🏗️  Building for Cloudflare Pages..."
if pnpm build:cloudflare; then
    echo "✓ Build completed successfully"
else
    echo "✗ Build failed"
    exit 1
fi
echo ""

# Check build output
if [ -d ".vercel/output/static" ]; then
    BUILD_SIZE=$(du -sh .vercel/output/static | cut -f1)
    echo "✓ Build output directory exists: $BUILD_SIZE"
    echo ""
    echo "Build artifacts:"
    ls -lh .vercel/output/static/ | head -15
    echo ""
    echo "✅ Build test PASSED!"
    echo ""
    echo "Next steps:"
    echo "  1. Set real environment variables from .env.cloudflare.template"
    echo "  2. Run: ./scripts/deploy-to-cloudflare.sh --dry-run"
    echo "  3. When ready, deploy: ./scripts/deploy-to-cloudflare.sh"
else
    echo "✗ Build output directory not found"
    exit 1
fi

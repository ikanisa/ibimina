#!/bin/bash

set -e

echo "🧹 Removing Cloudflare/Vercel specific files and dependencies..."
echo ""

# Remove Vercel configuration files
echo "❌ Removing Vercel configuration files..."
rm -rf apps/pwa/staff-admin/.vercel || true
rm -rf apps/pwa/client/.vercel || true
rm -rf apps/website/.vercel || true
rm -f infra/scripts/deploy-vercel.ts || true
rm -f apps/pwa/client/public/vercel.svg || true
rm -f apps/website/public/vercel.svg || true
rm -f docs/releases/2025-12-05-vercel-supabase.md || true

# Remove Cloudflare configuration files
echo "❌ Removing Cloudflare configuration files..."
rm -f .env.cloudflare.template || true
rm -f apps/pwa/staff-admin/.env.cloudflare.template || true
rm -f apps/pwa/client/.env.cloudflare.template || true
rm -f apps/pwa/staff-admin/wrangler.toml || true
rm -f apps/pwa/staff-admin/wrangler.staff.toml || true
rm -f apps/pwa/staff-admin/wrangler.pages.backup.toml || true
rm -f apps/pwa/client/wrangler.toml || true
rm -f apps/website/wrangler.toml || true
rm -f apps/pwa/staff-admin/scripts/mac/install_caddy_cloudflared.sh || true
rm -rf infra/cloudflared || true
rm -f docs/local-caddy-cloudflare-tunnel.md || true

# Remove Cloudflare scripts
echo "❌ Removing Cloudflare deployment scripts..."
rm -f scripts/deploy-to-cloudflare.sh || true
rm -f scripts/test-cloudflare-build.sh || true
rm -f scripts/validate-cloudflare-deployment.sh || true
rm -f scripts/validate-pwa-cloudflare.sh || true

# Remove Cloudflare GitHub Actions workflows
echo "❌ Removing Cloudflare GitHub Actions workflows..."
rm -f .github/workflows/deploy-admin-cloudflare.yml || true
rm -f .github/workflows/deploy-client-cloudflare.yml || true
rm -f .github/workflows/deploy-cloudflare.yml || true

echo ""
echo "✅ Cloudflare/Vercel files removed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Update package.json to remove Cloudflare dependencies"
echo "   2. Update Next.js configs for Netlify"
echo "   3. Remove edge runtime from API routes"
echo "   4. Update middleware for standard Next.js"

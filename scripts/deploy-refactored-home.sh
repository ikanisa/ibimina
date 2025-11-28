#!/bin/bash
# Deployment Script for Refactored Home Page
# Created: November 28, 2024

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║         🚀 DEPLOYING REFACTORED HOME PAGE 🚀                        ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Backup original
echo "📦 Step 1: Backing up original..."
cp apps/pwa/client/app/\(tabs\)/home/page.tsx apps/pwa/client/app/\(tabs\)/home/page.original.backup.tsx
echo "✅ Backup created: page.original.backup.tsx"
echo ""

# Step 2: Apply refactored version
echo "🔄 Step 2: Applying refactored version..."
cp apps/pwa/client/app/\(tabs\)/home/page.refactored.tsx apps/pwa/client/app/\(tabs\)/home/page.tsx
echo "✅ Refactored version applied"
echo ""

# Step 3: TypeScript check
echo "🔍 Step 3: Running TypeScript check..."
pnpm --filter client typecheck
if [ $? -eq 0 ]; then
  echo "✅ TypeScript check passed"
else
  echo "❌ TypeScript errors found - reverting..."
  cp apps/pwa/client/app/\(tabs\)/home/page.original.backup.tsx apps/pwa/client/app/\(tabs\)/home/page.tsx
  exit 1
fi
echo ""

# Step 4: Build check
echo "🏗️  Step 4: Running build check..."
pnpm --filter client build
if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed - reverting..."
  cp apps/pwa/client/app/\(tabs\)/home/page.original.backup.tsx apps/pwa/client/app/\(tabs\)/home/page.tsx
  exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Run: pnpm --filter client dev"
echo "2. Visit: http://localhost:3000/home"
echo "3. Test the refactored page"
echo "4. Monitor metrics and user feedback"
echo ""
echo "To rollback:"
echo "cp apps/pwa/client/app/\(tabs\)/home/page.original.backup.tsx apps/pwa/client/app/\(tabs\)/home/page.tsx"
echo ""

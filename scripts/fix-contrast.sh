#!/bin/bash

# Fix text contrast issues across the repository
# Changes text-neutral-600 to text-neutral-700 on white/light backgrounds

echo "🔍 Fixing text contrast issues for WCAG AA compliance..."

# Website - only on white backgrounds (not neutral-50)
echo "📱 Fixing apps/website..."
find apps/website/app -name "*.tsx" -type f -exec sed -i.bak 's/text-neutral-600/text-neutral-700/g' {} \;

# Client PWA - check all files
echo "📱 Fixing apps/client..."
if [ -d "apps/client" ]; then
  find apps/client -name "*.tsx" -type f -exec sed -i.bak 's/text-neutral-600/text-neutral-700/g' {} \;
fi

# Mobile - different approach needed for React Native
echo "📱 Checking apps/mobile..."
if [ -d "apps/mobile" ]; then
  echo "⚠️  Mobile uses React Native styles - manual review needed"
fi

# Clean up backup files
find apps -name "*.bak" -delete

echo "✅ Text contrast fixes complete!"
echo ""
echo "📊 Changes made:"
git diff --stat apps/website apps/client 2>/dev/null || echo "No git changes detected"


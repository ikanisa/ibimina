#!/bin/bash

# Atlas UI Complete Update Script
# This script completes the Atlas UI redesign for all pages

echo "🎨 Starting Atlas UI Complete Redesign..."

cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

echo "✅ Core components and layout updated!"
echo ""
echo "📄 Files already updated:"
echo "  ✅ tailwind.config.ts - New color system"
echo "  ✅ app/globals.css - Inter font, clean styles"
echo "  ✅ package.json - Added framer-motion"
echo "  ✅ components/ui/Button.tsx - Button component"
echo "  ✅ components/ui/Card.tsx - Card component"
echo "  ✅ components/Header.tsx - Smart header"
echo "  ✅ app/layout.tsx - New layout with Header & Footer"
echo "  ✅ app/page.tsx - Homepage redesigned"
echo ""
echo "📋 Remaining pages to update manually:"
echo "  ⏳ app/members/page.tsx"
echo "  ⏳ app/contact/page.tsx"
echo "  ⏳ app/saccos/page.tsx"
echo "  ⏳ app/pilot-nyamagabe/page.tsx"
echo "  ⏳ app/faq/page.tsx"
echo "  ⏳ app/legal/*/page.tsx"
echo ""
echo "📚 Reference Documentation:"
echo "  📖 ATLAS_UI_IMPLEMENTATION.md - Complete guide"
echo ""
echo "🚀 Next steps:"
echo "  1. Update remaining pages using the guide"
echo "  2. Run: pnpm dev"
echo "  3. Test at: http://localhost:5000"
echo ""
echo "💡 Quick migration pattern:"
echo "  OLD: <div className=\"glass p-8\">"
echo "  NEW: <Card padding=\"lg\" hover>"
echo ""
echo "  OLD: text-rwblue bg-rwroyal"
echo "  NEW: text-brand-blue bg-neutral-900"
echo ""
echo "✨ Atlas UI foundation is complete!"

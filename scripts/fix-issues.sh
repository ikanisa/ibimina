#!/bin/bash

echo "🔧 Fixing common repository issues..."
echo ""

# Fix line endings
echo "📝 Normalizing line endings..."
if command -v git &> /dev/null; then
    git config core.autocrlf false
    git config core.eol lf
    echo "✅ Git line ending settings configured"
else
    echo "⚠️  Git not found, skipping line ending normalization"
fi
echo ""

# Fix permissions
echo "🔑 Fixing script permissions..."
find . -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null || true
chmod +x scripts/*.js 2>/dev/null || true
echo "✅ Script permissions fixed"
echo ""

# Clean node_modules if corrupted
if [ "$1" = "--clean" ]; then
    echo "🧹 Cleaning node_modules..."
    rm -rf node_modules
    rm -rf apps/*/node_modules
    rm -rf packages/*/node_modules
    rm -rf pnpm-lock.yaml
    echo "✅ Cleaned node_modules and lock file"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install --frozen-lockfile
    echo "✅ Dependencies installed"
else
    echo "❌ pnpm not found. Install with: npm install -g pnpm@10.19.0"
    exit 1
fi
echo ""

# Check environment variables
echo "🔍 Checking environment variables..."
if [ -f .env ]; then
    echo "✅ .env file found"
else
    echo "⚠️  No .env file found"
    if [ -f .env.example ]; then
        echo "📝 Creating .env from .env.example..."
        cp .env.example .env
        echo "✅ .env file created. Please update the values."
    else
        echo "❌ .env.example not found"
    fi
fi
echo ""

# Generate PWA manifests
echo "🎨 Generating PWA manifests..."
node scripts/generate-pwa.js
echo ""

# Fix TypeScript issues
echo "🔧 Checking TypeScript configuration..."
if pnpm run typecheck 2>&1 | grep -q "error"; then
    echo "⚠️  TypeScript errors found. Run: pnpm typecheck"
else
    echo "✅ TypeScript check passed"
fi
echo ""

# Fix linting issues
echo "🧹 Fixing linting issues..."
if pnpm run format; then
    echo "✅ Code formatted"
else
    echo "⚠️  Some files could not be formatted"
fi
echo ""

# Clean build artifacts
echo "🧹 Cleaning build artifacts..."
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".vercel" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "dist" -type d -path "*/apps/*/dist" -exec rm -rf {} + 2>/dev/null || true
echo "✅ Build artifacts cleaned"
echo ""

# Summary
DIVIDER="=================================================="
echo "$DIVIDER"
echo "✨ Common issues fixed!"
echo ""
echo "📝 Next steps:"
echo "   1. Update .env with your values"
echo "   2. Run: pnpm build"
echo "   3. Run: pnpm test"
echo "   4. Run: pnpm dev"
echo ""
echo "💡 For help, see:"
echo "   - README.md"
echo "   - DEVELOPMENT.md"
echo "   - QUICK_START.md"
echo "$DIVIDER"

#!/bin/bash

# Quick environment setup script for Ibimina

echo "🚀 Ibimina Environment Setup"
echo "=============================="
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file missing - creating from template..."
    cp .env.example .env
    
    # Generate secrets
    echo "🔐 Generating security secrets..."
    sed -i.bak "s/stub-kms-data-key-base64/$(openssl rand -base64 32 | tr -d '\n')/" .env
    sed -i.bak "s/hex-64-character-backup-pepper/$(openssl rand -hex 32)/" .env
    sed -i.bak "s/hex-64-character-mfa-secret/$(openssl rand -hex 32)/" .env
    sed -i.bak "s/hex-64-character-trusted-secret/$(openssl rand -hex 32)/" .env
    sed -i.bak "s/hex-64-character-hmac-secret/$(openssl rand -hex 32)/" .env
    rm .env.bak
    
    echo "✅ .env created with auto-generated secrets"
fi

echo ""
echo "📋 Current Configuration Status:"
echo ""

# Check Supabase configuration
if grep -q "your-project.supabase.co" .env 2>/dev/null || grep -q "your-actual-anon-key" .env.local 2>/dev/null; then
    echo "❌ Supabase not configured"
    echo ""
    echo "To configure Supabase, choose one option:"
    echo ""
    echo "Option 1: Use Your Supabase Project"
    echo "  1. Go to: https://app.supabase.com/project/_/settings/api"
    echo "  2. Copy your Project URL and API keys"
    echo "  3. Edit .env.local and add:"
    echo "     NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co"
    echo "     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo "     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    echo "Option 2: Use Local Supabase"
    echo "  1. Run: supabase start"
    echo "  2. Copy the credentials shown"
    echo "  3. Add them to .env.local"
    echo ""
else
    echo "✅ Supabase configured"
fi

# Check if dev server is running
if lsof -ti:3100 > /dev/null 2>&1; then
    echo "✅ Dev server is running on port 3100"
    echo ""
    echo "⚠️  If you just updated .env, restart the server:"
    echo "   Kill current: pkill -f 'next dev'"
    echo "   Start again: pnpm dev"
else
    echo "ℹ️  Dev server not running"
    echo ""
    echo "To start the development server:"
    echo "   pnpm dev"
fi

echo ""
echo "📚 Documentation:"
echo "  - Full setup: README.md"
echo "  - Quick start: QUICK_START.md"
echo "  - Testing: TESTING_GUIDE.md"
echo ""

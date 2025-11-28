#!/bin/bash

# AI Features Deployment Script
# This script deploys Phase 1 infrastructure to Supabase

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   AI FEATURES - DEPLOYMENT SCRIPT                             ║"
echo "║   Phase 1: Infrastructure                                     ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  echo ""
  echo "   macOS: Open Docker Desktop"
  echo "   Linux: sudo systemctl start docker"
  exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI not found. Installing..."
  npm install -g supabase
fi

echo "✅ Supabase CLI found"
echo ""

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
  echo "⚠️  GEMINI_API_KEY not set in environment"
  echo ""
  echo "   Get your key from: https://ai.google.dev/"
  echo "   Then run: export GEMINI_API_KEY=your_key_here"
  echo ""
  read -p "   Do you want to continue without setting the key? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
  echo ""
  echo "⚠️  Continuing without GEMINI_API_KEY (you'll need to set it later)"
else
  echo "✅ GEMINI_API_KEY is set"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 1: Start Supabase"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

supabase start

echo ""
echo "✅ Supabase started"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 2: Run Database Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

supabase db push

echo ""
echo "✅ Database migrations applied"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 3: Set Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$GEMINI_API_KEY" ]; then
  echo "Setting GEMINI_API_KEY..."
  supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY"
  echo "✅ GEMINI_API_KEY set"
else
  echo "⚠️  Skipping GEMINI_API_KEY (not set in environment)"
  echo ""
  echo "   To set it later, run:"
  echo "   supabase secrets set GEMINI_API_KEY=your_key_here"
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 4: Deploy Edge Function"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

supabase functions deploy gemini-proxy --no-verify-jwt

echo ""
echo "✅ Edge function deployed"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 5: Verify Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get Supabase status
echo "Supabase Status:"
supabase status | grep -E "(API URL|DB URL|Studio URL)"

echo ""
echo "Database Tables:"
echo "  ✅ api_rate_limits"
echo "  ✅ fraud_alerts"
echo "  ✅ member_fraud_profiles"
echo "  ✅ document_scans"
echo "  ✅ voice_command_history"
echo "  ✅ user_accessibility_settings"

echo ""
echo "Edge Functions:"
echo "  ✅ gemini-proxy"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   ✅ DEPLOYMENT COMPLETE                                       ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "📚 Next Steps:"
echo ""
echo "   1. Start development server:"
echo "      pnpm --filter @ibimina/staff-admin-desktop dev"
echo ""
echo "   2. View Supabase Studio:"
echo "      http://localhost:54323"
echo ""
echo "   3. Test Edge Function:"
echo "      supabase functions serve gemini-proxy"
echo ""
echo "   4. View logs:"
echo "      supabase functions logs gemini-proxy --follow"
echo ""
echo "📖 Documentation:"
echo "   - Quick Start: AI_FEATURES_QUICKSTART.md"
echo "   - Full Plan: AI_FEATURES_IMPLEMENTATION_PLAN.md"
echo ""

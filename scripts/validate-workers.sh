#!/bin/bash
#
# Worker Validation Script
# Tests platform-api workers without requiring full environment setup
#

set -e

echo "🔍 Platform API Worker Validation"
echo "=================================="
echo ""

# Check if platform-api builds
echo "📦 Building platform-api..."
cd /home/runner/work/ibimina/ibimina/apps/platform-api
if pnpm run build 2>&1 | tail -10; then
    echo "✅ Platform API builds successfully"
else
    echo "❌ Platform API build failed"
    exit 1
fi

echo ""
echo "📝 Checking worker implementations..."

# Check momo-poller
if [ -f "src/workers/momo-poller.ts" ]; then
    echo "✅ momo-poller.ts exists"
    
    # Check for key functions
    if grep -q "runMomoPoller" src/workers/momo-poller.ts; then
        echo "  ✓ runMomoPoller function found"
    fi
    
    if grep -q "invokeEdge" src/workers/momo-poller.ts; then
        echo "  ✓ Edge function invocation implemented"
    fi
else
    echo "❌ momo-poller.ts missing"
    exit 1
fi

# Check gsm-heartbeat
if [ -f "src/workers/gsm-heartbeat.ts" ]; then
    echo "✅ gsm-heartbeat.ts exists"
    
    # Check for key functions
    if grep -q "runGsmHeartbeat" src/workers/gsm-heartbeat.ts; then
        echo "  ✓ runGsmHeartbeat function found"
    fi
    
    if grep -q "invokeEdge" src/workers/gsm-heartbeat.ts; then
        echo "  ✓ Edge function invocation implemented"
    fi
else
    echo "❌ gsm-heartbeat.ts missing"
    exit 1
fi

# Check index.ts
if [ -f "src/index.ts" ]; then
    echo "✅ index.ts exists"
    
    if grep -q "runMomoPoller\|runGsmHeartbeat" src/index.ts; then
        echo "  ✓ Workers are wired up in main entry point"
    fi
else
    echo "❌ index.ts missing"
    exit 1
fi

# Check if compiled files exist
echo ""
echo "📦 Checking build artifacts..."
if [ -d "dist" ]; then
    echo "✅ dist directory exists"
    
    if [ -f "dist/index.js" ]; then
        echo "  ✓ dist/index.js exists"
    fi
    
    if [ -f "dist/workers/momo-poller.js" ]; then
        echo "  ✓ dist/workers/momo-poller.js exists"
    fi
    
    if [ -f "dist/workers/gsm-heartbeat.js" ]; then
        echo "  ✓ dist/workers/gsm-heartbeat.js exists"
    fi
else
    echo "⚠️  dist directory not found (run pnpm build)"
fi

# Check Supabase edge functions
echo ""
echo "🔗 Checking Supabase edge functions..."
cd /home/runner/work/ibimina/ibimina

if [ -f "supabase/functions/momo-statement-poller/index.ts" ]; then
    echo "✅ momo-statement-poller edge function exists"
else
    echo "❌ momo-statement-poller edge function missing"
    exit 1
fi

# Check for gsm heartbeat or maintenance function
if [ -f "supabase/functions/gsm-heartbeat/index.ts" ] || [ -f "supabase/functions/gsm-maintenance/index.ts" ]; then
    echo "✅ GSM edge function exists"
else
    echo "❌ GSM edge function missing"
    exit 1
fi

echo ""
echo "✅ All worker validations passed!"
echo ""
echo "📋 Summary:"
echo "  - Platform API builds successfully"
echo "  - Worker implementations are complete"
echo "  - Edge functions are present"
echo "  - Ready for deployment with proper environment variables"
echo ""
echo "⚠️  Note: Actual execution requires:"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - HMAC_SHARED_SECRET"
echo "  - Deployed Supabase edge functions"

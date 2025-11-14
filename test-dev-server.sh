#!/bin/bash

echo "=== DEV SERVER TEST SCRIPT ==="
echo ""

# Clean previous build
echo "Step 1: Cleaning previous build..."
rm -rf apps/pwa/staff-admin/.next
echo "✓ Cleaned"
echo ""

# Start dev server in background
echo "Step 2: Starting dev server..."
cd apps/pwa/staff-admin
pnpm dev > /tmp/ibimina-dev.log 2>&1 &
DEV_PID=$!
echo "✓ Dev server started (PID: $DEV_PID)"
echo ""

# Wait for server to be ready
echo "Step 3: Waiting for server to be ready (30s timeout)..."
for i in {1..30}; do
    if curl -s http://localhost:3100 > /dev/null 2>&1; then
        echo "✓ Server is responding!"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Test server
echo "Step 4: Testing server response..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100)
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
    echo "✅ SUCCESS - Server is working!"
else
    echo "❌ FAILED - Server returned $HTTP_CODE"
    echo ""
    echo "Last 50 lines of log:"
    tail -50 /tmp/ibimina-dev.log
fi

echo ""
echo "Dev server is running at: http://localhost:3100"
echo "PID: $DEV_PID"
echo "Log: /tmp/ibimina-dev.log"
echo ""
echo "To stop: kill $DEV_PID"

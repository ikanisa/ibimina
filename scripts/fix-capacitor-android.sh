#!/bin/bash
# Fix Capacitor Android 7.4.4 API 35 compatibility issues
# This script patches Capacitor to compile against API 34

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "===== Capacitor Android API 34 Compatibility Patch ====="
echo "This will patch Capacitor Android 7.4.4 to compile against API 34"
echo ""

# Find CapacitorWebView.java
CAPACITOR_FILE=$(find "$PROJECT_ROOT/node_modules" -name "CapacitorWebView.java" -path "*@capacitor/android*" | head -1)

if [ -z "$CAPACITOR_FILE" ]; then
    echo "❌ Error: Could not find CapacitorWebView.java"
    echo "   Please run 'pnpm install' first"
    exit 1
fi

echo "📁 Found: $CAPACITOR_FILE"

# Check if already patched
if grep -q "API35-DISABLED" "$CAPACITOR_FILE"; then
    echo "✅ Already patched - skipping"
    exit 0
fi

echo "🔧 Applying patch..."

# Create backup
cp "$CAPACITOR_FILE" "$CAPACITOR_FILE.bak"

# Patch 1: Replace VANILLA_ICE_CREAM with numeric 34
sed -i.tmp1 's/Build.VERSION_CODES.VANILLA_ICE_CREAM/34/g' "$CAPACITOR_FILE"

# Patch 2: Comment out the API 35-specific edge-to-edge code
sed -i.tmp2 '/if (Build.VERSION.SDK_INT >= 34 && configEdgeToEdge.equals("auto"))/,/autoMargins = !(foundOptOut && optOutValue);/{
    s/^/\/\/ API35-DISABLED: /
}' "$CAPACITOR_FILE"

# Patch 3: Remove orphaned closing brace
sed -i.tmp3 '/^\/\/ API35-DISABLED: $/{ N; /\n *}$/d; }' "$CAPACITOR_FILE"

# Clean up temp files
rm -f "$CAPACITOR_FILE.tmp1" "$CAPACITOR_FILE.tmp2" "$CAPACITOR_FILE.tmp3"

echo "✅ Patch applied successfully!"
echo ""
echo "🔍 Verifying patch..."
if grep -q "API35-DISABLED" "$CAPACITOR_FILE"; then
    echo "✅ Patch verified"
    echo ""
    echo "📝 Note: You can restore the original with:"
    echo "   cp \"$CAPACITOR_FILE.bak\" \"$CAPACITOR_FILE\""
else
    echo "⚠️  Warning: Patch may not have applied correctly"
    echo "   Restoring backup..."
    cp "$CAPACITOR_FILE.bak" "$CAPACITOR_FILE"
    exit 1
fi

echo ""
echo "✨ Done! You can now run:"
echo "   cd apps/pwa/staff-admin/android && JAVA_HOME=\$(/usr/libexec/java_home -v 21) ./gradlew assembleDebug"

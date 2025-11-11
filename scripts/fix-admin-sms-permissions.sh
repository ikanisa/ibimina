#!/bin/bash
# Fix Admin App SMS Permissions - CRITICAL FOR GOOGLE PLAY COMPLIANCE
# This script removes banned SMS permissions and prepares for Notification Listener approach

set -e

echo "🚨 CRITICAL: Fixing Google Play Banned SMS Permissions"
echo "=================================================="
echo ""

ADMIN_MANIFEST="apps/pwa/staff-admin/android/app/src/main/AndroidManifest.xml"
STAFF_MANIFEST="apps/staff-mobile-android/app/src/main/AndroidManifest.xml"

# Backup original files
echo "📦 Creating backups..."
cp "$ADMIN_MANIFEST" "${ADMIN_MANIFEST}.backup"
if [ -f "$STAFF_MANIFEST" ]; then
    cp "$STAFF_MANIFEST" "${STAFF_MANIFEST}.backup"
fi

echo "✅ Backups created"
echo ""

# Fix apps/pwa/staff-admin/android/app/src/main/AndroidManifest.xml
echo "🔧 Fixing $ADMIN_MANIFEST..."

# Remove SMS permissions (lines 69-70)
sed -i.tmp '/<uses-permission android:name="android.permission.READ_SMS"[[:space:]]*\/>/d' "$ADMIN_MANIFEST"
sed -i.tmp '/<uses-permission android:name="android.permission.RECEIVE_SMS"[[:space:]]*\/>/d' "$ADMIN_MANIFEST"

# Remove SMS Broadcast Receiver (lines 38-45)
# This is more complex, need to remove the entire receiver block
sed -i.tmp '/<!-- SMS Broadcast Receiver/,/<\/receiver>/d' "$ADMIN_MANIFEST"
sed -i.tmp '/<receiver[[:space:]]*$/,/<\/receiver>/{ /android:name=".*SmsReceiver"/,/<\/receiver>/d; }' "$ADMIN_MANIFEST"

# Clean up temp files
rm -f "${ADMIN_MANIFEST}.tmp"

echo "✅ $ADMIN_MANIFEST fixed"
echo ""

# Fix apps/staff-mobile-android/app/src/main/AndroidManifest.xml (if exists)
if [ -f "$STAFF_MANIFEST" ]; then
    echo "🔧 Fixing $STAFF_MANIFEST..."
    
    # Remove SMS permissions
    sed -i.tmp '/<uses-permission android:name="android.permission.READ_SMS"[[:space:]]*\/>/d' "$STAFF_MANIFEST"
    sed -i.tmp '/<uses-permission android:name="android.permission.RECEIVE_SMS"[[:space:]]*\/>/d' "$STAFF_MANIFEST"
    
    # Remove SMS Receiver
    sed -i.tmp '/<!-- SMS Receiver -->/,/<\/receiver>/d' "$STAFF_MANIFEST"
    sed -i.tmp '/<receiver[[:space:]]*$/,/<\/receiver>/{ /android:name=".*sms.SmsReceiver"/,/<\/receiver>/d; }' "$STAFF_MANIFEST"
    
    rm -f "${STAFF_MANIFEST}.tmp"
    
    echo "✅ $STAFF_MANIFEST fixed"
else
    echo "ℹ️  $STAFF_MANIFEST not found (may not be separate build)"
fi

echo ""
echo "🔍 Verification..."
echo ""

# Verify SMS permissions removed
echo "Checking for banned SMS permissions..."
if grep -q "READ_SMS\|RECEIVE_SMS" "$ADMIN_MANIFEST"; then
    echo "⚠️  WARNING: SMS permissions still found in $ADMIN_MANIFEST"
    grep -n "SMS" "$ADMIN_MANIFEST"
else
    echo "✅ No SMS permissions in $ADMIN_MANIFEST"
fi

if [ -f "$STAFF_MANIFEST" ]; then
    if grep -q "READ_SMS\|RECEIVE_SMS" "$STAFF_MANIFEST"; then
        echo "⚠️  WARNING: SMS permissions still found in $STAFF_MANIFEST"
        grep -n "SMS" "$STAFF_MANIFEST"
    else
        echo "✅ No SMS permissions in $STAFF_MANIFEST"
    fi
fi

echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. ✅ SMS permissions removed (Google Play compliant)"
echo ""
echo "2. ⚠️  REQUIRED: Implement Notification Listener Service"
echo "   - Copy MoMoNotificationListener from client app"
echo "   - Update AndroidManifest.xml to declare service"
echo "   - Update SMS reading logic to use notifications"
echo "   - Test with MTN/Airtel notifications"
echo ""
echo "3. 🧪 Test the changes:"
echo "   cd apps/pwa/staff-admin/android"
echo "   ./gradlew clean assembleDebug"
echo "   aapt dump permissions app/build/outputs/apk/debug/app-debug.apk | grep SMS"
echo "   # Should return nothing"
echo ""
echo "4. 📱 Install and test on device:"
echo "   adb install app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "5. 🔄 If anything breaks, restore backups:"
echo "   cp ${ADMIN_MANIFEST}.backup $ADMIN_MANIFEST"
echo ""
echo "📚 See MOBILE_APK_PRODUCTION_ROADMAP.md for full implementation guide"
echo ""
echo "✨ SMS permissions fix complete!"

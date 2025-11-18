#!/bin/bash
# Build Release APK/AAB for Ibimina Admin/Staff App

set -e

echo "🚀 Building Ibimina Staff/Admin App for Release"
echo "=============================================="
echo ""

# Check if SMS permissions were fixed
ADMIN_MANIFEST="apps/pwa/staff-admin/android/app/src/main/AndroidManifest.xml"

echo "🔍 Checking for banned SMS permissions..."
if grep -q "READ_SMS\|RECEIVE_SMS" "$ADMIN_MANIFEST"; then
    echo "❌ CRITICAL: Banned SMS permissions found!"
    echo ""
    echo "Google Play will REJECT this app with these permissions."
    echo ""
    echo "Remove the SMS permissions from the Android manifest before building."
    exit 1
else
    echo "✅ No banned SMS permissions (Google Play compliant)"
fi

echo ""

# Check if signing credentials are configured
if [ -z "$ANDROID_KEYSTORE_PATH" ]; then
    echo "⚠️  Signing credentials not configured"
    echo ""
    echo "To build a signed release, set these environment variables:"
    echo "  export ANDROID_KEYSTORE_PATH=/path/to/ibimina-staff-release.keystore"
    echo "  export ANDROID_KEYSTORE_PASSWORD=<your-keystore-password>"
    echo "  export ANDROID_KEY_ALIAS=ibimina-staff"
    echo "  export ANDROID_KEY_PASSWORD=<your-key-password>"
    echo "  export ANDROID_VERSION_CODE=102"
    echo "  export ANDROID_VERSION_NAME=0.1.2"
    echo ""
    echo "Or create a signing config file:"
    echo "  ~/.ibimina-staff-signing.env"
    echo ""
    
    read -p "Continue with unsigned build? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Build cancelled"
        exit 1
    fi
    
    UNSIGNED_BUILD=true
fi

# Set version info
export ANDROID_VERSION_CODE="${ANDROID_VERSION_CODE:-102}"
export ANDROID_VERSION_NAME="${ANDROID_VERSION_NAME:-0.1.2}"

echo "🔍 Checking build environment..."
echo "   Version Code: $ANDROID_VERSION_CODE"
echo "   Version Name: $ANDROID_VERSION_NAME"
echo "✅ Build environment ready"
echo ""

# Change to Android directory
cd apps/pwa/staff-admin/android

echo "📦 Cleaning previous builds..."
./gradlew clean

echo ""
echo "🏗️  Building..."

if [ "$UNSIGNED_BUILD" = true ]; then
    echo "Building unsigned debug APK..."
    ./gradlew assembleDebug
    
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    
    if [ -f "$APK_PATH" ]; then
        echo ""
        echo "✅ Build successful!"
        echo "📱 APK: $APK_PATH"
        ls -lh "$APK_PATH"
        
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo "📊 Size: $APK_SIZE"
        
        echo ""
        echo "⚠️  This is an UNSIGNED debug build"
        echo "   Good for internal distribution to staff"
        echo "   For Play Store, you need a signed release build"
        
        echo ""
        echo "📋 To distribute to staff:"
        echo "   1. Upload APK to staff portal"
        echo "   2. Staff enable 'Install from Unknown Sources'"
        echo "   3. Staff download and install"
        echo "   4. No Google Play review needed!"
    else
        echo "❌ Build failed - APK not found"
        exit 1
    fi
else
    echo "Building signed release APK..."
    ./gradlew assembleRelease
    
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
    
    if [ -f "$APK_PATH" ]; then
        echo ""
        echo "✅ Release APK built successfully!"
        echo "📱 APK: $APK_PATH"
        ls -lh "$APK_PATH"
        
        # Verify signing
        echo ""
        echo "🔐 Verifying signature..."
        if jarsigner -verify -verbose -certs "$APK_PATH" | grep -q "jar verified"; then
            echo "✅ APK is properly signed"
            
            # Show certificate details
            echo ""
            echo "📜 Certificate info:"
            jarsigner -verify -verbose -certs "$APK_PATH" | grep "CN=" | head -1
        else
            echo "⚠️  APK signature verification failed"
        fi
        
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo ""
        echo "📊 APK Size: $APK_SIZE"
        
        echo ""
        echo "🎯 Now building AAB (Android App Bundle) for Play Store..."
        ./gradlew bundleRelease
        
        AAB_PATH="app/build/outputs/bundle/release/app-release.aab"
        
        if [ -f "$AAB_PATH" ]; then
            echo ""
            echo "✅ AAB built successfully!"
            echo "📦 AAB: $AAB_PATH"
            ls -lh "$AAB_PATH"
            
            AAB_SIZE=$(du -h "$AAB_PATH" | cut -f1)
            echo "📊 AAB Size: $AAB_SIZE"
            
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "✨ Build Complete!"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "📱 For testing on device:"
            echo "   adb install $APK_PATH"
            echo ""
            echo "📦 For Google Play Store upload:"
            echo "   Upload: $AAB_PATH"
            echo ""
            echo "⚠️  IMPORTANT: Before Play Store submission:"
            echo "   1. Verify Notification Listener Service is implemented"
            echo "   2. Test mobile money notification reading"
            echo "   3. Verify no SMS permissions in final APK:"
            echo "      aapt dump permissions $APK_PATH | grep SMS"
            echo ""
            echo "📋 Testing checklist:"
            echo "   1. Test on 3+ devices"
            echo "   2. Verify TapMoMo payee mode (NFC HCE)"
            echo "   3. Test member onboarding flow"
            echo "   4. Test deposit allocation"
            echo "   5. Test receipt OCR"
            echo "   6. Verify biometric auth"
            echo ""
            echo "📚 See MOBILE_APK_PRODUCTION_ROADMAP.md for details"
            
        else
            echo "⚠️  AAB build failed"
        fi
        
    else
        echo "❌ Build failed - APK not found"
        exit 1
    fi
fi

echo ""
echo "🏁 Done!"

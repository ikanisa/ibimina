#!/bin/bash
# Build Release APK/AAB for Ibimina Client App
# Google Play Ready (No Banned Permissions)

set -e

echo "🚀 Building Ibimina Client App for Release"
echo "=========================================="
echo ""

# Check if signing credentials are configured
if [ -z "$ANDROID_KEYSTORE_PATH" ]; then
    echo "⚠️  Signing credentials not configured"
    echo ""
    echo "To build a signed release, set these environment variables:"
    echo "  export ANDROID_KEYSTORE_PATH=/path/to/ibimina-client-release.keystore"
    echo "  export ANDROID_KEYSTORE_PASSWORD=<your-keystore-password>"
    echo "  export ANDROID_KEY_ALIAS=ibimina-client"
    echo "  export ANDROID_KEY_PASSWORD=<your-key-password>"
    echo ""
    echo "Or create a signing config file:"
    echo "  ~/.ibimina-client-signing.env"
    echo ""
    
    read -p "Continue with unsigned build? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Build cancelled"
        exit 1
    fi
    
    UNSIGNED_BUILD=true
fi

# Check build environment
echo "🔍 Checking build environment..."

# Check required environment variables for runtime
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "⚠️  WARNING: NEXT_PUBLIC_SUPABASE_URL not set"
    echo "   Using placeholder. App will build but may not work at runtime."
    export NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
fi

if [ -z "$HMAC_SHARED_SECRET" ]; then
    echo "⚠️  WARNING: HMAC_SHARED_SECRET not set"
    echo "   Using placeholder. TapMoMo will not verify signatures."
    export HMAC_SHARED_SECRET="placeholder-secret"
fi

echo "✅ Build environment ready"
echo ""

# Change to Android directory
cd apps/pwa/client/android

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
        
        # Get APK size
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo "📊 Size: $APK_SIZE"
        
        echo ""
        echo "⚠️  This is an UNSIGNED debug build"
        echo "   For Play Store submission, you need a signed release build"
        echo "   Configure signing credentials and run again"
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
        
        # Get APK size
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
            echo "📋 Next steps:"
            echo "   1. Test APK on 3+ devices (Samsung, Tecno, Infinix)"
            echo "   2. Verify deep links work (https://client.ibimina.rw)"
            echo "   3. Test TapMoMo NFC on 2+ devices"
            echo "   4. Test USSD payment flow with MTN & Airtel"
            echo "   5. Upload AAB to Play Console Internal Testing"
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

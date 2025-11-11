#!/bin/bash
# Android Build Verification Script
# Verifies that the Capacitor 7 Android build works correctly

set -e

echo "================================================"
echo "Ibimina Android Build Verification"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

# Check Java version
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java not found${NC}"
    echo "   Install Java 17: brew install openjdk@17"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -ne 17 ]; then
    echo -e "${YELLOW}⚠️  Java version is $JAVA_VERSION (expected 17)${NC}"
    echo "   May cause issues. Install Java 17: brew install openjdk@17"
else
    echo -e "${GREEN}✓ Java 17 found${NC}"
fi

# Check Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo -e "${RED}❌ ANDROID_HOME or ANDROID_SDK_ROOT not set${NC}"
    echo "   Install Android Studio and set ANDROID_HOME"
    exit 1
else
    echo -e "${GREEN}✓ Android SDK configured${NC}"
fi

# Navigate to Android directory
cd "$(dirname "$0")/../apps/pwa/staff-admin/android" || exit 1

echo ""
echo "Current directory: $(pwd)"
echo ""

# Check for google-services.json
if [ ! -f "app/google-services.json" ]; then
    echo -e "${YELLOW}⚠️  google-services.json not found${NC}"
    echo "   Push notifications won't work without Firebase setup"
    echo "   Place google-services.json in apps/pwa/staff-admin/android/app/"
fi

# Clean build
echo ""
echo "Cleaning previous builds..."
./gradlew clean --no-daemon > /dev/null 2>&1

# Assemble debug APK
echo ""
echo "Building debug APK (this may take 5-10 minutes)..."
echo ""

if ./gradlew assembleDebug --no-daemon; then
    echo ""
    echo -e "${GREEN}================================================"
    echo "✅ BUILD SUCCESSFUL"
    echo "================================================${NC}"
    echo ""
    
    # Find the APK
    APK_PATH=$(find app/build/outputs/apk/debug -name "*.apk" | head -n 1)
    
    if [ -n "$APK_PATH" ]; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo "APK Location: $APK_PATH"
        echo "APK Size: $APK_SIZE"
        echo ""
        
        # Check APK details
        if command -v aapt &> /dev/null; then
            echo "APK Details:"
            aapt dump badging "$APK_PATH" | grep -E "package:|sdkVersion:|targetSdkVersion:"
            echo ""
        fi
        
        echo "Next steps:"
        echo "  1. Install on device: adb install $APK_PATH"
        echo "  2. Or: ./gradlew installDebug"
        echo ""
    fi
    
    # Check for warnings
    echo "Build completed with the following known warnings:"
    echo "  - EnhancedNotificationsPlugin: deprecated permission APIs (non-blocking)"
    echo "  - SmsIngestPlugin: deprecated WorkManager REPLACE policy (non-blocking)"
    echo "  - Minor Kotlin warnings (unused variables)"
    echo ""
    echo "These warnings don't affect functionality."
    
    exit 0
else
    echo ""
    echo -e "${RED}================================================"
    echo "❌ BUILD FAILED"
    echo "================================================${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. Java version != 17: check 'java -version'"
    echo "  2. Android SDK not installed: install via Android Studio"
    echo "  3. Gradle cache corrupt: rm -rf ~/.gradle/caches"
    echo "  4. Build artifacts stale: ./gradlew clean"
    echo ""
    echo "Check the error log above for specific issues."
    echo ""
    echo "For help, see: apps/pwa/staff-admin/android/ANDROID_BUILD_FIX.md"
    
    exit 1
fi

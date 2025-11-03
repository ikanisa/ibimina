#!/bin/bash

# Production Build Script for Client Mobile App
# This script builds production-ready APK and AAB files

set -e

echo "🚀 Starting Ibimina Client Mobile App Production Build"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment
check_env() {
    echo -e "${YELLOW}Checking environment...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment OK${NC}"
    echo ""
}

# Check Firebase config
check_firebase() {
    echo -e "${YELLOW}Checking Firebase configuration...${NC}"
    
    if [ ! -f "android/app/google-services.json" ]; then
        echo -e "${RED}❌ android/app/google-services.json not found${NC}"
        echo -e "${YELLOW}📝 Copy from google-services.json.example and fill with your Firebase credentials${NC}"
        exit 1
    fi
    
    if [ ! -f "ios/GoogleService-Info.plist" ]; then
        echo -e "${YELLOW}⚠️  ios/GoogleService-Info.plist not found (iOS build will fail)${NC}"
    fi
    
    echo -e "${GREEN}✅ Firebase config OK${NC}"
    echo ""
}

# Install dependencies
install_deps() {
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
}

# Build Android APK
build_android_apk() {
    echo -e "${YELLOW}Building Android APK...${NC}"
    cd android
    ./gradlew assembleRelease
    cd ..
    echo -e "${GREEN}✅ Android APK built successfully${NC}"
    echo -e "${GREEN}📦 APK: android/app/build/outputs/apk/release/app-release.apk${NC}"
    echo ""
}

# Build Android AAB (for Play Store)
build_android_aab() {
    echo -e "${YELLOW}Building Android AAB...${NC}"
    cd android
    ./gradlew bundleRelease
    cd ..
    echo -e "${GREEN}✅ Android AAB built successfully${NC}"
    echo -e "${GREEN}📦 AAB: android/app/build/outputs/bundle/release/app-release.aab${NC}"
    echo ""
}

# Build iOS (requires macOS and Xcode)
build_ios() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo -e "${YELLOW}⚠️  iOS build skipped (requires macOS)${NC}"
        echo ""
        return
    fi
    
    echo -e "${YELLOW}Building iOS app...${NC}"
    echo -e "${YELLOW}Note: This will create an archive. Upload to App Store Connect manually.${NC}"
    cd ios
    pod install
    xcodebuild -workspace IbiminaClient.xcworkspace \
               -scheme IbiminaClient \
               -configuration Release \
               -archivePath build/IbiminaClient.xcarchive \
               archive
    cd ..
    echo -e "${GREEN}✅ iOS archive created${NC}"
    echo -e "${GREEN}📦 Archive: ios/build/IbiminaClient.xcarchive${NC}"
    echo ""
}

# Main
main() {
    echo "Choose build target:"
    echo "1) Android APK only"
    echo "2) Android AAB only"
    echo "3) Both Android (APK + AAB)"
    echo "4) iOS only"
    echo "5) All (Android + iOS)"
    echo ""
    read -p "Enter choice [1-5]: " choice
    
    check_env
    check_firebase
    install_deps
    
    case $choice in
        1)
            build_android_apk
            ;;
        2)
            build_android_aab
            ;;
        3)
            build_android_apk
            build_android_aab
            ;;
        4)
            build_ios
            ;;
        5)
            build_android_apk
            build_android_aab
            build_ios
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}🎉 Build complete!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  • Android: Upload to Google Play Console"
    echo "  • iOS: Upload to App Store Connect via Xcode"
    echo ""
}

main

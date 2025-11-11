#!/bin/bash
set -e

echo "🏗️  Ibimina Android Build Script"
echo "================================"
echo ""

# Colors
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Select app
echo "Select app to build:"
echo "1) Admin (Staff) App"
echo "2) Client (Member) App"
read -p "Enter choice [1-2]: " app_choice

if [ "$app_choice" = "1" ]; then
    APP_DIR="apps/pwa/staff-admin"
    APP_NAME="Ibimina Staff"
    APP_ID="rw.ibimina.staff"
elif [ "$app_choice" = "2" ]; then
    APP_DIR="apps/pwa/client"
    APP_NAME="Ibimina Client"
    APP_ID="rw.gov.ikanisa.ibimina.client"
else
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

# Select build type
echo ""
echo "Select build type:"
echo "1) Debug (for testing)"
echo "2) Release (for production)"
read -p "Enter choice [1-2]: " build_choice

if [ "$build_choice" = "1" ]; then
    BUILD_TYPE="assembleDebug"
    BUILD_NAME="debug"
    INSTALL_TASK="installDebug"
elif [ "$build_choice" = "2" ]; then
    BUILD_TYPE="assembleRelease"
    BUILD_NAME="release"
    INSTALL_TASK="installRelease"
else
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

# Optional: Set production URL for release builds
if [ "$build_choice" = "2" ]; then
    echo ""
    read -p "Enter production server URL (or press Enter to use embedded files): " SERVER_URL
    if [ ! -z "$SERVER_URL" ]; then
        export CAPACITOR_SERVER_URL=$SERVER_URL
        echo -e "${GREEN}✓ Server URL set to: $SERVER_URL${NC}"
    else
        echo -e "${YELLOW}⚠ Using embedded static files${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🔨 Building $APP_NAME ($BUILD_NAME)...${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${YELLOW}1/5: Installing dependencies...${NC}"
pnpm install

# Step 2: Build shared packages
echo -e "${YELLOW}2/5: Building shared packages...${NC}"
pnpm --filter @ibimina/core run build
pnpm --filter @ibimina/config run build
pnpm --filter @ibimina/ui run build

# Step 3: Build Next.js app
echo -e "${YELLOW}3/5: Building Next.js app...${NC}"
cd $APP_DIR
pnpm run build

# Step 4: Sync Capacitor
echo -e "${YELLOW}4/5: Syncing Capacitor...${NC}"
npx cap sync android

# Step 5: Build Android APK
echo -e "${YELLOW}5/5: Building Android APK...${NC}"
cd android
./gradlew clean $BUILD_TYPE

# Locate APK
APK_DIR="app/build/outputs/apk/$BUILD_NAME/"
APK_FILE=$(ls $APK_DIR*.apk | head -1)

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📱 Build Information${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "App Name:    $APP_NAME"
echo "App ID:      $APP_ID"
echo "Build Type:  $BUILD_NAME"
echo "APK Size:    $(du -h $APK_FILE | cut -f1)"
echo "APK Path:    $APK_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📲 Installation Commands${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To install on connected device:"
echo -e "  ${YELLOW}adb install -r $APK_FILE${NC}"
echo ""
echo "To install via Gradle:"
echo -e "  ${YELLOW}./gradlew $INSTALL_TASK${NC}"
echo ""
echo "To run on emulator:"
echo -e "  ${YELLOW}npx cap run android${NC}"
echo ""

# Check if device is connected
if adb devices | grep -q "device$"; then
    echo -e "${GREEN}✓ Android device detected${NC}"
    echo ""
    read -p "Install on connected device now? [y/N]: " install_choice
    if [ "$install_choice" = "y" ] || [ "$install_choice" = "Y" ]; then
        echo ""
        echo -e "${YELLOW}Installing...${NC}"
        adb install -r $APK_FILE
        echo ""
        echo -e "${GREEN}✅ Installed successfully!${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No Android device connected${NC}"
    echo "Connect a device or start an emulator to install"
fi

echo ""
echo -e "${GREEN}🎉 Done!${NC}"

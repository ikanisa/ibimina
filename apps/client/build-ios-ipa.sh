#!/bin/bash
set -e

###############################################################################
# Ibimina Client App - iOS IPA Builder for App Store
###############################################################################
# Builds signed iOS IPA for member/customer app
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════════"
echo "  Ibimina Client App - iOS IPA Builder"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Configuration
APP_VERSION="1.0.0"
BUILD_NUMBER="100"
APP_DIR="$(pwd)"
IOS_DIR="$APP_DIR/ios/App"
SCHEME="App"
CONFIGURATION="Release"

###############################################################################
# Step 1: Environment Validation
###############################################################################
echo -e "${BLUE}[1/7] Validating environment...${NC}"

# Check macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "${RED}✗ iOS builds require macOS${NC}"
    exit 1
fi
echo -e "${GREEN}✓ macOS detected${NC}"

# Check Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}✗ Xcode not installed${NC}"
    exit 1
fi
XCODE_VERSION=$(xcodebuild -version | head -n 1)
echo -e "${GREEN}✓ $XCODE_VERSION${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}✗ pnpm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# Check required environment variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}✗ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi
echo -e "${GREEN}✓ Required environment variables set${NC}"

###############################################################################
# Step 2: Check Apple Developer Setup
###############################################################################
echo ""
echo -e "${BLUE}[2/7] Checking Apple Developer setup...${NC}"

if [ ! -d "$IOS_DIR" ]; then
    echo -e "${RED}✗ iOS project not found at $IOS_DIR${NC}"
    echo -e "${YELLOW}Run: npx cap add ios${NC}"
    exit 1
fi
echo -e "${GREEN}✓ iOS project exists${NC}"

# Check if workspace exists
if [ ! -f "$IOS_DIR/App.xcworkspace/contents.xcworkspacedata" ]; then
    echo -e "${RED}✗ Xcode workspace not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Xcode workspace exists${NC}"

echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  IMPORTANT: Apple Developer Account Required${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
echo ""
echo "Before building IPA, ensure you have:"
echo ""
echo "1. ✅ Apple Developer account (\$99/year)"
echo "2. ✅ App ID created: rw.ibimina.client"
echo "3. ✅ Provisioning profile downloaded"
echo "4. ✅ Distribution certificate installed"
echo ""
echo "To set up in Xcode:"
echo "  • Open: ios/App/App.xcworkspace"
echo "  • Select App target → Signing & Capabilities"
echo "  • Team: Select your Apple Developer team"
echo "  • Provisioning Profile: Select distribution profile"
echo ""
read -p "Press Enter when Apple Developer setup is complete..."

###############################################################################
# Step 3: Clean Previous Builds
###############################################################################
echo ""
echo -e "${BLUE}[3/7] Cleaning previous builds...${NC}"

rm -rf .next .next-static
rm -rf ios/App/App/public

echo -e "${GREEN}✓ Clean complete${NC}"

###############################################################################
# Step 4: Install Dependencies
###############################################################################
echo ""
echo -e "${BLUE}[4/7] Installing dependencies...${NC}"

pnpm install --frozen-lockfile --silent

echo -e "${GREEN}✓ Dependencies installed${NC}"

###############################################################################
# Step 5: Build Next.js App
###############################################################################
echo ""
echo -e "${BLUE}[5/7] Building Next.js application...${NC}"

export NODE_ENV=production
export APP_ENV=production

pnpm build

if [ ! -d ".next" ]; then
    echo -e "${RED}✗ Next.js build failed${NC}"
    exit 1
fi

# Create .next-static for Capacitor
cp -r .next .next-static

echo -e "${GREEN}✓ Next.js build complete${NC}"

###############################################################################
# Step 6: Sync Capacitor
###############################################################################
echo ""
echo -e "${BLUE}[6/7] Syncing Capacitor...${NC}"

npx cap sync ios

echo -e "${GREEN}✓ Capacitor sync complete${NC}"

###############################################################################
# Step 7: Build iOS IPA
###############################################################################
echo ""
echo -e "${BLUE}[7/7] Building iOS IPA...${NC}"

cd "$IOS_DIR"

# Update version and build number
agvtool new-marketing-version "$APP_VERSION"
agvtool new-version -all "$BUILD_NUMBER"

# Clean build folder
xcodebuild clean \
    -workspace App.xcworkspace \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION"

# Build archive
ARCHIVE_PATH="$APP_DIR/build/Ibimina-Client.xcarchive"
mkdir -p "$APP_DIR/build"

echo -e "${YELLOW}Building archive (this may take 5-10 minutes)...${NC}"

xcodebuild archive \
    -workspace App.xcworkspace \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS" \
    -allowProvisioningUpdates \
    CODE_SIGN_STYLE=Manual

if [ ! -d "$ARCHIVE_PATH" ]; then
    echo -e "${RED}✗ Archive build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Archive created${NC}"

# Export IPA
IPA_PATH="$APP_DIR/build/Ibimina-Client.ipa"

echo -e "${YELLOW}Exporting IPA...${NC}"

# Create export options plist
cat > /tmp/ExportOptions.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>manual</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>rw.ibimina.client</key>
        <string>YOUR_PROVISIONING_PROFILE_NAME</string>
    </dict>
</dict>
</plist>
EOF

xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$APP_DIR/build" \
    -exportOptionsPlist /tmp/ExportOptions.plist

if [ ! -f "$IPA_PATH" ]; then
    echo -e "${RED}✗ IPA export failed${NC}"
    echo -e "${YELLOW}Note: You may need to manually export from Xcode if signing fails${NC}"
    exit 1
fi

IPA_SIZE=$(du -h "$IPA_PATH" | cut -f1)

cd "$APP_DIR"

###############################################################################
# Success
###############################################################################
echo ""
echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════════"
echo "  ✓ BUILD SUCCESSFUL!"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo ""
echo "📦 Output:"
echo "   Archive: $ARCHIVE_PATH"
echo "   IPA: $IPA_PATH ($IPA_SIZE)"
echo ""
echo "📊 Info:"
echo "   Version: $APP_VERSION ($BUILD_NUMBER)"
echo "   Bundle ID: rw.ibimina.client"
echo "   Type: Member/Customer App"
echo ""
echo "🚀 Next Steps:"
echo "   1. Open Xcode → Window → Organizer"
echo "   2. Select the archive"
echo "   3. Click 'Distribute App'"
echo "   4. Choose 'App Store Connect'"
echo "   5. Upload for TestFlight / App Store review"
echo ""
echo "   Or use: xcrun altool --upload-app -f $IPA_PATH -t ios -u YOUR_APPLE_ID"
echo ""

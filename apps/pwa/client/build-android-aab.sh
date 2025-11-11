#!/bin/bash
set -e

###############################################################################
# Ibimina Client App - Production AAB Builder for Google Play
###############################################################################
# Builds signed Android App Bundle (AAB) for member/customer app
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════════"
echo "  Ibimina Client App - Production AAB Builder"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Configuration
APP_VERSION="1.0.0"
VERSION_CODE="100"
KEYSTORE_PATH="./android/app/ibimina-client-release.keystore"
KEY_ALIAS="ibimina-client"
APP_DIR="$(pwd)"
ANDROID_DIR="$APP_DIR/android"
OUTPUT_DIR="$ANDROID_DIR/app/build/outputs"

###############################################################################
# Step 1: Environment Validation
###############################################################################
echo -e "${BLUE}[1/8] Validating environment...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}✗ Node.js 20+ required${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}✗ pnpm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}✗ Java not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Java $(java -version 2>&1 | head -n 1 | cut -d'"' -f2)${NC}"

# Check Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${RED}✗ ANDROID_HOME not set${NC}"
    exit 1
fi
echo -e "${GREEN}✓ ANDROID_HOME: $ANDROID_HOME${NC}"

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
# Step 2: Clean Firebase References
###############################################################################
echo ""
echo -e "${BLUE}[2/8] Cleaning Firebase references...${NC}"

# Remove push notifications from package.json if present
if grep -q "@capacitor/push-notifications" package.json 2>/dev/null; then
    echo -e "${YELLOW}⚠ Removing @capacitor/push-notifications...${NC}"
    # Create temp file without push-notifications
    grep -v "@capacitor/push-notifications" package.json > package.json.tmp
    mv package.json.tmp package.json
    echo -e "${GREEN}✓ Push notifications removed${NC}"
else
    echo -e "${GREEN}✓ No push notifications found${NC}"
fi

###############################################################################
# Step 3: Keystore Setup
###############################################################################
echo ""
echo -e "${BLUE}[3/8] Checking keystore...${NC}"

if [ ! -f "$KEYSTORE_PATH" ]; then
    echo -e "${YELLOW}⚠ Keystore not found. Generating...${NC}"
    
    KEYSTORE_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=')
    
    echo ""
    echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  CRITICAL: SAVE THIS PASSWORD!${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Keystore Password: $KEYSTORE_PASSWORD"
    echo "  Key Alias: $KEY_ALIAS"
    echo ""
    read -p "Press Enter when saved..."
    
    keytool -genkeypair -v -storetype PKCS12 \
        -keystore "$KEYSTORE_PATH" \
        -alias "$KEY_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEYSTORE_PASSWORD" \
        -dname "CN=Ibimina Client, OU=IT, O=Ikanisa Rwanda, L=Kigali, C=RW" \
        2>&1 | grep -v "^$"
    
    # Save keystore info
    cat > "$ANDROID_DIR/app/KEYSTORE_INFO.txt" <<EOF
Ibimina Client App - Keystore Information
Generated: $(date)

Keystore Path: $KEYSTORE_PATH
Key Alias: $KEY_ALIAS
Keystore Password: $KEYSTORE_PASSWORD
Key Password: $KEYSTORE_PASSWORD

BACKUP THIS FILE SECURELY!
EOF
    chmod 600 "$ANDROID_DIR/app/KEYSTORE_INFO.txt"
    
    export ANDROID_KEYSTORE_PATH="$KEYSTORE_PATH"
    export ANDROID_KEYSTORE_PASSWORD="$KEYSTORE_PASSWORD"
    export ANDROID_KEY_ALIAS="$KEY_ALIAS"
    export ANDROID_KEY_PASSWORD="$KEYSTORE_PASSWORD"
else
    echo -e "${GREEN}✓ Keystore found${NC}"
    
    if [ -z "$ANDROID_KEYSTORE_PASSWORD" ]; then
        echo -e "${YELLOW}Enter keystore password:${NC}"
        read -s ANDROID_KEYSTORE_PASSWORD
        export ANDROID_KEYSTORE_PASSWORD
        export ANDROID_KEY_PASSWORD="$ANDROID_KEYSTORE_PASSWORD"
        export ANDROID_KEYSTORE_PATH="$KEYSTORE_PATH"
        export ANDROID_KEY_ALIAS="$KEY_ALIAS"
    fi
fi

###############################################################################
# Step 4: Clean Previous Builds
###############################################################################
echo ""
echo -e "${BLUE}[4/8] Cleaning previous builds...${NC}"

rm -rf .next .next-static
rm -rf android/app/build
rm -rf android/app/src/main/assets/public

echo -e "${GREEN}✓ Clean complete${NC}"

###############################################################################
# Step 5: Install Dependencies
###############################################################################
echo ""
echo -e "${BLUE}[5/8] Installing dependencies...${NC}"

pnpm install --frozen-lockfile --silent

echo -e "${GREEN}✓ Dependencies installed${NC}"

###############################################################################
# Step 6: Build Next.js App
###############################################################################
echo ""
echo -e "${BLUE}[6/8] Building Next.js application...${NC}"

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
# Step 7: Sync Capacitor
###############################################################################
echo ""
echo -e "${BLUE}[7/8] Syncing Capacitor...${NC}"

npx cap sync android

echo -e "${GREEN}✓ Capacitor sync complete${NC}"

###############################################################################
# Step 8: Build Android App Bundle
###############################################################################
echo ""
echo -e "${BLUE}[8/8] Building signed AAB...${NC}"

cd android

export ANDROID_VERSION_CODE="$VERSION_CODE"
export ANDROID_VERSION_NAME="$APP_VERSION"

./gradlew clean bundleRelease --no-daemon

cd ..

AAB_PATH="$OUTPUT_DIR/bundle/release/app-release.aab"
if [ ! -f "$AAB_PATH" ]; then
    echo -e "${RED}✗ AAB build failed${NC}"
    exit 1
fi

AAB_SIZE=$(du -h "$AAB_PATH" | cut -f1)

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
echo "   AAB: $AAB_PATH ($AAB_SIZE)"
echo ""
echo "📊 Info:"
echo "   Version: $APP_VERSION ($VERSION_CODE)"
echo "   Package: rw.ibimina.client"
echo "   Type: Member/Customer App"
echo ""
echo "🚀 Upload to Google Play Internal Testing"
echo ""

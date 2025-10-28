#!/bin/bash
set -e

# TWA Build Script for Ibimina Client App
# This script automates the build process for the Android TWA

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Ibimina Client TWA Build Script ===${NC}\n"

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v bubblewrap &> /dev/null; then
    echo -e "${RED}Error: bubblewrap CLI not found${NC}"
    echo "Install with: npm install -g @bubblewrap/cli"
    exit 1
fi

if ! command -v keytool &> /dev/null; then
    echo -e "${RED}Error: keytool not found${NC}"
    echo "Please install Java JDK (v11 or higher)"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}\n"

# Check if keystore exists
if [ ! -f "android.keystore" ]; then
    echo -e "${YELLOW}Keystore not found. Generating...${NC}"
    read -p "Enter keystore password: " -s KEYSTORE_PASSWORD
    echo
    read -p "Confirm password: " -s KEYSTORE_PASSWORD_CONFIRM
    echo
    
    if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
        echo -e "${RED}Passwords don't match!${NC}"
        exit 1
    fi
    
    keytool -genkey -v \
        -keystore android.keystore \
        -alias ibimina-client \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$KEYSTORE_PASSWORD"
    
    echo -e "\n${GREEN}✓ Keystore generated${NC}"
    echo -e "${YELLOW}Important: Save the password securely!${NC}\n"
    
    echo "Getting SHA-256 fingerprint..."
    keytool -list -v -keystore android.keystore -alias ibimina-client -storepass "$KEYSTORE_PASSWORD" | grep SHA256
    echo -e "\n${YELLOW}Update assetlinks.json with the SHA-256 fingerprint above!${NC}\n"
fi

# Determine build type
BUILD_TYPE="${1:-release}"
if [ "$BUILD_TYPE" != "release" ] && [ "$BUILD_TYPE" != "debug" ]; then
    echo -e "${RED}Invalid build type: $BUILD_TYPE${NC}"
    echo "Usage: $0 [release|debug]"
    exit 1
fi

echo -e "Building ${GREEN}$BUILD_TYPE${NC} version...\n"

# Initialize Bubblewrap project if not already done
if [ ! -d "app" ]; then
    echo "Initializing Bubblewrap project..."
    bubblewrap init --manifest twa-manifest.json
    echo -e "${GREEN}✓ Project initialized${NC}\n"
fi

# Build
if [ "$BUILD_TYPE" = "release" ]; then
    if [ ! -f "android.keystore" ]; then
        echo -e "${RED}Error: Keystore not found for release build${NC}"
        exit 1
    fi
    
    echo "Building signed AAB..."
    bubblewrap build --signingKeyPath ./android.keystore --signingKeyAlias ibimina-client
    
    if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
        echo -e "\n${GREEN}✓ Build successful!${NC}"
        echo -e "AAB location: ${GREEN}app/build/outputs/bundle/release/app-release.aab${NC}"
        echo -e "\nReady for Play Store upload!"
    fi
else
    echo "Building debug APK..."
    bubblewrap build
    
    if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
        echo -e "\n${GREEN}✓ Build successful!${NC}"
        echo -e "APK location: ${GREEN}app/build/outputs/apk/debug/app-debug.apk${NC}"
        echo -e "\nInstall with: adb install app/build/outputs/apk/debug/app-debug.apk"
    fi
fi

echo -e "\n${GREEN}=== Build Complete ===${NC}"

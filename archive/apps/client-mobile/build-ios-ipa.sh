#!/bin/bash
set -e

echo "🚀 Building Production IPA for iOS..."

# Navigate to project directory
cd "$(dirname "$0")"

# Check environment
if [ ! -f ".env.production" ]; then
  echo "❌ Error: .env.production not found"
  exit 1
fi

# Check if on macOS
if [ "$(uname)" != "Darwin" ]; then
  echo "❌ Error: iOS builds require macOS"
  exit 1
fi

# Load production env
export $(cat .env.production | xargs)

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🏗️  Pre-building iOS..."
npx expo prebuild --platform ios --clean

cd ios

echo "📥 Installing CocoaPods..."
pod install

echo "🔨 Building iOS Archive..."
xcodebuild -workspace Ibimina.xcworkspace \
  -scheme Ibimina \
  -configuration Release \
  -archivePath ./build/Ibimina.xcarchive \
  archive

echo "📦 Exporting IPA..."
xcodebuild -exportArchive \
  -archivePath ./build/Ibimina.xcarchive \
  -exportPath ./build \
  -exportOptionsPlist ./ExportOptions.plist

if [ -f "./build/Ibimina.ipa" ]; then
  echo "✅ Build successful!"
  echo "📱 IPA location: ios/build/Ibimina.ipa"
  
  # Copy to root
  cp ./build/Ibimina.ipa ../ibimina-client-$(date +%Y%m%d-%H%M%S).ipa
  echo "📦 Copied to: ibimina-client-$(date +%Y%m%d-%H%M%S).ipa"
  echo ""
  echo "📤 Ready to upload to App Store Connect"
else
  echo "❌ Build failed"
  exit 1
fi

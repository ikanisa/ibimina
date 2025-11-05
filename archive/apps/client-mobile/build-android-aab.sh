#!/bin/bash
set -e

echo "🚀 Building Production AAB for Google Play..."

# Navigate to project directory
cd "$(dirname "$0")"

# Check environment
if [ ! -f ".env.production" ]; then
  echo "❌ Error: .env.production not found"
  exit 1
fi

# Load production env
export $(cat .env.production | xargs)

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🏗️  Pre-building Android..."
npx expo prebuild --platform android --clean

cd android

echo "🔨 Building Android App Bundle..."
./gradlew bundleRelease

# Check if build succeeded
if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
  echo "✅ Build successful!"
  echo "📱 AAB location: android/app/build/outputs/bundle/release/app-release.aab"
  
  # Copy to root
  cp app/build/outputs/bundle/release/app-release.aab ../ibimina-client-$(date +%Y%m%d-%H%M%S).aab
  echo "📦 Copied to: ibimina-client-$(date +%Y%m%d-%H%M%S).aab"
  echo ""
  echo "📤 Ready to upload to Google Play Console"
else
  echo "❌ Build failed"
  exit 1
fi

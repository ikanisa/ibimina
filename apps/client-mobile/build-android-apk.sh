#!/bin/bash
set -e

echo "🚀 Building Production APK for Android..."

# Navigate to project directory
cd "$(dirname "$0")"

# Check environment
if [ ! -f ".env.production" ]; then
  echo "❌ Error: .env.production not found"
  echo "Create .env.production with required variables"
  exit 1
fi

# Load production env
export $(cat .env.production | xargs)

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🏗️  Building Android APK..."
npx expo prebuild --platform android --clean

cd android

echo "🔨 Assembling release APK..."
./gradlew assembleRelease

# Check if build succeeded
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
  echo "✅ Build successful!"
  echo "📱 APK location: android/app/build/outputs/apk/release/app-release.apk"
  
  # Copy to root for easy access
  cp app/build/outputs/apk/release/app-release.apk ../ibimina-client-$(date +%Y%m%d-%H%M%S).apk
  echo "📦 Copied to: ibimina-client-$(date +%Y%m%d-%H%M%S).apk"
else
  echo "❌ Build failed"
  exit 1
fi

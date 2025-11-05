# Quick Command Reference

## Development

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Install iOS pods
npm run pods

# Clean builds
npm run clean
```

## Code Quality

```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Format code
npm run format  # if configured
```

## Production Builds

```bash
# Check production readiness
./check-production-ready.sh

# Build Android APK (for testing)
npm run android:release
# Output: android/app/build/outputs/apk/release/app-release.apk

# Build Android AAB (for Play Store)
npm run android:bundle
# Output: android/app/build/outputs/bundle/release/app-release.aab

# Build iOS Archive (macOS only)
npm run ios:release
# Output: ios/build/IbiminaClient.xcarchive

# Interactive build script
./build-production.sh
```

## Version Management

```bash
# Bump patch version (1.0.0 → 1.0.1)
npm run version:patch

# Bump minor version (1.0.0 → 1.1.0)
npm run version:minor

# Bump major version (1.0.0 → 2.0.0)
npm run version:major
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- MyComponent.test.tsx
```

## Deployment

```bash
# 1. Ensure Firebase configured
ls android/app/google-services.json
ls ios/GoogleService-Info.plist

# 2. Build production
npm run android:bundle  # AAB
npm run ios:release     # Archive

# 3. Upload to stores
# Android: https://play.google.com/console
# iOS: Use Xcode Organizer
```

## Troubleshooting

```bash
# Reset Metro cache
npm start -- --reset-cache

# Clean Android build
cd android && ./gradlew clean && cd ..

# Clean iOS build
cd ios && pod cache clean --all && cd ..
rm -rf ~/Library/Developer/Xcode/DerivedData

# Reinstall dependencies
rm -rf node_modules
npm install

# Fix iOS pods
cd ios && pod deintegrate && pod install && cd ..
```

## Environment Variables

```bash
# Development
cp .env.example .env
# Edit .env with your values

# Production
cp .env.example .env.production
# Edit .env.production with production values
```

## Firebase Setup

```bash
# Follow complete guide
cat FIREBASE_SETUP.md

# Quick steps:
# 1. Create Firebase project
# 2. Add Android app → download google-services.json
# 3. Add iOS app → download GoogleService-Info.plist
# 4. Configure APNs for iOS
# 5. Test notifications
```

## Supabase

```bash
# Push migrations
cd /Users/jeanbosco/workspace/ibimina
supabase db push

# Deploy Edge Functions
supabase functions deploy whatsapp-send-otp
supabase functions deploy whatsapp-verify-otp
supabase functions deploy group-contribute

# Set secrets
supabase secrets set WHATSAPP_API_TOKEN=your_token
supabase secrets set FIREBASE_SERVER_KEY=your_key
```

## Common Issues

### Android: "SDK location not found"
```bash
# Create android/local.properties
echo "sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk" > android/local.properties
```

### iOS: "Pod not found"
```bash
cd ios && pod install && cd ..
```

### "Module not found"
```bash
npm install
npm start -- --reset-cache
```

### Firebase not working
```bash
# Verify files exist
ls android/app/google-services.json
ls ios/GoogleService-Info.plist

# Rebuild
npm run clean
npm run android  # or ios
```

## Links

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Firebase Setup](./FIREBASE_SETUP.md)
- [WhatsApp Auth](./WHATSAPP_AUTH_IMPLEMENTATION.md)
- [Final Report](./FINAL_IMPLEMENTATION_REPORT.md)

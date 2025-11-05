# Production Build Guide - Client Mobile App

## Prerequisites

1. **EAS CLI**: Install Expo Application Services CLI

   ```bash
   npm install -g eas-cli
   ```

2. **Expo Account**: Log in to your Expo account

   ```bash
   eas login
   ```

3. **Credentials**: Prepare signing credentials
   - **iOS**: Apple Developer account with App Store Connect access
   - **Android**: Google Play Console service account JSON

## Environment Configuration

### 1. Set up environment variables

Create `.env.production` in `apps/client-mobile/`:

```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_WHATSAPP_PHONE_ID=your-phone-id
EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN=your-access-token
EXPO_PUBLIC_API_BASE_URL=https://api.ibimina.rw
```

### 2. Update app.json

Make sure these are set correctly:

- `expo.version`: Current app version (e.g., "1.0.0")
- `expo.ios.bundleIdentifier`: "rw.sacco.ibimina.client"
- `expo.android.package`: "rw.sacco.ibimina.client"

## Build Process

### Development Build (Internal Testing)

```bash
cd apps/client-mobile

# Android APK
eas build --profile development --platform android

# iOS Simulator
eas build --profile development --platform ios
```

### Preview Build (Beta Testing)

```bash
# Android APK
eas build --profile preview --platform android

# iOS TestFlight
eas build --profile preview --platform ios
```

### Production Build

```bash
# Android AAB (Google Play)
eas build --profile production-aab --platform android

# Android APK (Direct distribution)
eas build --profile production --platform android

# iOS (App Store)
eas build --profile production --platform ios
```

## Credential Management

### iOS Credentials

EAS will guide you through:

1. App Store Connect API key
2. Distribution certificate
3. Provisioning profile

```bash
eas credentials
```

### Android Credentials

1. **Generate keystore** (first time only):

   ```bash
   eas credentials
   ```

   Follow prompts to create keystore

2. **Or use existing keystore**:
   ```bash
   eas credentials
   # Select "Set up credentials from local Keystore"
   ```

## Submission to Stores

### Google Play Store

1. **First submission**: Manual upload
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app
   - Upload AAB from EAS build
   - Fill out store listing

2. **Automated submission** (after first upload):

   ```bash
   eas submit --platform android --latest
   ```

   Requirements:
   - Create service account in Google Cloud Console
   - Grant "Release Manager" role in Play Console
   - Download JSON key as `google-service-account.json`

### Apple App Store

1. **Create app in App Store Connect**:
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new app with bundle ID `rw.sacco.ibimina.client`

2. **Submit via EAS**:

   ```bash
   eas submit --platform ios --latest
   ```

   Requirements:
   - Apple ID credentials
   - App-specific password
   - App Store Connect app ID
   - Team ID

## Build Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "build:android:dev": "eas build --profile development --platform android",
    "build:android:preview": "eas build --profile preview --platform android",
    "build:android:production": "eas build --profile production-aab --platform android",
    "build:ios:dev": "eas build --profile development --platform ios",
    "build:ios:preview": "eas build --profile preview --platform ios",
    "build:ios:production": "eas build --profile production --platform ios",
    "submit:android": "eas submit --platform android --latest",
    "submit:ios": "eas submit --platform ios --latest"
  }
}
```

## Version Management

### Increment version

1. **Update `app.json`**:

   ```json
   {
     "expo": {
       "version": "1.0.1"
     }
   }
   ```

2. **Build with auto-increment** (already configured):
   - Android: `versionCode` auto-increments
   - iOS: `buildNumber` auto-increments

### Version naming convention

- **Major.Minor.Patch**: `1.0.0`
- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes

## Testing Production Builds

### Android APK Testing

1. **Download APK** from EAS dashboard
2. **Install on device**:
   ```bash
   adb install path/to/app.apk
   ```
3. **Test thoroughly**:
   - All user flows
   - Push notifications
   - Deep links
   - Offline mode
   - Payment flows

### iOS TestFlight

1. **Add testers** in App Store Connect
2. **Install TestFlight** app on device
3. **Accept invite** and install build
4. **Test and collect feedback**

## Monitoring & Analytics

### Crash Reporting

EAS includes built-in crash reporting. View crashes in:

- EAS Dashboard: https://expo.dev
- Or integrate Sentry:
  ```bash
  npm install @sentry/react-native
  ```

### Analytics

Consider adding:

- **Firebase Analytics**: User behavior tracking
- **Mixpanel**: Product analytics
- **Amplitude**: User journey analysis

## Release Checklist

Before each production release:

- [ ] All tests passing
- [ ] Version number updated in `app.json`
- [ ] Changelog updated
- [ ] Environment variables verified
- [ ] Deep links tested
- [ ] Push notifications tested
- [ ] Offline mode tested
- [ ] Payment flows tested (all networks)
- [ ] WhatsApp OTP tested
- [ ] Biometric auth tested
- [ ] Screenshots updated (for stores)
- [ ] Store listing updated
- [ ] Privacy policy URL verified
- [ ] Terms of service URL verified
- [ ] Release notes prepared

## Common Issues

### Build fails with "AAPT: error"

**Solution**: Update build tools version in `app.json`:

```json
{
  "plugins": [
    [
      "expo-build-properties",
      {
        "android": {
          "buildToolsVersion": "34.0.0"
        }
      }
    ]
  ]
}
```

### iOS build fails with signing error

**Solution**: Clear credentials and re-run:

```bash
eas credentials --platform ios --clear-provisioning-profile
eas build --platform ios --clear-cache
```

### App size too large

**Solution**: Enable Hermes and ProGuard:

```json
{
  "android": {
    "enableProguardInReleaseBuilds": true,
    "enableShrinkResourcesInReleaseBuilds": true
  }
}
```

## Support

- **EAS Documentation**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev
- **Discord**: https://chat.expo.dev

## Next Steps

After successful build:

1. Submit to stores
2. Set up CI/CD for automated builds
3. Configure over-the-air (OTA) updates with EAS Update
4. Monitor crash reports and user feedback
5. Plan next release cycle

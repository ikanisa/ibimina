# Native Mobile Apps - Quick Reference

## Quick Start

### Build Android Apps
```bash
# Staff Android
cd apps/mobile/staff-android && ./gradlew assembleDebug

# Client Android
cd apps/mobile/client-android && ./gradlew assembleDebug
```

### Build iOS App
```bash
cd apps/mobile/client-ios
pod install
open IbiminaClient.xcworkspace
```

## Configuration

### Android (local.properties)
```properties
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key  # Staff app only
```

### iOS (Info.plist)
```xml
<key>SUPABASE_URL</key>
<string>https://your-project.supabase.co</string>
<key>SUPABASE_ANON_KEY</key>
<string>your-anon-key</string>
```

## NFC Usage

### Android - Read NFC
```kotlin
val nfcManager = NFCManager()
nfcManager.initialize(activity)
val data = nfcManager.readNFCTag(intent)
```

### Android - Write NFC
```kotlin
val nfcManager = NFCManager()
val success = nfcManager.writeNFCTag(tag, paymentData)
```

### iOS - Read NFC
```swift
let nfcReader = NFCReaderManager()
nfcReader.onTagRead = { data in
    print("Read: \(data)")
}
nfcReader.beginScanning()
```

### iOS - Write NFC
```swift
let nfcWriter = NFCWriterManager()
nfcWriter.onWriteSuccess = {
    print("Success!")
}
nfcWriter.beginWriting(data: paymentData)
```

## Common Commands

### Android
```bash
# Clean build
./gradlew clean

# Run tests
./gradlew test

# Build release
./gradlew assembleRelease

# Install on device
./gradlew installDebug
```

### iOS
```bash
# Clean build
rm -rf ~/Library/Developer/Xcode/DerivedData

# Reinstall pods
pod deintegrate && pod install

# Build from CLI
xcodebuild -workspace IbiminaClient.xcworkspace \
           -scheme IbiminaClient \
           -sdk iphonesimulator

# Run tests
xcodebuild test -workspace IbiminaClient.xcworkspace \
                -scheme IbiminaClient \
                -destination 'platform=iOS Simulator,name=iPhone 15'
```

## Troubleshooting

### Android NFC Not Working
- Check NFC is enabled: Settings → Connected devices → NFC
- Verify permission in manifest: `<uses-permission android:name="android.permission.NFC" />`
- Check device has NFC: `android.hardware.nfc` feature
- Use NDEF-formatted tags

### iOS NFC Not Working
- Verify iPhone 7 or later (XR/XS+ for writing)
- Check Info.plist has NFC usage description
- Enable NFC capability in Xcode
- Test on physical device (not simulator)
- Remember 60-second timeout

### Build Errors

**Android:**
```bash
# Sync project
./gradlew --refresh-dependencies

# Clear cache
./gradlew clean build --no-build-cache
```

**iOS:**
```bash
# Clean DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData

# Update pods
pod update

# Clean build folder
Product → Clean Build Folder (Cmd+Shift+K)
```

## File Locations

### Android Staff App
- Source: `apps/mobile/staff-android/app/src/main/java/com/ibimina/staff/`
- Manifest: `apps/mobile/staff-android/app/src/main/AndroidManifest.xml`
- Build: `apps/mobile/staff-android/app/build.gradle.kts`

### Android Client App
- Source: `apps/mobile/client-android/app/src/main/java/com/ibimina/client/`
- NFC: `apps/mobile/client-android/app/src/main/java/com/ibimina/client/nfc/`
- Manifest: `apps/mobile/client-android/app/src/main/AndroidManifest.xml`

### iOS Client App
- Source: `apps/mobile/client-ios/IbiminaClient/`
- NFC: `apps/mobile/client-ios/IbiminaClient/NFC/`
- Config: `apps/mobile/client-ios/IbiminaClient/Resources/Info.plist`

## Documentation Links

- Main Guide: `docs/NATIVE_MOBILE_APPS.md`
- Staff Android: `apps/mobile/staff-android/README.md`
- Client Android: `apps/mobile/client-android/README.md`
- Client iOS: `apps/mobile/client-ios/README.md`
- Complete Summary: `NATIVE_REFACTORING_COMPLETE.md`

## Key Features

### Staff Android App
✅ QR code scanning (Google ML Kit)
✅ MoMo SMS parsing (MTN/Airtel)
✅ OpenAI integration
✅ Supabase sync

### Client Android App
✅ Full NFC read/write
✅ TapMoMo payment handoff
✅ Offline support (Room)
✅ Real-time updates

### Client iOS App
✅ Core NFC read/write
✅ TapMoMo with USSD flow
✅ SwiftUI interface
✅ Keychain security

## Testing

### NFC Testing Setup
1. Get two NFC-enabled devices
2. Install app on both
3. Device A: Open "Create Payment Tag"
4. Device B: Open "Scan NFC Payment"
5. Tap devices together
6. Verify data transfer

### Requirements
- **Android**: Android 5.0+ with NFC
- **iOS**: iPhone 7+ (XR/XS+ for writing)
- NDEF-compatible NFC tags

## CI/CD

### Workflow
- File: `.github/workflows/build-native-apps.yml`
- Triggers: Push to main/work, PRs
- Artifacts: APKs, AABs, iOS builds

### Secrets Needed
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (staff app)
- `ANDROID_KEYSTORE_BASE64` (release)
- `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`

## Support

For issues or questions:
1. Check documentation
2. Review troubleshooting section
3. Open GitHub issue
4. Contact development team

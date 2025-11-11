# Ibimina Client iOS App

Native iOS application for SACCO members (client-facing).

## Features

- **TapMoMo NFC Payments**: Full NFC read/write for payment handoff
- **Group Management**: View and manage your ibimina groups
- **Transaction History**: Track all your savings and payments
- **Real-time Updates**: Instant sync with Supabase
- **Native iOS Experience**: SwiftUI + Modern iOS APIs

## Tech Stack

- **Language**: Swift 5.9+
- **UI**: SwiftUI
- **Architecture**: MVVM + Combine
- **NFC**: Core NFC
- **Network**: Alamofire
- **Database**: Core Data + Supabase
- **Real-time**: Supabase Realtime

## Build Requirements

- Xcode 15.0 or later
- iOS 14.0 or later
- CocoaPods 1.12+
- iPhone with NFC support (iPhone 7 or later)

## Building the App

### Install Dependencies
# Client iOS

The `ClientIOS` workspace bootstraps an iOS SwiftUI application with Combine,
Core NFC, and Supabase integration scaffolding.

## Requirements

- macOS with Xcode 15+
- CocoaPods (for managing the Supabase dependency)
- A configured Supabase project (set environment values in the scheme or update
  `Info.plist`)

## Getting started

```bash
cd apps/mobile/client-ios
pod install
```

### Open in Xcode

```bash
open IbiminaClient.xcworkspace
```

### Build for Simulator

1. Select "IbiminaClient" scheme
2. Select an iOS Simulator
3. Press Cmd+B to build
4. Press Cmd+R to run

Note: NFC features require a physical device and will not work in the simulator.

### Build for Device

1. Connect iPhone via USB
2. Select your device in Xcode
3. Configure signing in project settings
4. Press Cmd+R to build and run

## Configuration

Add the following to your `Info.plist` or set as environment variables:

```xml
<key>SUPABASE_URL</key>
<string>your_supabase_url</string>
<key>SUPABASE_ANON_KEY</key>
<string>your_supabase_anon_key</string>
```

## NFC Implementation

### Reading NFC Tags

```swift
let nfcReader = NFCReaderManager()
nfcReader.onTagRead = { data in
    print("Read data: \(data)")
}
nfcReader.beginScanning()
```

### Writing NFC Tags

```swift
let nfcWriter = NFCWriterManager()
nfcWriter.onWriteSuccess = {
    print("Write successful")
}
nfcWriter.beginWriting(data: paymentData)
```

## NFC Requirements

- iPhone 7 or later (iPhone XR/XS or later for writing)
- iOS 13.0+ for reading
- iOS 13.0+ for writing
- Core NFC capability enabled
- NFC usage description in Info.plist

## Permissions

The app requires the following:
- NFC Reader Session capability
- Network access (no explicit permission)
- NFC Usage Description in Info.plist

## Architecture

```
IbiminaClient/
├── App/
│   ├── AppDelegate.swift
│   └── SceneDelegate.swift
├── NFC/
│   ├── NFCReaderManager.swift
│   ├── NFCWriterManager.swift
│   └── NFCTagHandler.swift
├── Services/
│   └── SupabaseService.swift
├── Views/
│   └── ContentView.swift
├── Models/
└── Resources/
    └── Info.plist
```

## Testing

### Unit Tests

```bash
# Run from command line
xcodebuild test -workspace IbiminaClient.xcworkspace \
                -scheme IbiminaClient \
                -destination 'platform=iOS Simulator,name=iPhone 15'
```

### NFC Testing

NFC features require physical devices:
1. Install app on two iPhones
2. Open app on both devices
3. Device A: Tap "Create Payment Tag"
4. Device B: Tap "Scan NFC Payment"
5. Hold devices close (top of iPhone to top of iPhone)
6. iOS will show NFC scanning UI
7. Verify data transfer

## Known Limitations

- **iOS NFC Writing**: Only supported on iPhone XR/XS and later
- **Background NFC**: Not supported on iOS (foreground only)
- **USSD Dialing**: Cannot be automated on iOS; app copies code and opens Phone app
- **NFC Session Timeout**: 60 seconds maximum

## Deployment

### TestFlight

1. Archive app in Xcode (Product → Archive)
2. Upload to App Store Connect
3. Submit for TestFlight review
4. Distribute to internal/external testers

### App Store

1. Complete App Store listing
2. Submit for review
3. Include NFC usage description
4. Wait for approval

## Security

- All NFC data includes HMAC signatures
- Time-to-live (TTL) validation on payments
- One-time use nonces to prevent replay attacks
- Secure storage using iOS Keychain
- App Transport Security enabled

## Troubleshooting

### NFC Not Working

- Verify device supports NFC (iPhone 7+)
- Check NFC is enabled in device settings
- Ensure app has NFC capability
- Verify Info.plist has NFC usage description

### Build Errors

```bash
# Clean build folder
rm -rf ~/Library/Developer/Xcode/DerivedData

# Reinstall pods
pod deintegrate
pod install
```

## Support

For issues and feature requests, please contact the development team.
open ClientIOS.xcworkspace
```

Once the workspace is open in Xcode you can select the **ClientIOS** scheme and
run it on an iOS 16+ simulator or device.

## Running from the command line

```bash
cd apps/mobile/client-ios
pod install
xcodebuild -workspace ClientIOS.xcworkspace \
  -scheme ClientIOS \
  -sdk iphonesimulator \
  -configuration Debug \
  build
```

## NFC capabilities

The project enables Core NFC in the entitlements and `Info.plist`. When running
on hardware that supports NFC you can read or write tags using the provided
manager classes and SwiftUI screens.

## Supabase integration

The `SupabaseService` exposes helper methods for authenticating anonymously and
interacting with a placeholder `transactions` table. Update the Supabase URL and
anon key in `Info.plist` for your environment or override them at runtime using
build settings.

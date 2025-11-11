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

# Ibimina Client iOS App

Native iOS application for SACCO members, built with SwiftUI and integrated with
Supabase for real-time savings, groups, and TapMoMo NFC payments.

## Features

- **TapMoMo NFC payments** – create and scan secure payment tags backed by
  Supabase allocations
- **Group management** – fetch ibimina groups and membership codes from Supabase
- **Transaction history** – show the latest allocations for a member
- **Composable architecture** – MVVM view models with dependency-injected
  Supabase service

## Tech Stack

- Swift 5.9+
- SwiftUI + Combine
- Core NFC
- Supabase Swift SDK
- CocoaPods for dependency management

## Build Requirements

- macOS with Xcode 15 or later
- iOS 16.0+ deployment target
- CocoaPods 1.12+
- NFC-capable iPhone for end-to-end testing

## Getting Started

```bash
cd apps/mobile/client-ios
pod install
open IbiminaClient.xcworkspace
```

Select the **IbiminaClient** scheme, choose an iOS Simulator or physical device,
and build (`⌘B`) / run (`⌘R`). NFC features require a physical device.

### Command-line build

```bash
xcodebuild \
  -workspace IbiminaClient.xcworkspace \
  -scheme IbiminaClient \
  -destination 'platform=iOS Simulator,name=iPhone 15'
```

## Supabase Configuration

Provide your Supabase credentials via `Info.plist` or build settings
(`SUPABASE_URL` and `SUPABASE_ANON_KEY`). The default values are placeholders
meant for development.

## NFC Notes

- Reading is available on iPhone 7 and later; writing requires iPhone XS/XR or
  newer.
- Ensure the NFC capability and usage description remain in `Info.plist` and the
  entitlements file.

## Project Structure

```
IbiminaClient/
├── App/
│   ├── AppDelegate.swift
│   └── SceneDelegate.swift
├── Models/
│   └── PaymentModels.swift
├── NFC/
│   ├── NFCReaderManager.swift
│   ├── NFCWriterManager.swift
│   └── NFCTagHandler.swift
├── Services/
│   └── SupabaseService.swift
├── Views/
│   ├── ContentView.swift
│   ├── GroupsListView.swift
│   └── TransactionsListView.swift
└── Resources/
    ├── Assets.xcassets
    ├── IbiminaClient.entitlements
    └── Info.plist
```

## Testing

### Unit tests

```bash
xcodebuild test \
  -workspace IbiminaClient.xcworkspace \
  -scheme IbiminaClient \
  -destination 'platform=iOS Simulator,name=iPhone 15'
```

### SwiftUI previews

Previews are available for the new group and transaction screens. They use
lightweight preview services that conform to the Supabase protocol, keeping
preview data inline with production models.

### UI tests

`IbiminaClientUITests` launches the consolidated app target and verifies that
the primary NFC actions render on the landing screen.

## Pods & Workspace

The repository now ships with a single CocoaPods configuration targeting
**IbiminaClient** and its associated test bundles. Run `pod install` whenever
dependencies change.

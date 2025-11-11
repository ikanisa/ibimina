# Ibimina Repository Refactoring Plan - Full Native Mobile Apps

## 1. Revised Repository Structure

```
ibimina/
├── apps/                  # All application code
│   ├── pwa/               # Progressive Web Apps
│   │   ├── staff-admin/   # Staff/Admin PWA
│   │   │   ├── src/
│   │   │   ├── public/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   └── client/        # Client PWA
│   │       ├── src/
│   │       ├── public/
│   │       ├── package.json
│   │       └── tsconfig.json
│   └── mobile/            # Native Mobile Apps
│       ├── staff-android/     # Staff/Admin Android App (Kotlin)
│       │   ├── app/
│       │   │   └── src/
│       │   │       ├── main/
│       │   │       │   ├── java/com/ibimina/staff/
│       │   │       │   │   ├── MainActivity.kt
│       │   │       │   │   ├── services/
│       │   │       │   │   │   ├── MomoSmsService.kt
│       │   │       │   │   │   ├── QRScannerService.kt
│       │   │       │   │   │   └── OpenAIService.kt
│       │   │       │   │   └── data/
│       │   │       │   │       └── SupabaseClient.kt
│       │   │       │   └── res/
│       │   ├── gradle/
│       │   ├── build.gradle.kts
│       │   └── settings.gradle.kts
│       ├── client-android/    # Client Android App (Kotlin) - NATIVE
│       │   ├── app/
│       │   │   └── src/
│       │   │       ├── main/
│       │   │       │   ├── java/com/ibimina/client/
│       │   │       │   │   ├── MainActivity.kt
│       │   │       │   │   ├── nfc/
│       │   │       │   │   │   ├── NFCReaderActivity.kt
│       │   │       │   │   │   ├── NFCWriterActivity.kt
│       │   │       │   │   │   └── NFCManager.kt
│       │   │       │   │   ├── ui/
│       │   │       │   │   │   ├── screens/
│       │   │       │   │   │   └── components/
│       │   │       │   │   └── data/
│       │   │       │   └── res/
│       │   ├── gradle/
│       │   └── build.gradle.kts
│       └── client-ios/        # Client iOS App (Swift) - NATIVE
│           ├── IbiminaClient/
│           │   ├── App/
│           │   │   ├── AppDelegate.swift
│           │   │   └── SceneDelegate.swift
│           │   ├── NFC/
│           │   │   ├── NFCReaderManager.swift
│           │   │   ├── NFCWriterManager.swift
│           │   │   └── NFCTagHandler.swift
│           │   ├── Views/
│           │   ├── Models/
│           │   ├── Services/
│           │   │   └── SupabaseService.swift
│           │   └── Resources/
│           ├── IbiminaClient.xcodeproj/
│           └── Podfile
├── packages/              # Shared packages/libraries
│   ├── shared-types/      # TypeScript types for PWAs
│   ├── supabase-schemas/  # Supabase database schemas
│   ├── api-contracts/     # API contracts/documentation
│   └── ui-components/     # Shared UI components for PWAs only
├── backend/               # Backend services
│   ├── supabase/
│   │   ├── migrations/
│   │   ├── functions/
│   │   └── seed/
│   └── services/
│       ├── momo-parser/
│       └── openai-integration/
├── scripts/
├── docs/
└── .github/
```

## 2. Native Mobile Apps Technology Stack

### Staff Android App (Kotlin)

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM
- **Key Libraries**:
  - Retrofit for API calls
  - Room for local database
  - CameraX for QR scanning
  - Supabase Kotlin client

### Client Android App (Kotlin) - NATIVE

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: Clean Architecture + MVVM
- **NFC Libraries**: Android NFC API
- **Key Libraries**:
  - Retrofit for API calls
  - Room for local database
  - Android NFC API for read/write
  - Supabase Kotlin client
  - Hilt for dependency injection

### Client iOS App (Swift) - NATIVE

- **Language**: Swift
- **UI Framework**: SwiftUI
- **Architecture**: MVVM + Combine
- **NFC Framework**: Core NFC
- **Key Libraries**:
  - Alamofire for networking
  - Core Data for persistence
  - Core NFC for NFC operations
  - Supabase Swift client

## 3. NFC Implementation Details

### Android NFC Implementation

```kotlin
// apps/mobile/client-android/app/src/main/java/com/ibimina/client/nfc/NFCManager.kt
package com.ibimina.client.nfc

import android.app.Activity
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.Ndef
import android.nfc.tech.NdefFormatable
import android.content.Intent
import android.nfc.NdefMessage
import android.nfc.NdefRecord

class NFCManager(private val activity: Activity) {
    private var nfcAdapter: NfcAdapter? = null

    init {
        nfcAdapter = NfcAdapter.getDefaultAdapter(activity)
    }

    fun writeNFCTag(tag: Tag, data: String): Boolean {
        try {
            val ndefMessage = createNdefMessage(data)
            val ndef = Ndef.get(tag)

            if (ndef != null) {
                ndef.connect()
                if (!ndef.isWritable) {
                    return false
                }
                ndef.writeNdefMessage(ndefMessage)
                ndef.close()
                return true
            } else {
                val ndefFormatable = NdefFormatable.get(tag)
                if (ndefFormatable != null) {
                    ndefFormatable.connect()
                    ndefFormatable.format(ndefMessage)
                    ndefFormatable.close()
                    return true
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return false
    }

    fun readNFCTag(intent: Intent): String? {
        val tag = intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG)
        val ndef = Ndef.get(tag)

        if (ndef != null) {
            ndef.connect()
            val ndefMessage = ndef.ndefMessage
            val records = ndefMessage.records

            for (record in records) {
                if (record.tnf == NdefRecord.TNF_WELL_KNOWN) {
                    val payload = record.payload
                    val text = String(payload, 3, payload.size - 3)
                    return text
                }
            }
            ndef.close()
        }
        return null
    }

    private fun createNdefMessage(data: String): NdefMessage {
        val record = NdefRecord.createTextRecord("en", data)
        return NdefMessage(arrayOf(record))
    }
}
```

### iOS NFC Implementation

```swift
// apps/mobile/client-ios/IbiminaClient/NFC/NFCReaderManager.swift
import CoreNFC
import UIKit

class NFCReaderManager: NSObject, NFCNDEFReaderSessionDelegate {
    var session: NFCNDEFReaderSession?
    var onTagRead: ((String) -> Void)?

    func beginScanning() {
        guard NFCNDEFReaderSession.readingAvailable else {
            print("NFC not available on this device")
            return
        }

        session = NFCNDEFReaderSession(delegate: self,
                                       queue: nil,
                                       invalidateAfterFirstRead: true)
        session?.alertMessage = "Hold your iPhone near the NFC tag"
        session?.begin()
    }

    func readerSession(_ session: NFCNDEFReaderSession,
                      didDetectNDEFs messages: [NFCNDEFMessage]) {
        for message in messages {
            for record in message.records {
                if let string = String(data: record.payload, encoding: .utf8) {
                    onTagRead?(string)
                }
            }
        }
    }

    func readerSession(_ session: NFCNDEFReaderSession,
                      didInvalidateWithError error: Error) {
        print("NFC Session invalidated: \(error.localizedDescription)")
    }
}

// NFCWriterManager.swift
class NFCWriterManager: NSObject, NFCNDEFReaderSessionDelegate {
    var session: NFCNDEFReaderSession?
    var dataToWrite: String = ""

    func beginWriting(data: String) {
        guard NFCNDEFReaderSession.readingAvailable else {
            print("NFC not available on this device")
            return
        }

        self.dataToWrite = data
        session = NFCNDEFReaderSession(delegate: self,
                                       queue: nil,
                                       invalidateAfterFirstRead: false)
        session?.alertMessage = "Hold your iPhone near the NFC tag to write"
        session?.begin()
    }

    func readerSession(_ session: NFCNDEFReaderSession,
                      didDetect tags: [NFCNDEFTag]) {
        guard tags.count == 1 else {
            session.invalidate(errorMessage: "Multiple tags detected")
            return
        }

        let tag = tags.first!
        session.connect(to: tag) { error in
            if error != nil {
                session.invalidate(errorMessage: "Connection failed")
                return
            }

            tag.queryNDEFStatus { status, capacity, error in
                guard error == nil else {
                    session.invalidate(errorMessage: "Query failed")
                    return
                }

                switch status {
                case .readWrite:
                    let payload = NFCNDEFPayload(
                        format: .nfcWellKnown,
                        type: "T".data(using: .utf8)!,
                        identifier: Data(),
                        payload: self.dataToWrite.data(using: .utf8)!
                    )

                    let message = NFCNDEFMessage(records: [payload])

                    tag.writeNDEF(message) { error in
                        if error != nil {
                            session.invalidate(errorMessage: "Write failed")
                        } else {
                            session.alertMessage = "Write successful"
                            session.invalidate()
                        }
                    }

                default:
                    session.invalidate(errorMessage: "Tag is not writable")
                }
            }
        }
    }
}
```

## 4. Staff Android App Architecture

```kotlin
// apps/mobile/staff-android/build.gradle.kts
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("dagger.hilt.android.plugin")
}

android {
    namespace = "com.ibimina.staff"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.ibimina.staff"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation("androidx.compose.ui:ui:1.5.4")
    implementation("androidx.compose.material3:material3:1.1.2")
    implementation("com.google.mlkit:barcode-scanning:17.2.0")
    implementation("io.github.jan-tennert.supabase:postgrest-kt:2.0.0")
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.aallam.openai:openai-client:3.5.0")
}
```

## 5. Client Native Apps Features

### Client Android App (Kotlin)

```xml
<!-- apps/mobile/client-android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.NFC" />
    <uses-feature android:name="android.hardware.nfc" android:required="true" />

    <application>
        <activity
            android:name=".MainActivity"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.nfc.action.NDEF_DISCOVERED"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <data android:mimeType="text/plain" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

```kotlin
// MainActivity.kt
class MainActivity : ComponentActivity() {
    private lateinit var nfcManager: NFCManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        nfcManager = NFCManager(this)

        setContent {
            IbiminaClientTheme {
                MainScreen(nfcManager)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (NfcAdapter.ACTION_NDEF_DISCOVERED == intent.action) {
            val data = nfcManager.readNFCTag(intent)
            // Process NFC data
        }
    }
}
```

### Client iOS App (Swift)

```xml
<!-- apps/mobile/client-ios/IbiminaClient/Info.plist -->
<key>NFCReaderUsageDescription</key>
<string>This app uses NFC to read and write payment tags</string>

<key>com.apple.developer.nfc.readersession.iso7816.select-identifiers</key>
<array>
    <string>A0000000041010</string>
</array>
```

```swift
// ContentView.swift
import SwiftUI
import CoreNFC

struct ContentView: View {
    @StateObject private var nfcReader = NFCReaderManager()
    @StateObject private var nfcWriter = NFCWriterManager()
    @State private var nfcData: String = ""

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Button("Read NFC Tag") {
                    nfcReader.beginScanning()
                }
                .buttonStyle(.borderedProminent)

                Button("Write NFC Tag") {
                    nfcWriter.beginWriting(data: "Payment_ID_12345")
                }
                .buttonStyle(.borderedProminent)

                if !nfcData.isEmpty {
                    Text("NFC Data: \(nfcData)")
                        .padding()
                }
            }
            .navigationTitle("Ibimina Client")
        }
        .onAppear {
            nfcReader.onTagRead = { data in
                self.nfcData = data
            }
        }
    }
}
```

## 6. Supabase Integration for Native Apps

### Android Supabase Client

```kotlin
// apps/mobile/client-android/app/src/main/java/com/ibimina/client/data/SupabaseClient.kt
package com.ibimina.client.data

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.realtime.Realtime

object SupabaseClient {
    private const val SUPABASE_URL = "YOUR_SUPABASE_URL"
    private const val SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"

    val client = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_KEY
    ) {
        install(Postgrest)
        install(Auth)
        install(Realtime)
    }

    suspend fun getTransactions(): List<Transaction> {
        return client.postgrest
            .from("transactions")
            .select()
            .decodeList<Transaction>()
    }

    suspend fun createTransaction(transaction: Transaction) {
        client.postgrest
            .from("transactions")
            .insert(transaction)
    }
}
```

### iOS Supabase Client

```swift
// apps/mobile/client-ios/IbiminaClient/Services/SupabaseService.swift
import Foundation
import Supabase

class SupabaseService {
    static let shared = SupabaseService()

    private let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: URL(string: "YOUR_SUPABASE_URL")!,
            supabaseKey: "YOUR_SUPABASE_ANON_KEY"
        )
    }

    func fetchTransactions() async throws -> [Transaction] {
        let response = try await client.database
            .from("transactions")
            .select()
            .execute()

        let decoder = JSONDecoder()
        return try decoder.decode([Transaction].self, from: response.data)
    }

    func createTransaction(_ transaction: Transaction) async throws {
        try await client.database
            .from("transactions")
            .insert(transaction)
            .execute()
    }
}
```

## 7. Build Configuration

### Android Build Commands

```bash
# Staff Android App
cd apps/mobile/staff-android
./gradlew clean
./gradlew assembleDebug
./gradlew assembleRelease

# Client Android App
cd apps/mobile/client-android
./gradlew clean
./gradlew assembleDebug
./gradlew assembleRelease
```

### iOS Build Commands

```bash
# Client iOS App
cd apps/mobile/client-ios
pod install
xcodebuild -workspace IbiminaClient.xcworkspace \
           -scheme IbiminaClient \
           -configuration Debug \
           -sdk iphonesimulator \
           -derivedDataPath build

# For release
xcodebuild archive -workspace IbiminaClient.xcworkspace \
                   -scheme IbiminaClient \
                   -archivePath ./build/IbiminaClient.xcarchive
```

## 8. CI/CD Pipeline for Native Apps

```yaml
# .github/workflows/build-native-apps.yml
name: Build Native Mobile Apps

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-android-apps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: "17"
          distribution: "temurin"

      - name: Build Staff Android App
        run: |
          cd apps/mobile/staff-android
          chmod +x gradlew
          ./gradlew assembleRelease

      - name: Build Client Android App
        run: |
          cd apps/mobile/client-android
          chmod +x gradlew
          ./gradlew assembleRelease

      - name: Upload APKs
        uses: actions/upload-artifact@v3
        with:
          name: android-apps
          path: |
            apps/mobile/staff-android/app/build/outputs/apk/release/*.apk
            apps/mobile/client-android/app/build/outputs/apk/release/*.apk

  build-ios-app:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Xcode
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: latest-stable

      - name: Install CocoaPods
        run: |
          cd apps/mobile/client-ios
          pod install

      - name: Build iOS App
        run: |
          cd apps/mobile/client-ios
          xcodebuild -workspace IbiminaClient.xcworkspace \
                     -scheme IbiminaClient \
                     -configuration Release \
                     -sdk iphoneos \
                     -derivedDataPath build \
                     CODE_SIGN_IDENTITY="" \
                     CODE_SIGNING_REQUIRED=NO

      - name: Upload iOS Build
        uses: actions/upload-artifact@v3
        with:
          name: ios-app
          path: apps/mobile/client-ios/build/Build/Products/Release-iphoneos/
```

## 9. Removal Checklist

```bash
# Remove all Capacitor-related files
rm -rf capacitor.config.ts
rm -rf capacitor.config.json
rm -rf ios/  # Old Capacitor iOS folder
rm -rf android/  # Old Capacitor Android folder

# Remove from package.json dependencies
npm uninstall @capacitor/core \
              @capacitor/cli \
              @capacitor/ios \
              @capacitor/android \
              @capacitor/app \
              @capacitor/haptics \
              @capacitor/keyboard \
              @capacitor/status-bar \
              @capacitor/camera \
              @capacitor/filesystem \
              @capacitor/geolocation \
              @capacitor/push-notifications \
              @capacitor/share \
              @capacitor/splash-screen

# Remove Ionic if present
npm uninstall @ionic/react \
              @ionic/react-router \
              ionicons \
              @ionic/core

# Clean up component files
find src/components -name "*capacitor*" -type f -delete
find src/components -name "*ionic*" -type f -delete
```

## 10. Testing Strategy

- Android NFC Read functionality
- Android NFC Write functionality
- iOS NFC Read functionality
- iOS NFC Write functionality
- NFC tag format compatibility
- Error handling for unsupported devices
- Background NFC tag detection (Android)
- Foreground NFC tag detection (iOS)

### Integration Testing

- Supabase connection from native apps
- Real-time data sync
- Offline mode handling
- Push notifications
- Deep linking
- App-to-app communication

---

This updated plan ensures:

1. **All mobile apps are fully native** – No hybrid frameworks
2. **Full NFC support** – Both read and write capabilities on Android and iOS
3. **Optimal performance** – Native apps provide the best performance
4. **Platform-specific features** – Full access to all platform APIs
5. **Clean separation** – PWAs for web, native apps for mobile

The native implementation guarantees full NFC functionality without any
limitations that hybrid frameworks might impose. Each platform (Android with
Kotlin, iOS with Swift) will have complete access to their respective NFC APIs.

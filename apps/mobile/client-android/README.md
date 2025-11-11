# Ibimina Client Android App

Native Android application for SACCO members (client-facing). Built with **Clean Architecture**, **Jetpack Compose**, and **Hilt DI**.

## Features

- **TapMoMo NFC Payments**: Full NFC read/write for secure payment handoff with HMAC signatures
- **Group Management**: View and manage your ibimina groups
- **Transaction History**: Track all your savings and payments  
- **Real-time Updates**: Instant sync with Supabase
- **Offline Support**: Works offline with local Room database caching
- **Security**: HMAC-SHA256 signatures, TTL validation, replay attack prevention

## Architecture

This app follows **Clean Architecture** principles with clear separation of concerns:

```
app/
├── domain/              # Business Logic (Pure Kotlin, no Android dependencies)
│   ├── model/          # Domain entities (Group, Transaction, NFCPaymentPayload)
│   └── repository/     # Repository interfaces
├── data/               # Data Layer (Implementations)
│   ├── local/          # Room database for offline storage
│   │   ├── dao/        # Data Access Objects
│   │   └── entity/     # Room entities
│   ├── remote/         # Supabase API clients
│   └── repository/     # Repository implementations
├── di/                 # Dependency Injection (Hilt modules)
├── presentation/       # Presentation Layer
│   └── viewmodel/      # ViewModels for UI state management
├── ui/                 # Compose UI components
├── nfc/                # NFC handling (NFCManager, activities)
└── security/           # Security utilities (PayloadSigner)
```

### Key Design Patterns

- **Dependency Injection**: Hilt for compile-time DI
- **Repository Pattern**: Clean abstraction for data sources
- **MVVM**: ViewModels manage UI state
- **Flow**: Reactive data streams for real-time updates
- **Single Source of Truth**: Room as offline cache

## Tech Stack

- **Language**: Kotlin
- **UI**: Jetpack Compose + Material 3
- **Architecture**: Clean Architecture + MVVM
- **DI**: Hilt
- **NFC**: Android NFC API with HMAC-SHA256 security
- **Network**: Supabase Kotlin SDK
- **Database**: Room + Supabase
- **Real-time**: Supabase Realtime
- **Testing**: JUnit 4 + Espresso

## Build Requirements

- Android Studio Hedgehog (2023.1.1) or later
- JDK 17
- Android SDK 34 (minimum SDK 24, supports Android 7.0+)
- Gradle 8.2+ (wrapper included)
- Device with NFC support (for NFC features)

## Configuration

### Option 1: Environment Variables

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-anon-key
```

### Option 2: local.properties (Recommended for development)

Create `local.properties` in the project root:

```properties
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Building the App

### Debug Build (Development)

```bash
cd apps/mobile/client-android
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build (Production)

```bash
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release.apk`

### Build from Repository Root

```bash
# From monorepo root
pnpm build:client-android
```

## Running Tests

### Unit Tests

```bash
./gradlew test
# Or specific test
./gradlew test --tests NFCPayloadValidationTest
```

### Instrumentation Tests (Requires connected device/emulator)

```bash
./gradlew connectedAndroidTest
```

## NFC Implementation

### Security Features

The NFC implementation includes multiple security layers:

1. **HMAC-SHA256 Signatures**: All payloads are signed with a shared secret
2. **TTL (Time-to-Live)**: Payloads expire after 60 seconds (configurable)
3. **Nonce**: One-time use nonces prevent replay attacks
4. **Constant-Time Comparison**: Prevents timing attacks on signature verification

### Reading NFC Tags

```kotlin
val nfcManager = NFCManager()
nfcManager.initialize(activity)

// In onNewIntent
val payloadJson = nfcManager.readNFCTag(intent)
val payload = Json.decodeFromString<NFCPaymentPayload>(payloadJson)

// Validate signature
val result = PayloadSigner.validateSignedPayload(payloadMap, SECRET_KEY)
if (result.valid) {
    // Process payment
}
```

### Writing NFC Tags

```kotlin
val nfcManager = NFCManager()
val signedPayload = PayloadSigner.createSignedPayload(
    merchantId = "MERCHANT123",
    network = "MTN",
    amount = 1000.0,
    reference = "REF123",
    secretKey = SECRET_KEY
)

val payloadJson = Json.encodeToString(signedPayload)
val success = nfcManager.writeNFCTag(tag, payloadJson)
```

## Permissions

Required permissions in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.NFC" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-feature android:name="android.hardware.nfc" android:required="true" />
```

## NFC Testing

To test NFC functionality:

1. Install app on two NFC-enabled devices
2. Open NFCWriterActivity on device A (merchant/payee)
3. Enter amount and network, tap "Generate Payment"
4. Open NFCReaderActivity on device B (payer)
5. Tap devices back-to-back
6. Verify signature validation and data transfer
7. Complete USSD payment flow

## Deployment

### Debug Deployment

```bash
./gradlew installDebug
# Or with ADB
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Release Deployment

1. Update version in `app/build.gradle.kts`:
   ```kotlin
   versionCode = 2
   versionName = "1.1.0"
   ```

2. Sign with release keystore:
   ```bash
   ./gradlew assembleRelease
   ```

3. Upload to Google Play Console as AAB:
   ```bash
   ./gradlew bundleRelease
   ```

## Troubleshooting

### NFC Not Working

- Ensure NFC is enabled in device settings
- Verify app has NFC permission
- Check device has NFC hardware: `nfcAdapter != null`
- Test with NDEF-compatible tags

### Build Failures

- Clean and rebuild: `./gradlew clean build`
- Invalidate Android Studio caches: File → Invalidate Caches
- Check JDK version: `java -version` (should be 17)
- Verify Gradle version: `./gradlew --version`

### Supabase Connection Issues

- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Check network permissions in manifest
- Test connection in Android Studio logcat

## Contributing

Follow Clean Architecture principles:

1. **Domain layer**: Pure Kotlin, no Android/framework dependencies
2. **Data layer**: Implementation details, data sources
3. **Presentation layer**: UI logic, ViewModels
4. **DI layer**: Dependency wiring with Hilt

## License

Copyright © 2024 Ibimina SACCO+


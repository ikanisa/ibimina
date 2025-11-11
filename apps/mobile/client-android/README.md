# Ibimina Client Android App

Native Android application for SACCO members (client-facing).

## Features

- **TapMoMo NFC Payments**: Full NFC read/write for payment handoff
- **Group Management**: View and manage your ibimina groups
- **Transaction History**: Track all your savings and payments
- **Real-time Updates**: Instant sync with Supabase
- **Offline Support**: Works offline with local caching

## Tech Stack

- **Language**: Kotlin
- **UI**: Jetpack Compose + Material 3
- **Architecture**: Clean Architecture + MVVM
- **DI**: Hilt
- **NFC**: Android NFC API
- **Network**: Retrofit + OkHttp
- **Database**: Room + Supabase
- **Real-time**: Supabase Realtime

## Build Requirements

- Android Studio Hedgehog or later
- JDK 17
- Android SDK 34 (minimum SDK 24)
- Gradle 8.2+
- Device with NFC support

## Building the App

### Debug Build

```bash
cd apps/mobile/client-android
./gradlew assembleDebug
```

The APK will be located at: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build

```bash
cd apps/mobile/client-android
./gradlew assembleRelease
```

The APK will be located at: `app/build/outputs/apk/release/app-release.apk`

## Configuration

Create a `local.properties` file in the root directory with:

```properties
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## NFC Implementation

### Reading NFC Tags

```kotlin
val nfcManager = NFCManager()
nfcManager.initialize(activity)

// In onNewIntent
val data = nfcManager.readNFCTag(intent)
```

### Writing NFC Tags

```kotlin
val nfcManager = NFCManager()
val success = nfcManager.writeNFCTag(tag, paymentData)
```

## Permissions

The app requires the following permissions:
- `INTERNET`: Network access
- `NFC`: Read/write NFC tags
- `ACCESS_NETWORK_STATE`: Check connectivity

## NFC Requirements

- Device must have NFC hardware
- NFC must be enabled in device settings
- App requires NDEF-compatible tags

## Architecture

```
app/
├── src/main/java/com/ibimina/client/
│   ├── MainActivity.kt
│   ├── nfc/
│   │   ├── NFCManager.kt
│   │   ├── NFCReaderActivity.kt
│   │   └── NFCWriterActivity.kt
│   ├── data/
│   │   └── SupabaseClient.kt
│   └── ui/
│       ├── screens/
│       └── components/
```

## Testing

Run tests with:

```bash
./gradlew test
./gradlew connectedAndroidTest
```

## NFC Testing

To test NFC functionality:
1. Install app on two NFC-enabled devices
2. Open NFCWriterActivity on device A
3. Open NFCReaderActivity on device B
4. Tap devices back-to-back
5. Verify data transfer

## Deployment

1. Update version in `app/build.gradle.kts`
2. Build release APK/AAB
3. Sign with release keystore
4. Upload to Google Play Console

## Security

- All NFC data includes HMAC signatures
- Time-to-live (TTL) validation on payments
- One-time use nonces to prevent replay attacks
- Secure storage using Android Keystore

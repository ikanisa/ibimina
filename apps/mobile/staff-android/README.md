# Staff Android Mobile App

This module contains the baseline Android application for the Ibimina staff
experience. It is configured with Jetpack Compose, Hilt, Retrofit, and Supabase
so future feature teams can plug in product functionality quickly.

## Project structure

```
apps/mobile/staff-android/
├── app/                # Android application module
│   ├── src/main/
│   │   ├── java/com/ibimina/staff
│   │   │   ├── StaffApplication.kt
│   │   │   ├── service/    # Baseline service skeletons
│   │   │   └── ui/         # Compose UI entry point
│   │   └── res/            # Minimal resource bundle
├── build.gradle.kts        # Root Gradle configuration
├── settings.gradle.kts
└── gradle/wrapper          # Gradle wrapper for reproducible builds
```

## Prerequisites

- JDK 17+
- Android SDK with API level 34 installed
- Executable permissions on the Gradle wrapper (`chmod +x gradlew` if required)
- Outbound network access on first run so the wrapper can download its JAR

## First-time setup

1. Navigate to the project root:
   ```bash
   cd apps/mobile/staff-android
   ```
2. (Optional) Set environment-specific secrets by creating a `local.properties`
   file or exporting variables before build:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Sync Gradle dependencies and build the debug APK (the first invocation will
   download the Gradle wrapper JAR automatically):
   ```bash
   ./gradlew assembleDebug
   ```

The build script enables Jetpack Compose, configures the Hilt dependency graph,
and provisions Retrofit and Supabase clients with placeholder configuration so
real credentials can be injected later.

## Next steps

- Connect the `MomoSmsService` to the MTN MoMo SMS webhook/receiver logic.
- Wire the `QRScannerService` into a camera capture pipeline.
- Replace the placeholder OpenAI and Supabase configuration with
  production-ready secrets.
- Expand the Compose UI to expose core staff workflows.
# Ibimina Staff Android App

Native Android application for SACCO staff and administrators.

## Features

- **QR Code Scanning**: Scan member QR codes for verification
- **MoMo SMS Parsing**: Automatic parsing of mobile money transaction SMS
- **OpenAI Integration**: AI-powered assistance for queries and reports
- **Real-time Sync**: Connected to Supabase for real-time data
- **Offline Support**: Works offline with local caching

## Tech Stack

- **Language**: Kotlin
- **UI**: Jetpack Compose + Material 3
- **Architecture**: MVVM + Clean Architecture
- **DI**: Hilt
- **Network**: Retrofit + OkHttp
- **Database**: Supabase (PostgreSQL)
- **QR Scanning**: Google ML Kit
- **AI**: OpenAI API

## Build Requirements

- Android Studio Hedgehog or later
- JDK 17
- Android SDK 34
- Gradle 8.2+

## Building the App

### Debug Build

```bash
cd apps/mobile/staff-android
./gradlew assembleDebug
```

The APK will be located at: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build

```bash
cd apps/mobile/staff-android
./gradlew assembleRelease
```

The APK will be located at: `app/build/outputs/apk/release/app-release.apk`

## Configuration

Create a `local.properties` file in the root directory with:

```properties
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## Permissions

The app requires the following permissions:
- `INTERNET`: Network access for API calls
- `CAMERA`: QR code scanning
- `RECEIVE_SMS`: Automatic MoMo SMS parsing
- `READ_SMS`: Read existing SMS for reconciliation

## Architecture

```
app/
├── src/main/java/com/ibimina/staff/
│   ├── MainActivity.kt
│   ├── data/
│   │   └── SupabaseClient.kt
│   ├── services/
│   │   ├── MomoSmsService.kt
│   │   ├── QRScannerService.kt
│   │   └── OpenAIService.kt
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

## Deployment

1. Update version in `app/build.gradle.kts`
2. Build release APK
3. Sign with release keystore
4. Upload to Google Play Console

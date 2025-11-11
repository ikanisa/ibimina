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

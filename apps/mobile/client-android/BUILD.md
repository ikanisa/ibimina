# Building the Ibimina Client Android App

## Prerequisites

- **Java JDK 17** or higher
- **Android SDK 34** (minimum SDK 24)
- **Gradle 8.2+** (included via wrapper)
- **NFC-capable Android device** for testing NFC features

## Quick Start

### 1. Configure Environment

Create a `local.properties` file in the `apps/mobile/client-android` directory:

```properties
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Alternatively, set environment variables:
```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Build the App

```bash
cd apps/mobile/client-android
./gradlew assembleDebug
```

The APK will be generated at:
`app/build/outputs/apk/debug/app-debug.apk`

### 3. Install on Device

```bash
# Install via ADB
adb install app/build/outputs/apk/debug/app-debug.apk

# Or use Android Studio
# Open project in Android Studio and click "Run"
```

## Build Commands

### Debug Build
```bash
./gradlew assembleDebug
```

### Release Build
```bash
./gradlew assembleRelease
```

### Clean Build
```bash
./gradlew clean assembleDebug
```

## Testing

### Run Unit Tests
```bash
./gradlew test
./gradlew testDebugUnitTest
```

Unit tests are located in:
- `app/src/test/java/com/ibimina/client/`

### Run Instrumentation Tests
```bash
./gradlew connectedAndroidTest
```

Instrumentation tests are located in:
- `app/src/androidTest/java/com/ibimina/client/`

**Note:** Instrumentation tests require a physical device or emulator to be connected.

### Run All Tests
```bash
./gradlew test connectedAndroidTest
```

## Project Structure

The project follows **Clean Architecture** principles with clear separation of concerns:

```
app/src/main/java/com/ibimina/client/
├── domain/              # Business logic (entities, use cases, repository interfaces)
│   ├── model/          # Domain entities (Payment, Group, NFCPayload)
│   ├── repository/     # Repository interfaces
│   └── usecase/        # Use cases
├── data/               # Data layer (repository implementations)
│   ├── local/          # Room database
│   │   ├── entity/    # Room entities
│   │   └── dao/       # Data Access Objects
│   ├── remote/         # Network layer
│   │   ├── api/       # Retrofit interfaces
│   │   └── dto/       # Data Transfer Objects
│   └── repository/     # Repository implementations
├── presentation/       # UI layer
│   └── viewmodel/     # ViewModels for UI state management
├── di/                 # Dependency injection (Hilt modules)
├── nfc/               # NFC functionality
└── ui/                # Compose UI components
```

## Architecture Components

### Domain Layer
- **Entities:** Payment, Group, NFCPayload
- **Use Cases:** GetPaymentsUseCase, CreatePaymentUseCase, GetGroupsUseCase
- **Repository Interfaces:** PaymentRepository, GroupRepository

### Data Layer
- **Room Database:** Local caching with PaymentEntity and GroupEntity
- **Retrofit API:** Network calls to Supabase backend
- **Repository Implementations:** PaymentRepositoryImpl, GroupRepositoryImpl

### Presentation Layer
- **ViewModels:** PaymentViewModel, GroupViewModel
- **UI States:** PaymentUiState, GroupUiState

### Dependency Injection (Hilt)
- **DatabaseModule:** Provides Room database and DAOs
- **NetworkModule:** Provides Retrofit, OkHttp, and API services
- **RepositoryModule:** Binds repository interfaces to implementations

## NFC Features

The app includes comprehensive NFC support:

- **NFCManager:** Core NFC read/write operations
- **NFCReaderActivity:** Activity for reading NFC tags
- **NFCWriterActivity:** Activity for writing to NFC tags
- **NFCPayload:** Domain model for NFC payment data with validation

### Testing NFC
1. Install app on two NFC-enabled devices
2. Open NFCWriterActivity on device A
3. Open NFCReaderActivity on device B
4. Tap devices back-to-back
5. Verify data transfer

## Troubleshooting

### Build Fails with "Could not resolve dependencies"
- Ensure you have internet connectivity
- Try running `./gradlew --refresh-dependencies`
- Check that Google and Maven Central repositories are accessible

### "SUPABASE_URL is required" Error
- Create `local.properties` file with Supabase configuration
- Or set SUPABASE_URL and SUPABASE_ANON_KEY environment variables

### Gradle Wrapper Not Found
- The wrapper should be in `gradle/wrapper/`
- If missing, run: `gradle wrapper --gradle-version 8.2`

### NFC Not Working on Emulator
- NFC requires physical hardware
- Use a real Android device with NFC capability
- Ensure NFC is enabled in device settings

## Development

### Adding New Features
1. Define domain entities in `domain/model/`
2. Create use cases in `domain/usecase/`
3. Implement repositories in `data/repository/`
4. Create ViewModels in `presentation/viewmodel/`
5. Add UI components in `ui/`

### Running in Android Studio
1. Open `apps/mobile/client-android` in Android Studio
2. Let Gradle sync complete
3. Select a device or emulator
4. Click "Run" or press Shift+F10

## CI/CD

### GitHub Actions
The project can be built in CI/CD pipelines. Set the following secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Example workflow:
```yaml
- name: Build Android APK
  run: |
    cd apps/mobile/client-android
    ./gradlew assembleDebug
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Additional Resources

- [README.md](./README.md) - Main project documentation
- [Android Developer Guide](https://developer.android.com/)
- [Kotlin Documentation](https://kotlinlang.org/docs/)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [Hilt Dependency Injection](https://developer.android.com/training/dependency-injection/hilt-android)
- [Room Persistence Library](https://developer.android.com/training/data-storage/room)
- [Retrofit](https://square.github.io/retrofit/)

# Ibimina Client Android App

Native Android application for SACCO members (client-facing) with full Clean Architecture implementation.

## Features

- **TapMoMo NFC Payments**: Full NFC read/write for payment handoff with HMAC validation
- **Group Management**: View and manage your ibimina groups
- **Transaction History**: Track all your savings and payments
- **Real-time Updates**: Instant sync with Supabase
- **Offline Support**: Works offline with local Room database caching

## Tech Stack

- **Language**: Kotlin
- **UI**: Jetpack Compose + Material 3
- **Architecture**: Clean Architecture (Domain/Data/Presentation) + MVVM
- **DI**: Hilt
- **NFC**: Android NFC API with NDEF support
- **Network**: Retrofit + OkHttp
- **Database**: Room + Supabase
- **Real-time**: Supabase Realtime
- **Testing**: JUnit, Mockito, Espresso

## Architecture Overview

This project follows **Clean Architecture** principles with three distinct layers:

### Domain Layer (`domain/`)
Pure business logic with no Android dependencies.
- **Models**: Payment, Group, NFCPayload
- **Repository Interfaces**: PaymentRepository, GroupRepository
- **Use Cases**: GetPaymentsUseCase, CreatePaymentUseCase, GetGroupsUseCase

### Data Layer (`data/`)
Handles data operations from multiple sources.
- **Local**: Room database with DAOs for offline caching
- **Remote**: Retrofit API services for network calls
- **Repository Implementations**: Concrete implementations of domain repositories

### Presentation Layer (`presentation/`)
UI-related code using MVVM pattern.
- **ViewModels**: Manage UI state and business logic
- **UI States**: Sealed classes for loading/success/error states

## Build Requirements

- Android Studio Hedgehog or later
- JDK 17
- Android SDK 34 (minimum SDK 24)
- Gradle 8.2+ (included via wrapper)
- Device with NFC support (for NFC testing)

## Building the App

See [BUILD.md](./BUILD.md) for comprehensive build instructions.

### Quick Start

1. Create `local.properties` with Supabase configuration:
```properties
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Build:
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
val payload = NFCPayload(
    amount = 5000.0,
    network = "MTN",
    merchantId = "MERCHANT123",
    reference = "REF001",
    hmacSignature = "signature",
    nonce = "nonce123",
    timestamp = System.currentTimeMillis() / 1000,
    ttl = 60
)
val success = nfcManager.writeNFCTag(tag, payload.toJson())
```

### NFC Security

- HMAC signature validation
- Time-to-live (TTL) checking
- One-time nonce to prevent replay attacks
- Payload expiration validation

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
app/src/main/java/com/ibimina/client/
├── domain/              # Business logic layer (no Android dependencies)
│   ├── model/          # Domain entities
│   │   ├── Payment.kt
│   │   ├── Group.kt
│   │   └── NFCPayload.kt
│   ├── repository/     # Repository interfaces
│   │   ├── PaymentRepository.kt
│   │   └── GroupRepository.kt
│   └── usecase/        # Use cases
│       ├── GetPaymentsUseCase.kt
│       ├── CreatePaymentUseCase.kt
│       └── GetGroupsUseCase.kt
├── data/               # Data layer
│   ├── local/          # Room database for offline caching
│   │   ├── IbiminaDatabase.kt
│   │   ├── entity/    # Room entities
│   │   │   ├── PaymentEntity.kt
│   │   │   └── GroupEntity.kt
│   │   └── dao/       # Data Access Objects
│   │       ├── PaymentDao.kt
│   │       └── GroupDao.kt
│   ├── remote/         # Network layer
│   │   ├── api/       # Retrofit interfaces
│   │   │   └── IbiminaApi.kt
│   │   └── dto/       # Data Transfer Objects
│   │       ├── PaymentDto.kt
│   │       └── GroupDto.kt
│   ├── repository/     # Repository implementations
│   │   ├── PaymentRepositoryImpl.kt
│   │   └── GroupRepositoryImpl.kt
│   └── SupabaseClient.kt
├── presentation/       # Presentation layer
│   └── viewmodel/     # ViewModels
│       ├── PaymentViewModel.kt
│       └── GroupViewModel.kt
├── di/                # Dependency injection modules
│   ├── DatabaseModule.kt
│   ├── NetworkModule.kt
│   └── RepositoryModule.kt
├── nfc/               # NFC functionality
│   ├── NFCManager.kt
│   ├── NFCReaderActivity.kt
│   └── NFCWriterActivity.kt
├── ui/                # Compose UI
│   ├── screens/
│   ├── components/
│   ├── navigation/
│   │   └── AppNavigation.kt
│   └── theme/
│       └── Theme.kt
├── MainActivity.kt
└── ClientApplication.kt
```

## Testing

### Unit Tests

Run unit tests with:
```bash
./gradlew test
./gradlew testDebugUnitTest
```

Unit tests include:
- **NFCManagerTest**: Tests for NFC payload validation, expiration, serialization
- **PaymentUseCaseTest**: Tests for payment use cases with mocked repositories

### Instrumentation Tests

Run instrumentation tests with:
```bash
./gradlew connectedAndroidTest
```

Instrumentation tests include:
- **NFCInstrumentationTest**: Integration tests for NFC hardware functionality

**Note**: Requires a physical device or emulator connected via ADB.

### Test Coverage

Tests cover:
- ✅ Domain layer (entities, use cases)
- ✅ NFC payload validation and expiration
- ✅ Repository interfaces
- 🔄 Data layer (TODO: Add Room and Retrofit tests)
- 🔄 Presentation layer (TODO: Add ViewModel tests)

## NFC Testing

To test NFC functionality:
1. Install app on two NFC-enabled devices
2. Open NFCWriterActivity on device A
3. Open NFCReaderActivity on device B
4. Tap devices back-to-back
5. Verify data transfer

**Security Testing:**
- Verify HMAC signature validation
- Test TTL expiration (payload should be rejected after TTL)
- Test replay attack prevention (same nonce should be rejected)

## Deployment

1. Update version in `app/build.gradle.kts`
2. Build release APK/AAB
3. Sign with release keystore
4. Upload to Google Play Console

## Security

- All NFC data includes HMAC signatures for integrity
- Time-to-live (TTL) validation on payments prevents stale data
- One-time use nonces prevent replay attacks
- Secure storage using Android Keystore (TODO)
- Network traffic encrypted via HTTPS

## Dependency Management

Key dependencies:
- **Hilt 2.48**: Dependency injection
- **Room 2.6.1**: Local database
- **Retrofit 2.9.0**: Network calls
- **Supabase 2.0.0**: Backend integration
- **Compose BOM 2023.10.01**: UI framework
- **Coroutines 1.7.3**: Async operations

## Known Issues

- Build requires network connectivity to download dependencies
- NFC testing requires physical devices (emulators don't have NFC hardware)
- Some unit tests use Mockito which may require additional configuration

## Contributing

When adding new features:
1. Create domain entities in `domain/model/`
2. Define repository interfaces in `domain/repository/`
3. Implement use cases in `domain/usecase/`
4. Create Room entities in `data/local/entity/`
5. Implement repositories in `data/repository/`
6. Create ViewModels in `presentation/viewmodel/`
7. Add UI components in `ui/`
8. Write unit and instrumentation tests

## License

See repository root for license information.

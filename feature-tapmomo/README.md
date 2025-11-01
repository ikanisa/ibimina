# TapMoMo - NFC Mobile Money Payment Library for Android

TapMoMo is a reusable Android library that enables phone-to-phone NFC payments
with MoMo USSD integration for Rwanda. It provides both UI components and
headless APIs for easy integration into existing apps.

## Features

- **NFC Payment Protocol**: Phone-to-phone handshake using HCE (payee) and
  Reader Mode (payer)
- **USSD Integration**: Automatic USSD code launch for MoMo payments (MTN,
  Airtel)
- **Security**: HMAC-SHA256 signing, TTL validation, nonce replay protection
- **Dual-SIM Support**: SIM card picker for devices with multiple SIM cards
- **Offline-First**: Local Room database for transaction history
- **Optional Backend**: Supabase integration for merchant profiles and
  reconciliation
- **QR Code Fallback**: Alternative payment method when NFC is unavailable
- **Compose UI**: Ready-to-use Material3 Composable screens and Activities

## Requirements

- **minSdk**: 26 (Android 8.0 Oreo)
- **targetSdk**: 35 (Android 15)
- **Kotlin**: 1.9.20+
- **Jetpack Compose**: Material3

## Installation

### 1. Add the Module to Your Project

Add the module to your `settings.gradle.kts`:

```kotlin
include(":feature-tapmomo")
```

### 2. Add Dependency

In your app's `build.gradle.kts`:

```kotlin
dependencies {
    implementation(project(":feature-tapmomo"))
}
```

### 3. Initialize in Application

In your `Application` class:

```kotlin
import com.tapmomo.feature.TapMoMo
import com.tapmomo.feature.TapMoMoConfig
import com.tapmomo.feature.Network

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        TapMoMo.init(
            context = this,
            config = TapMoMoConfig(
                supabaseUrl = BuildConfig.SUPABASE_URL,
                supabaseAnonKey = BuildConfig.SUPABASE_ANON_KEY,
                reconcileFunctionUrl = BuildConfig.RECONCILE_URL,
                defaultCurrency = "RWF",
                networks = setOf(Network.MTN, Network.Airtel),
                hceTtlMs = 45_000,
                requireSignature = true,
                allowUnsignedWithWarning = true
            )
        )
    }
}
```

## Usage

### Check NFC Availability

```kotlin
val isAvailable = TapMoMo.isNfcAvailable(context)
val isEnabled = TapMoMo.isNfcEnabled(context)
```

### Launch "Get Paid" Screen (Merchant/Payee)

```kotlin
TapMoMo.openGetPaid(
    context = context,
    amount = 2500, // Optional, in RWF
    network = Network.MTN,
    merchantId = "123456"
)
```

### Launch "Pay" Screen (Payer)

```kotlin
TapMoMo.openPay(context)
```

### Using Composables Directly

```kotlin
@Composable
fun MyPaymentScreen() {
    GetPaidScreen(
        initialAmount = 1000,
        initialNetwork = Network.MTN,
        initialMerchantId = "123456",
        onClose = { /* handle close */ }
    )
}
```

## NFC Protocol

### Application ID (AID)

- **AID**: `F01234567890` (proprietary, avoids payment app conflicts)
- **Category**: `other` (not a payment application)

### Payload Format

JSON payload transmitted via NFC:

```json
{
  "ver": 1,
  "network": "MTN",
  "merchantId": "123456",
  "currency": "RWF",
  "amount": 2500,
  "ref": "optional-reference",
  "ts": 1698765432000,
  "nonce": "uuid-v4",
  "sig": "base64-hmac-sha256-signature"
}
```

### Security

- **TTL**: Maximum 120 seconds from timestamp
- **Nonce**: UUID v4, cached for 10 minutes to prevent replay attacks
- **Signature**: HMAC-SHA256 of payload fields (optional but recommended)

## USSD Templates

Default templates for Rwanda MoMo:

### MTN

- **Shortcut** (with amount): `*182*8*1*{MERCHANT}*{AMOUNT}#`
- **Menu**: `*182*8*1#`
- **Base**: `*182#`

### Airtel

- **Shortcut** (with amount): `*182*8*1*{MERCHANT}*{AMOUNT}#`
- **Menu**: `*182*8*1#`
- **Base**: `*182#`

Custom templates can be configured via `TapMoMoConfig.ussdTemplateBundle` (use
`UssdTemplateBundle.from(...)` for OTA refreshes).
`TapMoMo.refreshUssdTemplates` can replace the bundle at runtime when a newer
version is fetched.

## Permissions

Required permissions (declared in library manifest):

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-permission android:name="android.permission.CALL_PHONE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
```

Optional:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

The library handles runtime permission requests automatically.

## Database Schema

Local Room database stores:

- **transactions**: Payment transaction history
- **seen_nonces**: Nonce replay protection cache

## Supabase Backend (Optional)

### Setup

1. Create Supabase project
2. Run `backend/schema.sql` to create tables
3. Deploy Edge Function: `backend/reconcile/index.ts`
4. Store merchant secrets securely

### Tables

- **merchants**: Merchant profiles with HMAC signing keys
- **transactions**: Server-side transaction records

See `backend/README.md` for detailed setup instructions.

## ProGuard Rules

The library includes consumer ProGuard rules automatically. No additional
configuration needed.

## Testing

### Unit Tests

Run unit tests:

```bash
./gradlew :feature-tapmomo:test
```

### Instrumented Tests

Run on device/emulator:

```bash
./gradlew :feature-tapmomo:connectedAndroidTest
```

## Architecture

```
com.tapmomo.feature
├── TapMoMo.kt              # Main API
├── core/                   # Utilities
│   ├── CryptoUtils.kt
│   ├── TimeUtils.kt
│   ├── SimUtils.kt
│   └── PermissionUtils.kt
├── nfc/                    # NFC layer
│   ├── PayeeCardService.kt # HCE service
│   ├── ReaderController.kt # Reader mode
│   ├── PayloadBuilder.kt
│   └── PayloadValidator.kt
├── ussd/                   # USSD launcher
│   └── UssdLauncher.kt
├── data/                   # Data layer
│   ├── TapMoMoDatabase.kt
│   ├── TapMoMoRepository.kt
│   ├── SupabaseClient.kt
│   ├── entity/
│   ├── dao/
│   └── models/
└── ui/                     # UI components
    ├── screens/
    │   ├── GetPaidScreen.kt
    │   └── PayScreen.kt
    ├── TapMoMoGetPaidActivity.kt
    └── TapMoMoPayActivity.kt
```

## Configuration Options

All options in `TapMoMoConfig`:

| Option                             | Type               | Default         | Description                          |
| ---------------------------------- | ------------------ | --------------- | ------------------------------------ |
| `supabaseUrl`                      | String?            | null            | Supabase project URL                 |
| `supabaseAnonKey`                  | String?            | null            | Supabase anonymous key               |
| `reconcileFunctionUrl`             | String?            | null            | Edge Function URL for reconciliation |
| `defaultCurrency`                  | String             | "RWF"           | Default currency code                |
| `networks`                         | Set<Network>       | MTN, Airtel     | Supported networks                   |
| `hceTtlMs`                         | Long               | 45000           | NFC payload TTL (milliseconds)       |
| `requireSignature`                 | Boolean            | true            | Require HMAC signature               |
| `allowUnsignedWithWarning`         | Boolean            | true            | Allow unsigned with warning          |
| `useUssdShortcutWhenAmountPresent` | Boolean            | true            | Use shortcut USSD when amount known  |
| `ussdTemplateBundle`               | UssdTemplateBundle | Rwanda defaults | Versioned USSD templates + TTL       |

## Contributing

Contributions are welcome! Please:

1. Follow Kotlin coding conventions
2. Write unit tests for new features
3. Update documentation
4. Use conventional commit messages

## License

Copyright 2024 TapMoMo Library

Licensed under the Apache License, Version 2.0

## Support

For issues, questions, or feature requests, please open an issue on the
repository.

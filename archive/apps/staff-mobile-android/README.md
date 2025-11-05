# Staff/Admin Mobile App (Android)

Production-grade Android application for Ibimina SACCO staff with:

## 🔥 Key Features

### 1. **QR Code Web Authentication** 
- Scan QR codes from Staff Admin PWA to authenticate web sessions
- Biometric verification (fingerprint/face) required before authenticating
- Secure challenge-response protocol with Supabase Edge Functions

### 2. **SMS Payment Monitoring**
- Reads incoming SMS messages for mobile money payment notifications
- AI-powered parsing using OpenAI GPT-4
- Automatic payment reconciliation with user accounts in Supabase
- Manual approval workflow for ambiguous payments

### 3. **Biometric Security**
- Fingerprint and face authentication
- Secure token storage with Android Keystore
- Device registration and management

### 4. **Offline-First Architecture**
- Local Room database for caching
- Background sync when connectivity returns
- Works without internet for critical operations

## 🏗️ Architecture

```
app/
├── src/main/java/rw/ibimina/staff/
│   ├── StaffApp.kt                 # Application class
│   ├── MainActivity.kt             # Main entry point
│   ├── ui/
│   │   ├── navigation/             # Navigation graph
│   │   ├── screens/
│   │   │   ├── auth/               # Login screens
│   │   │   ├── home/               # Dashboard
│   │   │   ├── qr/                 # QR scanner
│   │   │   └── sms/                # SMS monitor
│   │   ├── theme/                  # Material3 theme
│   │   └── components/             # Reusable components
│   ├── data/
│   │   ├── models/                 # Data classes
│   │   ├── repository/             # Data repositories
│   │   └── database/               # Room database
│   ├── sms/
│   │   ├── SmsReceiver.kt          # Broadcast receiver
│   │   ├── SmsParser.kt            # AI-powered parser
│   │   └── PaymentReconciler.kt    # Payment matching
│   ├── qr/
│   │   ├── QRScanner.kt            # Camera + ML Kit
│   │   └── WebAuthService.kt       # Auth verification
│   ├── biometric/
│   │   └── BiometricManager.kt     # Biometric auth
│   └── viewmodels/                 # ViewModels
```

## �� Setup

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or later
- JDK 17
- Android SDK 34
- Kotlin 1.9.22

### Environment Variables

Create `local.properties` in the project root:

```properties
sdk.dir=/path/to/Android/sdk
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-key
```

### Build & Run

```bash
# Install dependencies
./gradlew build

# Run on device/emulator
./gradlew installDebug

# Run tests
./gradlew test
./gradlew connectedAndroidTest
```

## 📱 User Flow

### QR Authentication Flow

1. Staff opens Staff Admin PWA on desktop
2. PWA displays QR code with session challenge
3. Staff opens this app and taps "Scan QR Code"
4. App scans QR code
5. App prompts for biometric authentication (fingerprint/face)
6. After biometric verification, app calls `auth-qr-verify` Edge Function
7. Edge Function validates and creates web session tokens
8. PWA polls and receives tokens, logs user in

### SMS Payment Flow

1. Customer sends mobile money payment (e.g., MTN Mobile Money)
2. Payment provider sends SMS notification to staff phone
3. App's `SmsReceiver` intercepts SMS
4. `SmsParser` uses OpenAI GPT-4 to extract:
   - Transaction ID
   - Amount
   - Sender phone number
   - Timestamp
5. `PaymentReconciler` matches payment to user account in Supabase
6. If match found: auto-approve and notify user
7. If ambiguous: flag for manual approval in app
8. Staff reviews and approves/rejects in SMS Monitor screen

## 🔒 Security

### Biometric Authentication
- Uses Android BiometricPrompt API
- Supports fingerprint and face recognition
- Fallback to device PIN/pattern if biometrics unavailable
- Biometric verification required for:
  - App login
  - QR code authentication
  - Payment approval

### Token Storage
- Access tokens stored in encrypted DataStore
- Refresh tokens stored in Android Keystore
- Never logs sensitive data
- Automatic token refresh

### Permissions
- **CAMERA**: QR code scanning
- **READ_SMS**: Read mobile money notifications
- **USE_BIOMETRIC**: Biometric authentication
- **INTERNET**: API calls to Supabase
- All permissions requested at runtime with rationale

## 📊 Database Schema (Room)

### StaffEntity
```kotlin
@Entity(tableName = "staff")
data class StaffEntity(
    @PrimaryKey val id: String,
    val email: String,
    val fullName: String,
    val role: String,
    val deviceId: String?,
    val lastSyncedAt: Long
)
```

### SmsPaymentEntity
```kotlin
@Entity(tableName = "sms_payments")
data class SmsPaymentEntity(
    @PrimaryKey val id: String,
    val smsBody: String,
    val sender: String,
    val receivedAt: Long,
    val parsedData: String?, // JSON
    val status: String, // pending, matched, approved, rejected
    val matchedUserId: String?,
    val matchConfidence: Float?,
    val approvedBy: String?,
    val approvedAt: Long?
)
```

## 🧪 Testing

### Unit Tests
```bash
./gradlew test
```

### Instrumented Tests
```bash
./gradlew connectedAndroidTest
```

### Test Coverage
- QR code parsing
- SMS parsing with OpenAI
- Payment matching algorithm
- Biometric flow (mocked)
- Repository layer
- ViewModels

## 📦 Dependencies

Key libraries:
- **Jetpack Compose**: Modern UI toolkit
- **Material3**: Material Design 3 components
- **Supabase Kotlin**: Database and auth
- **CameraX + ML Kit**: QR code scanning
- **OpenAI Client**: AI-powered SMS parsing
- **Room**: Local database
- **Biometric API**: Fingerprint/face auth
- **Retrofit**: HTTP client
- **Hilt**: Dependency injection (optional)

## 🐛 Troubleshooting

### QR Scanner Not Working
- Ensure CAMERA permission granted
- Check device has autofocus
- Verify good lighting conditions

### SMS Not Being Received
- Ensure READ_SMS permission granted
- Set app as default SMS app (optional)
- Check SMS broadcast receiver is registered

### Biometric Prompt Not Showing
- Verify device has biometric hardware
- Ensure biometric enrolled in device settings
- Fallback to PIN will be offered

### OpenAI API Errors
- Check OPENAI_API_KEY is valid
- Verify API quota not exceeded
- Check network connectivity
- Review error logs in Logcat

## 📄 License

Apache-2.0

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

**Built with ❤️ for Ibimina SACCO**

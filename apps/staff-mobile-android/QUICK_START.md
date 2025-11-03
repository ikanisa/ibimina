# Quick Start Guide - Staff Admin Android App

## 🎯 RECOMMENDED APPROACH: Native Kotlin (Option 1)

For your banking system requirements (QR auth + SMS payment processing), **native Android is strongly recommended** because:

1. **SMS Access**: Requires deep Android integration - Capacitor plugins are limited
2. **Security**: Banking apps need native KeyStore integration
3. **Performance**: Real-time SMS processing and AI parsing need native performance
4. **Background Processing**: SMS reception works better with native BroadcastReceiver

## ⚡ Current Status

### ✅ What's Ready
- Project structure with Gradle build files
- Android manifest with all permissions
- Supabase client initialization
- Navigation structure
- Dependencies configured

### 🔨 What to Implement Next

**PRIORITY 1: Critical Path (QR Auth)**
1. Data models (30 min)
2. Biometric manager (20 min)
3. QR scanner with CameraX (45 min)
4. Web auth service (30 min)
5. QR scanner UI screen (40 min)

**PRIORITY 2: SMS Payment Processing**
6. SMS receiver + parser (60 min)
7. Payment reconciler (45 min)
8. SMS monitor UI (50 min)

**PRIORITY 3: Supporting Features**
9. Login screen (30 min)
10. Home dashboard (30 min)
11. Auth ViewModel (25 min)
12. Theme + resources (20 min)

**Total estimated time: ~6-7 hours** for experienced Android developer

## 🚀 Setup Instructions

### 1. Prerequisites
```bash
# Install Android Studio
# Download from: https://developer.android.com/studio

# Install JDK 17
brew install openjdk@17

# Set JAVA_HOME
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
```

### 2. Configure Project
```bash
cd /Users/jeanbosco/workspace/ibimina/apps/staff-mobile-android

# Create local.properties
cat > local.properties << 'PROPS'
sdk.dir=/Users/jeanbosco/Library/Android/sdk
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-key
PROPS
```

### 3. Open in Android Studio
```bash
# Open Android Studio
# File → Open → Select /Users/jeanbosco/workspace/ibimina/apps/staff-mobile-android

# Wait for Gradle sync to complete (first time takes 5-10 min)
```

### 4. Build & Run
```bash
# Via Android Studio:
# - Connect Android device or start emulator
# - Click Run button (green triangle)

# Or via command line:
./gradlew assembleDebug
./gradlew installDebug

# Run on connected device
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## 📱 Testing the App

### Test QR Authentication
1. Open Staff Admin PWA at http://localhost:3000
2. PWA shows QR code
3. Open Android app
4. Tap "Scan QR Code"
5. Grant camera permission
6. Point camera at QR code
7. Biometric prompt appears
8. After biometric verification, PWA logs in

### Test SMS Payment Processing
1. Send test SMS to device:
   ```
   You have received RWF 10,000 from +250788123456 (JOHN DOE). 
   Transaction ID: MP123456789. Your new balance is RWF 50,000.
   ```

2. App intercepts SMS
3. OpenAI parses payment details
4. App matches to user in Supabase
5. If match > 85% confidence: auto-approve
6. If match < 85%: shows in "Pending Approvals" list

## 🔧 Development Workflow

### Daily Development
```bash
# Pull latest
git pull origin fix/admin-supabase-alias

# Make changes in Android Studio

# Test on device
./gradlew installDebug

# Commit
git add .
git commit -m "feat(android): implement QR scanner"
git push
```

### Common Tasks

**Add a new screen:**
```bash
# Create in app/src/main/java/rw/ibimina/staff/ui/screens/yourscreen/
# Add to AppNavigation.kt
```

**Add a new dependency:**
```groovy
// In app/build.gradle.kts
dependencies {
    implementation("com.example:library:1.0.0")
}
```

**Run tests:**
```bash
./gradlew test                    # Unit tests
./gradlew connectedAndroidTest    # Instrumented tests
```

## 🐛 Troubleshooting

### "SDK location not found"
```bash
# Create/update local.properties
echo "sdk.dir=$HOME/Library/Android/sdk" > local.properties
```

### "Build failed: SUPABASE_URL not found"
```bash
# Add to gradle.properties or local.properties:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key
OPENAI_API_KEY=sk-your-key
```

### SMS not being received
```bash
# Check permission in AndroidManifest.xml:
<uses-permission android:name="android.permission.RECEIVE_SMS" />

# Request permission at runtime in app
# Grant in: Settings → Apps → Staff Admin → Permissions → SMS
```

### QR Scanner black screen
```bash
# Check camera permission:
<uses-permission android:name="android.permission.CAMERA" />

# Verify device has camera:
<uses-feature android:name="android.hardware.camera" />
```

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Staff Admin Android App                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐ │
│  │   QR Scanner  │  │  SMS Receiver │  │ Biometric Auth  │ │
│  │   (CameraX +  │  │(BroadcastRec) │  │ (BiometricAPI)  │ │
│  │    ML Kit)    │  │               │  │                 │ │
│  └───────┬───────┘  └───────┬───────┘  └────────┬────────┘ │
│          │                   │                   │          │
│          v                   v                   v          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   ViewModels                          │  │
│  │  (AuthVM, QRScannerVM, SmsVM)                        │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│                     v                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Repository Layer                    │  │
│  │  (Auth, Payments, SMS)                               │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│          ┌──────────┴──────────┐                           │
│          v                     v                           │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │ Supabase SDK │      │  Room DB     │                   │
│  │(Remote data) │      │(Local cache) │                   │
│  └──────────────┘      └──────────────┘                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
           │                           │
           v                           v
    ┌─────────────┐            ┌──────────────┐
    │  Supabase   │            │  OpenAI API  │
    │  (Auth+DB)  │            │ (SMS Parsing)│
    └─────────────┘            └──────────────┘
```

## 🎯 Next Actions

Choose your path:

**Path A: Full Native Implementation (Recommended)**
- Continue implementing Kotlin files
- Estimated time: 6-7 hours
- Best for banking security

**Path B: Hybrid with Capacitor**
- Convert staff-admin-pwa to Capacitor
- Add custom SMS plugin
- Estimated time: 4-5 hours
- Shares code with web app

**My Recommendation:**
Go with **Path A (Native Kotlin)** for staff app because:
1. SMS access needs deep Android integration
2. Banking security requires native KeyStore
3. Better performance for AI SMS parsing
4. More control over background processing

But use **Path B (Capacitor)** for client mobile app because:
1. Clients don't need SMS access
2. Can share UI with client PWA
3. Faster development
4. Easier maintenance

This gives you:
- **Staff**: Native Android (security + SMS)
- **Client**: Capacitor (speed + code sharing)

Would you like me to continue with the native Kotlin implementation?

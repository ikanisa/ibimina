# Android Mobile Apps - Build Guide

**Platform**: Android  
**Build Tool**: Gradle + Capacitor  
**Target SDK**: 34 (Android 14)  
**Min SDK**: 24 (Android 7.0)

---

## 📱 Applications

### 1. Ibimina Staff (Admin Mobile App)

- **App ID**: `rw.ibimina.staff`
- **Package**: `apps/admin/android/`
- **Purpose**: Staff console for Android devices

### 2. Ibimina Client (Member Mobile App)

- **App ID**: `rw.gov.ikanisa.ibimina.client`
- **Package**: `apps/client/android/`
- **Purpose**: Member self-service portal

---

## 🛠️ Prerequisites

### Required Software (Local Machine Only)

1. **Android Studio** (Hedgehog | 2023.1.1 or later)
   - Download: https://developer.android.com/studio
   - Includes: Android SDK, Gradle, emulators

2. **Java Development Kit (JDK) 17**

   ```bash
   # macOS (Homebrew)
   brew install openjdk@17

   # Ubuntu/Debian
   sudo apt install openjdk-17-jdk

   # Verify
   java -version  # Should show 17.x.x
   ```

3. **Node.js 18+** & **pnpm**

   ```bash
   node -v  # Should be 18+
   pnpm -v  # Should be 10+
   ```

4. **Android SDK Command Line Tools**

   ```bash
   # Set environment variable
   export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
   export ANDROID_HOME=$HOME/Android/Sdk         # Linux

   # Add to PATH
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   ```

5. **Accept SDK Licenses**
   ```bash
   sdkmanager --licenses
   # Accept all licenses by typing 'y'
   ```

### Verify Setup

```bash
# Check Java
java -version
# Expected: openjdk 17.x.x

# Check Android SDK
sdkmanager --list | head -20
# Should show installed SDK versions

# Check Gradle (via project)
cd apps/admin/android
./gradlew --version
# Expected: Gradle 8.7+
```

---

## 🤖 Continuous Integration (Signed Bundles)

Production-signed Android App Bundles for the staff application are produced by
the [`Build Signed Staff Android Bundle`](.github/workflows/android-build.yml)
GitHub Actions workflow. The job executes the same steps documented below
(workspace builds, Next.js build, Capacitor sync) and finishes with a
deterministic `bundleRelease` Gradle build that honours the versioning values
injected via CI.

### Required GitHub Secrets

| Secret                              | Purpose                                                                |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`           | Base64-encoded Java keystore used for release signing.                 |
| `ANDROID_KEYSTORE_PASSWORD`         | Password protecting the keystore container.                            |
| `ANDROID_KEY_ALIAS`                 | Alias of the signing key inside the keystore.                          |
| `ANDROID_KEY_PASSWORD`              | Password for the signing key.                                          |
| `STAFF_APP_SERVER_URL` _(optional)_ | Overrides the production server URL embedded into the Capacitor build. |

> The workflow fails fast if the base64 keystore secret is missing. The decoded
> keystore is written to `apps/admin/android/app/release.keystore`, matching the
> default path referenced in `gradle.properties`.

### Triggering the Workflow

- **Automatic**: Any push to `main` touching `apps/admin/**`.
- **Manual**: `workflow_dispatch`, which also supports an optional `server_url`
  override when testing against non-production endpoints.

The resulting `.aab` artefact is uploaded under the name
`ibimina-staff-aab-<version>` and, when the workflow runs on a tag, attached to
the corresponding GitHub Release for downstream distribution.

---

## 🚀 Building Admin Mobile App

### Step 1: Clone Repository

```bash
# If not already cloned
git clone https://github.com/ikanisa/ibimina.git
cd ibimina

# Or download from Replit
# Use Replit's "Download as ZIP" option
```

### Step 2: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Build shared packages (only those with build scripts)
pnpm --filter @ibimina/core run build
pnpm --filter @ibimina/config run build
pnpm --filter @ibimina/ui run build
```

### Step 3: Build Next.js App

```bash
cd apps/admin

# Build for production
pnpm run build

# Output: .next/ directory
```

### Step 4: Configure Environment (Optional)

For production builds, set server URL:

```bash
# Production server
export CAPACITOR_SERVER_URL=https://staff.ibimina.rw

# Development (connects to localhost)
# No need to set CAPACITOR_SERVER_URL
```

### Step 5: Sync Capacitor

```bash
# Sync web assets to Android
npx cap sync android

# Or force sync if needed
npx cap sync android --force
```

### Step 6: Build APK

```bash
cd android

# Debug build (for testing)
./gradlew assembleDebug

# Release build (for production)
./gradlew assembleRelease

# Clean build (if issues)
./gradlew clean assembleDebug
```

### Step 7: Locate APK

```bash
# Debug APK
ls -lh app/build/outputs/apk/debug/app-debug.apk

# Release APK (unsigned)
ls -lh app/build/outputs/apk/release/app-release-unsigned.apk
```

### Step 8: Install on Device

```bash
# Via ADB (Android Debug Bridge)
cd apps/admin/android
./gradlew installDebug

# Or manually
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Check installed
adb shell pm list packages | grep ibimina
```

---

## 🚀 Building Client Mobile App

### Same Steps as Admin, Different Directory

```bash
# 1. Install dependencies (from project root)
cd ibimina  # or wherever you cloned the repo
pnpm install

# 2. Build shared packages
pnpm --filter @ibimina/core run build
pnpm --filter @ibimina/config run build
pnpm --filter @ibimina/ui run build

# 3. Navigate to client app
cd apps/client

# 4. Build Next.js (static export)
pnpm run build

# 5. Set production URL (optional)
export CAPACITOR_SERVER_URL=https://client.ibimina.rw

# 6. Sync to Android
npx cap sync android

# 7. Build APK
cd android
./gradlew assembleDebug

# 8. Locate APK
ls -lh app/build/outputs/apk/debug/app-debug.apk

# 9. Install
./gradlew installDebug
```

---

## 🏗️ Build Variants

### Debug Build

**Purpose**: Development and testing  
**Features**:

- Web view debugging enabled
- Connects to localhost
- Not signed
- Faster build time

```bash
./gradlew assembleDebug
```

### Release Build

**Purpose**: Production deployment  
**Features**:

- Optimized and minified
- Must be signed
- Connects to production server
- ProGuard enabled

```bash
./gradlew assembleRelease
```

---

## 🔐 Signing Release APKs

### Step 1: Generate Keystore (One-Time)

```bash
# Navigate to project root
cd ibimina

# Generate keystore
keytool -genkey -v \
  -keystore release-keys/ibimina-release.keystore \
  -alias ibimina \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Follow prompts:
# - Enter keystore password (save this!)
# - Enter key password (save this!)
# - Fill in organizational details
```

### Step 2: Configure Gradle Signing

Create `android/key.properties`:

```properties
storeFile=../../release-keys/ibimina-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=ibimina
keyPassword=YOUR_KEY_PASSWORD
```

**IMPORTANT**: Never commit `key.properties` to git!

### Step 3: Update `android/app/build.gradle`

```gradle
// Load keystore properties
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 4: Build Signed APK

```bash
cd android
./gradlew assembleRelease

# Signed APK location:
# app/build/outputs/apk/release/app-release.apk
```

### Step 5: Verify Signature

```bash
# Check APK signature
jarsigner -verify -verbose -certs \
  app/build/outputs/apk/release/app-release.apk

# Expected: "jar verified"
```

---

## 📦 Build Automation Scripts

### Create `build-android.sh` (Project Root)

```bash
#!/bin/bash
set -e

echo "🏗️  Ibimina Android Build Script"
echo "================================"
echo ""

# Select app
echo "Select app to build:"
echo "1) Admin (Staff) App"
echo "2) Client (Member) App"
read -p "Enter choice [1-2]: " app_choice

if [ "$app_choice" = "1" ]; then
    APP_DIR="apps/admin"
    APP_NAME="Admin"
elif [ "$app_choice" = "2" ]; then
    APP_DIR="apps/client"
    APP_NAME="Client"
else
    echo "Invalid choice"
    exit 1
fi

# Select build type
echo ""
echo "Select build type:"
echo "1) Debug"
echo "2) Release"
read -p "Enter choice [1-2]: " build_choice

if [ "$build_choice" = "1" ]; then
    BUILD_TYPE="assembleDebug"
    BUILD_NAME="debug"
elif [ "$build_choice" = "2" ]; then
    BUILD_TYPE="assembleRelease"
    BUILD_NAME="release"
else
    echo "Invalid choice"
    exit 1
fi

# Optional: Set production URL
if [ "$build_choice" = "2" ]; then
    read -p "Enter production server URL (or press Enter to skip): " SERVER_URL
    if [ ! -z "$SERVER_URL" ]; then
        export CAPACITOR_SERVER_URL=$SERVER_URL
        echo "✓ Server URL set to: $SERVER_URL"
    fi
fi

echo ""
echo "🔨 Building $APP_NAME ($BUILD_NAME)..."
echo ""

# Step 1: Install dependencies
echo "1/5: Installing dependencies..."
pnpm install

# Step 2: Build shared packages
echo "2/5: Building shared packages..."
pnpm --filter @ibimina/core run build
pnpm --filter @ibimina/config run build
pnpm --filter @ibimina/ui run build

# Step 3: Build Next.js app
echo "3/5: Building Next.js app..."
cd $APP_DIR
pnpm run build

# Step 4: Sync Capacitor
echo "4/5: Syncing Capacitor..."
npx cap sync android

# Step 5: Build Android APK
echo "5/5: Building Android APK..."
cd android
./gradlew clean $BUILD_TYPE

# Locate APK
APK_PATH="app/build/outputs/apk/$BUILD_NAME/"
echo ""
echo "✅ Build complete!"
echo ""
echo "📱 APK Location:"
ls -lh $APK_PATH*.apk
echo ""
echo "To install on device:"
echo "  adb install -r $APK_PATH*.apk"
echo ""
```

Make executable:

```bash
chmod +x build-android.sh
```

Run:

```bash
./build-android.sh
```

---

## 🧪 Testing on Emulator

### Start Android Emulator

```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_7_API_34

# Or use Android Studio:
# Tools > Device Manager > Create Device
```

### Install and Run

```bash
# Install APK
adb install -r app-debug.apk

# Launch app
adb shell am start -n rw.ibimina.staff/.MainActivity

# View logs
adb logcat | grep Capacitor
```

---

## 🐛 Troubleshooting

### Build Fails: "SDK location not found"

**Fix**: Set `ANDROID_HOME`

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
```

### Build Fails: "Could not resolve dependencies"

**Fix**: Sync Gradle files

```bash
cd android
./gradlew --refresh-dependencies
./gradlew clean build
```

### Build Fails: "Failed to sync Capacitor"

**Fix**: Clear cache and re-sync

```bash
rm -rf android
npx cap add android
npx cap sync android
```

### App Crashes on Launch

**Check logs**:

```bash
adb logcat *:E

# Or filtered:
adb logcat | grep -E "(ERROR|AndroidRuntime)"
```

### Web View Shows Blank Screen

**Fix**: Check server URL in Capacitor config

```typescript
// apps/admin/capacitor.config.ts
server: {
  url: process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:5000',
  // 10.0.2.2 = localhost from Android emulator
}
```

### Gradle Version Issues

**Fix**: Use project wrapper

```bash
cd android
chmod +x gradlew
./gradlew --version
```

---

## 📱 Device-Specific Builds

### Build for Specific ABI

```bash
# ARM64 only (most modern devices)
./gradlew assembleDebug -PbuildArm64=true

# ARMv7 (older devices)
./gradlew assembleDebug -PbuildArmv7=true

# x86_64 (emulators)
./gradlew assembleDebug -PbuildX86_64=true

# All ABIs (larger file)
./gradlew assembleDebug
```

---

## 🚀 Play Store Deployment

### Step 1: Build Signed APK

```bash
./gradlew bundleRelease
# Generates: app/build/outputs/bundle/release/app-release.aab
```

### Step 2: Prepare Store Listing

**Required**:

- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (at least 2)
- Privacy policy URL
- App description

### Step 3: Upload to Play Console

1. Go to https://play.google.com/console
2. Create app
3. Upload AAB file
4. Fill in store listing
5. Submit for review

**Timeline**: 1-7 days for review

---

## 📊 Build Size Optimization

### Enable ProGuard (Release Builds)

```gradle
// android/app/build.gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
    }
}
```

### Split APKs by ABI

```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
            universalApk false
        }
    }
}
```

---

## ✅ Build Checklist

### Before Building:

- [ ] Java 17 installed
- [ ] Android SDK installed
- [ ] Licenses accepted
- [ ] Dependencies installed (`pnpm install`)
- [ ] Shared packages built
- [ ] Environment variables set (if production)

### Build Process:

- [ ] Next.js build completed
- [ ] Capacitor sync successful
- [ ] Gradle build successful
- [ ] APK generated and located
- [ ] APK size reasonable (<50MB)

### Testing:

- [ ] Install on emulator
- [ ] Test core functionality
- [ ] Check offline mode
- [ ] Test camera/permissions
- [ ] Verify push notifications
- [ ] Test biometric auth

### Production Release:

- [ ] Keystore created and secured
- [ ] APK signed
- [ ] Version number incremented
- [ ] ProGuard enabled
- [ ] Tested on real devices
- [ ] Store listing prepared

---

## 🎯 Quick Commands Reference

```bash
# Build debug APK
cd apps/admin && pnpm run android:build:debug

# Build release APK
cd apps/admin && pnpm run android:build:release

# Install on device
cd apps/admin && pnpm run android:install

# Open in Android Studio
cd apps/admin && npx cap open android

# Run on Android
cd apps/admin && npx cap run android

# Sync after web changes
cd apps/admin && npx cap sync
```

---

**Last Updated**: October 31, 2025  
**Status**: Android configurations complete ✅  
**Build Environment**: Local machine required (Java, Android SDK)

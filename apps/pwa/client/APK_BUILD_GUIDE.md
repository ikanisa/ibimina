# Android APK Generation Guide

This guide explains how to build and generate Android APK files for the Ibimina
Client app.

## Overview

The Ibimina Client app is a Progressive Web App (PWA) built with Next.js. It has
been configured to work as an Android app using Capacitor, which wraps the web
app in a native Android container.

## Architecture

The Android app uses a **hosted PWA approach**:

- **Development**: The app connects to `localhost:3001` for development and
  testing
- **Production**: The app connects to the production server (e.g.,
  `https://client.ibimina.rw`)

This approach allows:

- ✅ All server-side features (API routes, SSR) remain functional
- ✅ Single codebase for web and mobile
- ✅ Deploy web updates without rebuilding the app
- ✅ Easy development and testing workflow

## Prerequisites

### Required Software

1. **Node.js** (v18.18.0 or later)

   ```bash
   node --version
   ```

2. **pnpm** (v10.19.0)

   ```bash
   npm install -g pnpm@10.19.0
   ```

3. **Java Development Kit (JDK)** (version 17)

   ```bash
   java -version
   ```

   Install JDK 17 if needed:
   - **Ubuntu/Debian**: `sudo apt-get install openjdk-17-jdk`
   - **macOS**: `brew install openjdk@17`
   - **Windows**: Download from
     [Oracle](https://www.oracle.com/java/technologies/downloads/#java17) or
     [Adoptium](https://adoptium.net/)

4. **Android Studio** (optional but recommended for easier development)
   - Download from: https://developer.android.com/studio
   - During installation, make sure to install:
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device (for testing)

5. **Android SDK Command Line Tools** (if not using Android Studio)
   - Download from: https://developer.android.com/studio#command-tools

### Environment Variables

Set the following environment variables:

```bash
# Linux/macOS
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Windows (PowerShell)
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools"
```

## Setup

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Verify Capacitor Configuration

The `capacitor.config.ts` file is already configured. For production builds, you
can set the server URL:

```bash
export CAPACITOR_SERVER_URL=https://client.ibimina.rw
```

## Development Workflow

### Testing with Development Server

1. Start the Next.js development server:

   ```bash
   pnpm --filter @ibimina/client dev
   ```

2. Open Android Studio and run the app:

   ```bash
   pnpm --filter @ibimina/client cap:open:android
   ```

3. In Android Studio, click "Run" or use an emulator to test the app.

The app will connect to `http://localhost:3001` and support hot reloading.

### Testing on Physical Device

1. Enable USB Debugging on your Android device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings > Developer Options
   - Enable "USB Debugging"

2. Connect your device via USB

3. Run the app:
   ```bash
   pnpm --filter @ibimina/client cap:run:android
   ```

## Building APK

### Debug APK (for testing)

Build a debug APK that can be installed on any device for testing:

```bash
cd apps/client
pnpm android:build:debug
```

The APK will be generated at:

```
apps/client/android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (for production)

#### 1. Create a Signing Key

First time only - generate a keystore for signing your app:

```bash
cd apps/client/android/app
keytool -genkey -v -keystore ibimina-client-release.keystore -alias ibimina-client -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:

- Keystore password (remember this!)
- Key password (remember this!)
- Your name, organization, etc.

**⚠️ Important**: Keep your keystore file secure! Store it safely and never
commit it to git.

#### 2. Configure Signing

Create/edit `apps/client/android/key.properties`:

```properties
storePassword=your-keystore-password
keyPassword=your-key-password
keyAlias=ibimina-client
storeFile=ibimina-client-release.keystore
```

**⚠️ Important**: This file is gitignored. Never commit it!

#### 3. Update build.gradle (First time only)

Edit `apps/client/android/app/build.gradle` to add signing configuration:

```gradle
android {
    ...

    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("key.properties")
            def keystoreProperties = new Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
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

#### 4. Build Release APK

For production deployment with a specific server URL:

```bash
cd apps/client
CAPACITOR_SERVER_URL=https://client.ibimina.rw pnpm cap:sync
pnpm android:build:release
```

The signed APK will be at:

```
apps/client/android/app/build/outputs/apk/release/app-release.apk
```

## App Configuration

### Update App Details

Edit `apps/client/capacitor.config.ts` to customize:

```typescript
{
  appId: 'rw.gov.ikanisa.ibimina.client',  // Package name
  appName: 'Ibimina Client',                // App display name
  // ...
}
```

### Update App Icon

Replace icons in `apps/client/android/app/src/main/res/`:

- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

### Update Splash Screen

Edit splash screen in `apps/client/android/app/src/main/res/values/styles.xml`
or use Android Studio's Resource Manager.

## Deployment

### Install APK on Device

#### Via USB (ADB)

```bash
cd apps/client
pnpm android:install
```

#### Via File Transfer

1. Transfer the APK to your device
2. Enable "Install from Unknown Sources" in device settings
3. Open the APK file on your device to install

### Publish to Google Play Store

1. **Prepare Assets**:
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (at least 2)
   - Privacy policy URL
   - App description

2. **Create Google Play Developer Account** ($25 one-time fee)

3. **Create App in Play Console**:
   - Go to https://play.google.com/console
   - Click "Create App"
   - Fill in app details

4. **Upload APK or AAB**:
   - Build an Android App Bundle (recommended):
     ```bash
     cd apps/client/android
     ./gradlew bundleRelease
     ```
   - Upload to Play Console
   - Fill in required store listing information

5. **Submit for Review**

## Troubleshooting

### Gradle Build Fails

```bash
cd apps/client/android
./gradlew clean
./gradlew build --info
```

### JDK Version Issues

Make sure you're using JDK 17:

```bash
export JAVA_HOME=/path/to/jdk-17
```

### Android SDK Not Found

Set ANDROID_HOME correctly:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
```

### Capacitor Sync Issues

**Error: "ENOENT: no such file or directory, open
'android/app/src/main/assets/capacitor.config.json'"**

This error occurs if the `assets` directory doesn't exist. The directory should
be tracked in git via `.gitkeep`. If you encounter this error:

```bash
cd apps/client
mkdir -p android/app/src/main/assets
touch android/app/src/main/assets/.gitkeep
CAPACITOR_SERVER_URL=https://client.ibimina.rw pnpm cap:sync
```

**Force a clean sync:**

```bash
cd apps/client
rm -rf android/app/src/main/assets/public
pnpm cap:sync
```

### App Crashes on Launch

1. Check Android Logcat:

   ```bash
   adb logcat | grep Ibimina
   ```

2. Verify server URL is accessible from the device

3. Check SSL certificate if using HTTPS

## Production Checklist

Before releasing to production:

- [ ] Update `capacitor.config.ts` with production server URL
- [ ] Test on multiple Android devices/versions
- [ ] Verify all features work (auth, API calls, offline mode)
- [ ] Check app permissions in AndroidManifest.xml
- [ ] Review and update app icon and splash screen
- [ ] Test with production backend
- [ ] Create signed release APK
- [ ] Test release APK on devices
- [ ] Prepare Play Store listing assets
- [ ] Update version number in `android/app/build.gradle`
- [ ] Create release notes
- [ ] Submit to Google Play Store

## Additional Resources

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## Support

For issues or questions:

- Check the [Capacitor GitHub](https://github.com/ionic-team/capacitor)
- Review [Next.js Documentation](https://nextjs.org/docs)
- Contact the Ibimina development team

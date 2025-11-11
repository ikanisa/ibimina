# 📱 Android App Testing Guide

## Quick Start - Test on Your Android Device

Follow these steps to build and test the mobile authentication features on your Android phone.

---

## Prerequisites

Before you start, make sure you have:

- ✅ Android phone with USB debugging enabled
- ✅ USB cable to connect phone to computer
- ✅ Android Studio installed (or at least Android SDK)
- ✅ Node.js and pnpm installed
- ✅ Java JDK 17+ installed

---

## Step 1: Enable Developer Options on Your Android Phone

1. **Open Settings** on your Android phone
2. **Scroll to "About phone"**
3. **Tap "Build number" 7 times** (you'll see "You are now a developer!")
4. **Go back to Settings → System → Developer options**
5. **Enable "USB debugging"**
6. **Connect your phone to computer via USB**
7. **Allow USB debugging** when prompted on your phone

---

## Step 2: Verify Phone Connection

```bash
# Check if your phone is connected
adb devices

# You should see something like:
# List of devices attached
# ABC123XYZ    device
```

If you don't see your device:
- Make sure USB debugging is enabled
- Try a different USB cable
- On your phone, tap "Allow" when prompted about USB debugging
- Run `adb kill-server` then `adb devices` again

---

## Step 3: Set Up Environment Variables

Create a `.env` file in `apps/admin/` with your Supabase credentials:

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin

# Create .env file (if it doesn't exist)
cat > .env << 'ENVFILE'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BACKUP_PEPPER=$(openssl rand -hex 32)
MFA_SESSION_SECRET=$(openssl rand -hex 32)
TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
OPENAI_API_KEY=your-openai-key-or-placeholder
HMAC_SHARED_SECRET=$(openssl rand -hex 32)
KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)
APP_ENV=development
NODE_ENV=development
ENVFILE
```

**Important:** Replace `your-project.supabase.co` and the keys with your actual Supabase credentials.

---

## Step 4: Install Dependencies

```bash
cd /Users/jeanbosco/workspace/ibimina

# Install all dependencies
pnpm install

# Install html5-qrcode (for QR scanner)
cd apps/admin
pnpm add html5-qrcode
```

---

## Step 5: Build the App

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin

# Build the Next.js app
pnpm build

# This will take 3-5 minutes
# Wait for "✓ Compiled successfully"
```

---

## Step 6: Sync with Capacitor (Android)

```bash
# Still in apps/admin directory
npx cap sync android

# This will:
# - Copy web assets to Android project
# - Update Capacitor plugins
# - Sync native dependencies
```

---

## Step 7: Build the Android APK

### Option A: Using Gradle (Command Line) - RECOMMENDED

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin/android

# Build debug APK
./gradlew assembleDebug

# Wait for "BUILD SUCCESSFUL"
# APK will be at: app/build/outputs/apk/debug/app-debug.apk
```

### Option B: Using Android Studio (GUI)

```bash
# Open Android project in Android Studio
cd /Users/jeanbosco/workspace/ibimina/apps/admin
npx cap open android

# In Android Studio:
# 1. Wait for Gradle sync to complete
# 2. Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"
# 3. Wait for build to complete
# 4. Click "locate" in the notification to find the APK
```

---

## Step 8: Install APK on Your Phone

### Method 1: Direct Install via ADB (Easiest)

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin/android

# Install the APK
adb install -r app/build/outputs/apk/debug/app-debug.apk

# You should see "Success"
```

### Method 2: Copy APK to Phone

```bash
# Copy APK to phone's Download folder
adb push app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/

# Then on your phone:
# 1. Open "Files" or "Downloads" app
# 2. Find "app-debug.apk"
# 3. Tap to install
# 4. Allow "Install from unknown sources" if prompted
```

---

## Step 9: Apply Test Account to Database

Before testing login, you need to create the test account in your Supabase database.

### Option A: Local Supabase

```bash
cd /Users/jeanbosco/workspace/ibimina
supabase db reset
```

### Option B: Remote Supabase (Cloud)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Open the file: `supabase/seed/test_mobile_auth_account.sql`
5. Copy the SQL content
6. Paste into SQL Editor
7. Click **Run**

You should see messages:
```
✓ Test account created successfully
✓ Email: info@ikanisa.com
✓ User ID: [some-uuid]
```

---

## Step 10: Launch and Test the App!

### Open the App

On your Android phone, find and tap the **Ibimina Staff** app icon.

### Test Flow

#### 1️⃣ First Login (Email/Password)

```
1. App opens to login screen
2. Enter:
   Email: info@ikanisa.com
   Password: MoMo!!0099
3. Tap "Sign In"
4. ✅ Should see dashboard or prompt to set up PIN
```

#### 2️⃣ Set Up PIN

```
1. After first login, you'll see: "Set up quick login?"
2. Tap "Set up 6-digit PIN"
3. Enter any 6 digits (e.g., 123456)
4. Re-enter the same 6 digits to confirm
5. ✅ PIN is saved!
```

#### 3️⃣ Test PIN Login

```
1. Close the app completely (swipe up from recent apps)
2. Reopen the app
3. You should see "Quick Login" screen with options:
   • Sign in with PIN
   • Sign in with Biometric
   • Sign in with Email
4. Tap "Sign in with PIN"
5. Enter your 6-digit PIN
6. ✅ Should login automatically and show dashboard
```

#### 4️⃣ Test Biometric (if your phone supports it)

```
1. Close and reopen app
2. On Quick Login screen, tap "Sign in with Biometric"
3. Place your finger on fingerprint sensor (or use face unlock)
4. ✅ Should login with biometric
```

#### 5️⃣ Test QR Scanner

```
1. Navigate to QR Scanner:
   - In app, go to menu → "Scan Login"
   - Or access via: /scan-login route
2. Tap "Start Camera"
3. Grant camera permission when prompted
4. ✅ Camera should open with QR scanning overlay
5. Point at QR code from web dashboard
6. ✅ Should authenticate and login to web
```

#### 6️⃣ Test SMS Consent

```
1. In app, go to Settings → SMS Consent
2. Read the privacy information
3. Tap "Enable SMS Ingestion"
4. Grant SMS permissions when prompted
5. ✅ SMS ingestion is now active
6. Send yourself a test MoMo SMS
7. ✅ App should capture it in background
```

---

## Troubleshooting

### Build Fails

**Error: "NEXT_PUBLIC_SUPABASE_URL is required"**
```bash
# Make sure .env file exists with all required variables
cat apps/admin/.env
```

**Error: "BUILD FAILED" during Gradle**
```bash
# Clean and rebuild
cd apps/admin/android
./gradlew clean
./gradlew assembleDebug
```

### Phone Not Detected

```bash
# Kill and restart ADB
adb kill-server
adb start-server
adb devices

# Make sure USB debugging is enabled on phone
# Try a different USB cable
```

### App Crashes on Launch

```bash
# Check logs
adb logcat | grep "ibimina"

# Common issues:
# - Missing environment variables
# - Supabase URL not reachable
# - Network permissions not granted
```

### Login Doesn't Work

1. **Check Supabase connection:**
   - Make sure your Supabase project is running
   - Verify NEXT_PUBLIC_SUPABASE_URL is correct
   - Check internet connection on phone

2. **Verify test account exists:**
   - Go to Supabase Dashboard → Authentication → Users
   - Look for info@ikanisa.com
   - If not found, run the seed script again

3. **Check app logs:**
   ```bash
   adb logcat | grep -i "auth\|login\|error"
   ```

### PIN Doesn't Save

- Make sure you entered the same PIN twice
- Check that app has storage permissions
- Try uninstalling and reinstalling the app

### QR Scanner Doesn't Open Camera

- Grant camera permission in Settings → Apps → Ibimina Staff → Permissions
- Restart the app after granting permission

---

## Quick Commands Reference

```bash
# Check connected devices
adb devices

# Build APK
cd apps/admin/android && ./gradlew assembleDebug

# Install APK
adb install -r app/build/outputs/apk/debug/app-debug.apk

# View logs (helpful for debugging)
adb logcat | grep "ibimina"

# Uninstall app
adb uninstall rw.ibimina.staff

# Clear app data (reset PIN, etc.)
adb shell pm clear rw.ibimina.staff
```

---

## Build for Release (Production)

When ready for production:

```bash
cd apps/admin/android

# Build signed release APK
./gradlew assembleRelease

# Or build AAB for Play Store
./gradlew bundleRelease

# Output:
# APK: app/build/outputs/apk/release/app-release.apk
# AAB: app/build/outputs/bundle/release/app-release.aab
```

**Note:** You'll need to set up signing keys first. See Android documentation for keystore setup.

---

## Summary

✅ **5 Minutes:** Set up environment and install dependencies  
✅ **3-5 Minutes:** Build Next.js app  
✅ **2 Minutes:** Build Android APK  
✅ **1 Minute:** Install on phone  
✅ **Total: ~10-15 minutes**

Then you can test:
- Email/Password login
- PIN authentication
- Biometric login
- QR scanner
- SMS ingestion

**Need help?** Check the logs:
```bash
adb logcat | grep -E "ibimina|auth|error"
```

---

🎉 **Happy Testing!**

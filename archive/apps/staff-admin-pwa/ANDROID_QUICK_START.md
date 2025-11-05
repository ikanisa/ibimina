# 📱 Quick Start - Android App

## 🎯 You Want: Android App from Staff Admin PWA

## ⚡ Super Quick (5 Minutes)

### 1. Install Android Studio
```bash
# macOS
brew install --cask android-studio

# Or download: https://developer.android.com/studio
```

### 2. Configure SDK
- Open Android Studio
- Install Android SDK 33
- Set `ANDROID_HOME` environment variable

### 3. Build and Run

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/staff-admin-pwa

# Install deps (if not done)
pnpm install

# Build web app
pnpm build

# Add Android (first time only)
pnpm cap add android

# Open in Android Studio
pnpm cap open android

# Click Run (green play button) → Done!
```

---

## 📚 Complete Guides

- **[ANDROID_COMPLETE.md](./ANDROID_COMPLETE.md)** - Quick summary + commands
- **[ANDROID_SETUP.md](./ANDROID_SETUP.md)** - Complete step-by-step guide (12KB)
- **[ANDROID_APP_OPTIONS.md](./ANDROID_APP_OPTIONS.md)** - Why we chose Capacitor

---

## 🎯 What You Get

✅ **Native Android APK**  
✅ **Same code as web PWA**  
✅ **Offline support**  
✅ **Google Play Store ready**  
✅ **All PWA features**  

**Package:** `rw.ibimina.staffadmin`  
**App Name:** Ibimina Staff Admin

---

## 💡 Quick Commands

```bash
# Build web → sync → run Android
pnpm build && pnpm cap sync && pnpm cap run android

# Open in Android Studio
pnpm cap open android

# Build debug APK
pnpm android:build

# View device logs
adb logcat | grep -i "Capacitor"
```

---

## 🚀 Ready!

Your Android app is **one command away**:

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/staff-admin-pwa
pnpm cap add android && pnpm cap open android
```

**That's it!** 🎉

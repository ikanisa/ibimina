# Android Quick Start Guide

Get up and running with the enhanced Capacitor Android app in 5 minutes.

## Prerequisites

- ✅ Android Studio (latest stable)
- ✅ JDK 17
- ✅ Node.js 20+
- ✅ pnpm 10+

## 5-Minute Setup

### 1. Clone and Install (2 min)

```bash
# Clone repository
git clone https://github.com/ikanisa/ibimina.git
cd ibimina

# Install dependencies
pnpm install

# Build shared packages
pnpm run build:packages
```

### 2. Build Admin App (2 min)

```bash
cd apps/admin

# Build Next.js app
pnpm run build

# Sync to Android
npx cap sync android
```

### 3. Open in Android Studio (1 min)

```bash
# Open project
npx cap open android

# Or manually
open -a "Android Studio" android/
```

### 4. Run on Device

In Android Studio:

1. Connect device or start emulator
2. Click ▶️ Run button
3. App launches on device

## Try New Features

### Enhanced Notifications

```typescript
import EnhancedNotifications from "@/lib/plugins/enhanced-notifications";

// Show notification
await EnhancedNotifications.showNotification({
  title: "Welcome!",
  body: "Capacitor enhancements are ready",
  channelId: "alerts",
});
```

### Network Monitoring

```typescript
import NetworkMonitor from "@/lib/plugins/network-monitor";

// Check status
const status = await NetworkMonitor.getStatus();
console.log(`Connected: ${status.connected}`);

// Monitor changes
await NetworkMonitor.startMonitoring();
NetworkMonitor.addListener("networkStatusChange", (status) => {
  console.log("Network changed:", status);
});
```

## Development Workflow

### Making Changes

1. **Edit web code** in `apps/admin/`
2. **Rebuild**: `pnpm run build` (if needed)
3. **Sync**: `npx cap sync android`
4. **Run**: Press ▶️ in Android Studio

### Live Reload (Development Mode)

```bash
# Terminal 1: Start Next.js dev server
cd apps/admin
pnpm run dev

# Terminal 2: Update Capacitor config to point to localhost
# Edit capacitor.config.ts - url: 'http://10.0.2.2:3100'

# Sync and run
npx cap sync android
npx cap open android
```

Changes to web code will hot-reload automatically!

## Testing

### Run All Tests

```bash
cd apps/admin/android
./gradlew test
```

### Specific Tests

```bash
# Unit tests only
./gradlew testDebugUnitTest

# Lint
./gradlew lintDebug

# Build debug APK
./gradlew assembleDebug
```

## Build Release APK

```bash
cd apps/admin/android

# Clean build
./gradlew clean

# Build release APK
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/
```

**Note**: Release signing requires keystore. See
[BUILD_ANDROID.md](../../BUILD_ANDROID.md#signing-release-apks) for setup.

## Debugging

### Chrome DevTools

1. Connect device via USB
2. Enable USB debugging on device
3. Open Chrome: `chrome://inspect/#devices`
4. Click "inspect" under your app
5. Use DevTools console/network/performance tabs

### Check Plugins

In Chrome DevTools console:

```javascript
// List all Capacitor plugins
console.log(Capacitor.Plugins);

// Test enhanced notifications
Capacitor.Plugins.EnhancedNotifications.checkPermissions().then((result) =>
  console.log("Notification permissions:", result)
);

// Test network monitor
Capacitor.Plugins.NetworkMonitor.getStatus().then((status) =>
  console.log("Network status:", status)
);
```

### ADB Logcat

```bash
# View all logs
adb logcat

# Filter by app
adb logcat | grep Capacitor

# Filter by plugin
adb logcat | grep EnhancedNotifications
```

## Common Issues

### ❌ Build fails with "SDK location not found"

**Fix**: Set ANDROID_HOME environment variable

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux

# Add to ~/.zshrc or ~/.bashrc
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
```

### ❌ "Plugin not found" error

**Fix**:

1. Check plugin is registered in `MainActivity.java`
2. Run `npx cap sync android` again
3. Clean and rebuild in Android Studio

### ❌ Web view shows blank screen

**Fix**: Check Capacitor server URL

```typescript
// capacitor.config.ts
server: {
  url: process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:3100',
  // 10.0.2.2 = localhost from Android emulator
}
```

### ❌ Hot reload not working

**Fix**:

1. Ensure dev server is running: `pnpm run dev`
2. Check device can reach dev server IP
3. Verify URL in capacitor.config.ts
4. Rebuild: `npx cap sync android`

## Next Steps

- 📖 Read [CAPACITOR_PLUGIN_GUIDE.md](CAPACITOR_PLUGIN_GUIDE.md) to create
  custom plugins
- 📖 Read [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md) for
  optimization tips
- 📖 See [README.md](README.md) for full feature documentation

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/docs)
- [BUILD_ANDROID.md](../../BUILD_ANDROID.md) - Original build guide

## Need Help?

1. Check
   [BUILD_ANDROID.md troubleshooting](../../BUILD_ANDROID.md#troubleshooting)
2. Check [GitHub Issues](https://github.com/ikanisa/ibimina/issues)
3. Review [CAPACITOR_PLUGIN_GUIDE.md](CAPACITOR_PLUGIN_GUIDE.md)

---

**Time to first build**: ~5 minutes ⚡  
**Hot reload**: ✅ Supported  
**Platform**: Android API 24+ (Android 7.0+)

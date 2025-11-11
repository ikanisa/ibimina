# Quick Start: Building Android APK

This is a quick reference guide for building the Ibimina Client Android app. For
detailed instructions, see [APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md).

## Prerequisites

- Node.js 18.18.0+
- pnpm 10.19.0
- JDK 17
- Android SDK (via Android Studio or command line tools)

## Quick Commands

### Development

```bash
# Start Next.js dev server
pnpm --filter @ibimina/client dev

# Open Android Studio to run the app
pnpm --filter @ibimina/client cap:open:android
```

### Build Debug APK

```bash
cd apps/client
pnpm android:build:debug
```

**Output**: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build Release APK

**First time**: Set up signing key (see
[APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md#1-create-a-signing-key))

```bash
cd apps/client

# For production server
CAPACITOR_SERVER_URL=https://client.ibimina.rw pnpm cap:sync

# Build release APK
pnpm android:build:release
```

**Output**: `android/app/build/outputs/apk/release/app-release.apk`

### Install on Device

```bash
cd apps/client
pnpm android:install
```

## Project Structure

```
apps/client/
├── android/                    # Android project (Capacitor-generated)
│   ├── app/
│   │   ├── build.gradle       # App build configuration
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/          # Native code (if any)
│   │       └── res/           # Android resources (icons, strings, etc.)
│   ├── build.gradle           # Project build configuration
│   └── gradlew                # Gradle wrapper
├── capacitor.config.ts         # Capacitor configuration
├── package.json               # NPM scripts for Android builds
└── APK_BUILD_GUIDE.md         # Detailed build guide
```

## Configuration

### Server URL

The app connects to a server URL. Configure it in `capacitor.config.ts`:

```typescript
server: {
  url: process.env.CAPACITOR_SERVER_URL || undefined,
}
```

- **Development**: Connects to `localhost:3001` (dev server)
- **Production**: Set `CAPACITOR_SERVER_URL=https://your-domain.com`

### App Details

Edit `capacitor.config.ts`:

```typescript
{
  appId: 'rw.gov.ikanisa.ibimina.client',
  appName: 'Ibimina Client',
}
```

## Troubleshooting

### Common Issues

1. **Gradle build fails**: Run `cd android && ./gradlew clean`
2. **JDK version error**: Ensure JDK 17 is installed and set as JAVA_HOME
3. **Android SDK not found**: Set ANDROID_HOME environment variable
4. **Capacitor sync errors**: Delete `android/app/src/main/assets/public` and
   run `pnpm cap:sync`

### Getting Help

See detailed troubleshooting in
[APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md#troubleshooting)

## Next Steps

1. Test the debug APK on a physical device
2. Set up signing key for release builds
3. Configure production server URL
4. Update app icon and splash screen
5. Prepare Google Play Store listing
6. Submit to Play Store

For complete instructions, see [APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md).

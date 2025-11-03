# UI/UX Audit Runbook

## Overview

This runbook provides step-by-step instructions for running the client PWA and
mobile app locally for UI/UX audit purposes.

**Target Applications:**

- **Client PWA**: `apps/client` - Next.js 15 Progressive Web App
- **Mobile App**: `apps/mobile` - Expo/React Native mobile application

**Repository**: [ikanisa/ibimina](https://github.com/ikanisa/ibimina)

## Prerequisites

### System Requirements

- **Node.js**: v20.x or higher (specified in `.nvmrc`)
- **pnpm**: 10.19.0 (package manager)
- **Git**: For cloning the repository

### For Mobile Development (Optional)

- **Expo CLI**: Installed via project dependencies
- **iOS Simulator**: Xcode on macOS
- **Android Emulator**: Android Studio on macOS/Linux/Windows
- **Physical Device**: iOS/Android phone with Expo Go app

### For PWA Android Build (Optional)

- **Android Studio**: For Capacitor native builds
- **Java JDK**: 11 or higher

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ikanisa/ibimina.git
cd ibimina
```

### 2. Install Node.js (if needed)

```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Verify version
node --version  # Should be 20.x
```

### 3. Install pnpm

```bash
npm install -g pnpm@10.19.0

# Verify installation
pnpm --version  # Should be 10.19.0
```

### 4. Install Dependencies

From the repository root:

```bash
pnpm install
```

**Note**: You may see peer dependency warnings. These are expected and do not
prevent the apps from running.

### 5. Set Up Environment Variables

#### Option A: Placeholder Values (For Build Testing)

Create a `.env` file in the repository root:

```bash
cat << 'EOF' > .env
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key
SUPABASE_URL=https://placeholder.supabase.co
BACKUP_PEPPER=$(openssl rand -hex 32)
MFA_SESSION_SECRET=$(openssl rand -hex 32)
TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
OPENAI_API_KEY=placeholder
HMAC_SHARED_SECRET=$(openssl rand -hex 32)
KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)
APP_ENV=development
NODE_ENV=development
EOF
```

**Note**: With placeholder values, the apps will build and run, but backend
functionality will not work. This is sufficient for UI/UX auditing.

#### Option B: Real Supabase Credentials (For Full Functionality)

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your actual Supabase credentials from your Supabase
   dashboard.

---

## Running the Client PWA (apps/client)

### Development Server

```bash
# From repository root
pnpm --filter @ibimina/client dev

# Or navigate to the client directory
cd apps/client
pnpm dev
```

**Access URL**: http://localhost:5000

**Features Available**:

- Bottom navigation (Home, Groups, Pay, Statements, Profile)
- All UI components and layouts
- Responsive design testing
- PWA installation prompt (on supported browsers)

### Production Build

```bash
# Build the PWA
pnpm --filter @ibimina/client build

# Start production server
pnpm --filter @ibimina/client start
```

**Access URL**: http://localhost:5000

### Type Checking and Linting

```bash
# Type check
pnpm --filter @ibimina/client typecheck

# Lint
pnpm --filter @ibimina/client lint
```

### Testing PWA Features

1. **Install as PWA**:
   - Chrome/Edge: Click install icon in address bar
   - Safari (iOS): Share → Add to Home Screen

2. **Test Offline Mode**:
   - Open DevTools → Application → Service Workers
   - Check "Offline" checkbox
   - Navigate to http://localhost:5000/offline

3. **Test Responsive Design**:
   - DevTools → Toggle device toolbar (Ctrl+Shift+M)
   - Test various screen sizes (mobile, tablet, desktop)

### Capacitor Android (Native Wrapper)

If you need to test the PWA in a native Android wrapper:

```bash
cd apps/client

# Sync web assets to Android
pnpm cap:sync:android

# Open in Android Studio
pnpm cap:open:android

# Or run directly on device/emulator
pnpm cap:run:android
```

---

## Running the Mobile App (apps/mobile)

### Development Server

```bash
# From repository root
pnpm --filter @ibimina/mobile start

# Or navigate to the mobile directory
cd apps/mobile
pnpm start
```

This starts the Expo dev server. You'll see a QR code and options:

- Press `i` → Open in iOS Simulator
- Press `a` → Open in Android Emulator
- Press `w` → Open in web browser (for quick testing)
- Scan QR code with Expo Go app (iOS/Android)

### Platform-Specific Launch

```bash
# iOS Simulator (macOS only)
pnpm --filter @ibimina/mobile ios

# Android Emulator
pnpm --filter @ibimina/mobile android

# Web browser (for quick preview)
pnpm --filter @ibimina/mobile web
```

### Type Checking and Linting

```bash
# Type check
pnpm --filter @ibimina/mobile typecheck

# Lint
pnpm --filter @ibimina/mobile lint
```

### Testing on Physical Device

1. **Install Expo Go**:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android:
     [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Connect to Dev Server**:
   - Ensure phone and computer are on same network
   - Scan QR code from terminal with Expo Go app

### Testing Specific Features

```bash
# Test with different locales
# Edit apps/mobile/src/providers/i18n.tsx to change default locale

# Test feature flags
# Edit apps/mobile/app/_layout.tsx to toggle flags

# Test dark mode
# Change device system settings
```

---

## Browser Testing Recommendations

### Desktop Browsers

- **Chrome/Edge**: Primary testing (90%+ of users)
- **Firefox**: Secondary testing
- **Safari**: MacOS testing

### Mobile Browsers

- **Chrome Mobile**: Android testing
- **Safari Mobile**: iOS testing
- **Samsung Internet**: Additional Android testing

### Screen Sizes to Test

**PWA (Responsive)**:

- Mobile: 375×667 (iPhone SE), 390×844 (iPhone 12/13)
- Tablet: 768×1024 (iPad), 820×1180 (iPad Air)
- Desktop: 1280×720, 1920×1080

**Mobile App**:

- iOS: iPhone SE (small), iPhone 14 Pro (standard), iPhone 14 Pro Max (large)
- Android: Pixel 5 (small), Pixel 6 (standard), Samsung S21 Ultra (large)

---

## Common Issues and Solutions

### Issue: `pnpm: command not found`

**Solution**: Install pnpm globally: `npm install -g pnpm@10.19.0`

### Issue: Build fails with "NEXT_PUBLIC_SUPABASE_URL is required"

**Solution**: Ensure `.env` file exists with the required variables (see step 5)

### Issue: Peer dependency warnings during install

**Solution**: These are expected. The apps will still work. Use `pnpm install`
without `--frozen-lockfile`.

### Issue: iOS Simulator won't open

**Solution**:

1. Ensure Xcode is installed
2. Open Xcode → Preferences → Locations → Command Line Tools is set
3. Run: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

### Issue: Android Emulator won't start

**Solution**:

1. Open Android Studio → AVD Manager
2. Create a new virtual device if none exist
3. Ensure emulator is running before running `pnpm android`

### Issue: Expo Go shows connection error

**Solution**:

1. Ensure phone and computer are on same WiFi network
2. Try toggling "Tunnel" mode in Expo CLI (press `s` → `t`)
3. Check firewall isn't blocking connections

---

## Accessibility Testing Tools

### Browser Extensions

- **axe DevTools**: Chrome/Firefox extension for automated a11y checks
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools (Audit tab)

### Screen Readers

- **VoiceOver**: macOS/iOS (Cmd+F5 to toggle)
- **TalkBack**: Android (Settings → Accessibility)
- **NVDA**: Windows (free download)

### Testing Commands

```bash
# Run Lighthouse on PWA
pnpm --filter @ibimina/client build
# Open http://localhost:5000 in Chrome
# DevTools → Lighthouse → Generate report

# Run accessibility tests (if configured)
pnpm --filter @ibimina/client test:a11y
```

---

## Performance Testing

### Lighthouse (PWA)

1. Build production version: `pnpm --filter @ibimina/client build`
2. Start server: `pnpm --filter @ibimina/client start`
3. Open Chrome DevTools → Lighthouse
4. Run audit for Performance, Accessibility, Best Practices, SEO, PWA

### React Native Performance Monitor (Mobile)

- Shake device → Show Performance Monitor
- Or press `Ctrl+M` (Android) / `Cmd+D` (iOS) in simulator

---

## Quick Reference

| Task                 | Command                                   |
| -------------------- | ----------------------------------------- |
| Install dependencies | `pnpm install`                            |
| Run PWA dev server   | `pnpm --filter @ibimina/client dev`       |
| Run mobile app       | `pnpm --filter @ibimina/mobile start`     |
| Build PWA            | `pnpm --filter @ibimina/client build`     |
| Type check PWA       | `pnpm --filter @ibimina/client typecheck` |
| Type check mobile    | `pnpm --filter @ibimina/mobile typecheck` |
| Lint PWA             | `pnpm --filter @ibimina/client lint`      |
| Lint mobile          | `pnpm --filter @ibimina/mobile lint`      |

---

## Next Steps

After successfully running both apps:

1. **Explore the UI**: Navigate through all screens and features
2. **Review Components**: Inspect `apps/client/components` and
   `apps/mobile/src/components`
3. **Check Routing**: Review `apps/client/app` and `apps/mobile/app` directory
   structures
4. **Test Interactions**: Try all buttons, forms, navigation patterns
5. **Document Issues**: Note any UX problems, accessibility issues, or
   inconsistencies

Proceed to the next audit documents:

- [01-heuristic-accessibility.md](./01-heuristic-accessibility.md) - Usability
  and accessibility evaluation
- [02-ia-navigation.md](./02-ia-navigation.md) - Information architecture
  analysis

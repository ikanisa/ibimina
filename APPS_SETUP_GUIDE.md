# Ibimina Applications - Complete Setup Guide

**Last Updated**: October 31, 2025  
**Status**: ✅ All PWAs Running Successfully

---

## 🎯 Overview

Your Ibimina platform consists of **5 applications**:

1. **Admin PWA** (Staff Console) - Running ✅
2. **Client PWA** (Member Portal) - Running ✅
3. **Website** (Public Marketing) - Running ✅
4. **Admin Mobile App** (Android APK) - Configured ✅
5. **Client Mobile App** (Android APK) - Configured ✅

---

## 🚀 Running Applications (PWAs)

### Admin PWA - Staff Console

**Purpose**: Internal tool for SACCO staff to manage members, loans,
transactions  
**Status**: ✅ Running  
**Port**: 5000 (exposed via Replit webview)  
**Access**: Click the webview panel in Replit

**Features**:

- Member management
- Loan processing & approvals
- Transaction reconciliation
- Analytics dashboard
- MFA authentication
- Report generation
- SMS processing
- Mobile money integration

**Start Command**:

```bash
cd apps/admin && npx next dev -p 5000 -H 0.0.0.0
```

**Login**: Create user in Supabase Dashboard → Authentication → Users

---

### Client PWA - Member Portal

**Purpose**: Self-service portal for SACCO members  
**Status**: ✅ Running  
**Port**: 3000 (internal)  
**Access**: http://localhost:3100 (or via port forwarding)

**Features**:

- View account balance
- Transaction history
- Loan applications
- Payment requests
- WhatsApp OTP login
- Offline support
- Push notifications
- QR code payments

**Start Command**:

```bash
cd apps/client && npx next dev -p 3000 -H 0.0.0.0
```

---

### Website - Public Marketing

**Purpose**: Public-facing marketing and information website  
**Status**: ✅ Running  
**Port**: 3001 (internal)  
**Access**: http://localhost:3001

**Features**:

- Homepage with SACCO features
- About page
- Pricing information
- SACCO directory
- Contact form
- Multi-language support (EN, FR, RW)
- SEO optimized
- Static export ready

**Start Command**:

```bash
cd apps/website && npx next dev -p 3001 -H 0.0.0.0
```

---

## 📱 Mobile Applications (Android)

### Admin Mobile App (Android)

**App ID**: `rw.ibimina.staff`  
**App Name**: Ibimina Staff  
**Package**: `apps/admin/android/`  
**Web Dir**: `.next`

**Build Commands** (Run on your local machine with Android Studio):

```bash
# 1. Navigate to admin app
cd apps/admin

# 2. Build the Next.js app
npx next build

# 3. Sync assets to Android
npx cap sync android

# 4. Build debug APK
cd android && ./gradlew assembleDebug

# 5. Build release APK (for production)
cd android && ./gradlew assembleRelease

# Output location:
# Debug: apps/admin/android/app/build/outputs/apk/debug/app-debug.apk
# Release: apps/admin/android/app/build/outputs/apk/release/app-release.apk
```

**Features**:

- Full staff console on Android
- Biometric authentication
- NFC payment support (TapMoMo)
- Offline data sync
- Camera for document scanning
- Push notifications
- Background services

**Production Configuration**:

```bash
# Set production server URL before syncing
export CAPACITOR_SERVER_URL=https://staff.ibimina.rw
npx cap sync android
```

---

### Client Mobile App (Android)

**App ID**: `rw.gov.ikanisa.ibimina.client`  
**App Name**: Ibimina Client  
**Package**: `apps/client/android/`  
**Web Dir**: `out`

**Build Commands** (Run on your local machine):

```bash
# 1. Navigate to client app
cd apps/client

# 2. Build the Next.js app (static export)
npx next build

# 3. Sync assets to Android
npx cap sync android

# 4. Build debug APK
cd android && ./gradlew assembleDebug

# 5. Build release APK (for production)
cd android && ./gradlew assembleRelease

# Output location:
# Debug: apps/client/android/app/build/outputs/apk/debug/app-debug.apk
# Release: apps/client/android/app/build/outputs/apk/release/app-release.apk
```

**Features**:

- Member self-service portal
- WhatsApp OTP authentication
- Biometric login
- QR code scanning
- Mobile money payments
- Loan applications
- Transaction history
- Offline support
- Push notifications

**Production Configuration**:

```bash
# Set production server URL
export CAPACITOR_SERVER_URL=https://client.ibimina.rw
npx cap sync android
```

---

## 🛠️ Development Workflows

### All Apps Running Simultaneously

Replit workflows are configured to run all PWAs:

```bash
# Check status of all workflows
# (Use Replit's workflow panel)

# Admin PWA: Port 5000 (webview)
# Client PWA: Port 3000 (console)
# Website: Port 3001 (console)
```

**To access Client or Website externally**: You can temporarily change the port
to 5000 for testing, or use port forwarding.

---

## 📦 Build for Production

### Build All Applications

```bash
# From project root
pnpm run build

# This builds:
# - Admin PWA
# - Client PWA
# - Website
# - All shared packages
```

### Build Individual Apps

```bash
# Admin PWA
pnpm --filter @ibimina/admin run build

# Client PWA
pnpm --filter @ibimina/client run build

# Website
pnpm --filter @ibimina/website run build
```

---

## 🚀 Deployment Options

### Option 1: Replit Deployment (Autoscale)

**Best for**: Quick deployment, testing, small-scale production

1. Click **"Publish"** button in Replit
2. Configuration already set (autoscale deployment)
3. You get a public URL: `https://your-repl.repl.co`

**Deployment Config** (already configured):

```typescript
{
  deployment_target: "autoscale",
  run: ["node", "server.js"],
  build: ["pnpm", "build"]
}
```

---

### Option 2: Cloudflare Pages (Recommended for Production)

**Best for**: Production, high performance, global CDN

**Admin App**:

```bash
cd apps/admin
CLOUDFLARE_BUILD=1 npx @cloudflare/next-on-pages
wrangler pages deploy .vercel/output/static --project-name ibimina-admin
```

**Client App**:

```bash
cd apps/client
CLOUDFLARE_BUILD=1 npx @cloudflare/next-on-pages
wrangler pages deploy .vercel/output/static --project-name ibimina-client
```

**Website**:

```bash
cd apps/website
npx next build
wrangler pages deploy out --project-name ibimina-website
```

---

### Option 3: Vercel (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy admin app
cd apps/admin && vercel --prod

# Deploy client app
cd apps/client && vercel --prod

# Deploy website
cd apps/website && vercel --prod
```

---

## 🔧 Android Build Requirements

### Local Machine Setup (for Android builds)

**Required Software**:

1. **Android Studio** (Latest version)
   - Download: https://developer.android.com/studio
   - Install Android SDK
   - Accept SDK licenses

2. **Java JDK 11+**

   ```bash
   # macOS (with Homebrew)
   brew install openjdk@11

   # Ubuntu/Debian
   sudo apt install openjdk-11-jdk

   # Windows
   # Download from: https://adoptium.net/
   ```

3. **Gradle 8+** (Included in Android Studio)

4. **Node.js 18+** (Already have this)

5. **pnpm** (Already have this)

**Environment Variables**:

```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk  # Linux
# set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows

export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

**Verify Setup**:

```bash
java -version          # Should show Java 11+
android --version      # Should show Android SDK
./gradlew --version    # Should show Gradle 8+
```

---

## 🔐 PWA Features

All PWAs (Admin, Client) include:

### Service Workers

- Offline support
- Background sync
- Caching strategies
- Push notifications

### Web App Manifest

- Installable on devices
- Custom app icons
- Splash screens
- Standalone mode

### Progressive Enhancement

- Works offline
- Fast loading
- Responsive design
- Touch-optimized

**Check PWA Score**:

```bash
# Run Lighthouse audit
cd apps/admin
npm run lighthouse

# Or use Chrome DevTools:
# 1. Open app in Chrome
# 2. Press F12
# 3. Go to "Lighthouse" tab
# 4. Run audit
```

---

## 📊 Testing Applications

### Unit Tests

```bash
# Test admin app
pnpm --filter @ibimina/admin run test:unit

# Test client app
pnpm --filter @ibimina/client run test:unit
```

### E2E Tests

```bash
# Admin app E2E
cd apps/admin
pnpm run test:e2e

# Client app E2E
cd apps/client
pnpm run test:e2e

# E2E with UI (interactive)
pnpm run test:e2e:ui
```

### Database Tests

```bash
# Run Supabase tests (after migrations)
cd supabase
supabase test db
```

---

## 🌍 Multi-Language Support

All apps support:

- 🇬🇧 English (en)
- 🇫🇷 French (fr)
- 🇷🇼 Kinyarwanda (rw)

**Translation Files**: `packages/locales/`

**Usage in Apps**:

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('namespace');
  return <div>{t('key')}</div>;
}
```

---

## 🔍 Troubleshooting

### Admin App Won't Load

**Check**:

1. ✅ Workflow is running (check Replit panel)
2. ✅ Port 5000 is accessible
3. ✅ Supabase credentials are correct
4. ✅ Database migrations are run

**Fix**:

```bash
# Restart workflow
# Or manually:
cd apps/admin
npx next dev -p 5000 -H 0.0.0.0
```

---

### Client App Shows Blank Screen

**Check**:

1. ✅ Port 3000 is running
2. ✅ Environment variables set
3. ✅ Build completed successfully

**Fix**:

```bash
# Clear Next.js cache
cd apps/client
rm -rf .next
npx next dev -p 3000 -H 0.0.0.0
```

---

### Android Build Fails

**Common Issues**:

1. **Java version mismatch**

   ```bash
   java -version  # Must be 11+
   ```

2. **SDK licenses not accepted**

   ```bash
   sdkmanager --licenses
   ```

3. **Gradle build failure**

   ```bash
   cd apps/admin/android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

4. **Capacitor sync issues**
   ```bash
   cd apps/admin
   npx cap sync android --force
   ```

---

### Port Already in Use

**Error**: `Port 5000 already in use`

**Fix**:

```bash
# Find process using port
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)

# Or use different port
npx next dev -p 5001 -H 0.0.0.0
```

---

## 📈 Performance Optimization

### PWA Optimization

```bash
# Analyze bundle size
cd apps/admin
ANALYZE_BUNDLE=true pnpm build

# This generates a bundle analysis at:
# .next/analyze/client.html
```

### Image Optimization

All apps use Next.js Image component for automatic optimization:

- WebP format
- Lazy loading
- Responsive sizes
- Blur placeholder

### Caching Strategy

**Service Worker Caching**:

- API responses: Network-first
- Static assets: Cache-first
- Images: Stale-while-revalidate

---

## 🔐 Security Best Practices

### Before Production

1. ✅ Rotate all credentials (Supabase tokens, secrets)
2. ✅ Enable HTTPS only (no cleartext)
3. ✅ Configure CORS properly
4. ✅ Set up CSP headers
5. ✅ Enable rate limiting
6. ✅ Review RLS policies
7. ✅ Sign Android APKs with release keys
8. ✅ Minify and obfuscate code

### Android APK Signing (Release)

```bash
# 1. Generate keystore (one time)
keytool -genkey -v -keystore ibimina-release.keystore -alias ibimina -keyalg RSA -keysize 2048 -validity 10000

# 2. Configure in android/app/build.gradle:
# signingConfigs {
#     release {
#         storeFile file("../../ibimina-release.keystore")
#         storePassword "your-password"
#         keyAlias "ibimina"
#         keyPassword "your-password"
#     }
# }

# 3. Build signed APK
cd apps/client/android
./gradlew assembleRelease
```

---

## 📱 App Store Deployment

### Google Play Store (Android)

**Requirements**:

1. Google Play Developer account ($25 one-time fee)
2. Signed release APK
3. App icon (512x512px)
4. Screenshots (various sizes)
5. Privacy policy URL
6. App description

**Steps**:

1. Create app in Play Console
2. Upload signed APK
3. Fill in store listing
4. Set pricing (free)
5. Submit for review

**Timeline**: 1-3 days for review

---

## 🎯 Summary

### ✅ Currently Running

- Admin PWA on port 5000 (accessible via webview)
- Client PWA on port 5173 (internal)
- Website on port 3001 (internal)

### 📱 Android Apps

- Configured and ready to build
- Build on local machine with Android Studio
- Both apps have Capacitor configurations

### 🚀 Deployment Ready

- PWAs can be deployed to Replit, Cloudflare Pages, or Vercel
- Android APKs can be published to Google Play Store
- All apps are production-ready after database migrations

---

## 🆘 Need Help?

- **Documentation**: Check `docs/` folder for detailed guides
- **Logs**: Use Replit workflow panel to view app logs
- **Database**: Use Supabase Dashboard for database management
- **Errors**: Check `docs/TROUBLESHOOTING.md`

---

**Last Updated**: October 31, 2025  
**Status**: All PWAs Operational ✅  
**Next Steps**: Run database migrations, create admin user, test features

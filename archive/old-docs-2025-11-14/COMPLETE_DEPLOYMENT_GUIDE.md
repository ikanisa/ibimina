# 🚀 Complete System Deployment Guide

## Ibimina SACCO Management Platform

**Version:** 1.0.0  
**Last Updated:** 2025-11-03

---

## 📋 System Overview

This guide covers deployment of the complete Ibimina platform:

1. **Staff Admin PWA** - Web application for staff (Vite + React)
2. **Staff Admin Android** - Mobile SMS payment processor (React Native)
3. **Client Mobile App** - Customer mobile app (React Native, Android + iOS)
4. **Shared Packages** - 4 TypeScript packages for code reuse
5. **Backend** - Supabase with Edge Functions

---

## 🎯 Quick Start

```bash
# 1. Clone and navigate to repository
cd /Users/jeanbosco/workspace/ibimina

# 2. Install dependencies
pnpm install

# 3. Build shared packages
pnpm --filter @ibimina/types build
pnpm --filter @ibimina/api-client build
pnpm --filter @ibimina/sms-parser build

# 4. Set environment variables (see below)
cp .env.example .env
# Edit .env with your values

# 5. Run database migrations
cd supabase
supabase db push

# 6. Start applications
# Staff Admin PWA:
pnpm --filter @ibimina/staff-admin-pwa dev

# Staff Admin Android:
cd apps/staff-admin-android && pnpm android

# Client Mobile:
cd apps/client-mobile && pnpm android
```

---

## 📦 Part 1: Shared Packages

### Build Order (Important!)

Packages must be built in this order due to dependencies:

```bash
# 1. types (no dependencies)
cd packages/types
pnpm install
pnpm build

# 2. api-client (depends on types)
cd ../api-client
pnpm install
pnpm build

# 3. sms-parser (depends on types)
cd ../sms-parser
pnpm install
pnpm build

# 4. mobile-shared (depends on all above)
cd ../mobile-shared
pnpm install
pnpm build
```

**Or use the script:**

```bash
./scripts/implement-complete-system.sh
```

### Verify Packages

```bash
# Check types
cd packages/types && pnpm typecheck

# Test SMS parser
cd packages/sms-parser && pnpm test

# Check API client
cd packages/api-client && pnpm typecheck
```

---

## 🌐 Part 2: Staff Admin PWA Deployment

### Local Development

```bash
cd apps/staff-admin-pwa
pnpm install
pnpm dev
# Opens http://localhost:3100
```

### Production Build

```bash
cd apps/staff-admin-pwa
pnpm build
# Output: dist/
```

### Docker Deployment (HTTP)

```bash
cd apps/staff-admin-pwa
docker compose up --build
# Access: http://localhost:8080
```

### Docker Deployment (HTTPS with mkcert)

```bash
# 1. Install mkcert
brew install mkcert  # macOS
# or
apt install mkcert   # Linux

# 2. Generate certificates
cd apps/staff-admin-pwa/deploy/nginx
mkcert -install
mkcert admin.local localhost 127.0.0.1

# 3. Update docker-compose.yml to use SSL config
docker compose -f docker-compose.ssl.yml up --build
# Access: https://admin.local:8443
```

### Environment Variables

Create `apps/staff-admin-pwa/.env.production`:

```env
VITE_API_BASE_URL=https://api.ibimina.rw
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_ENABLE_MOCKS=false
VITE_APP_VERSION=1.0.0
```

---

## 📱 Part 3: Staff Admin Android (SMS Parser)

### Prerequisites

```bash
# Install Expo CLI
npm install -g expo-cli eas-cli

# Install Android Studio (for building APK)
# Download from: https://developer.android.com/studio
```

### Setup

```bash
cd apps/staff-admin-android

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
```

### Environment Variables

`apps/staff-admin-android/.env`:

```env
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # For payment allocation

# SMS Processing
SMS_POLLING_INTERVAL=300000        # 5 minutes
AUTO_APPROVE_THRESHOLD=50000       # 50,000 RWF
ENABLE_BACKGROUND_PROCESSING=true

# Notification
ENABLE_PUSH_NOTIFICATIONS=true
ONESIGNAL_APP_ID=your-onesignal-id  # Optional
```

### Development

```bash
cd apps/staff-admin-android

# Start Metro bundler
pnpm start

# Run on Android device (USB debugging enabled)
pnpm android

# Run on Android emulator
pnpm android --device "Pixel_5_API_31"
```

### Build APK

```bash
cd apps/staff-admin-android

# Build with EAS
eas build --platform android --profile production

# Or build locally
pnpm android --mode=release

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### Deploy to Device

```bash
# Install via ADB
adb install android/app/build/outputs/apk/release/app-release.apk

# Or download from EAS build and install manually
```

---

## 📱 Part 4: Client Mobile App (Android + iOS)

### Setup

```bash
cd apps/client-mobile
pnpm install
```

### Environment Variables

`apps/client-mobile/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
API_BASE_URL=https://api.ibimina.rw
ENVIRONMENT=production
ENABLE_BIOMETRICS=true
ONESIGNAL_APP_ID=your-onesignal-id
```

### Development

```bash
# Android
pnpm android

# iOS (macOS only)
pnpm ios
```

### Build for Production

#### Android

```bash
# Build APK
eas build --platform android --profile production

# Build AAB for Play Store
eas build --platform android --profile production --type app-bundle
```

#### iOS

```bash
# Build for App Store
eas build --platform ios --profile production

# Build for TestFlight
eas build --platform ios --profile preview
```

### App Store Submission

See detailed guides:

- Android: `/docs/ANDROID_DEPLOYMENT.md`
- iOS: `/docs/IOS_DEPLOYMENT.md`

---

## 🗄️ Part 5: Database Setup

### Supabase Configuration

```bash
cd supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push

# Apply RLS policies
supabase db reset  # Resets and applies all migrations + seed data
```

### Create SMS Payment Tables

```bash
cd supabase
supabase migration new add_sms_payments

# Copy SQL from docs/SMS_PAYMENT_INTEGRATION.md
# Then apply:
supabase db push
```

### Verify Tables

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('payments', 'unmatched_payments', 'sms_parsing_logs');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%payment%';
```

---

## 🔐 Part 6: Environment Variables Reference

### Required Secrets

| Variable                    | Description               | Where to Get                         |
| --------------------------- | ------------------------- | ------------------------------------ |
| `OPENAI_API_KEY`            | OpenAI API key            | https://platform.openai.com/api-keys |
| `SUPABASE_URL`              | Supabase project URL      | Supabase Dashboard → Settings → API  |
| `SUPABASE_ANON_KEY`         | Supabase anon/public key  | Supabase Dashboard → Settings → API  |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API  |

### Optional Secrets

| Variable           | Description        | Where to Get                     |
| ------------------ | ------------------ | -------------------------------- |
| `ONESIGNAL_APP_ID` | Push notifications | https://onesignal.com/           |
| `SENTRY_DSN`       | Error tracking     | https://sentry.io/               |
| `ANALYTICS_ID`     | Analytics          | Google Analytics, Mixpanel, etc. |

### Setting Secrets in GitHub Actions

```bash
# Go to GitHub repo → Settings → Secrets and variables → Actions
# Add these secrets:

OPENAI_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_REF
SUPABASE_ACCESS_TOKEN
```

---

## 🔄 Part 7: CI/CD Setup

### GitHub Actions Workflows

The repository includes these workflows:

1. **`ci.yml`** - Main CI pipeline (lint, test, build)
2. **`deploy-staff-admin-pwa.yml`** - Deploy PWA to hosting
3. **`build-android-apps.yml`** - Build Android APKs
4. **`supabase-deploy.yml`** - Deploy database migrations

### Trigger Deployment

```bash
# Tag a release
git tag v1.0.0
git push origin v1.0.0

# This triggers:
# - Build all apps
# - Run all tests
# - Create release artifacts
# - Deploy to production (if configured)
```

### Manual Deployment

```bash
# Staff Admin PWA to Cloudflare Pages
cd apps/staff-admin-pwa
pnpm build
npx wrangler pages deploy dist --project-name=ibimina-staff-admin

# Android APK via EAS
cd apps/staff-admin-android
eas build --platform android --profile production --non-interactive

# Client Mobile
cd apps/client-mobile
eas build --platform all --profile production --non-interactive
```

---

## 🧪 Part 8: Testing

### Run All Tests

```bash
# From repository root
pnpm test

# This runs:
# - Unit tests for all packages
# - Integration tests
# - E2E tests (Playwright for PWA)
```

### Test Individual Apps

```bash
# Staff Admin PWA
cd apps/staff-admin-pwa
pnpm test
pnpm test:e2e

# SMS Parser
cd packages/sms-parser
pnpm test

# API Client
cd packages/api-client
pnpm test
```

### Manual Testing Checklist

#### Staff Admin PWA

- [ ] Login/logout works
- [ ] Dashboard loads
- [ ] Users CRUD operations
- [ ] Offline mode works
- [ ] Service worker registers
- [ ] PWA installable

#### Staff Admin Android

- [ ] SMS permission granted
- [ ] Reads mobile money SMS
- [ ] Parses with OpenAI
- [ ] Allocates to correct user
- [ ] Shows notifications
- [ ] Background processing works

#### Client Mobile

- [ ] Login with biometrics
- [ ] View account balance
- [ ] View transaction history
- [ ] Initiate payment
- [ ] Receive notifications
- [ ] Works offline

---

## 🐛 Part 9: Troubleshooting

### Common Issues

#### 1. "Cannot find module '@ibimina/types'"

**Solution:**

```bash
# Build packages in correct order
cd packages/types && pnpm build
cd ../api-client && pnpm build
cd ../sms-parser && pnpm build
```

#### 2. "Supabase connection failed"

**Solution:**

- Check `SUPABASE_URL` in `.env`
- Verify `SUPABASE_ANON_KEY` is correct
- Ensure Supabase project is active
- Check network/firewall settings

#### 3. "OpenAI API key invalid"

**Solution:**

- Verify key starts with `sk-proj-` or `sk-`
- Check billing is enabled on OpenAI account
- Ensure key hasn't expired
- Test with curl:
  ```bash
  curl https://api.openai.com/v1/models \
    -H "Authorization: Bearer $OPENAI_API_KEY"
  ```

#### 4. "Android build fails"

**Solution:**

```bash
# Clean build
cd apps/staff-admin-android/android
./gradlew clean
cd ..
pnpm android

# Or try:
watchman watch-del-all
rm -rf node_modules
pnpm install
pnpm android
```

#### 5. "iOS build fails" (macOS only)

**Solution:**

```bash
cd apps/client-mobile/ios
pod install
cd ..
pnpm ios

# Or:
npx pod-install
pnpm ios
```

---

## 📊 Part 10: Monitoring & Observability

### Application Monitoring

#### Metrics to Track

1. **Staff Admin PWA**
   - Page load time
   - API response times
   - Error rates
   - User sessions
   - PWA install rate

2. **Staff Admin Android**
   - SMS processing rate
   - Parsing accuracy
   - Payment allocation success
   - OpenAI API latency
   - Battery usage

3. **Client Mobile**
   - App crashes
   - Screen transitions
   - API errors
   - Push notification delivery
   - Offline queue size

### Logging Setup

#### Supabase Logs

```bash
# View Edge Function logs
supabase functions logs process-sms-payment

# View database logs
supabase db logs
```

#### Application Logs

```bash
# PWA (browser console)
# Check service worker logs:
chrome://serviceworker-internals

# Android (Logcat)
adb logcat | grep Ibimina

# iOS (Console.app on Mac)
# Filter by process: client-mobile
```

### Alerts Configuration

Set up alerts for:

- ❗ SMS parsing success rate < 90%
- ❗ API error rate > 5%
- ❗ Unmatched payments > 50
- ❗ App crashes > 10/day
- ❗ Database CPU > 80%
- ❗ Supabase storage > 80%

---

## 🔒 Part 11: Security Checklist

### Before Production

- [ ] All secrets in environment variables (not hardcoded)
- [ ] HTTPS enabled for all APIs
- [ ] Supabase RLS policies applied and tested
- [ ] API rate limiting configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF protection for forms
- [ ] Content Security Policy (CSP) configured
- [ ] Sensitive data encrypted at rest
- [ ] Regular security audits scheduled
- [ ] Dependency vulnerability scanning enabled
- [ ] Biometric authentication tested (mobile)
- [ ] Session timeout configured
- [ ] Failed login attempt limiting

### Supabase Security

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Should show rowsecurity = true for sensitive tables

-- Test RLS policies
SET LOCAL ROLE authenticated;
SELECT * FROM payments;  -- Should only see own records

SET LOCAL ROLE anon;
SELECT * FROM payments;  -- Should see nothing or error
```

---

## 📈 Part 12: Performance Optimization

### Staff Admin PWA

```bash
# Analyze bundle size
cd apps/staff-admin-pwa
ANALYZE_BUNDLE=1 pnpm build

# Run Lighthouse
pnpm preview &
npx lighthouse http://localhost:4173 --view

# Target scores:
# - Performance: >90
# - Accessibility: >90
# - Best Practices: >90
# - SEO: >80
# - PWA: 100
```

### Mobile Apps

```bash
# Android build size
cd apps/staff-admin-android
eas build --platform android --profile production
# Target: < 50 MB APK

# Enable Hermes (faster JS execution)
# Already enabled in default React Native config

# Profiling
npx react-native start --reset-cache
# Use React DevTools Profiler
```

---

## 📚 Part 13: Documentation

### User Documentation

- [ ] Staff Admin PWA user guide
- [ ] Staff Admin Android SMS setup guide
- [ ] Client mobile app user guide
- [ ] FAQ and troubleshooting

### Developer Documentation

- [x] This deployment guide
- [x] SMS Payment Integration guide
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Architecture decision records (ADRs)

### Generate API Docs

```bash
# Install TypeDoc
pnpm add -D typedoc

# Generate docs
npx typedoc --out docs/api packages/*/src/index.ts
```

---

## 🎓 Part 14: Training

### Staff Training Required

1. **Staff Admin PWA**
   - User management
   - Payment review and approval
   - Report generation
   - Settings configuration

2. **Staff Admin Android**
   - SMS permission setup
   - Manual payment matching
   - Reviewing unmatched payments
   - Handling edge cases

3. **Client Support**
   - Helping users install mobile app
   - Troubleshooting login issues
   - Explaining mobile money payments
   - Handling disputes

### Training Materials

Create these resources:

- [ ] Video tutorials
- [ ] Step-by-step guides with screenshots
- [ ] FAQ document
- [ ] Quick reference cards
- [ ] Troubleshooting flowcharts

---

## 📞 Part 15: Support & Maintenance

### Maintenance Schedule

#### Daily

- Monitor error logs
- Check unmatched payment queue
- Review SMS parsing success rate

#### Weekly

- Review performance metrics
- Update SMS provider templates if needed
- Security log review
- Backup verification

#### Monthly

- Dependency updates
- Security patches
- Cost optimization review
- User feedback analysis

#### Quarterly

- Full security audit
- Performance benchmarking
- Architecture review
- Disaster recovery test

### Support Channels

- **Email:** support@ibimina.rw
- **GitHub Issues:** For bugs and feature requests
- **Slack/Teams:** Internal team communication
- **Phone:** For urgent issues

---

## ✅ Deployment Checklist

Use this checklist for each deployment:

### Pre-Deployment

- [ ] Code review completed
- [ ] All tests passing
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Secrets rotated if needed
- [ ] Backup completed
- [ ] Rollback plan documented

### Deployment

- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Deploy database migrations
- [ ] Deploy backend services
- [ ] Deploy frontend applications
- [ ] Verify health checks
- [ ] Monitor error rates
- [ ] Check performance metrics

### Post-Deployment

- [ ] Announce to users
- [ ] Monitor for 24 hours
- [ ] Review logs for errors
- [ ] Verify critical paths work
- [ ] Update documentation
- [ ] Tag release in Git
- [ ] Update changelog

---

## 🚀 Going Live

### Final Steps Before Production

1. **Domain Setup**

   ```bash
   # Point domain to your hosting
   # Example for Cloudflare Pages:
   # admin.ibimina.rw → Cloudflare Pages
   # api.ibimina.rw → Supabase Edge Functions
   ```

2. **SSL Certificates**

   ```bash
   # Ensure HTTPS is enabled
   # Use Let's Encrypt or Cloudflare
   ```

3. **Email Configuration**

   ```bash
   # Configure Supabase Auth emails
   # Set custom SMTP if needed
   ```

4. **Push Notifications**

   ```bash
   # Configure OneSignal or FCM
   # Test notifications on devices
   ```

5. **Analytics**

   ```bash
   # Set up Google Analytics or Mixpanel
   # Configure conversion tracking
   ```

6. **Monitoring**
   ```bash
   # Set up Sentry for error tracking
   # Configure uptime monitoring
   # Set up performance monitoring
   ```

---

## 📝 Summary

You've now deployed the complete Ibimina platform:

✅ **Staff Admin PWA** - Running at https://admin.ibimina.rw  
✅ **Staff Admin Android** - APK distributed to staff devices  
✅ **Client Mobile App** - Available on Play Store and App Store  
✅ **Shared Packages** - Built and working across all apps  
✅ **SMS Payment Integration** - Processing mobile money payments
automatically  
✅ **Database** - Supabase with RLS policies and migrations applied  
✅ **CI/CD** - Automated testing and deployment pipeline  
✅ **Monitoring** - Error tracking and performance monitoring  
✅ **Documentation** - Complete guides for users and developers

### Next Steps

1. Monitor application metrics
2. Gather user feedback
3. Plan feature roadmap
4. Optimize based on real usage data
5. Scale infrastructure as needed

---

**Questions?**  
Contact: support@ibimina.rw  
Documentation: https://docs.ibimina.rw  
GitHub: https://github.com/yourusername/ibimina

**Last Updated:** 2025-11-03  
**Version:** 1.0.0

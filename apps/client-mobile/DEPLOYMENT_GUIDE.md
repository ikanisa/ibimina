# Ibimina Client Mobile App - Production Deployment Guide

Complete guide to deploy the Ibimina Client Mobile App to production (Google Play Store & Apple App Store).

## Overview

**Estimated Time**: 4-6 weeks (including review)
- Week 1: Preparation & Setup (20 hours)
- Week 2: Beta Testing (20 hours)
- Week 3-4: App Store Submission & Review (varies)

## Prerequisites

### Development Environment
- [x] Node.js 18+ installed
- [x] React Native CLI configured
- [x] Android Studio (for Android)
- [x] Xcode 14+ (for iOS, macOS only)

### Accounts
- [ ] Google Play Console account ($25 one-time)
- [ ] Apple Developer Program account ($99/year)
- [ ] Firebase project configured
- [ ] Supabase project deployed

### Assets
- [ ] App icon (1024x1024 PNG)
- [ ] Splash screen assets
- [ ] Screenshots (various sizes)
- [ ] Feature graphic (Android)
- [ ] App Store privacy policy URL
- [ ] Terms of service URL

---

## Phase 1: Pre-Deployment Setup (20 hours)

### 1.1 Firebase Configuration (3 hours)

Follow [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) to:

1. Create Firebase project
2. Add Android app, download `google-services.json`
3. Add iOS app, download `GoogleService-Info.plist`
4. Configure APNs for iOS push notifications
5. Set up Supabase Edge Function for sending notifications
6. Test notifications end-to-end

**Verification**:
```bash
# Test FCM token retrieval
npm run android  # or ios
# Check console logs for "FCM Token: ..."
```

### 1.2 Environment Variables (1 hour)

Create production `.env` file:

```bash
# apps/client-mobile/.env.production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
WHATSAPP_API_TOKEN=your_production_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_id
```

**Security**: Never commit `.env.production` to Git.

### 1.3 App Version Bump (30 min)

Update version in:

**1. package.json**
```json
{
  "version": "1.0.0"
}
```

**2. Android: android/app/build.gradle**
```gradle
defaultConfig {
    versionCode 1  // Increment for each release
    versionName "1.0.0"
}
```

**3. iOS: ios/IbiminaClient/Info.plist**
```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

### 1.4 App Icons & Splash (2 hours)

#### Android
Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/):

1. Upload 1024x1024 icon
2. Generate all sizes
3. Download and replace in `android/app/src/main/res/`

#### iOS
Use Xcode:

1. Open `ios/IbiminaClient.xcworkspace`
2. Assets.xcassets → AppIcon
3. Drag icon into all size slots
4. For splash: Add LaunchScreen.storyboard

Or use [react-native-bootsplash](https://github.com/zoontek/react-native-bootsplash).

### 1.5 Code Signing Setup (4 hours)

#### Android Keystore

Generate release keystore:

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore ibimina-release.keystore \
  -alias ibimina \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Enter secure passwords (SAVE THESE!)
# Keystore password: ********
# Key password: ********
```

**CRITICAL**: Back up keystore securely!

Create `android/gradle.properties` (DO NOT COMMIT):

```properties
IBIMINA_RELEASE_STORE_FILE=ibimina-release.keystore
IBIMINA_RELEASE_KEY_ALIAS=ibimina
IBIMINA_RELEASE_STORE_PASSWORD=your_keystore_password
IBIMINA_RELEASE_KEY_PASSWORD=your_key_password
```

Update `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('IBIMINA_RELEASE_STORE_FILE')) {
                storeFile file(IBIMINA_RELEASE_STORE_FILE)
                storePassword IBIMINA_RELEASE_STORE_PASSWORD
                keyAlias IBIMINA_RELEASE_KEY_ALIAS
                keyPassword IBIMINA_RELEASE_KEY_PASSWORD
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

#### iOS Certificates & Provisioning

1. Join Apple Developer Program ($99/year)
2. Create App ID:
   - Go to [Apple Developer](https://developer.apple.com/account/)
   - Identifiers → + (Add)
   - App IDs → App
   - Bundle ID: `com.ibimina.client`
   - Capabilities: Push Notifications, Associated Domains

3. Create Distribution Certificate:
   - Certificates → + (Add)
   - iOS Distribution (App Store and Ad Hoc)
   - Upload CSR from Keychain Access

4. Create Provisioning Profile:
   - Profiles → + (Add)
   - App Store
   - Select App ID
   - Select Distribution Certificate
   - Download and install

5. Configure Xcode:
   - Open project
   - Signing & Capabilities
   - Team: Select your team
   - Provisioning Profile: Select created profile

### 1.6 Build & Test Locally (10 hours)

#### Android Release Build

```bash
cd apps/client-mobile

# Clean previous builds
cd android
./gradlew clean
cd ..

# Build APK (for testing)
cd android
./gradlew assembleRelease
cd ..

# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk

# OR use script
./build-production.sh
# Choose option 1 (APK only)
```

**Test everything**:
- [ ] WhatsApp OTP authentication
- [ ] View accounts and transactions
- [ ] Apply for loan
- [ ] Make group contribution
- [ ] Receive push notifications
- [ ] Deep links work
- [ ] Offline browsing
- [ ] No crashes

#### iOS Release Build

```bash
cd ios
pod install
cd ..

# Open Xcode
open ios/IbiminaClient.xcworkspace

# In Xcode:
# 1. Select "Any iOS Device" target
# 2. Product → Archive
# 3. Wait for archive to complete
# 4. Distribute App → Development
# 5. Export and install on device via Xcode

# Test same checklist as Android
```

---

## Phase 2: App Store Setup (6 hours)

### 2.1 Google Play Console (3 hours)

#### Create App Listing

1. Go to [Google Play Console](https://play.google.com/console/)
2. Create Application
3. Fill details:

**App Details**:
- Name: `Ibimina - SACCO Banking`
- Short description (80 chars):
  > Digital banking for Rwanda's SACCO members. Save, borrow, grow together.
  
- Full description (4000 chars):
  > Ibimina brings modern banking to Rwanda's SACCO communities. Manage your savings, apply for loans, contribute to groups, and track transactions - all from your phone.
  >
  > **Features:**
  > • Instant account access with WhatsApp OTP
  > • View savings balances and transaction history
  > • Apply for loans in minutes
  > • Contribute to group savings (Ikimina)
  > • Secure mobile money payments
  > • Real-time push notifications
  > • Works offline
  >
  > **Why Ibimina?**
  > • Built for Rwandans, by Rwandans
  > • Supports local languages (Kinyarwanda, English, French)
  > • Integrates with MTN, Airtel mobile money
  > • Community-focused financial inclusion
  >
  > **Security:**
  > • Bank-level encryption
  > • WhatsApp OTP authentication
  > • Biometric login (coming soon)
  > • No passwords to remember
  >
  > Join thousands of SACCO members modernizing their financial lives.

- App icon: Upload 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots:
  - Phone: 2-8 screenshots (min 320px shortest side)
  - 7-inch tablet: Optional
  - 10-inch tablet: Optional

**Content Rating**:
- Complete questionnaire (Financial app, no ads, no user-generated content)
- Expected: Everyone

**Pricing & Distribution**:
- Free
- Countries: Rwanda (add more as needed)

**App Category**:
- Category: Finance
- Tags: Banking, SACCO, Savings, Loans

#### Store Listing Content

**Screenshots** (take from emulator/device):
1. Login screen (WhatsApp OTP)
2. Home dashboard with balance
3. Accounts overview
4. Loan application screen
5. Group contributions
6. Transaction history

**Promotional Video** (optional but recommended):
- 30-60 second demo
- Show key features
- Upload to YouTube, add link

### 2.2 Apple App Store Connect (3 hours)

#### Create App Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. My Apps → + (Add App)
3. Fill details:

**App Information**:
- Name: `Ibimina - SACCO Banking`
- Bundle ID: `com.ibimina.client`
- Primary Language: English
- SKU: `ibimina-client-ios`
- User Access: Full Access

**Pricing & Availability**:
- Price: Free
- Availability: Rwanda

**App Privacy**:
- Privacy Policy URL: `https://ibimina.rw/privacy` (create this!)
- User Privacy Choices URL: Optional

**App Category**:
- Primary: Finance
- Secondary: Productivity

**Version Information** (1.0.0):
- Screenshots: 6.5", 5.5", 12.9" iPad (required)
  - Use Xcode Simulator
  - Cmd+S to take screenshots
  - Upload to App Store Connect

- Description:
  > (Same as Google Play, max 4000 chars)

- Keywords (100 chars):
  > SACCO,savings,loans,banking,Rwanda,ikimina,mobile money,MTN,Airtel

- Support URL: `https://ibimina.rw/support`
- Marketing URL: `https://ibimina.rw` (optional)

**Build**:
- Will be added after upload via Xcode

**App Review Information**:
- First Name, Last Name, Phone, Email
- Sign-In Required: Yes
- Demo Account:
  - Username: `demo@ibimina.rw` or `+250788000000`
  - Password: Provide test OTP flow instructions
- Notes:
  > This app uses WhatsApp OTP for authentication. For review, use the provided test phone number: +250788000000. An OTP will be sent to this WhatsApp number. Please contact us if you need assistance.

---

## Phase 3: Build & Upload (4 hours)

### 3.1 Build Android AAB (1 hour)

```bash
cd apps/client-mobile

# Build AAB for Play Store
cd android
./gradlew bundleRelease
cd ..

# AAB location:
# android/app/build/outputs/bundle/release/app-release.aab
```

**Verify AAB**:
```bash
bundletool build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=ibimina-test.apks \
  --mode=universal

bundletool install-apks --apks=ibimina-test.apks
```

### 3.2 Upload to Play Console (1 hour)

1. Google Play Console → Your App
2. Production → Create new release
3. Upload AAB (`app-release.aab`)
4. Release notes:
   ```
   Initial release of Ibimina SACCO Banking app.
   
   Features:
   • WhatsApp OTP authentication
   • View account balances
   • Transaction history
   • Apply for loans
   • Group contributions
   • Push notifications
   • Offline support
   ```
5. Review release
6. Start rollout to Production (or Internal Testing first)

### 3.3 Build iOS Archive (1 hour)

```bash
cd ios
pod install
cd ..

open ios/IbiminaClient.xcworkspace

# In Xcode:
# 1. Select "Any iOS Device"
# 2. Product → Archive
# 3. Wait... (5-10 min)
# 4. Organizer window opens
```

### 3.4 Upload to App Store Connect (1 hour)

In Xcode Organizer:

1. Select latest archive
2. Distribute App
3. App Store Connect
4. Upload
5. Next → Next → Upload
6. Wait for processing (10-30 min)

Once processed:

1. Go to App Store Connect
2. Your App → 1.0.0
3. Build → Select uploaded build
4. Submit for Review

---

## Phase 4: Beta Testing (40 hours over 2 weeks)

### 4.1 Internal Testing (1 week)

#### Google Play Internal Testing

1. Play Console → Testing → Internal testing
2. Create release with same AAB
3. Add internal testers (email addresses)
4. Testers receive email with link

#### TestFlight (iOS)

1. App Store Connect → TestFlight
2. Internal Testing
3. Add internal testers
4. Testers install TestFlight app, receive invitation

### 4.2 External Testing (1 week)

#### Google Play Open Testing

1. Play Console → Testing → Open testing
2. Promote internal release
3. Anyone with link can test
4. Share link: `https://play.google.com/apps/testing/com.ibimina.client`

#### TestFlight External Testing

1. App Store Connect → TestFlight → External Testing
2. Add external testers (emails or public link)
3. Submit for Beta App Review (1-2 days)
4. Once approved, testers can download

### 4.3 Collect Feedback

Create feedback form (Google Forms / Typeform):

**Questions**:
1. What device are you using?
2. Rate overall experience (1-5)
3. Which features did you use?
4. Did you encounter any bugs? (describe)
5. What would you improve?
6. Would you recommend this app?

**Track**:
- Crashes (Firebase Crashlytics)
- ANRs (Application Not Responding)
- User drop-off points
- Most used features

### 4.4 Fix Critical Issues

Priority:
1. **Blockers**: Crashes, auth failures → Hotfix immediately
2. **High**: Major bugs, poor UX → Fix before public launch
3. **Medium**: Minor bugs → Fix in 1.1
4. **Low**: Nice-to-have → Backlog

---

## Phase 5: Public Launch (2-4 weeks review time)

### 5.1 Submit for Review

#### Google Play

1. Play Console → Production
2. Promote beta release
3. Submit for review
4. Review time: 1-7 days typically

**Common rejection reasons**:
- Missing privacy policy
- Permissions not explained
- Crashes during review
- Incomplete metadata

#### Apple App Store

1. App Store Connect → 1.0.0
2. Submit for Review
3. Review time: 1-5 days typically

**Common rejection reasons**:
- Guideline 2.1: Crashes
- Guideline 4.0: Design issues
- Guideline 5.1: Privacy concerns
- Demo account not working

### 5.2 Monitor Launch

**First 24 Hours**:
- Monitor crash reports
- Check user reviews
- Respond to support requests
- Watch server load (Supabase)
- Track downloads

**First Week**:
- Daily review monitoring
- Address critical bugs
- Plan 1.0.1 hotfix if needed
- Collect user feedback

**First Month**:
- Weekly analytics review
- Plan 1.1 features
- Optimize performance
- Marketing push

---

## Phase 6: Post-Launch (Ongoing)

### 6.1 Monitoring

**Tools**:
- Firebase Crashlytics: Crash reports
- Firebase Analytics: User behavior
- Supabase Dashboard: API usage
- Play Console / App Store Connect: Reviews, downloads

**Metrics to Track**:
- DAU / MAU (Daily/Monthly Active Users)
- Retention rate (D1, D7, D30)
- Session length
- Feature usage
- Crash-free rate
- API response times

### 6.2 Support

**Channels**:
- In-app help (Help screen)
- Email: support@ibimina.rw
- WhatsApp Business: +250788000000
- Play Store / App Store reviews

**SLA**:
- Critical issues: < 4 hours
- High priority: < 24 hours
- Medium: < 3 days
- Low: Best effort

### 6.3 Updates

**Release Cadence**:
- Hotfixes: As needed (1-2 days)
- Minor updates: Every 2-4 weeks
- Major updates: Every 2-3 months

**Update Process**:
1. Bump version (e.g., 1.0.0 → 1.1.0)
2. Update changelog
3. Build & test
4. Upload to stores
5. Gradual rollout (Play: 10% → 50% → 100%)
6. Monitor for issues
7. Full rollout if stable

---

## Checklist

### Pre-Launch
- [ ] Firebase configured (google-services.json, GoogleService-Info.plist)
- [ ] Environment variables set (.env.production)
- [ ] App version bumped
- [ ] Icons and splash screens added
- [ ] Android keystore generated and backed up
- [ ] iOS certificates and provisioning profiles created
- [ ] Release builds tested locally (Android APK, iOS archive)
- [ ] All features tested (auth, accounts, loans, groups, notifications)
- [ ] Privacy policy published
- [ ] Terms of service published

### Store Listings
- [ ] Google Play Console account created
- [ ] Apple Developer account enrolled
- [ ] App details filled (name, description, category)
- [ ] Screenshots uploaded (Android: 5+, iOS: 10+)
- [ ] Feature graphics created (Android)
- [ ] Content rating completed
- [ ] Pricing set (Free)
- [ ] Countries selected (Rwanda +)

### Upload
- [ ] Android AAB built and uploaded to Play Console
- [ ] iOS archive built and uploaded to App Store Connect
- [ ] Release notes written
- [ ] Demo account credentials provided (iOS)

### Testing
- [ ] Internal testing completed (1 week)
- [ ] External beta testing completed (1 week)
- [ ] Critical bugs fixed
- [ ] Feedback addressed

### Launch
- [ ] Submitted to Google Play
- [ ] Submitted to Apple App Store
- [ ] Monitoring tools configured
- [ ] Support channels ready
- [ ] Marketing materials prepared

---

## Timeline

```
Week 1: Preparation
├─ Day 1-2: Firebase setup, environment config
├─ Day 3-4: Code signing, build configs
└─ Day 5-7: Store listings, screenshots

Week 2: Beta Testing
├─ Day 8-11: Internal testing (team)
└─ Day 12-14: External testing (users)

Week 3-4: Review
├─ Day 15: Submit to stores
├─ Day 16-21: Review process
└─ Day 22: Approved & Published 🎉

Week 5+: Post-Launch
├─ Monitor metrics
├─ Respond to reviews
├─ Fix bugs
└─ Plan next version
```

---

## Support Contacts

- **Development**: Your team
- **Firebase**: firebase-support@google.com
- **Google Play**: Via Play Console
- **Apple**: developer.apple.com/support
- **Supabase**: support@supabase.io

---

## Resources

- [Google Play Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [React Native Publishing](https://reactnative.dev/docs/signed-apk-android)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

**Generated**: November 3, 2025  
**Version**: 1.0.0  
**Status**: Ready for Deployment 🚀

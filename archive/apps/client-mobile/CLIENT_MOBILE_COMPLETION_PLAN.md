# CLIENT MOBILE APP - COMPLETION PLAN

## Status: 70% Complete → Target: 100%

### Remaining Work: ~30-40 hours

---

## Phase 1: Loan Features (10 hours)

### 1. Loan Application Form (/screens/loans/LoanApplicationScreen.tsx)
**Status:** Basic structure exists, needs completion

**Tasks:**
- [ ] Add form validation (amount, term, purpose)
- [ ] Add eligibility check (minimum balance, account age)
- [ ] Add loan calculator (monthly payment preview)
- [ ] Integrate with `supabase.from('loans').insert()`
- [ ] Add success/error handling
- [ ] Add navigation to loan detail after submission

**File:** `apps/client-mobile/src/screens/loans/LoanApplicationScreen.tsx`

**API:**
```typescript
const { data, error } = await supabase
  .from('loans')
  .insert({
    user_id: userId,
    account_id: accountId,
    amount: loanAmount,
    term_months: termMonths,
    purpose: purpose,
    status: 'pending'
  })
  .select()
  .single();
```

---

### 2. Loan Detail Screen
**Status:** Basic exists, needs enhancement

**Tasks:**
- [ ] Show loan schedule (payment dates)
- [ ] Show payment history
- [ ] Add repayment button
- [ ] Show guarantors if applicable
- [ ] Add loan status tracking

---

## Phase 2: Group (Ikimina) Features (10 hours)

### 1. Groups List Screen
**Status:** Exists, needs polish

**Tasks:**
- [ ] Add group filtering (active/inactive)
- [ ] Add group search
- [ ] Show contribution status badges
- [ ] Add pull-to-refresh
- [ ] Show next contribution date

---

### 2. Group Detail Screen
**Status:** Basic exists, needs completion

**Tasks:**
- [ ] Show member list with avatars
- [ ] Show contribution schedule
- [ ] Show group balance/fund
- [ ] Add member contribution history
- [ ] Add group chat (optional, post-launch)

---

### 3. Group Contributions
**Status:** Missing, needs implementation

**Tasks:**
- [ ] Create contribution screen
- [ ] Add payment method selection
- [ ] Integrate with payment API
- [ ] Add contribution confirmation
- [ ] Show contribution receipt

**New File:** `apps/client-mobile/src/screens/groups/ContributeScreen.tsx`

---

## Phase 3: Push Notifications (5 hours)

### 1. Setup
**Tasks:**
- [ ] Install `@react-native-firebase/messaging`
- [ ] Configure FCM (Firebase Cloud Messaging)
- [ ] Update `android/app/google-services.json`
- [ ] Update `ios/GoogleService-Info.plist`
- [ ] Add notification permissions

---

### 2. Implementation
**Tasks:**
- [ ] Request permission on app launch
- [ ] Store FCM token in Supabase
- [ ] Handle foreground notifications
- [ ] Handle background notifications
- [ ] Handle notification clicks (deep linking)

**New File:** `apps/client-mobile/src/services/notificationService.ts`

```typescript
import messaging from '@react-native-firebase/messaging';

export const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
  if (enabled) {
    const token = await messaging().getToken();
    // Save token to Supabase
    await supabase
      .from('user_devices')
      .upsert({ user_id: userId, fcm_token: token });
  }
};
```

---

## Phase 4: UI/UX Polish (5 hours)

### 1. Animations
**Tasks:**
- [ ] Add skeleton loaders
- [ ] Add pull-to-refresh animations
- [ ] Add slide animations between screens
- [ ] Add button press feedback

---

### 2. Empty States
**Tasks:**
- [ ] Add empty state for no transactions
- [ ] Add empty state for no loans
- [ ] Add empty state for no groups
- [ ] Add empty state illustrations

---

### 3. Error Handling
**Tasks:**
- [ ] Add network error screens
- [ ] Add retry buttons
- [ ] Add timeout handling
- [ ] Add user-friendly error messages

---

## Phase 5: Production Build & Testing (10 hours)

### 1. Android Production Build
**Tasks:**
- [ ] Update `android/app/build.gradle` (version code/name)
- [ ] Generate release keystore
- [ ] Configure signing in Gradle
- [ ] Build AAB: `cd android && ./gradlew bundleRelease`
- [ ] Test on physical device
- [ ] Prepare Play Store listing

**Commands:**
```bash
# Generate keystore
keytool -genkeypair -v -storetype PKCS12 -keystore ibimina-release.keystore \
  -alias ibimina -keyalg RSA -keysize 2048 -validity 10000

# Build release
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

### 2. iOS Production Build
**Tasks:**
- [ ] Update `ios/IbiminaClient/Info.plist` (version)
- [ ] Configure signing in Xcode
- [ ] Update provisioning profiles
- [ ] Build archive
- [ ] Upload to App Store Connect
- [ ] Prepare App Store listing

**Commands:**
```bash
cd ios
pod install
xcodebuild -workspace IbiminaClient.xcworkspace \
  -scheme IbiminaClient \
  -configuration Release \
  -archivePath build/IbiminaClient.xcarchive \
  archive
```

---

### 3. Testing Checklist
- [ ] Test WhatsApp OTP flow
- [ ] Test account creation
- [ ] Test transactions
- [ ] Test loan application
- [ ] Test group contributions
- [ ] Test push notifications
- [ ] Test offline behavior
- [ ] Test on slow network
- [ ] Test on various screen sizes
- [ ] Test on Android 10+
- [ ] Test on iOS 14+

---

## Quick Start Commands

```bash
# 1. Install dependencies
cd apps/client-mobile
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with production values

# 3. Development
npm run android  # Android
npm run ios      # iOS

# 4. Production builds
npm run android --mode=release
npm run ios --mode=release
```

---

## Environment Variables Needed

```bash
# .env
SUPABASE_URL=https://vacltfdslodqybxojytc.supabase.co
SUPABASE_ANON_KEY=your-anon-key
APP_ENV=production
GOOGLE_SERVICES_JSON=path/to/google-services.json  # Android
GOOGLE_SERVICE_INFO_PLIST=path/to/GoogleService-Info.plist  # iOS
```

---

## Files to Create/Modify

### New Files:
1. `src/screens/groups/ContributeScreen.tsx`
2. `src/services/notificationService.ts`
3. `src/components/EmptyState.tsx`
4. `src/components/SkeletonLoader.tsx`

### Modify Existing:
1. `src/screens/loans/LoanApplicationScreen.tsx` - Complete form
2. `src/screens/loans/LoansScreen.tsx` - Polish UI
3. `src/screens/groups/GroupDetailScreen.tsx` - Add contributions
4. `src/navigation/AppNavigator.tsx` - Add deep linking

---

## Time Breakdown

| Task | Hours |
|------|-------|
| Loan application form | 6 |
| Loan detail enhancements | 4 |
| Group contributions | 6 |
| Group detail polish | 4 |
| Push notifications | 5 |
| UI/UX polish | 5 |
| Production builds | 6 |
| Testing | 4 |
| **TOTAL** | **40 hours** |

---

## Success Criteria

✅ User can apply for a loan  
✅ User can view loan details and schedule  
✅ User can contribute to group (Ikimina)  
✅ User receives push notifications  
✅ App works offline (graceful degradation)  
✅ Production builds work on real devices  
✅ App is submitted to stores

---

## Post-Launch Enhancements (Future)

- Biometric authentication
- Offline sync with SQLite
- Transaction receipts (PDF/share)
- Group chat
- Referral system
- Investment products
- Insurance products

---

## Notes

- Focus on MVP features first
- Loan and group features are CRITICAL
- Push notifications are NICE-TO-HAVE but recommended
- Production builds must be tested thoroughly
- App store submission takes 1-3 days for review

---

**Estimated Completion:** 1-2 weeks with focused effort  
**Developer Effort:** 40 hours (5 days full-time)


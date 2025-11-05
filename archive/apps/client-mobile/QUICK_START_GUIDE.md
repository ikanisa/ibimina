# 🚀 QUICK START: Complete Client Mobile App

**Goal:** Finish the client mobile app (30 hours of work)  
**Status:** Ready to execute  
**Priority:** ⚡ CRITICAL (blocks launch)

---

## Step 1: Set Up Environment (10 minutes)

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/client-mobile

# Install dependencies
npm install

# Or if using pnpm (recommended)
pnpm install

# Create environment file
cp .env.example .env

# Edit .env with your Supabase credentials
nano .env
```

**Required .env variables:**
```bash
SUPABASE_URL=https://vacltfdslodqybxojytc.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For admin operations
```

---

## Step 2: Implement WhatsApp OTP Auth (10 hours)

### Option A: Run the Implementation Script (Automated) ✅ RECOMMENDED
```bash
cd /Users/jeanbosco/workspace/ibimina/apps/client-mobile
chmod +x implement-whatsapp-auth.sh
./implement-whatsapp-auth.sh
```

This script creates:
- `src/screens/onboarding/OnboardingScreen.tsx` (3 slides)
- `src/screens/auth/whatsapp/WhatsAppAuthScreen.tsx` (phone input)
- `src/screens/auth/whatsapp/OTPVerificationScreen.tsx` (6-digit code)
- `src/screens/browse/BrowseModeScreen.tsx` (demo data)
- `src/components/AuthGuard.tsx` (protects actions)
- Navigation updates

### Option B: Manual Implementation (If script fails)

1. **Create Onboarding Screen** (Created ✅)
   - Already exists at `src/screens/onboarding/OnboardingScreen.tsx`

2. **Create WhatsApp Auth Screen** (Created ✅)
   - Already exists at `src/screens/auth/whatsapp/WhatsAppAuthScreen.tsx`

3. **Create OTP Verification Screen** (2 hours)
```bash
# Create the screen
cat > src/screens/auth/whatsapp/OTPVerificationScreen.tsx << 'EOF'
// Full implementation with:
// - 6-digit code input
// - Countdown timer (5 minutes)
// - Resend OTP button
// - Auto-submit on 6 digits
// - Loading states
// - Error handling
EOF
```

4. **Create Browse Mode** (2 hours)
```bash
# Demo dashboard with sample data
cat > src/screens/browse/BrowseModeScreen.tsx << 'EOF'
// Full implementation with:
// - Sample account balance
// - Sample transactions
// - Feature list
// - "Sign in to continue" prompts
EOF
```

5. **Create Auth Guard** (1 hour)
```bash
cat > src/components/AuthGuard.tsx << 'EOF'
// HOC that:
// - Checks if user is authenticated
// - Shows WhatsApp auth modal if not
// - Allows action after auth
EOF
```

6. **Update Navigation** (1 hour)
```typescript
// src/navigation/index.tsx
// Add new screens:
// - Onboarding
// - WhatsAppAuth
// - OTPVerification
// - BrowseMode
```

---

## Step 3: Build Transaction Screens (12 hours)

### A. Deposit Screen (3 hours)
```bash
mkdir -p src/screens/transactions
cat > src/screens/transactions/DepositScreen.tsx << 'EOF'
// Features:
// - Amount input with number pad
// - Mobile Money provider selection (MTN/Airtel)
// - Phone number input
// - Confirmation screen
// - Success/failure feedback
// - Receipt generation
EOF
```

### B. Withdraw Screen (3 hours)
```bash
cat > src/screens/transactions/WithdrawScreen.tsx << 'EOF'
// Features:
// - Amount input with balance check
// - Withdrawal method (Bank/Mobile Money)
// - Account details input
// - OTP confirmation
// - Receipt generation
EOF
```

### C. Transfer Screen (3 hours)
```bash
cat > src/screens/transactions/TransferScreen.tsx << 'EOF'
// Features:
// - Beneficiary search/selection
// - Phone number input
// - Amount input
// - Transfer note
// - Confirmation
// - Success feedback
EOF
```

### D. Transaction History (3 hours)
```bash
cat > src/screens/transactions/TransactionHistoryScreen.tsx << 'EOF'
// Features:
// - List with infinite scroll
// - Filters (date, type, status)
// - Search
// - Pull-to-refresh
// - Transaction detail modal
// - Export to PDF
EOF
```

---

## Step 4: Complete Additional Screens (8 hours)

### A. Loan Application (3 hours)
```bash
cat > src/screens/loans/LoanApplicationScreen.tsx << 'EOF'
// Features:
// - Loan amount input
// - Term selection (3, 6, 12 months)
// - Purpose dropdown
// - Interest calculator
// - Repayment schedule preview
// - Submit application
EOF
```

### B. Profile & Settings (2 hours)
```bash
cat > src/screens/profile/ProfileScreen.tsx << 'EOF'
// Features:
// - View profile info
// - Edit name, phone, photo
// - Change password/PIN
// - Biometric settings
// - Language (EN/RW)
// - Dark mode toggle
// - Notification preferences
// - About/version
EOF
```

### C. Notifications (2 hours)
```bash
cat > src/screens/notifications/NotificationsScreen.tsx << 'EOF'
// Features:
// - List of notifications
// - Mark as read
// - Clear all
// - Deep linking to relevant screens
EOF
```

### D. Group Details (1 hour)
```bash
cat > src/screens/groups/GroupDetailScreen.tsx << 'EOF'
// Features:
// - Group info (name, members, balance)
// - Member list
// - Recent transactions
// - Contribute button
EOF
```

---

## Step 5: Add Advanced Features (6 hours)

### A. Offline Support (2 hours)
```typescript
// src/utils/offlineQueue.ts
// Features:
// - Queue failed requests
// - Retry when online
// - Optimistic updates
// - Sync indicator
```

### B. Push Notifications (2 hours)
```bash
# Install Firebase
npm install @react-native-firebase/app @react-native-firebase/messaging

# Configure FCM (Android) and APNs (iOS)
# Set up notification handler
```

### C. Biometric Auth (1 hour)
```bash
npm install react-native-biometrics

# Implement:
# - Face ID / Touch ID prompt
# - Fallback to PIN
# - Settings toggle
```

### D. Polish (1 hour)
- Loading skeletons
- Empty states
- Error boundaries
- Pull-to-refresh animations

---

## Step 6: Testing (4 hours)

### A. Unit Tests (2 hours)
```bash
# Test critical functions
npm run test

# Test coverage should be >70%
npm run test:coverage
```

### B. Manual Testing Checklist (2 hours)
- [ ] Onboarding flow (skip + get started)
- [ ] WhatsApp OTP (send + verify)
- [ ] Browse mode (restrictions work)
- [ ] Deposit (MTN + Airtel)
- [ ] Withdraw (Bank + MoMo)
- [ ] Transfer (P2P)
- [ ] Transaction history (filters)
- [ ] Loan application
- [ ] Profile editing
- [ ] Notifications
- [ ] Offline mode
- [ ] Push notifications
- [ ] Biometric unlock

---

## Step 7: Build & Deploy (2 hours)

### Android Build
```bash
cd android
./gradlew assembleRelease

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore your-keystore.jks \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  your-alias

# Zipalign
zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  app-release.apk
```

### iOS Build
```bash
cd ios
pod install
cd ..

# Open Xcode
open ios/IbiminaClient.xcworkspace

# Build for release (Xcode)
# Product > Archive
# Distribute to App Store
```

---

## Step 8: Submit to Stores (1 hour)

### Google Play Console
1. Create app listing
2. Upload APK
3. Add screenshots
4. Write description
5. Set pricing (Free)
6. Submit for review

### Apple App Store Connect
1. Create app record
2. Upload IPA (via Xcode)
3. Add screenshots
4. Write description
5. Set pricing (Free)
6. Submit for review

---

## 📋 Daily Checklist

### Day 1 (8 hours)
- [ ] Set up environment
- [ ] Run WhatsApp OTP implementation script
- [ ] Test OTP flow (send + verify)
- [ ] Create Browse Mode screen
- [ ] Test exploration flow

### Day 2 (8 hours)
- [ ] Build Deposit screen
- [ ] Build Withdraw screen
- [ ] Test deposit flow end-to-end
- [ ] Test withdraw flow end-to-end

### Day 3 (8 hours)
- [ ] Build Transfer screen
- [ ] Build Transaction History
- [ ] Test transfer flow
- [ ] Add filters to history

### Day 4 (6 hours)
- [ ] Build Loan Application
- [ ] Build Profile/Settings
- [ ] Test loan flow
- [ ] Test profile editing

---

## 🐛 Troubleshooting

### WhatsApp OTP not sending
```bash
# Check Edge Function logs
supabase functions logs send-whatsapp-otp

# Test manually
curl -X POST https://vacltfdslodqybxojytc.supabase.co/functions/v1/send-whatsapp-otp \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d '{"phoneNumber": "+250788123456"}'
```

### Build errors (Android)
```bash
cd android
./gradlew clean
rm -rf .gradle
./gradlew assembleDebug
```

### Build errors (iOS)
```bash
cd ios
pod cache clean --all
rm -rf Pods Podfile.lock
pod install
```

### Metro bundler errors
```bash
npm start -- --reset-cache
```

---

## 📱 Testing Devices Needed

### Android
- Physical device with Android 9+ (API 28+)
- NFC-enabled (for TapMoMo testing)
- Active SIM card (for USSD testing)

### iOS
- Physical device with iOS 13+ (CoreNFC requires real device)
- Face ID or Touch ID enabled
- Active SIM card

---

## ✅ Definition of Done

Client Mobile App is complete when:
- [ ] All screens implemented and navigable
- [ ] WhatsApp OTP flow works end-to-end
- [ ] Users can deposit, withdraw, transfer
- [ ] Users can apply for loans
- [ ] Users can view transaction history
- [ ] Offline mode works (basic caching)
- [ ] Push notifications delivered
- [ ] Biometric unlock works
- [ ] No critical bugs
- [ ] App builds successfully (Android + iOS)
- [ ] App passes review guidelines
- [ ] Submitted to both app stores

---

## 🎯 Success Metrics

After launch, measure:
- **Registration Rate:** >80% complete WhatsApp OTP
- **Transaction Success:** >95% deposits/withdrawals succeed
- **User Retention:** >60% return after 7 days
- **App Rating:** >4.5 stars on both stores
- **Crash-Free Rate:** >99.5%

---

## 📞 Need Help?

### Resources
- React Native Docs: https://reactnative.dev
- Supabase Docs: https://supabase.com/docs
- React Navigation: https://reactnavigation.org

### Common Issues
- Check `IMPLEMENTATION_STATUS.md` for progress
- See `WHATSAPP_AUTH_IMPLEMENTATION.md` for auth details
- Review Edge Function code in `supabase/functions/`

---

**Ready to start?**

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/client-mobile
chmod +x implement-whatsapp-auth.sh
./implement-whatsapp-auth.sh
```

**Then continue with transaction screens!**

Good luck! 🚀

# 🧪 Manual Testing Checklist

**Use this checklist to systematically test each component**

## 📱 Testing Environment Setup

### Required Devices

- [ ] Desktop/laptop with modern browser (Chrome/Firefox/Safari)
- [ ] Android phone (API 26+) for Staff app
- [ ] Android phone for testing NFC payments
- [ ] iPhone (iOS 13+) for Client app testing
- [ ] Active SIM cards (MTN/Airtel Rwanda)

### Required Accounts

- [ ] Supabase project access
- [ ] WhatsApp Business API credentials
- [ ] Test user accounts in database
- [ ] Staff accounts with different roles

---

## 1️⃣ Supabase Backend (30 minutes)

### Database Connection

- [ ] Can connect to database via pgAdmin/psql
- [ ] All tables visible in Supabase dashboard
- [ ] RLS policies showing in table settings

### Tables to Verify

- [ ] `users` - User accounts
- [ ] `accounts` - Financial accounts
- [ ] `transactions` - Transaction history
- [ ] `loans` - Loan applications
- [ ] `groups` - Savings groups
- [ ] `merchants` - TapMoMo merchants
- [ ] `sms_reconciliation` - Payment SMS
- [ ] `otp_verifications` - WhatsApp OTPs
- [ ] `qr_auth_sessions` - Web-to-mobile auth

### Edge Functions

- [ ] Functions deployed (check Supabase dashboard)
- [ ] `auth` - Authentication endpoint
- [ ] `send-whatsapp-otp` - OTP sending
- [ ] `verify-whatsapp-otp` - OTP verification
- [ ] `sms-reconcile` - SMS payment reconciliation
- [ ] `tapmomo-reconcile` - NFC payment reconciliation
- [ ] `qr-auth-init` - QR code generation
- [ ] `qr-auth-verify` - QR scan verification

### Test Each Function Manually

#### Test: send-whatsapp-otp

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-whatsapp-otp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+250788123456"}'
```

- [ ] Returns success (200)
- [ ] WhatsApp message received
- [ ] OTP stored in database
- [ ] Expires in 5 minutes

#### Test: sms-reconcile

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/sms-reconcile \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sms_text": "You have received 5000 RWF from MTN Mobile Money. Ref: ABC123",
    "sender": "MTN",
    "timestamp": "2025-01-15T10:30:00Z"
  }'
```

- [ ] Returns parsed data (200)
- [ ] Amount extracted correctly
- [ ] Network identified
- [ ] Reference captured
- [ ] Record created in sms_reconciliation table

---

## 2️⃣ Admin PWA (45 minutes)

### Build & Deploy

- [ ] `pnpm build` completes successfully
- [ ] No build errors or warnings
- [ ] Bundle size reasonable (<1MB main chunk)
- [ ] `pnpm start` serves production build

### Test: http://localhost:3100

### Login Page

- [ ] Page loads without errors
- [ ] Ibimina logo displays
- [ ] Email and password fields present
- [ ] "Remember me" checkbox works
- [ ] "Forgot password" link present

### Login Flow

- [ ] Valid credentials → Dashboard
- [ ] Invalid credentials → Error message
- [ ] Empty fields → Validation errors
- [ ] Network error → Retry option
- [ ] Session persists on refresh
- [ ] Logout → Redirects to login

### Dashboard

- [ ] KPI cards load (Users, Transactions, Loans, Groups)
- [ ] Numbers update in real-time
- [ ] Charts render correctly
- [ ] Recent activity list shows latest items
- [ ] Quick action buttons work
- [ ] Date range filter works

### Users Management

Navigate to `/users`

- [ ] User list loads with pagination
- [ ] Search by name/email/phone works
- [ ] Filter by role works
- [ ] Filter by status works
- [ ] Sort by columns works
- [ ] Click user → Detail modal opens
- [ ] User info displays correctly
- [ ] Account list shows user's accounts
- [ ] Transaction history loads

### Create New User

- [ ] "Add User" button opens form
- [ ] All fields validate properly
- [ ] Phone number format validation
- [ ] Email format validation
- [ ] Role dropdown works
- [ ] Submit creates user
- [ ] Success message shown
- [ ] List refreshes with new user

### Edit User

- [ ] Edit button opens pre-filled form
- [ ] Changes save correctly
- [ ] Validation still works
- [ ] Cancel discards changes
- [ ] Optimistic UI updates

### Deactivate User

- [ ] Deactivate button works
- [ ] Confirmation dialog shows
- [ ] Status updates to "Suspended"
- [ ] User can't login when suspended
- [ ] Reactivate button appears
- [ ] Reactivate works

### Accounts Management

Navigate to `/accounts`

- [ ] Account list loads
- [ ] Shows account number, type, balance
- [ ] Filter by type works
- [ ] Filter by status works
- [ ] Search by account number works
- [ ] Click account → Detail view

### Account Detail

- [ ] Balance displayed correctly
- [ ] Transaction history loads
- [ ] Owner information shown
- [ ] Account status shown
- [ ] Action buttons visible
- [ ] Download statement works

### Transactions

Navigate to `/transactions`

- [ ] Transaction list loads paginated
- [ ] Filter by type (Deposit/Withdraw/Transfer)
- [ ] Filter by status
- [ ] Date range filter works
- [ ] Amount range filter works
- [ ] Search by reference works
- [ ] Click transaction → Detail modal

### Transaction Detail

- [ ] All transaction fields shown
- [ ] From/To accounts linked
- [ ] Amount formatted correctly
- [ ] Status badge colored correctly
- [ ] Timestamp formatted
- [ ] Receipt download button works

### Loans Management

Navigate to `/loans`

- [ ] Loan list loads
- [ ] Filter by status (Pending/Approved/Rejected)
- [ ] Sort by date, amount works
- [ ] Click loan → Detail view

### Loan Application Review

- [ ] Applicant info displayed
- [ ] Loan amount and term shown
- [ ] Purpose/notes visible
- [ ] Documents downloadable
- [ ] Credit score calculated
- [ ] Payment schedule preview
- [ ] Approve button works
- [ ] Reject button works
- [ ] Approval creates transaction
- [ ] Notifications sent

### Groups Management

Navigate to `/groups`

- [ ] Group list loads
- [ ] Filter by type works
- [ ] Search by name works
- [ ] Click group → Detail view

### Group Detail

- [ ] Group info displayed
- [ ] Member list loads
- [ ] Contribution history shown
- [ ] Balances calculated correctly
- [ ] Add member works
- [ ] Remove member works
- [ ] Record contribution works

### SMS Reconciliation

Navigate to `/sms-reconciliation`

- [ ] Unreconciled SMS list loads
- [ ] Shows sender, amount, date
- [ ] "Parse" button extracts data
- [ ] OpenAI parsing accurate
- [ ] "Match User" search works
- [ ] User selection populates details
- [ ] "Approve" creates transaction
- [ ] "Reject" archives SMS
- [ ] Status updates in real-time

### Settings

Navigate to `/settings`

- [ ] Profile section loads
- [ ] Can edit profile info
- [ ] Password change works
- [ ] Theme toggle (Light/Dark/System)
- [ ] Language selector works
- [ ] Notification preferences
- [ ] About section shows version
- [ ] Legal links work

### PWA Features

#### Service Worker

- [ ] Open DevTools → Application → Service Workers
- [ ] Shows "activated and running"
- [ ] Update on reload works

#### Offline Mode

- [ ] DevTools → Network → Offline
- [ ] App still loads cached pages
- [ ] Offline indicator shows
- [ ] "You're offline" message
- [ ] Actions queued
- [ ] Actions replay when back online

#### Install Prompt

- [ ] Desktop: Install icon in address bar
- [ ] Click icon → Install dialog
- [ ] Install completes
- [ ] App opens in standalone window
- [ ] No browser chrome visible

#### Mobile (Android/iOS)

- [ ] Visit site on mobile
- [ ] "Add to Home Screen" prompt shows
- [ ] Install from browser menu
- [ ] Icon appears on home screen
- [ ] Opens fullscreen
- [ ] Splash screen shows

---

## 3️⃣ Staff Android App (60 minutes)

### Installation

- [ ] APK file generated at `apps/admin/android/app/build/outputs/apk/release/`
- [ ] APK size reasonable (<50MB)
- [ ] Installs on Android device
- [ ] App icon appears
- [ ] Opens without crash

### Permissions

On first launch:

- [ ] Camera permission requested
- [ ] NFC permission requested
- [ ] SMS read permission requested
- [ ] Phone state permission requested
- [ ] All permissions granted

### QR Code Web Authentication

#### Desktop Side

1. Open Admin PWA: http://localhost:3100
2. Click "Login"
3. QR code displays

#### Mobile Side

4. Open Staff Android app
5. Tap "Scan QR" or camera icon
6. Point at QR code on screen

**Test Points:**

- [ ] Camera opens immediately
- [ ] QR code detected within 2 seconds
- [ ] Vibration feedback on detection
- [ ] "Approve Login?" dialog shows
- [ ] Shows website URL
- [ ] Shows timestamp
- [ ] Shows device info

7. Tap "Approve"

**Test Points:**

- [ ] Loading indicator shows
- [ ] Success message appears
- [ ] Desktop PWA logs in automatically
- [ ] Redirects to dashboard
- [ ] No manual password entry needed

**Test Rejection:**

- [ ] Tap "Reject" instead
- [ ] Desktop shows "Login denied"
- [ ] Session not created

**Test Expiry:**

- [ ] Wait 2 minutes
- [ ] Try scanning expired QR
- [ ] Shows "QR code expired"
- [ ] Desktop generates new QR

### TapMoMo NFC Payments

#### Setup

- [ ] Two Android phones (API 26+)
- [ ] NFC enabled on both
- [ ] Staff app installed on both
- [ ] Test merchant account created

#### Get Paid (Payee Mode)

Phone 1 (Merchant):

1. Open Staff app
2. Navigate to "Payments" → "Get Paid"
3. Enter amount: 5000 RWF
4. Select network: MTN
5. Tap "Activate NFC"

**Test Points:**

- [ ] Amount validation (min/max)
- [ ] Network dropdown shows MTN, Airtel
- [ ] "Activate NFC" button enabled
- [ ] Countdown timer starts (60s)
- [ ] Screen stays on
- [ ] Notification shows "NFC Active"
- [ ] Device vibrates on activation

#### Pay (Payer Mode)

Phone 2 (Customer):

1. Open Staff app
2. Navigate to "Payments" → "Pay"
3. Tap "Scan NFC"
4. Hold phones back-to-back

**Test Points:**

- [ ] NFC reader activates
- [ ] Detects payee phone within 3 seconds
- [ ] Beep/vibration on detection
- [ ] Payment details dialog shows
- [ ] Amount displayed correctly
- [ ] Merchant name shown
- [ ] Network shown
- [ ] Currency shown

5. Review details
6. Tap "Select SIM" (if dual-SIM)
7. Choose MTN SIM
8. Tap "Confirm Payment"

**Test Points:**

- [ ] SIM selection shows if dual-SIM
- [ ] USSD code generated correctly
- [ ] Format: `*182*8*1*MERCHANT*AMOUNT#`
- [ ] USSD launches automatically
- [ ] OR dialer opens with code if blocked
- [ ] Code copied to clipboard

9. Complete USSD payment

**Test Points:**

- [ ] Payment pending status shown
- [ ] SMS notification expected
- [ ] Transaction recorded in app
- [ ] Sync to backend works

#### NFC Security Tests

**Test: Nonce Replay**

1. Complete a payment
2. Immediately try tapping again
3. Should reject: "Transaction already processed"

- [ ] Replay protection works
- [ ] Error message shown
- [ ] No duplicate transaction

**Test: Expiry**

1. Activate NFC on payee
2. Wait 2+ minutes (past TTL)
3. Try to read with payer
4. Should reject: "Payment expired"

- [ ] TTL validation works
- [ ] Expired sessions rejected

**Test: HMAC Verification**

1. Modify payload manually (if possible)
2. Try to process
3. Should reject: "Invalid signature"

- [ ] Signature verification works
- [ ] Tampered data rejected

**Test: Network Offline**

1. Complete NFC read
2. Turn off WiFi/mobile data
3. Confirm payment
4. Should queue for later sync

- [ ] Offline queue works
- [ ] Syncs when back online
- [ ] No data loss

### SMS Reconciliation

#### Setup

- [ ] Grant SMS permissions
- [ ] Set as default SMS app (if required)

#### Test: Receive Payment SMS

Send test SMS to device:

```
You have received 10000 RWF from MTN Mobile Money.
Transaction ID: MP250115A1B2C3
Date: 15/01/2025 14:30
```

**Test Points:**

- [ ] SMS auto-detected
- [ ] Notification appears
- [ ] Badge shows count
- [ ] SMS appears in reconciliation list

#### Test: Parse SMS

1. Tap notification or open SMS Reconciliation
2. Select SMS from list
3. Tap "Parse" button

**Test Points:**

- [ ] Loading indicator shows
- [ ] OpenAI API called
- [ ] Parsed data displayed:
  - [ ] Amount: 10000
  - [ ] Currency: RWF
  - [ ] Network: MTN
  - [ ] Reference: MP250115A1B2C3
  - [ ] Date: 15/01/2025 14:30
- [ ] Confidence score shown
- [ ] Edit fields available

#### Test: Match User

1. Tap "Match User"
2. Search dialog opens
3. Type customer name/phone
4. Select from results

**Test Points:**

- [ ] Search works
- [ ] Recent customers shown
- [ ] Customer details preview
- [ ] Accounts list shown
- [ ] Can select specific account

#### Test: Approve Payment

1. Review matched data
2. Tap "Approve Payment"
3. Confirm dialog

**Test Points:**

- [ ] Confirmation shows summary
- [ ] Transaction created
- [ ] Account balance updated
- [ ] SMS marked as reconciled
- [ ] Success notification
- [ ] Receipt generated
- [ ] Sync to backend

#### Test: Reject SMS

1. Select suspicious/duplicate SMS
2. Tap "Reject"
3. Enter reason
4. Confirm

**Test Points:**

- [ ] Reason required
- [ ] SMS archived
- [ ] No transaction created
- [ ] Audit log entry

#### Test: Edge Cases

**Malformed SMS:**

```
Random text without payment info
```

- [ ] Parser returns "Unable to parse"
- [ ] Manual entry option shown

**Duplicate SMS:** Send same SMS twice

- [ ] Second attempt rejected
- [ ] "Already processed" message
- [ ] Original transaction linked

**Unknown Sender:**

```
From: Unknown
You got 5000 RWF
```

- [ ] Parses amount
- [ ] Flags for manual review
- [ ] Warning shown

---

## 4️⃣ Client Mobile App (60 minutes)

### iOS Testing

#### Build & Install

```bash
cd apps/client-mobile/ios
pod install
cd ..
npx react-native run-ios
```

- [ ] Build completes
- [ ] App installs on simulator/device
- [ ] Opens without crash
- [ ] Splash screen shows

### Android Testing

#### Build & Install

```bash
cd apps/client-mobile/android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

- [ ] Build completes
- [ ] APK installs
- [ ] Opens without crash
- [ ] Splash screen shows

### Onboarding Flow

First launch (fresh install):

**Screen 1:**

- [ ] Illustration displays
- [ ] Title: "Welcome to Ibimina"
- [ ] Description clear
- [ ] "Next" button works
- [ ] Dots show 1/3

**Screen 2:**

- [ ] Illustration displays
- [ ] Title about features
- [ ] Description clear
- [ ] "Next" button works
- [ ] "Skip" button visible
- [ ] Dots show 2/3

**Screen 3:**

- [ ] Illustration displays
- [ ] Title about security
- [ ] Description clear
- [ ] "Get Started" button
- [ ] Dots show 3/3

Tap "Get Started":

- [ ] Transitions to Home
- [ ] Onboarding doesn't show again

### Browse Mode (Unauthenticated)

#### Home Screen

- [ ] Loads immediately
- [ ] Balance cards show "Login to view"
- [ ] Quick actions visible:
  - [ ] Deposit
  - [ ] Withdraw
  - [ ] Transfer
  - [ ] Loans
- [ ] Recent transactions placeholder
- [ ] "Sign In" button prominent

Tap any action:

- [ ] Auth prompt shows
- [ ] "Sign in to continue" message
- [ ] "Sign In" button
- [ ] "Cancel" button

#### Accounts Tab

- [ ] Shows account types info
- [ ] Savings account explained
- [ ] Checking account explained
- [ ] Loan account explained
- [ ] "Open Account" button

Tap "Open Account":

- [ ] Auth prompt shows

#### Transactions Tab

- [ ] Shows sample transactions
- [ ] Demo data realistic
- [ ] Clear "Demo Mode" indicator
- [ ] Tap transaction → Auth prompt

#### Loans Tab

- [ ] Loan products listed
- [ ] Interest rates shown
- [ ] Terms displayed
- [ ] Calculator tool works
- [ ] "Apply" → Auth prompt

#### Groups Tab

- [ ] Group types explained
- [ ] Benefits listed
- [ ] "Join Group" → Auth prompt

#### Profile Tab

- [ ] Shows "Guest User"
- [ ] Settings accessible
- [ ] Language toggle works
- [ ] Theme toggle works (Light/Dark/System)
- [ ] About section shows version
- [ ] Legal links work
- [ ] "Sign In" button

### WhatsApp OTP Authentication

#### Phone Number Entry

1. Tap "Sign In"
2. Phone number screen shows

**Test Points:**

- [ ] Input field formatted (+250...)
- [ ] Keyboard numeric
- [ ] Auto-format as you type
- [ ] Validation on blur
- [ ] "Next" disabled until valid
- [ ] Country code locked (+250)

**Test Invalid Numbers:**

- [ ] Too short → Error
- [ ] Wrong format → Error
- [ ] Non-numeric → Error

3. Enter valid number: +250788123456
4. Tap "Send Code"

**Test Points:**

- [ ] Button shows loading
- [ ] API call to Supabase
- [ ] Success → OTP screen
- [ ] Failure → Error message
- [ ] Rate limit (5 tries/hour)

#### OTP Verification

1. OTP entry screen shows

**Test Points:**

- [ ] 6 digit inputs
- [ ] Auto-focus first digit
- [ ] Numeric keyboard
- [ ] Auto-advance on digit entry
- [ ] Backspace works
- [ ] Paste works (123456)

2. Check WhatsApp on device
3. Copy OTP code (e.g., 123456)
4. Paste or type in app

**Test Points:**

- [ ] Auto-submit on 6th digit
- [ ] Loading indicator
- [ ] API verification call
- [ ] Success → Home screen
- [ ] User logged in

**Timer:**

- [ ] 60 second countdown
- [ ] "Resend Code" appears after 60s
- [ ] Tap "Resend" → New OTP sent
- [ ] New timer starts

**Test Invalid OTP:**

- [ ] Enter 000000
- [ ] Error: "Invalid code"
- [ ] Can retry

**Test Expired OTP:**

- [ ] Wait 6+ minutes
- [ ] Try old code
- [ ] Error: "Code expired"
- [ ] Must resend

### Authenticated Features

After successful login:

#### Home Screen

- [ ] Real balance shows
- [ ] Balance animated count-up
- [ ] Account cards load
- [ ] Recent transactions load
- [ ] Pull-to-refresh works
- [ ] Quick actions enabled

#### Account Details

Tap an account card:

**Test Points:**

- [ ] Account number shown
- [ ] Current balance
- [ ] Available balance
- [ ] Account type
- [ ] Status badge
- [ ] Transaction history
- [ ] Paginated list
- [ ] Load more works
- [ ] Filter by date
- [ ] Search transactions

#### Deposit Flow

1. Tap "Deposit"

**Test Points:**

- [ ] Amount input screen
- [ ] Numeric keyboard
- [ ] Format as you type (5,000)
- [ ] Min amount validation (500 RWF)
- [ ] Max amount check
- [ ] Account selector works

2. Enter amount: 10000
3. Select account
4. Tap "Continue"

**Test Points:**

- [ ] Review screen shows
- [ ] Amount formatted
- [ ] Account details shown
- [ ] Fee calculated (if any)
- [ ] Total amount shown

5. Tap "Confirm"

**Test Points:**

- [ ] Payment method selector
- [ ] MTN Mobile Money
- [ ] Airtel Money
- [ ] Bank transfer

6. Select "MTN Mobile Money"
7. Tap "Pay Now"

**Test Points:**

- [ ] USSD code generated
- [ ] Shows: `*182*8*1*...#`
- [ ] "Copy Code" button
- [ ] "Launch USSD" button (Android)
- [ ] Instructions clear

Android:

- [ ] USSD launches
- [ ] OR dialer opens

iOS:

- [ ] Code copied
- [ ] Phone app opens
- [ ] Instruction: "Paste code"

8. Complete USSD payment

**Test Points:**

- [ ] Pending status shown
- [ ] Transaction created
- [ ] Notification when confirmed
- [ ] Balance updates
- [ ] Receipt available

#### Withdraw Flow

1. Tap "Withdraw"
2. Select account
3. Check balance sufficient

**Test Points:**

- [ ] Amount input
- [ ] Balance shown
- [ ] Validation: amount ≤ balance
- [ ] Over-limit error

4. Enter amount: 5000
5. Enter destination phone: +250788999888
6. Tap "Continue"

**Test Points:**

- [ ] Review screen
- [ ] Amount, fee, total shown
- [ ] Destination confirmed

7. Tap "Confirm"

**Test Points:**

- [ ] PIN entry screen
- [ ] 4-digit PIN input
- [ ] Secure keyboard
- [ ] Obscured digits

8. Enter PIN: 1234

**Test Points:**

- [ ] Biometric prompt (if enabled)
- [ ] Face ID / Touch ID / Fingerprint
- [ ] Success → Processing
- [ ] Transaction created
- [ ] Balance debited immediately
- [ ] Notification sent

#### Transfer Flow

1. Tap "Transfer"

**Test Points:**

- [ ] From account selector
- [ ] To account selector
- [ ] Recent recipients shown

2. Select from account
3. Tap "To" field

**Test Points:**

- [ ] Search dialog opens
- [ ] Can search by:
  - [ ] Name
  - [ ] Phone
  - [ ] Account number
- [ ] Recent transfers shown
- [ ] Contact list integration

4. Select recipient
5. Enter amount: 3000
6. Add note: "Lunch money"
7. Tap "Continue"

**Test Points:**

- [ ] Review screen
- [ ] Both accounts shown
- [ ] Amount, note visible
- [ ] No fee (internal transfer)

8. Enter PIN
9. Confirm

**Test Points:**

- [ ] Loading indicator
- [ ] Success animation
- [ ] Both balances updated
- [ ] Transaction in both histories
- [ ] Push notification to recipient
- [ ] Receipt shareable

#### Loan Application

1. Navigate to Loans tab
2. Tap "Apply for Loan"

**Test Points:**

- [ ] Loan product selector
- [ ] Personal Loan
- [ ] Business Loan
- [ ] Education Loan
- [ ] Each shows:
  - [ ] Interest rate
  - [ ] Max amount
  - [ ] Max term
  - [ ] Requirements

3. Select "Business Loan"
4. Tap "Continue"

**Test Points:**

- [ ] Amount input (50,000 - 5,000,000)
- [ ] Term selector (3 - 36 months)
- [ ] Calculator updates live
- [ ] Monthly payment shown
- [ ] Total interest shown
- [ ] Total repayment shown

5. Enter amount: 500,000
6. Select term: 12 months
7. Tap "Continue"

**Test Points:**

- [ ] Purpose input
- [ ] Document upload
- [ ] ID card (front/back)
- [ ] Proof of income
- [ ] Business license
- [ ] Camera/gallery picker

8. Upload documents
9. Review application
10. Submit

**Test Points:**

- [ ] Confirmation screen
- [ ] Application ID shown
- [ ] Status: "Pending Review"
- [ ] Estimated processing time
- [ ] Notification when approved

#### Loan Management

1. Navigate to Loans tab
2. View active loan

**Test Points:**

- [ ] Loan details displayed
- [ ] Outstanding balance
- [ ] Next payment date
- [ ] Next payment amount
- [ ] Payment history
- [ ] Payment schedule

Tap "Make Payment":

**Test Points:**

- [ ] Amount input (min payment shown)
- [ ] Can pay more
- [ ] Payment methods
- [ ] Confirmation flow
- [ ] Receipt generated

#### Group Contributions

1. Navigate to Groups tab
2. View your group

**Test Points:**

- [ ] Group name
- [ ] Member count
- [ ] Total contributions
- [ ] Your contributions
- [ ] Contribution schedule
- [ ] Member list

Tap "Contribute":

**Test Points:**

- [ ] Amount input
- [ ] Contribution type selector
- [ ] Payment method
- [ ] Confirmation flow
- [ ] Group balance updates
- [ ] All members notified

#### Profile & Settings

1. Navigate to Profile tab

**Test Points:**

- [ ] Profile photo
- [ ] Name, email, phone
- [ ] Edit button works

Tap "Edit Profile":

**Test Points:**

- [ ] Photo picker
- [ ] Name input
- [ ] Email input (read-only)
- [ ] Phone (read-only)
- [ ] Save button
- [ ] Changes reflected

**Settings:**

- [ ] Language (EN/RW/FR)
- [ ] Theme (Light/Dark/System)
- [ ] Notifications toggle
- [ ] Push notifications
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Biometric login toggle
- [ ] PIN change
- [ ] About section
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Logout

#### Notifications

**Test Push Notifications:**

1. Transaction completed

- [ ] Notification appears
- [ ] Shows amount, type
- [ ] Tap → Transaction detail

2. Payment received

- [ ] Notification appears
- [ ] Shows sender, amount
- [ ] Tap → Transaction detail

3. Loan approved

- [ ] Notification appears
- [ ] Shows loan amount
- [ ] Tap → Loan detail

4. Group contribution

- [ ] Notification appears
- [ ] Shows member name
- [ ] Tap → Group detail

**Notification Settings:**

- [ ] In-app notifications work
- [ ] Push notifications work
- [ ] Sound plays
- [ ] Vibration works
- [ ] Badge count updates
- [ ] Notification history

#### Offline Support

**Test Offline Mode:**

1. Turn off WiFi and mobile data
2. Open app

**Test Points:**

- [ ] App still loads
- [ ] Cached data shown
- [ ] "You're offline" banner
- [ ] Can browse cached screens
- [ ] Actions disabled (gracefully)

3. Try to make transaction

**Test Points:**

- [ ] Shows "No connection" error
- [ ] Option to queue action
- [ ] OR retry when online

4. Turn network back on

**Test Points:**

- [ ] Auto-reconnect
- [ ] Queued actions sync
- [ ] Data refreshes
- [ ] "Back online" message

---

## 5️⃣ Integration Testing (45 minutes)

### End-to-End Payment Flow

**Actors:**

- Client (mobile app)
- Staff (admin PWA + Android)
- Backend (Supabase)

#### Scenario: Client deposits money

1. **Client initiates:**
   - [ ] Open client mobile app
   - [ ] Tap "Deposit"
   - [ ] Enter 10,000 RWF
   - [ ] Select account
   - [ ] Confirm
   - [ ] Note reference: DEP-20250115-001
   - [ ] Complete USSD payment

2. **SMS arrives:**
   - [ ] Staff Android receives SMS
   - [ ] Notification: "New payment: 10,000 RWF"
   - [ ] SMS auto-detected

3. **Staff reconciles:**
   - [ ] Open Staff Android
   - [ ] Navigate to SMS Reconciliation
   - [ ] Tap notification
   - [ ] Parse SMS → Confirms details
   - [ ] Match to client account
   - [ ] Approve payment

4. **Client sees confirmation:**
   - [ ] Push notification received
   - [ ] Balance updated
   - [ ] Transaction status: Completed
   - [ ] Receipt available

5. **Verify in Admin PWA:**
   - [ ] Login to Admin PWA
   - [ ] Navigate to Transactions
   - [ ] Find transaction by reference
   - [ ] Status: Completed
   - [ ] Amounts match
   - [ ] Timestamps correct

6. **Verify in Database:**

```sql
SELECT * FROM transactions
WHERE reference = 'DEP-20250115-001';

SELECT * FROM sms_reconciliation
WHERE transaction_id = '...';

SELECT balance FROM accounts WHERE id = '...';
```

- [ ] Transaction exists
- [ ] SMS reconciliation record exists
- [ ] Account balance updated

### End-to-End NFC Payment Flow

**Actors:**

- Merchant (Staff Android - payee)
- Customer (Staff Android - payer)

#### Scenario: Customer pays merchant via NFC

1. **Merchant activates:**
   - [ ] Open Staff Android (phone 1)
   - [ ] "Get Paid" → 5,000 RWF
   - [ ] Select MTN
   - [ ] Activate NFC
   - [ ] Countdown starts

2. **Customer taps:**
   - [ ] Open Staff Android (phone 2)
   - [ ] "Pay" mode
   - [ ] Tap "Scan NFC"
   - [ ] Hold phones together
   - [ ] Beep on detection

3. **Customer confirms:**
   - [ ] Review details
   - [ ] Verify merchant name
   - [ ] Verify amount: 5,000 RWF
   - [ ] Select SIM (MTN)
   - [ ] Confirm payment
   - [ ] USSD launches

4. **Customer completes USSD:**
   - [ ] Enter PIN in USSD
   - [ ] Receive SMS confirmation

5. **Auto-reconciliation:**
   - [ ] Merchant phone receives SMS
   - [ ] System auto-matches nonce
   - [ ] Merchant account credited
   - [ ] Customer receipt issued

6. **Verify in Admin PWA:**
   - [ ] Navigate to Transactions
   - [ ] Filter by type: "TapMoMo NFC"
   - [ ] Find transaction
   - [ ] Verify nonce matches
   - [ ] Verify HMAC signature

7. **Verify in Database:**

```sql
SELECT * FROM transactions
WHERE type = 'tapmomo_nfc'
AND nonce = '...';

SELECT * FROM merchants
WHERE id = '...';
```

- [ ] Transaction recorded
- [ ] Merchant balance updated
- [ ] Nonce stored (replay protection)

### End-to-End Loan Flow

**Actors:**

- Client (mobile app)
- Staff (admin PWA)

#### Scenario: Client applies and receives loan

1. **Client applies:**
   - [ ] Open client mobile app
   - [ ] Navigate to Loans
   - [ ] Tap "Apply"
   - [ ] Select "Business Loan"
   - [ ] Amount: 500,000 RWF
   - [ ] Term: 12 months
   - [ ] Upload documents
   - [ ] Submit application
   - [ ] Note application ID

2. **Staff reviews:**
   - [ ] Open Admin PWA
   - [ ] Dashboard → "Pending Loans" badge
   - [ ] Click application
   - [ ] Review client profile
   - [ ] Check credit score
   - [ ] Verify documents
   - [ ] Calculate affordability

3. **Staff approves:**
   - [ ] Set interest rate: 12% p.a.
   - [ ] Generate payment schedule
   - [ ] Add approval notes
   - [ ] Click "Approve"
   - [ ] Confirmation dialog
   - [ ] Approve

4. **Client notified:**
   - [ ] Push notification received
   - [ ] "Loan approved!" message
   - [ ] Open app → Loan details
   - [ ] Payment schedule visible
   - [ ] Disbursement date confirmed

5. **Backend disburses:**
   - [ ] Scheduled job runs (or manual trigger)
   - [ ] Amount credited to client account
   - [ ] SMS confirmation sent
   - [ ] Client app balance updates

6. **Verify in Admin PWA:**
   - [ ] Loan status: Active
   - [ ] Outstanding balance correct
   - [ ] Payment schedule generated
   - [ ] Next payment date set

7. **Verify in Database:**

```sql
SELECT * FROM loans WHERE id = '...';

SELECT * FROM loan_payments WHERE loan_id = '...';

SELECT * FROM transactions
WHERE type = 'loan_disbursement'
AND loan_id = '...';
```

- [ ] Loan record created
- [ ] Payment schedule complete
- [ ] Disbursement transaction exists

### Web-to-Mobile 2FA Flow

**Actors:**

- Staff (desktop browser)
- Staff (Android app)

#### Scenario: Staff logs into PWA via QR scan

1. **Desktop side:**
   - [ ] Open Admin PWA
   - [ ] Click "Login"
   - [ ] QR code displays
   - [ ] Note session ID (in DevTools if needed)

2. **Mobile side:**
   - [ ] Open Staff Android app
   - [ ] Tap "Scan QR" or camera icon
   - [ ] Point at desktop screen
   - [ ] QR detected

3. **Mobile approval:**
   - [ ] "Approve Login?" dialog
   - [ ] Shows website URL
   - [ ] Shows timestamp
   - [ ] Shows device info
   - [ ] Tap "Approve"

4. **Desktop login:**
   - [ ] QR screen disappears
   - [ ] Loading indicator
   - [ ] Redirect to dashboard
   - [ ] User logged in
   - [ ] Session created

5. **Verify session:**
   - [ ] Check localStorage for token
   - [ ] Refresh page → Still logged in
   - [ ] Navigate around → No re-auth

6. **Verify in Database:**

```sql
SELECT * FROM qr_auth_sessions
WHERE status = 'approved'
ORDER BY created_at DESC
LIMIT 1;
```

- [ ] Session exists
- [ ] Status: approved
- [ ] Timestamps correct
- [ ] Device info stored

---

## 📊 Performance Testing

### Admin PWA Performance

**Lighthouse Audit:**

```bash
cd apps/admin
pnpm build
pnpm start &
npx lighthouse http://localhost:3100 --view
```

**Target Scores:**

- [ ] Performance: > 90
- [ ] Accessibility: > 95
- [ ] Best Practices: > 90
- [ ] SEO: > 90
- [ ] PWA: > 90

**Metrics:**

- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Speed Index < 4.0s
- [ ] Total Bundle Size < 500KB (gzipped)

### Mobile App Performance

**React Native Performance:**

```bash
npx react-native-performance-monitor
```

**Target Metrics:**

- [ ] App launch < 3s
- [ ] Screen transitions < 300ms
- [ ] List scrolling 60fps
- [ ] Memory usage < 200MB
- [ ] Battery drain < 5%/hour

### Backend Performance

**Supabase Dashboard:**

- [ ] Query performance < 100ms (95th percentile)
- [ ] Edge Function cold start < 1s
- [ ] Edge Function warm < 200ms

**Load Testing:**

```bash
# Install k6
brew install k6

# Run load test
k6 run scripts/load-test.js
```

- [ ] 100 concurrent users
- [ ] Response time < 500ms
- [ ] Error rate < 0.1%
- [ ] No timeouts

---

## 🔐 Security Testing

### Authentication

- [ ] Password complexity enforced
- [ ] Brute force protection (rate limiting)
- [ ] Session timeout (30 minutes)
- [ ] Logout invalidates token
- [ ] XSS protection
- [ ] CSRF protection

### Authorization

- [ ] Role-based access control
- [ ] RLS policies enforce permissions
- [ ] API endpoints check auth
- [ ] Unauthorized requests blocked

### Data Protection

- [ ] Passwords hashed (bcrypt)
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced
- [ ] No secrets in client code
- [ ] No secrets in logs

### NFC Security

- [ ] HMAC signature required
- [ ] Nonce replay protection
- [ ] TTL enforced (120s)
- [ ] Future timestamp skew limited
- [ ] Tamper detection

---

## 📋 Final Checklist

### Pre-Production

- [ ] All critical tests passed
- [ ] No P0/P1 bugs
- [ ] Performance targets met
- [ ] Security audit complete
- [ ] Data backup strategy in place
- [ ] Rollback plan documented

### Documentation

- [ ] User guides written
- [ ] Admin documentation complete
- [ ] API docs up to date
- [ ] Troubleshooting guide ready

### Deployment

- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Edge Functions deployed
- [ ] Mobile apps built and signed
- [ ] PWA deployed to hosting

### Monitoring

- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured
- [ ] Uptime monitoring active
- [ ] Alert rules configured
- [ ] Log aggregation working

### Support

- [ ] Support channels established
- [ ] Escalation process defined
- [ ] On-call rotation scheduled
- [ ] Incident response plan ready

---

## ✅ Sign-Off

**Tested By:** **\*\*\*\***\_**\*\*\*\***  
**Date:** **\*\*\*\***\_**\*\*\*\***  
**Environment:** ☐ Dev ☐ Staging ☐ Production  
**Overall Status:** ☐ Pass ☐ Pass with Issues ☐ Fail

**Notes:**

---

---

---

**Approved for Production:** ☐ Yes ☐ No

**Approver:** **\*\*\*\***\_**\*\*\*\***  
**Date:** **\*\*\*\***\_**\*\*\*\***

---

**Need Help?**

- Check logs: `supabase functions logs`
- Review docs: `PRODUCTION_READY_SUMMARY.md`
- Run automated tests: `./start-testing.sh`

# NFC-Based Mobile Payment System - Implementation Guide

This document provides comprehensive guidance for implementing the NFC payment, USSD integration, SMS ingestion, and token wallet features.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Android Implementation](#android-implementation)
5. [iOS Implementation](#ios-implementation)
6. [Edge Functions](#edge-functions)
7. [UI Components](#ui-components)
8. [Security](#security)
9. [Testing](#testing)
10. [Deployment](#deployment)

## System Overview

### What This System Does

**TapMoMo** is an NFC-based mobile payment intermediation system that enables:

1. **Tap-to-Pay** - Merchant generates payment request, payer taps phone to scan, pays via USSD
2. **Wallet System** - Double-entry token ledger for non-custodial digital currency
3. **SMS Ingestion** - Automatic parsing of MoMo receipt SMS with LLM assistance
4. **Visitor Check-in** - NFC-based visitor registration at SACCO offices

### Key Constraints

- **No Fund Custody**: System never holds money, only tracks allocations
- **No Core Banking Integration**: Works independently of SACCO systems
- **Android-First**: Full NFC + SMS features on Android only
- **iOS Limitations**: Read-only NFC, no SMS access, manual confirmation flows

## Architecture

```
┌─────────────────┐
│  Mobile Client  │
│   (Capacitor)   │
│                 │
│  ┌───────────┐  │
│  │ NFC HCE   │  │ (Android Payee)
│  │ Service   │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │ NFC Reader│  │ (Android/iOS Payer)
│  │  Plugin   │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │   USSD    │  │ (Dial/Send)
│  │  Plugin   │  │
│  └───────────┘  │
└────────┬────────┘
         │
         │ HTTPS/WebSocket
         │
┌────────▼────────────────────────┐
│      Supabase Backend           │
│                                  │
│  ┌──────────────────────────┐  │
│  │  PostgreSQL Database     │  │
│  │  - TapMoMo Tables        │  │
│  │  - Wallet Ledger         │  │
│  │  - Visitor Check-ins     │  │
│  │  - RLS Policies          │  │
│  └──────────────────────────┘  │
│                                  │
│  ┌──────────────────────────┐  │
│  │  Edge Functions (Deno)   │  │
│  │  - wallet-transfer       │  │
│  │  - wallet-operations     │  │
│  │  - tapmomo-reconcile     │  │
│  │  - sms-ai-parse          │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

## Database Schema

### Wallet System Tables

```sql
-- Wallet accounts (one per user/merchant)
app.wallet_accounts (
    id UUID PRIMARY KEY,
    owner_user UUID,
    merchant_id UUID,
    currency TEXT DEFAULT 'USDt',
    label TEXT
)

-- Transaction journal
app.wallet_journal (
    id BIGSERIAL PRIMARY KEY,
    ref TEXT UNIQUE,  -- Idempotency key
    op TEXT,  -- 'mint', 'buy', 'transfer', 'spend', 'burn'
    memo TEXT,
    ts TIMESTAMPTZ
)

-- Double-entry ledger
app.wallet_entries (
    id BIGSERIAL PRIMARY KEY,
    journal_id BIGINT,
    account_id UUID,
    amount NUMERIC(18,2),  -- +credit, -debit
    currency TEXT
)

-- Balance view (aggregated)
app.wallet_balances AS
    SELECT account_id, currency, SUM(amount) as balance
    FROM wallet_entries
    GROUP BY account_id, currency
```

### TapMoMo Tables

```sql
-- Merchant configurations
app.tapmomo_merchants (
    id UUID PRIMARY KEY,
    sacco_id UUID,
    merchant_code TEXT UNIQUE,
    network TEXT,  -- 'MTN', 'Airtel'
    secret_key BYTEA,  -- HMAC key
    is_active BOOLEAN
)

-- Payment transactions
app.tapmomo_transactions (
    id UUID PRIMARY KEY,
    merchant_id UUID,
    nonce UUID UNIQUE,  -- Prevents replay
    amount INTEGER,  -- Minor units
    currency TEXT,
    ref TEXT,
    status TEXT,  -- 'initiated', 'settled', 'failed', 'expired'
    payload_ts TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    payment_id UUID  -- Link to reconciled payment
)
```

### Visitor Check-in Tables

```sql
-- Office kiosks
app.visitor_offices (
    id UUID PRIMARY KEY,
    sacco_id UUID,
    name TEXT,
    nfc_token TEXT,  -- Short-lived token
    token_expires_at TIMESTAMPTZ
)

-- Check-in records
app.visitor_checkins (
    id UUID PRIMARY KEY,
    office_id UUID,
    user_id UUID,
    visitor_name TEXT,
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ
)
```

## Android Implementation

### NFC Reader Plugin

**File**: `apps/client/android/.../nfc/NfcReaderPlugin.kt`

**Features**:
- Reader Mode for NDEF tags
- IsoDep communication for HCE devices
- Automatic tag detection with listeners
- HMAC signature validation
- TTL enforcement

**Usage**:
```typescript
import NfcReader from '@/lib/plugins/nfc-reader';

// Start scanning
await NfcReader.startReaderMode();

// Listen for tags
NfcReader.addListener('nfcTagDetected', (data) => {
  console.log('Tag detected:', data.payload);
});

// Stop scanning
await NfcReader.stopReaderMode();
```

### HCE Payee Service

**File**: `apps/client/android/.../nfc/PayeeCardService.kt`

**Features**:
- Host-based Card Emulation (HCE)
- One-time payload serving
- Automatic expiration after 60s
- APDU command handling

**Usage**:
```kotlin
// Arm payload for transmission
PayeeCardService.arm(ActivePayload(
    payloadJson = """{"amount":5000,"network":"MTN",...}""",
    signatureBase64 = "...",
    merchantAccount = "...",
    expiresAtMillis = System.currentTimeMillis() + 60000
))

// Clear when done
PayeeCardService.clearActivePayload()
```

### USSD Dialer Plugin

**File**: `apps/client/android/.../ussd/UssdDialerPlugin.kt`

**Features**:
- Programmatic USSD (Android 8.0+)
- Fallback to ACTION_DIAL
- Dual-SIM support
- Permission handling

**Usage**:
```typescript
import UssdDialer from '@/lib/plugins/ussd-dialer';

// Check for dual SIM
const { hasDualSim, simCount } = await UssdDialer.hasDualSim();

// Get SIM list
const { simCards } = await UssdDialer.getSimList();

// Dial USSD
const result = await UssdDialer.dialUssd({
  ussdCode: '*182*1*1*5000*123456789#',
  subscriptionId: simCards[0].subscriptionId  // Optional
});
```

### SMS Notification Listener

**File**: `apps/client/android/.../MoMoNotificationListener.java`

**Features**:
- NotificationListenerService for MoMo receipts
- Automatic parsing and ingestion
- Works without SMS permissions
- Background processing

**Setup**:
1. User enables notification access in settings
2. Service listens for MoMo notifications
3. Extracts transaction details
4. Sends to Supabase for parsing

## iOS Implementation

### CoreNFC Reader

**File**: `apps/client/ios/App/NfcReader.swift` (to be created)

**Features**:
- NDEF tag reading
- Background tag reading with URI records
- No HCE support (except EEA with entitlement)
- QR code fallback

**Usage**:
```swift
import CoreNFC

class NfcReader: NSObject, NFCNDEFReaderSessionDelegate {
    func startSession() {
        let session = NFCNDEFReaderSession(
            delegate: self,
            queue: nil,
            invalidateAfterFirstRead: true
        )
        session.begin()
    }
    
    func readerSession(_ session: NFCNDEFReaderSession, 
                      didDetectNDEFs messages: [NFCNDEFMessage]) {
        // Process NDEF messages
    }
}
```

### USSD Handling

iOS cannot programmatically send USSD. Use `tel:` URL scheme:

```typescript
// Copy USSD code to clipboard
await Clipboard.write({ string: ussdCode });

// Open phone app
window.location.href = 'tel:';

// Show instruction to paste
showToast('USSD copied. Paste in the dialer and press call.');
```

## Edge Functions

### Wallet Transfer

**File**: `supabase/functions/wallet-transfer/index.ts`

**Endpoint**: `POST /functions/v1/wallet-transfer`

**Request**:
```json
{
  "from_account_id": "uuid",
  "to_account_id": "uuid",
  "amount": 5000,
  "currency": "USDt",
  "memo": "Payment for services",
  "idempotency_key": "unique-key"
}
```

**Response**:
```json
{
  "success": true,
  "journal_id": 12345
}
```

### Wallet Operations

**File**: `supabase/functions/wallet-operations/index.ts`

**Endpoint**: `POST /functions/v1/wallet-operations`

**Operations**:
- `buy` - Purchase tokens with MoMo
- `mint` - Admin-only token creation
- `burn` - Withdraw tokens to MoMo
- `spend` - Pay merchant with tokens

**Request**:
```json
{
  "operation": "buy",
  "account_id": "uuid",
  "amount": 10000,
  "payment_id": "uuid",
  "memo": "Top-up"
}
```

### SMS AI Parse

**File**: `supabase/functions/sms-ai-parse/index.ts`

Uses OpenAI Structured Outputs for reliable extraction:

```typescript
const schema = {
  type: "object",
  properties: {
    network: { type: "string", enum: ["MTN","Airtel","Other"] },
    amount: { type: "number" },
    currency: { type: "string" },
    txn_id: { type: "string" },
    reference: { type: "string" },
    timestamp: { type: "string", format: "date-time" }
  },
  required: ["amount","currency","timestamp"]
}
```

## UI Components

### Get Paid Screen

**File**: `apps/client/components/tapmomo/get-paid-screen.tsx`

Merchant enters amount, activates NFC, waits for tap.

**Features**:
- Amount input with validation
- Optional reference field
- NFC activation with 60s countdown
- Status indicators (ready/sent/expired)
- QR code fallback

### Tap to Pay Screen

**File**: `apps/client/components/tapmomo/tap-to-pay-screen.tsx`

Payer scans NFC tag, validates, confirms payment via USSD.

**Features**:
- NFC scanning with visual feedback
- Payload validation (signature, TTL)
- Dual-SIM picker if available
- USSD dialing with fallback
- Manual confirmation option

### Wallet Screen

**File**: `apps/client/components/wallet/wallet-screen.tsx`

Token wallet with balance, transactions, and operations.

**Features**:
- Balance display with formatting
- Transfer modal
- Transaction history
- Quick actions (earn, withdraw, vouchers)
- Activity filtering

## Security

### NFC Payload Format

```
momo://pay?
  network=MTN&
  merchant_msisdn=250788123456&
  merchant_code=MERC001&
  amount=5000&
  currency=RWF&
  ref=INV-123&
  nonce=uuid&
  timestamp=1234567890&
  sig=HMAC-SHA256(payload)
```

### HMAC Signature Validation

Server-side validation:

```typescript
const payload = `${timestamp}${network}${amount}${merchant}${ref}${nonce}`;
const expectedSig = crypto
  .createHmac('sha256', merchantSecret)
  .update(payload)
  .digest('base64');

if (expectedSig !== receivedSig) {
  throw new Error('Invalid signature');
}
```

### Replay Attack Prevention

1. **Nonce**: Unique UUID for each payment request
2. **TTL**: 60-120 second expiration
3. **Database**: Track used nonces in `tapmomo_transactions.nonce`
4. **Trigger**: Auto-expire old transactions via pg_cron

### RLS Policies

```sql
-- Users can only see their own wallet
CREATE POLICY wallet_user_isolation ON app.wallet_accounts
  FOR SELECT USING (owner_user = auth.uid());

-- Staff can see transactions for their SACCO
CREATE POLICY tapmomo_sacco_isolation ON app.tapmomo_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app.staff_profiles
      WHERE user_id = auth.uid()
        AND sacco_id = tapmomo_transactions.sacco_id
    )
  );
```

## Testing

### Unit Tests

```bash
# Wallet operations
pnpm test apps/client/tests/unit/wallet.test.ts

# NFC payload validation
pnpm test apps/client/tests/unit/nfc-validator.test.ts
```

### Integration Tests

```bash
# RLS policies
pnpm test:rls

# Edge functions
pnpm test apps/client/tests/integration/wallet-api.test.ts
```

### E2E Tests

```bash
# Playwright tests
pnpm test:e2e apps/client/tests/e2e/tapmomo-flow.spec.ts

# Test dual-SIM handling
pnpm test:e2e apps/client/tests/e2e/ussd-dual-sim.spec.ts
```

### Manual Testing Checklist

#### Android NFC Flow
- [ ] Merchant activates NFC (countdown starts)
- [ ] Payer taps phone to merchant's phone
- [ ] Payload is read and validated
- [ ] USSD dialer opens with pre-filled code
- [ ] User completes payment in dialer
- [ ] SMS receipt is captured (if listener enabled)
- [ ] Transaction reconciled in database

#### iOS NFC Flow
- [ ] Merchant shows QR code (NFC unavailable as payee)
- [ ] Payer scans QR code
- [ ] Payload is validated
- [ ] USSD code copied to clipboard
- [ ] Phone app opens
- [ ] User pastes and dials USSD
- [ ] Manual confirmation in app

#### Wallet Operations
- [ ] User can view balance
- [ ] User can transfer tokens
- [ ] User can buy tokens with MoMo
- [ ] Admin can mint promotional tokens
- [ ] User can withdraw (burn) tokens
- [ ] Double-entry ledger stays balanced
- [ ] Negative balances prevented

## Deployment

### Prerequisites

1. **Supabase Project**: Create and configure
2. **OpenAI API Key**: For SMS parsing
3. **Secrets**: Set in Supabase
4. **Migrations**: Apply all migrations
5. **Edge Functions**: Deploy functions

### Supabase Setup

```bash
# Link project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Deploy edge functions
supabase functions deploy wallet-transfer
supabase functions deploy wallet-operations
supabase functions deploy tapmomo-reconcile

# Set secrets
supabase secrets set \
  OPENAI_API_KEY=$OPENAI_API_KEY \
  HMAC_SHARED_SECRET=$(openssl rand -hex 32)
```

### Mobile App Build

**Android**:
```bash
cd apps/client
pnpm cap sync android
cd android
./gradlew assembleRelease
```

**iOS**:
```bash
cd apps/client
pnpm cap sync ios
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Secrets (server-side only)
HMAC_SHARED_SECRET=xxx
OPENAI_API_KEY=xxx
KMS_DATA_KEY_BASE64=xxx
```

### Post-Deployment Verification

```bash
# Test edge functions
curl -X POST "$SUPABASE_URL/functions/v1/wallet-transfer" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from_account_id":"...","to_account_id":"...","amount":1000}'

# Verify RLS policies
psql $DATABASE_URL -c "SELECT * FROM app.wallet_balances LIMIT 1;"

# Check cron jobs
psql $DATABASE_URL -c "SELECT * FROM cron.job WHERE jobname = 'expire-tapmomo-transactions';"
```

## Troubleshooting

### NFC Not Working (Android)

1. **Check NFC is enabled**: Settings → Connected devices → Connection preferences → NFC
2. **Check permissions**: Manifest includes `<uses-permission android:name="android.permission.NFC"/>`
3. **Check HCE service**: Verify `PayeeCardService` is registered in manifest
4. **Test with NFC Tools**: Use third-party app to verify NFC hardware

### USSD Fails (Android)

1. **Check permission**: CALL_PHONE must be granted
2. **Check carrier**: Some carriers block programmatic USSD
3. **Use fallback**: ACTION_DIAL always works
4. **Test manually**: Try dialing code directly in phone app

### SMS Not Captured

1. **Check notification access**: Settings → Apps → Special app access → Notification access
2. **Check MoMo app**: Ensure notifications are enabled
3. **Check listener**: Verify `MoMoNotificationListener` is running
4. **Fallback**: Use manual SMS forwarding or screenshot upload

### Wallet Balance Incorrect

1. **Check ledger**: Verify all entries are balanced
2. **Run audit**: `SELECT journal_id, SUM(amount) FROM wallet_entries GROUP BY journal_id HAVING SUM(amount) != 0;`
3. **Check triggers**: Ensure `trg_wallet_entries_balanced` is active
4. **Recompute**: Refresh `wallet_balances` view

## Support

For issues or questions:

1. **GitHub Issues**: https://github.com/ikanisa/ibimina/issues
2. **Documentation**: See `docs/` directory
3. **Supabase Logs**: Check edge function logs for errors
4. **Sentry**: Review error tracking dashboard

## License

Proprietary - SACCO+ / Ibimina

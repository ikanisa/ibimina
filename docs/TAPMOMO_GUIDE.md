# TapMoMo NFC Payment System

**TapMoMo** is a contactless mobile money payment system that enables staff to
accept MoMo payments via NFC tap, without requiring mobile money API
integration.

## Overview

TapMoMo uses NFC (Near Field Communication) technology to transmit signed
payment details from a payee's device to a payer's device. The payer then
completes the transaction via USSD.

### Key Features

- ✅ **Offline-capable**: Works without internet connection for NFC tap
- ✅ **Secure**: HMAC-SHA256 signing with replay protection
- ✅ **No API required**: Bypasses mobile money API integration
- ✅ **Fast**: Payment details transmitted in < 1 second
- ✅ **Dual-mode**: Staff devices can act as both payee (receiver) and payer
- ✅ **Auto-reconciliation**: Links NFC payments with SMS notifications

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TapMoMo Flow                              │
└─────────────────────────────────────────────────────────────┘

PAYEE (Merchant/Receiver)                PAYER (Customer)
┌──────────────────────────┐            ┌──────────────────────┐
│  1. Open "Get Paid"      │            │                       │
│  2. Enter amount/ref     │            │                       │
│  3. Activate NFC (60s)   │            │                       │
│  4. Keep device unlocked │            │                       │
│     ▼                    │            │                       │
│  ┌─────────────────┐    │            │                       │
│  │  HCE Service    │    │            │                       │
│  │  (Emulates Card)│    │            │                       │
│  └─────────────────┘    │            │                       │
│           │              │     NFC    │                       │
│           │              │◄──────────►│  1. Tap "Pay"         │
│           │ Signed JSON  │            │  2. Hold near payee   │
│           └──────────────┼───────────►│  3. Read payload      │
│                          │            │  4. Verify HMAC/nonce │
│                          │            │  5. Confirm amount    │
│                          │            │     ▼                 │
│                          │            │  ┌────────────────┐   │
│                          │            │  │ Launch USSD    │   │
│                          │            │  │ *182*8*1*...#  │   │
│                          │            │  └────────────────┘   │
│                          │            │     ▼                 │
│                          │            │  MoMo Network        │
└──────────────────────────┘            └──────────────────────┘
           │                                       │
           │                                       │
           └───────────────────────────────────────┘
                           │
                    SMS Notification
                           ▼
              ┌────────────────────────┐
              │  Supabase Backend      │
              │  - Record transaction  │
              │  - Reconcile with SMS  │
              │  - Update payment      │
              └────────────────────────┘
```

## Technical Specification

### Payload Format

TapMoMo transmits a signed JSON payload over NFC:

```json
{
  "ver": 1,
  "network": "MTN" | "Airtel",
  "merchantId": "123456",
  "currency": "RWF",
  "amount": 2500,           // null = payer enters amount
  "ref": "INV-2025-001",    // optional
  "ts": 1730419200000,      // epoch milliseconds
  "nonce": "uuid-v4",       // prevents replay attacks
  "sig": "base64(HMAC-SHA256(canonicalPayload, merchantSecret))"
}
```

### Security Model

#### HMAC Signing

Canonical form for HMAC computation (exact field order, no spaces):

```
{"ver":1,"network":"MTN","merchantId":"123456","currency":"RWF","amount":2500,"ref":"INV-2025-001","ts":1730419200000,"nonce":"550e8400-e29b-41d4-a716-446655440000"}
```

**Rules:**

- If `ref` is null/empty, omit the key entirely from canonical string
- No spaces, no trailing commas
- Fields in exact order: ver → network → merchantId → currency → amount → ref
  (if present) → ts → nonce
- Compute: `HMAC-SHA256(canonicalPayloadBytes, merchantSecretKey)`
- Encode result as Base64

#### Validation Rules

**Payer device validates:**

1. **TTL Check**: `now - payload.ts ≤ 120 seconds`
2. **Future Skew**: `payload.ts - now ≤ 60 seconds` (allows clock drift)
3. **Nonce Replay**: Cache nonce for 10 minutes; reject if seen before
4. **HMAC Verification**: Recompute HMAC and compare with `payload.sig`

**Penalties for failure:**

- Invalid HMAC → Show warning but allow user to proceed (logs warning)
- Expired TTL → Reject immediately
- Replay nonce → Reject immediately

### NFC Technical Details

#### Android (Payee - HCE)

- **Technology**: Host Card Emulation (HCE)
- **AID**: `F01234567890` (proprietary, avoid payment AIDs like
  `A0000000041010`)
- **Emulation**: ISO 7816-4 Type A card
- **Command**: `SELECT AID` returns JSON payload + `90 00` status
- **Activation**: Manual, 60-second TTL
- **Security**: Requires device unlock (configured in `apduservice.xml`)

#### Android (Payer - Reader)

- **Technology**: Reader Mode (IsoDep)
- **Flags**:
  `FLAG_READER_NFC_A | FLAG_READER_NFC_B | FLAG_READER_SKIP_NDEF_CHECK`
- **Flow**:
  1. Detect tag
  2. Send `SELECT AID` APDU
  3. Receive JSON payload
  4. Validate and display to user
  5. Launch USSD on confirm

#### iOS (Payer - Reader Only)

- **Technology**: CoreNFC (NFCTagReaderSession)
- **Tag Type**: NFCISO7816Tag
- **Limitation**: Cannot emulate HCE (payee mode unavailable on iOS)
- **USSD**: No programmatic dial → Copy code + open Phone app

### USSD Format

```
Network: MTN/Airtel
Code:    *182*8*1*<merchantId>*<amount>#

Examples:
- MTN with amount:    *182*8*1*123456*2500#
- MTN without amount: *182*8*1#
- Airtel:             *182*8*1*123456*2500#
```

**Android Launch:**

1. Try `TelephonyManager.sendUssdRequest()` (API 26+)
2. Fallback: `ACTION_DIAL` with `tel:*182*8*1*123456*2500%23`

**iOS:**

- Copy USSD to clipboard
- Open Phone app (blank)
- Show "Paste and dial" instruction

## Database Schema

```sql
-- Merchants (HMAC key storage)
CREATE TABLE app.tapmomo_merchants (
    id UUID PRIMARY KEY,
    sacco_id UUID REFERENCES app.saccos(id),
    merchant_code TEXT UNIQUE,
    display_name TEXT,
    network TEXT CHECK (network IN ('MTN', 'Airtel')),
    secret_key BYTEA,              -- 32-byte HMAC key
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ
);

-- Transactions (payment records)
CREATE TABLE app.tapmomo_transactions (
    id UUID PRIMARY KEY,
    merchant_id UUID REFERENCES app.tapmomo_merchants(id),
    sacco_id UUID REFERENCES app.saccos(id),
    nonce UUID UNIQUE,             -- From payload; replay protection
    amount INTEGER,                -- In minor units (e.g., 2500 = 25.00 RWF)
    currency TEXT DEFAULT 'RWF',
    ref TEXT,
    network TEXT CHECK (network IN ('MTN', 'Airtel')),
    status TEXT DEFAULT 'initiated' CHECK (status IN (
        'initiated', 'pending', 'settled', 'failed', 'expired'
    )),
    payer_hint TEXT,               -- Phone number if available
    payload_ts TIMESTAMPTZ,        -- From payload
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,        -- payload_ts + TTL
    payment_id UUID REFERENCES app.payments(id)  -- Linked after reconciliation
);

-- Indexes
CREATE INDEX tapmomo_transactions_status_idx ON app.tapmomo_transactions(status);
CREATE INDEX tapmomo_transactions_nonce_idx ON app.tapmomo_transactions(nonce);
CREATE INDEX tapmomo_transactions_merchant_idx ON app.tapmomo_transactions(merchant_id);
```

## API Endpoints

### Admin Web App

#### GET `/api/tapmomo/merchant-key/:id`

Fetch HMAC secret key for merchant (staff only)

**Response:**

```json
{
  "secret_key": "base64EncodedKey"
}
```

#### GET `/api/tapmomo/transactions`

List transactions with filters

**Query params:**

- `sacco_id`: Filter by SACCO
- `status`: Filter by status
- `limit`: Max results (default: 50)

**Response:**

```json
{
  "transactions": [
    {
      "id": "uuid",
      "merchant_name": "Kigali Branch",
      "merchant_code": "123456",
      "amount": 2500,
      "currency": "RWF",
      "status": "settled",
      "network": "MTN",
      "initiated_at": "2025-11-03T12:00:00Z"
    }
  ]
}
```

#### POST `/api/tapmomo/transactions`

Create transaction record after NFC read

**Body:**

```json
{
  "merchant_code": "123456",
  "nonce": "uuid-v4",
  "amount": 2500,
  "currency": "RWF",
  "ref": "INV-2025-001",
  "network": "MTN",
  "sacco_id": "uuid"
}
```

### Supabase Edge Function

#### POST `/functions/v1/tapmomo-reconcile`

Reconcile transaction with payment (called by SMS parser or manually)

**Body:**

```json
{
  "id": "transaction_uuid",
  "status": "settled" | "failed",
  "payer_hint": "+250788123456",
  "error_message": "Insufficient funds"
}
```

**Or by merchant_code + nonce:**

```json
{
  "merchant_code": "123456",
  "nonce": "uuid-v4",
  "status": "settled"
}
```

## Mobile App Integration

### Android Plugin (Capacitor)

```typescript
import { Plugins } from "@capacitor/core";
const { TapMoMo } = Plugins;

// Check NFC availability
const { available, enabled, hceSupported } = await TapMoMo.checkNfcAvailable();

// Payee: Activate "Get Paid" mode
const result = await TapMoMo.armPayee({
  network: "MTN",
  merchantId: "123456",
  amount: 2500, // or null
  ref: "INV-2025-001",
  merchantKey: "base64Key",
  ttlSeconds: 60,
});
// Returns: { success: true, nonce: 'uuid', expiresAt: timestamp }

// Payee: Deactivate
await TapMoMo.disarmPayee();

// Payer: Start reader
await TapMoMo.startReader();

// Listen for payload
TapMoMo.addListener("payloadReceived", (event) => {
  console.log("Payment details:", event);
  // { network, merchantId, amount, currency, ref, nonce }
});

// Listen for errors
TapMoMo.addListener("readerError", (event) => {
  console.error("NFC error:", event.error);
});

// Payer: Stop reader
await TapMoMo.stopReader();

// Launch USSD
await TapMoMo.launchUssd({
  network: "MTN",
  merchantId: "123456",
  amount: 2500,
  subscriptionId: null, // or specific SIM slot ID
});

// Get available SIM cards
const { subscriptions } = await TapMoMo.getActiveSubscriptions();
```

### React Component Example

```tsx
import { TapMoMoDashboard } from "@/components/tapmomo/tapmomo-dashboard";

export default function TapMoMoPage() {
  const merchants = [
    {
      id: "uuid",
      merchant_code: "123456",
      display_name: "Kigali Branch",
      network: "MTN",
      is_active: true,
    },
  ];

  return <TapMoMoDashboard saccoId="sacco-uuid" merchants={merchants} />;
}
```

## User Workflows

### Payee (Merchant/Staff) - "Get Paid"

1. Open admin app → TapMoMo → "Get Paid" tab
2. Select merchant account
3. Enter amount (or leave empty for payer to enter)
4. Enter optional reference
5. Tap "Activate NFC for 60s"
6. Keep screen on and device unlocked
7. Wait for payer to tap their device
8. Transaction appears in "Transactions" tab
9. SMS notification confirms payment
10. Transaction auto-reconciled with payment record

### Payer (Customer/Staff) - "Pay"

1. Open admin app → TapMoMo → "Pay" tab
2. Tap "Tap to Read Payment"
3. Hold device back-to-back with payee's phone (near NFC coil)
4. Payment details appear (merchant, amount, ref)
5. Confirm amount (or enter if not specified)
6. Select SIM card (if dual-SIM)
7. Tap "Pay Now"
8. USSD dialog opens or dialer with pre-filled code
9. Complete USSD flow on mobile network
10. Transaction recorded and awaits SMS confirmation

## NFC Tips & Troubleshooting

### Device Compatibility

✅ **Works:**

- NFC-enabled Android 8.0+ (API 26+)
- Samsung, Google Pixel, Xiaomi, OnePlus, etc.
- Dual SIM supported

❌ **Does NOT work:**

- Non-NFC devices
- iOS (payee mode only; payer mode works with CoreNFC on iPhone 7+)
- Android < 8.0 (HCE available but USSD launch limited)

### NFC Coil Location

| Device Brand | Typical Location         |
| ------------ | ------------------------ |
| Samsung      | Center-back, near camera |
| Google Pixel | Center-back              |
| Xiaomi       | Center or top-back       |
| OnePlus      | Center-back              |

**Tip**: Search "where is NFC coil on [your device model]"

### Common Issues

#### "NFC not available"

- Device doesn't have NFC hardware
- **Solution**: Use a different device

#### "NFC is disabled"

- NFC is turned off in system settings
- **Solution**: Settings → Connected devices → NFC → Enable

#### "Failed to read payment details"

- Devices not aligned properly
- Screen locked or device asleep
- Payload expired (> 60 seconds)
- **Solution**:
  - Hold devices back-to-back with centers aligned
  - Keep payee device unlocked and screen on
  - Re-activate payee mode if expired

#### "USSD launch failed" (Android)

- Carrier blocks `sendUssdRequest()`
- SIM not ready or airplane mode
- **Solution**: App automatically falls back to ACTION_DIAL; manually dial from
  opened dialer

#### "Cannot dial USSD" (iOS)

- iOS blocks programmatic USSD dialing
- **Solution**: App copies USSD to clipboard and opens Phone app; paste and dial
  manually

#### "Payload validation failed"

- HMAC mismatch (wrong merchant key)
- Expired timestamp
- Replay attack (nonce seen before)
- **Solution**:
  - Verify merchant key is correct
  - Check device clocks are synchronized
  - Re-activate payee mode with fresh payload

## Security Considerations

### Threat Model

| Threat        | Mitigation                                                     |
| ------------- | -------------------------------------------------------------- |
| Eavesdropping | HMAC signature prevents tampering; NFC range ~4cm              |
| Replay attack | Nonce cached for 10 minutes; reject duplicates                 |
| MITM          | Signed payload; payer verifies HMAC with shared secret         |
| Clock skew    | Allow ±60 seconds future skew                                  |
| Stolen key    | Store keys in secure storage (Android Keystore / iOS Keychain) |
| Phishing      | Display merchant name from verified database                   |

### Best Practices

1. **Rotate merchant keys** quarterly
2. **Monitor replay attempts** (nonce collision alerts)
3. **Rate-limit** payee activation (max 10/hour per staff)
4. **Log all transactions** for audit trail
5. **Reconcile daily** with MoMo SMS notifications
6. **Alert on mismatches** (transaction vs SMS amount)

## Testing

### Manual Test Script

**Prerequisites:**

- 2 NFC-enabled Android devices (or 1 Android + 1 iPhone for payer mode)
- Admin app installed on both
- Test merchant configured in database
- NFC enabled on both devices

**Test 1: Basic Payment Flow**

1. Device A (Payee):
   - Open TapMoMo → "Get Paid"
   - Select test merchant
   - Enter amount: 2500 RWF
   - Enter ref: "TEST-001"
   - Tap "Activate NFC"
   - Verify: Green "NFC Active" banner appears

2. Device B (Payer):
   - Open TapMoMo → "Pay"
   - Tap "Tap to Read Payment"
   - Hold back-to-back with Device A for 1-2 seconds
   - Verify: Payment details appear correctly
   - Tap "Pay Now"
   - Verify: USSD opens (Android) or clipboard has code (iOS)

**Test 2: Replay Protection**

1. Complete Test 1
2. Device B: Try to read from Device A again immediately
3. Expected: "Payload already consumed" error

**Test 3: Expiration**

1. Device A: Activate payee mode
2. Wait 65 seconds
3. Device B: Try to read
4. Expected: "No active payload" or timeout

**Test 4: HMAC Validation**

1. Manually craft payload with wrong signature
2. Device B: Read payload
3. Expected: "Invalid signature" warning (but allows proceed)

**Test 5: Amount Entry by Payer**

1. Device A: Activate without amount (leave empty)
2. Device B: Read payload
3. Verify: Amount field is editable
4. Enter custom amount
5. Tap "Pay Now"
6. Verify: USSD includes custom amount

## Deployment Checklist

- [ ] **Database migration applied** (`20260301000000_tapmomo_system.sql`)
- [ ] **Supabase Edge Function deployed** (`tapmomo-reconcile`)
- [ ] **Android app includes TapMoMo plugin** (Kotlin files in `tapmomo/`
      package)
- [ ] **APK signed and distributed** to staff devices
- [ ] **Merchants configured** with secret keys
- [ ] **SMS parser updated** to reconcile TapMoMo transactions
- [ ] **Admin web app updated** with TapMoMo UI components
- [ ] **NFC permissions granted** (`android.permission.NFC`)
- [ ] **HCE service registered** (`apduservice.xml` configured)
- [ ] **Staff training** completed (user workflows)
- [ ] **Test devices verified** (NFC working)
- [ ] **Monitoring enabled** (transaction logs, errors)
- [ ] **Backup plan** (USSD fallback documented)

## Future Enhancements

### Roadmap

- **v1.1**: iOS payee mode (requires Apple HCE enrollment)
- **v1.2**: QR code fallback (for non-NFC devices)
- **v1.3**: Bluetooth Low Energy (BLE) alternative
- **v1.4**: Biometric confirmation before USSD launch
- **v1.5**: Multi-currency support (USD, EUR)
- **v2.0**: Direct API integration (bypass USSD)

### Research Items

- **Payment Card Industry (PCI) compliance** for key storage
- **Certified Payment Application (CPA)** requirements
- **EMV contactless** standards alignment
- **Offline transaction queue** (batch reconciliation)
- **P2P transfers** (staff-to-staff)

## Support

### Documentation

- [NFC Basics](https://developer.android.com/guide/topics/connectivity/nfc)
- [HCE Guide](https://developer.android.com/guide/topics/connectivity/nfc/hce)
- [CoreNFC (iOS)](https://developer.apple.com/documentation/corenfc)
- [ISO 7816-4 Spec](https://www.iso.org/standard/54550.html)

### Common Questions

**Q: Can I use TapMoMo without NFC?**  
A: No, NFC is required. Consider QR code fallback (v1.2 roadmap).

**Q: Does this work with all mobile networks?**  
A: Currently MTN and Airtel Rwanda. USSD codes are network-specific.

**Q: What if USSD doesn't launch automatically?**  
A: App falls back to dialer with pre-filled code; dial manually.

**Q: How do I test without real money?**  
A: Use test merchant accounts with test SIMs (no actual debit).

**Q: Can staff accept payments offline?**  
A: Yes, NFC tap works offline. USSD requires network. Transaction reconciled
when online.

**Q: What's the transaction limit?**  
A: No technical limit; follow mobile network USSD transaction limits (typically
1,000,000 RWF/day).

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-03  
**Maintainer**: Ibimina Platform Team

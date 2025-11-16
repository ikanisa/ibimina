# Comprehensive System Implementation Plan

## Ibimina SACCO Management Platform

**Date:** 2025-11-03  
**Status:** Implementation In Progress  
**Scope:** Complete system with 4 apps + shared packages + SMS payment
integration

---

## 🎯 System Overview

### Applications to Deliver

1. **Staff Admin PWA** (`apps/staff-admin-pwa`) ✅ EXISTS
   - Technology: Vite + React 18 + TypeScript + Material UI
   - Features: User management, orders, tickets, settings, offline support
   - Deployment: Docker + Nginx (HTTP/HTTPS), Node preview server
   - Status: **COMPLETE** - Needs integration only

2. **Staff Admin Android** (`apps/staff-admin-android`) 🆕 TO CREATE
   - Technology: React Native (Android ONLY)
   - **Special Feature**: SMS parsing for mobile money payments
   - SMS Access: Read payment notification SMS → Parse with OpenAI →
     Auto-allocate to users
   - Deployment: APK build for Android devices
   - Status: **TO IMPLEMENT**

3. **Client Mobile App** (`apps/client-mobile`) 🆕 TO CREATE
   - Technology: React Native (Android + iOS)
   - Features: Account management, transactions, mobile money, ikimina groups
   - Deployment: Android APK + iOS IPA
   - Status: **TO IMPLEMENT**

4. **Existing Apps** (Keep As-Is)
   - `apps/admin` - Next.js staff console (keep)
   - `apps/staff` - Next.js staff app (keep)
   - `apps/client` - Next.js client web (keep)
   - `apps/mobile` - Expo client (may consolidate with client-mobile)
   - `apps/platform-api` - Backend API (keep)

---

## 📦 Shared Packages Architecture

### New Packages to Create

1. **`packages/sms-parser`** - SMS Payment Parsing

   ```typescript
   - OpenAI integration for SMS parsing
   - Mobile money provider templates (MTN, Airtel, etc.)
   - Payment validation and structuring
   - Supabase integration for payment records
   ```

2. **`packages/mobile-shared`** - React Native Components

   ```typescript
   - Shared UI components for mobile apps
   - Authentication flows
   - Payment widgets
   - Navigation patterns
   ```

3. **`packages/api-client`** - Unified API Client

   ```typescript
   - Type-safe Supabase client
   - HTTP interceptors
   - Error handling
   - Offline queue
   ```

4. **`packages/types`** - Shared TypeScript Types
   ```typescript
   - User models
   - Transaction types
   - Payment DTOs
   - API contracts
   ```

---

## 🔐 SMS Payment Integration (Mobile Money)

### Problem Statement

Rwanda's mobile money services (MTN MoMo, Airtel Money) send SMS notifications
when payments are received. We need to:

1. Read these SMS messages
2. Parse payment details (amount, sender, reference)
3. Match to user accounts
4. Auto-approve and allocate payments
5. Notify users of successful payment

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Staff Admin Android App (SMS Parser)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SMS Permission Request                                  │
│     ↓                                                        │
│  2. Read SMS Inbox (filter by mobile money senders)        │
│     ↓                                                        │
│  3. Send SMS text to OpenAI API                            │
│     ↓                                                        │
│  4. OpenAI parses structure:                                │
│     {                                                        │
│       provider: "MTN",                                       │
│       amount: 5000,                                          │
│       sender: "250788123456",                                │
│       reference: "TXN12345",                                 │
│       timestamp: "2025-11-03T10:30:00Z"                     │
│     }                                                        │
│     ↓                                                        │
│  5. Match sender phone to users table                       │
│     ↓                                                        │
│  6. Create payment record in Supabase                       │
│     ↓                                                        │
│  7. Auto-approve if amount matches pending transaction      │
│     ↓                                                        │
│  8. Send push notification to user                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 1: SMS Permission (React Native)

```typescript
import { PermissionsAndroid } from "react-native";
import SmsAndroid from "react-native-get-sms-android";

async function requestSmsPermission() {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_SMS
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}
```

#### Step 2: Read SMS Messages

```typescript
async function readMobileMoneyS ms() {
  const filter = {
    box: 'inbox',
    address: ['MTN', 'Airtel', 'Mobile Money'], // Sender filters
    maxCount: 50
  };

  return new Promise((resolve, reject) => {
    SmsAndroid.list(
      JSON.stringify(filter),
      fail => reject(fail),
      (count, smsList) => {
        const messages = JSON.parse(smsList);
        resolve(messages);
      }
    );
  });
}
```

#### Step 3: OpenAI Parsing

```typescript
import OpenAI from "openai";

async function parseSmsWithOpenAI(smsBody: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
    Parse this mobile money SMS notification and extract:
    - provider (MTN, Airtel, etc.)
    - amount (numeric)
    - sender phone number
    - transaction reference
    - timestamp
    
    SMS: "${smsBody}"
    
    Return only valid JSON:
    {
      "provider": "string",
      "amount": number,
      "sender": "string",
      "reference": "string",
      "timestamp": "ISO 8601"
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1, // Low temperature for consistent parsing
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

#### Step 4: User Matching & Payment Allocation

```typescript
import { createClient } from "@supabase/supabase-js";

async function allocatePayment(parsedSms: ParsedPayment) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Find user by phone number
  const { data: user } = await supabase
    .from("users")
    .select("id, name, phone")
    .eq("phone", parsedSms.sender)
    .single();

  if (!user) {
    // Create unmatched payment record for manual review
    await supabase.from("unmatched_payments").insert({
      sms_body: parsedSms.raw_sms,
      parsed_data: parsedSms,
      status: "pending_review",
    });
    return { matched: false };
  }

  // 2. Check for pending transactions
  const { data: pendingTxn } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .eq("amount", parsedSms.amount)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // 3. Create payment record
  const { data: payment } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      transaction_id: pendingTxn?.id,
      provider: parsedSms.provider,
      amount: parsedSms.amount,
      reference: parsedSms.reference,
      sender_phone: parsedSms.sender,
      status: pendingTxn ? "approved" : "pending_approval",
      parsed_at: new Date().toISOString(),
      sms_timestamp: parsedSms.timestamp,
    })
    .select()
    .single();

  // 4. Auto-approve if matched
  if (pendingTxn) {
    await supabase
      .from("transactions")
      .update({ status: "completed", payment_id: payment.id })
      .eq("id", pendingTxn.id);
  }

  // 5. Send notification
  await supabase.from("notifications").insert({
    user_id: user.id,
    title: "Payment Received",
    body: `Your payment of ${parsedSms.amount} RWF has been confirmed.`,
    type: "payment_confirmed",
  });

  return { matched: true, payment, user };
}
```

---

## 🏗️ Project Structure

```
ibimina/ (monorepo)
├── apps/
│   ├── admin/                    # Next.js staff console (existing)
│   ├── staff/                    # Next.js staff app (existing)
│   ├── staff-admin-pwa/          # Vite React PWA (✅ complete)
│   ├── staff-admin-android/      # React Native (🆕 to create)
│   │   ├── android/              # Android native code
│   │   ├── src/
│   │   │   ├── screens/          # UI screens
│   │   │   ├── services/
│   │   │   │   ├── sms-reader.ts
│   │   │   │   ├── openai-parser.ts
│   │   │   │   └── payment-allocator.ts
│   │   │   └── hooks/
│   │   ├── app.json              # Expo config
│   │   └── package.json
│   ├── client/                   # Next.js client web (existing)
│   ├── client-mobile/            # React Native client (🆕 to create)
│   │   ├── android/              # Android native
│   │   ├── ios/                  # iOS native
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── navigation/
│   │   │   └── components/
│   │   ├── app.json
│   │   └── package.json
│   ├── mobile/                   # Existing Expo (might consolidate)
│   ├── platform-api/             # Backend API (existing)
│   └── website/                  # Public website (existing)
│
├── packages/
│   ├── sms-parser/              # 🆕 SMS payment parsing
│   │   ├── src/
│   │   │   ├── openai-client.ts
│   │   │   ├── providers/
│   │   │   │   ├── mtn.ts
│   │   │   │   ├── airtel.ts
│   │   │   │   └── index.ts
│   │   │   ├── parser.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── mobile-shared/           # 🆕 Shared RN components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── navigation/
│   │   │   └── theme/
│   │   └── package.json
│   │
│   ├── api-client/              # 🆕 Unified API client
│   │   ├── src/
│   │   │   ├── supabase.ts
│   │   │   ├── http.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/                   # 🆕 Shared types
│   │   ├── src/
│   │   │   ├── user.ts
│   │   │   ├── payment.ts
│   │   │   ├── transaction.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── [existing packages...]
│
├── supabase/
│   ├── migrations/
│   │   └── 20251103_add_sms_payments_tables.sql  # 🆕
│   └── functions/
│       └── process-sms-payment/                   # 🆕
│
└── docs/
    ├── SMS_PAYMENT_INTEGRATION.md                 # 🆕
    ├── STAFF_ADMIN_ANDROID_SETUP.md               # 🆕
    └── CLIENT_MOBILE_SETUP.md                     # 🆕
```

---

## 🗄️ Database Schema Changes

### New Tables for SMS Payments

```sql
-- payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  transaction_id UUID REFERENCES transactions(id),
  provider VARCHAR(50) NOT NULL, -- MTN, Airtel, etc.
  amount DECIMAL(15,2) NOT NULL,
  reference VARCHAR(100),
  sender_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  parsed_at TIMESTAMP WITH TIME ZONE,
  sms_timestamp TIMESTAMP WITH TIME ZONE,
  sms_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- unmatched_payments (for manual review)
CREATE TABLE unmatched_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sms_body TEXT NOT NULL,
  parsed_data JSONB,
  status VARCHAR(20) DEFAULT 'pending_review',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- sms_parsing_logs (for debugging)
CREATE TABLE sms_parsing_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id VARCHAR(100),
  sms_body TEXT,
  openai_request JSONB,
  openai_response JSONB,
  parsed_data JSONB,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_sender_phone ON payments(sender_phone);
CREATE INDEX idx_unmatched_payments_status ON unmatched_payments(status);
```

---

## 📱 React Native Apps Configuration

### Staff Admin Android (SMS Parser)

**Key Dependencies:**

```json
{
  "dependencies": {
    "react-native": "^0.73.0",
    "expo": "~50.0.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-get-sms-android": "^2.0.0",
    "openai": "^4.20.0",
    "@supabase/supabase-js": "^2.38.0",
    "react-native-permissions": "^4.0.0",
    "react-native-background-actions": "^3.0.0",
    "react-native-push-notification": "^8.1.1"
  }
}
```

**Permissions (android/app/src/main/AndroidManifest.xml):**

```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

### Client Mobile App (Android + iOS)

**Key Dependencies:**

```json
{
  "dependencies": {
    "react-native": "^0.73.0",
    "expo": "~50.0.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@supabase/supabase-js": "^2.38.0",
    "react-native-biometrics": "^3.0.1",
    "react-native-keychain": "^8.1.2",
    "@ibimina/mobile-shared": "workspace:*",
    "@ibimina/api-client": "workspace:*",
    "@ibimina/types": "workspace:*"
  }
}
```

---

## 🚀 Implementation Phases

### Phase 1: Shared Packages (Week 1)

- [ ] Create `packages/types`
- [ ] Create `packages/api-client`
- [ ] Create `packages/sms-parser`
- [ ] Create `packages/mobile-shared`
- [ ] Add unit tests for each package

### Phase 2: Database & Backend (Week 1)

- [ ] Create SMS payments migration
- [ ] Create Supabase Edge Function for payment processing
- [ ] Add RLS policies
- [ ] Test with sample data

### Phase 3: Staff Admin Android (Week 2)

- [ ] Initialize React Native project
- [ ] Implement SMS reading
- [ ] Integrate OpenAI parsing
- [ ] Build payment allocation logic
- [ ] Create UI for payment review
- [ ] Add background service for automatic parsing
- [ ] Test on physical Android device
- [ ] Build APK

### Phase 4: Client Mobile App (Week 3)

- [ ] Initialize React Native project (both platforms)
- [ ] Implement authentication
- [ ] Build account dashboard
- [ ] Create transaction history
- [ ] Add mobile money payment flow
- [ ] Implement ikimina groups feature
- [ ] Test on Android + iOS
- [ ] Build APK + IPA

### Phase 5: Integration & Testing (Week 4)

- [ ] End-to-end SMS payment flow test
- [ ] Load testing
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Documentation finalization
- [ ] Deployment preparation

---

## 🔑 Environment Variables

### Staff Admin Android

```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SMS_POLLING_INTERVAL=300000  # 5 minutes
AUTO_APPROVE_THRESHOLD=50000  # RWF
```

### Client Mobile

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
API_BASE_URL=https://api.ibimina.rw
ENVIRONMENT=production
```

---

## 📋 Testing Strategy

### SMS Payment Integration Tests

1. **Unit Tests** (Jest)
   - SMS parsing logic
   - OpenAI response parsing
   - User matching algorithm
   - Payment allocation logic

2. **Integration Tests**
   - End-to-end SMS → Payment flow
   - Supabase integration
   - Notification delivery

3. **Manual Testing**
   - Real SMS messages from mobile money providers
   - Edge cases (multiple payments, duplicates, etc.)
   - Performance under load

### Mobile App Tests

1. **Unit Tests** - Component logic
2. **E2E Tests** - Detox for React Native
3. **Device Testing** - Physical Android + iOS devices

---

## 📚 Documentation Deliverables

1. **SMS_PAYMENT_INTEGRATION.md**
   - Complete setup guide
   - OpenAI prompt engineering
   - Troubleshooting guide

2. **STAFF_ADMIN_ANDROID_SETUP.md**
   - Build instructions
   - Permissions setup
   - Deployment to devices

3. **CLIENT_MOBILE_SETUP.md**
   - iOS + Android build
   - App Store / Play Store submission
   - Deep linking setup

4. **API_DOCUMENTATION.md**
   - All endpoints
   - Authentication
   - Webhooks

---

## 🎯 Success Criteria

### Staff Admin Android

- ✅ Successfully reads SMS from MTN/Airtel
- ✅ Parses payment details with >95% accuracy
- ✅ Matches payments to users automatically
- ✅ Processes 100+ SMS per minute
- ✅ Staff can manually review unmatched payments

### Client Mobile

- ✅ Works on Android 8.0+ and iOS 13+
- ✅ Users can view account balance
- ✅ Users can initiate mobile money payments
- ✅ Push notifications work
- ✅ Offline mode for viewing history

### System Integration

- ✅ All apps share types and API client
- ✅ Real-time sync across web and mobile
- ✅ Consistent authentication
- ✅ Under 3s payment processing time

---

## 🔒 Security Considerations

1. **SMS Permissions**
   - Request only READ_SMS (not SEND_SMS)
   - Explain clearly why permission is needed
   - Store minimal SMS data

2. **OpenAI API**
   - Never send user PII to OpenAI
   - Use GPT-4-turbo for better parsing
   - Rate limit API calls
   - Cache common patterns

3. **Payment Data**
   - Encrypt SMS bodies at rest
   - Use Supabase RLS for access control
   - Audit all payment approvals
   - Implement fraud detection

4. **Mobile Apps**
   - Biometric authentication
   - Certificate pinning
   - Secure storage for tokens
   - No hardcoded secrets

---

## 📊 Monitoring & Observability

### Metrics to Track

- SMS parsing success rate
- Payment matching accuracy
- API response times
- Error rates by provider (MTN vs Airtel)
- Manual review queue length

### Alerts

- Parsing accuracy drops below 90%
- Unmatched payments queue > 50
- OpenAI API errors
- Supabase connection issues

---

## 🚢 Deployment Strategy

### Staff Admin Android

1. Build APK with `eas build --platform android`
2. Sign with keystore
3. Distribute via:
   - Internal testing (Firebase App Distribution)
   - Play Store (private track)
   - Direct APK download (for staff devices)

### Client Mobile

1. Build for both platforms
2. Submit to App Stores:
   - Google Play Store
   - Apple App Store
3. Implement CodePush for OTA updates
4. Version management strategy

---

## 💰 Cost Estimates

### OpenAI API

- SMS parsing: ~$0.01 per 100 SMS
- Expected: 1000 SMS/day = $0.10/day = $3/month

### Supabase

- Current plan should suffice
- Monitor database growth
- May need upgrade for high volume

### Mobile Infrastructure

- Play Store: $25 one-time
- App Store: $99/year
- Code signing certificates: varies

---

## 📞 Support & Maintenance

### Staff Training Required

1. How to use Staff Admin Android app
2. Manual payment review process
3. Handling edge cases
4. Troubleshooting SMS parsing issues

### Ongoing Maintenance

- Update mobile money provider templates
- Refine OpenAI prompts based on new SMS formats
- Monitor and improve matching accuracy
- Regular security audits

---

## ✅ Next Steps

1. **Immediate**: Create shared packages structure
2. **Week 1**: Implement SMS parser package with OpenAI
3. **Week 1**: Database migrations for payments
4. **Week 2**: Build Staff Admin Android app
5. **Week 3**: Build Client Mobile app
6. **Week 4**: Integration testing and deployment

---

**Last Updated:** 2025-11-03  
**Document Owner:** Development Team  
**Review Frequency:** Weekly during implementation

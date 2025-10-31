# Authentication Implementation Guide

## Overview

This document describes the complete authentication system for the SACCO+ platform, including:

1. **Staff Mobile App Authentication** - Email/password login for staff members
2. **Client App Authentication** - WhatsApp OTP authentication for SACCO members
3. **Biometric Authentication** - Optional biometric login for mobile apps
4. **Permission System** - Granular access control for member features

## Table of Contents

- [Architecture](#architecture)
- [Staff Authentication](#staff-authentication)
- [Client Authentication](#client-authentication)
- [Biometric Authentication](#biometric-authentication)
- [Permission System](#permission-system)
- [API Reference](#api-reference)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Architecture

### Authentication Flows

```
┌─────────────────────────────────────────────────────────────────┐
│                     SACCO+ Authentication                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐              ┌──────────────────┐          │
│  │  Staff Mobile   │              │   Client App     │          │
│  │   Application   │              │  (Members)       │          │
│  └────────┬────────┘              └────────┬─────────┘          │
│           │                                │                     │
│           │ Email/Password                 │ WhatsApp OTP        │
│           │ (Created by admin)             │ (Self-service)      │
│           │                                │                     │
│           v                                v                     │
│  ┌─────────────────────────────────────────────────────┐        │
│  │          Supabase Auth (PostgreSQL + Auth)          │        │
│  ├─────────────────────────────────────────────────────┤        │
│  │  • app.user_profiles (staff)                        │        │
│  │  • members_app_profiles (clients)                   │        │
│  │  • whatsapp_otp_codes                               │        │
│  │  • member_permissions                               │        │
│  │  • device_auth_keys (biometric)                     │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

#### Staff Profiles
```sql
-- app.user_profiles (staff)
user_id     UUID        PRIMARY KEY (references auth.users)
sacco_id    UUID        References SACCO organization
role        TEXT        'SYSTEM_ADMIN' | 'SACCO_MANAGER' | 'SACCO_STAFF'
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

#### Member Profiles
```sql
-- members_app_profiles (clients)
id                      UUID        PRIMARY KEY
user_id                 UUID        UNIQUE (references auth.users)
whatsapp_msisdn         TEXT        NOT NULL
momo_msisdn             TEXT        NOT NULL
whatsapp_verified       BOOLEAN     DEFAULT false
whatsapp_verified_at    TIMESTAMPTZ
biometric_enabled       BOOLEAN     DEFAULT false
biometric_enrolled_at   TIMESTAMPTZ
last_login_at           TIMESTAMPTZ
id_type                 TEXT        'NID' | 'DL' | 'PASSPORT'
id_number               TEXT
preferred_language      TEXT        DEFAULT 'en'
```

#### WhatsApp OTP Codes
```sql
-- app.whatsapp_otp_codes
id            UUID        PRIMARY KEY
phone_number  TEXT        NOT NULL
code_hash     TEXT        NOT NULL (bcrypt hashed)
expires_at    TIMESTAMPTZ NOT NULL (5 minutes)
attempts      INTEGER     DEFAULT 0 (max 3)
consumed_at   TIMESTAMPTZ NULL until verified
created_at    TIMESTAMPTZ
```

#### Member Permissions
```sql
-- member_permissions
id           UUID               PRIMARY KEY
user_id      UUID               NOT NULL (references auth.users)
permission   member_permission  ENUM
granted_at   TIMESTAMPTZ       
granted_by   UUID               References auth.users
expires_at   TIMESTAMPTZ        NULL for permanent

-- Permission types:
- 'VIEW_BALANCE'      : View account balance
- 'VIEW_TRANSACTIONS' : View transaction history
- 'MAKE_PAYMENTS'     : Initiate payments
- 'VIEW_GROUPS'       : View savings groups
- 'JOIN_GROUPS'       : Join savings groups
- 'MANAGE_PROFILE'    : Update profile information
```

## Staff Authentication

### Overview

Staff members (SACCO admins, managers, and staff) use email/password authentication. Accounts are created by system administrators or through the web app.

### Key Rules

1. **Account Creation**: Only system admins can create staff accounts
2. **Password Changes**: Can only be changed via web app, NOT mobile app
3. **Mobile Access**: Staff mobile app provides read-only authentication
4. **Roles**: Three staff roles (SYSTEM_ADMIN, SACCO_MANAGER, SACCO_STAFF)

### Web App Password Change (Allowed)

```typescript
// apps/admin/app/api/admin/staff/reset-password/route.ts
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { userId, newPassword } = await req.json();
  
  const supabase = createSupabaseAdminClient();
  
  // Only allow if user is authenticated via web app
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  
  // ... handle response
}
```

### Mobile App Login (Email/Password Only)

The staff mobile app should:

1. Accept email/password credentials
2. Authenticate via Supabase Auth
3. Display "Password changes must be done via web app" message
4. NOT provide password change functionality

## Client Authentication

### Overview

SACCO members authenticate using WhatsApp OTP (One-Time Password). This provides:

- Phone number verification
- Passwordless authentication
- Self-service account creation
- WhatsApp as trusted communication channel

### Authentication Flow

```
1. User enters WhatsApp number
   ↓
2. System validates format
   ↓
3. Generate 6-digit OTP
   ↓
4. Send OTP via WhatsApp Business API
   ↓
5. User enters OTP
   ↓
6. Verify OTP (max 3 attempts)
   ↓
7. Create/authenticate user
   ↓
8. Grant default permissions
   ↓
9. Redirect to app home
```

### Implementation

#### Step 1: Request OTP

```typescript
// apps/client/app/(auth)/login/page.tsx
const handleSendOTP = async () => {
  const supabase = createClient();
  
  const { data, error } = await supabase.functions.invoke("whatsapp-otp-send", {
    body: { phone_number: phoneNumber },
  });
  
  if (data.success) {
    // Move to OTP verification step
    setStep("otp");
    setExpiresAt(new Date(data.expires_at));
  }
};
```

#### Step 2: Verify OTP

```typescript
const handleVerifyOTP = async () => {
  const supabase = createClient();
  
  const { data, error } = await supabase.functions.invoke("whatsapp-otp-verify", {
    body: { phone_number: phoneNumber, code: otpCode },
  });
  
  if (data.success) {
    // Set session and redirect
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    
    router.push("/");
  }
};
```

### Edge Functions

#### whatsapp-otp-send

**Endpoint**: `https://[project-ref].supabase.co/functions/v1/whatsapp-otp-send`

**Request**:
```json
{
  "phone_number": "+250781234567"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expires_at": "2025-12-01T10:35:00Z"
}
```

**Security Features**:
- Rate limiting: 3 OTPs per phone per hour
- OTP hashed with bcrypt before storage
- 5-minute expiry time
- Audit logging

#### whatsapp-otp-verify

**Endpoint**: `https://[project-ref].supabase.co/functions/v1/whatsapp-otp-verify`

**Request**:
```json
{
  "phone_number": "+250781234567",
  "code": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "user": {
      "id": "uuid",
      "phone": "+250781234567"
    }
  }
}
```

**Security Features**:
- Max 3 verification attempts
- Automatic OTP consumption
- Rate limiting: 10 attempts per phone per hour
- User creation if not exists

## Biometric Authentication

### Overview

After initial WhatsApp OTP authentication, members can enable biometric authentication for subsequent logins.

### Features

- Optional (user can choose)
- Device-bound keys (Android Keystore)
- Biometric verification required for each use
- Multiple device support

### Enrollment Flow

```
1. User logs in with WhatsApp OTP
   ↓
2. App prompts: "Enable biometric login?"
   ↓
3. User accepts
   ↓
4. Generate EC P-256 keypair in Android Keystore
   ↓
5. Enroll device with public key
   ↓
6. Biometric enabled for next login
```

### Implementation

See `DEVICE_AUTH_IMPLEMENTATION.md` for complete details on the device-bound authentication system.

#### Enable Biometrics

```typescript
// apps/client/lib/device-auth/manager.ts
import { deviceAuthManager } from "@/lib/device-auth";

const enableBiometric = async () => {
  const result = await deviceAuthManager.enrollDevice(
    userId,
    "My Phone",
    authToken
  );
  
  if (result.success) {
    // Update profile
    await supabase
      .from("members_app_profiles")
      .update({
        biometric_enabled: true,
        biometric_enrolled_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  }
};
```

#### Biometric Login

After enrollment, users can:
1. Scan QR code from web app
2. Approve with biometric (fingerprint/face)
3. Automatically log in to web session

## Permission System

### Overview

Granular access control for member features. Permissions can be granted/revoked by staff.

### Default Permissions

When a new member account is created, they automatically receive:

- `VIEW_BALANCE` - View account balance
- `VIEW_TRANSACTIONS` - View transaction history  
- `VIEW_GROUPS` - View savings groups
- `MANAGE_PROFILE` - Update profile information

### Permission Management

#### Check Permission

```typescript
// Check if user has permission
const hasPaymentPermission = await supabase.rpc("has_permission", {
  _user_id: userId,
  _permission: "MAKE_PAYMENTS",
});
```

#### Grant Permission

```typescript
// Staff grants permission to member
await supabase
  .from("member_permissions")
  .insert({
    user_id: memberId,
    permission: "MAKE_PAYMENTS",
    granted_by: staffUserId,
  });
```

#### Revoke Permission

```typescript
// Staff revokes permission
await supabase
  .from("member_permissions")
  .delete()
  .eq("user_id", memberId)
  .eq("permission", "MAKE_PAYMENTS");
```

### Permission-Based UI

```typescript
// Conditionally render based on permission
const PaymentButton = () => {
  const [canPay, setCanPay] = useState(false);
  
  useEffect(() => {
    checkPermission("MAKE_PAYMENTS").then(setCanPay);
  }, []);
  
  if (!canPay) {
    return (
      <div>
        <p>Payment permission required</p>
        <button>Request Permission</button>
      </div>
    );
  }
  
  return <button>Make Payment</button>;
};
```

## API Reference

### Edge Functions

| Function | Method | Description |
|----------|--------|-------------|
| `/whatsapp-otp-send` | POST | Send OTP via WhatsApp |
| `/whatsapp-otp-verify` | POST | Verify OTP and authenticate |
| `/device-auth/enroll` | POST | Enroll device for biometrics |
| `/device-auth/challenge` | POST | Generate login challenge |
| `/device-auth/verify` | POST | Verify biometric signature |

### Database Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `has_permission` | `_user_id`, `_permission` | `BOOLEAN` | Check if user has permission |
| `cleanup_expired_otp_codes` | - | `void` | Remove expired OTPs |

## Security

### WhatsApp OTP Security

1. **Rate Limiting**
   - 3 OTP sends per phone per hour
   - 10 verification attempts per phone per hour

2. **OTP Storage**
   - Hashed with bcrypt (not stored in plaintext)
   - 5-minute expiry time
   - Max 3 verification attempts
   - Automatic consumption after verification

3. **Phone Validation**
   - Rwanda format validation (+250XXXXXXXXX)
   - Normalization to E.164 format

4. **Audit Logging**
   - All OTP sends logged
   - All verification attempts logged
   - Failed attempts tracked

### Biometric Security

See `DEVICE_AUTH_IMPLEMENTATION.md` for complete security details:

- Device-bound EC P-256 keys
- StrongBox backed (hardware security)
- Keys never exported
- Biometric verification required
- Phishing-resistant origin binding

### Permission Security

1. **Row-Level Security (RLS)**
   - Members can only view their own permissions
   - Staff can manage all permissions
   - Service role has full access

2. **Expiry**
   - Permissions can have expiry dates
   - Expired permissions automatically ignored

## Troubleshooting

### WhatsApp OTP Issues

**Problem**: OTP not received

**Solutions**:
1. Check phone number format
2. Verify WhatsApp Business API credentials
3. Check rate limiting (3 per hour)
4. Review audit logs for send failures

**Problem**: "Invalid OTP code"

**Solutions**:
1. Check if OTP expired (5 minutes)
2. Verify attempts not exceeded (max 3)
3. Request new OTP

### Biometric Issues

**Problem**: Biometric enrollment fails

**Solutions**:
1. Check device has biometric hardware
2. Verify Android Keystore available
3. Ensure user has enrolled biometrics in system settings

**Problem**: "Device not found" on login

**Solutions**:
1. Re-enroll device
2. Check device not revoked
3. Verify device key exists in database

### Permission Issues

**Problem**: User can't access feature

**Solutions**:
1. Check permission granted: `has_permission(user_id, permission)`
2. Verify permission not expired
3. Request permission from staff

### Migration Issues

**Problem**: Migration fails

**Solutions**:
1. Ensure all dependencies exist (auth schema, functions)
2. Check pg_cron extension available for cleanup job
3. Review PostgreSQL logs

## Environment Variables

Required environment variables:

```bash
# Meta WhatsApp Business API
META_WHATSAPP_ACCESS_TOKEN=your_access_token
META_WHATSAPP_PHONE_NUMBER_ID=your_phone_id

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing

### Test OTP Flow

```bash
# 1. Send OTP
curl -X POST https://project.supabase.co/functions/v1/whatsapp-otp-send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{"phone_number": "+250781234567"}'

# 2. Verify OTP
curl -X POST https://project.supabase.co/functions/v1/whatsapp-otp-verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{"phone_number": "+250781234567", "code": "123456"}'
```

### Test Permissions

```sql
-- Check permission
SELECT has_permission(
  '00000000-0000-0000-0000-000000000001'::UUID,
  'MAKE_PAYMENTS'::member_permission
);

-- Grant permission
INSERT INTO member_permissions (user_id, permission)
VALUES ('00000000-0000-0000-0000-000000000001', 'MAKE_PAYMENTS');
```

## Production Checklist

- [ ] Configure Meta WhatsApp Business API credentials
- [ ] Run database migration
- [ ] Deploy edge functions
- [ ] Set up monitoring for OTP sends/failures
- [ ] Configure rate limiting thresholds
- [ ] Test OTP flow end-to-end
- [ ] Test biometric enrollment
- [ ] Test permission system
- [ ] Review audit logs setup
- [ ] Document incident response procedures
- [ ] Train support team on troubleshooting

## Support

For issues or questions:

1. Check this documentation
2. Review audit logs for authentication events
3. Check Supabase function logs
4. Contact development team

---

**Last Updated**: 2025-12-01  
**Version**: 1.0.0  
**Author**: SACCO+ Development Team

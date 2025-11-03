# 2FA/MFA QR Code Authentication System

## Overview

This system implements secure 2FA/MFA authentication for the Staff Admin Portal using QR code scanning from the mobile app. This provides bank-grade security with biometric verification.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   PWA Web App   │◄───────►│  Supabase Edge   │◄───────►│  Android Mobile │
│   (Browser)     │         │    Functions     │         │      App        │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                            │                            │
        │ 1. Request QR              │                            │
        │─────────────────────────►  │                            │
        │                            │                            │
        │ 2. Generate Session        │                            │
        │    Return QR Payload       │                            │
        │◄─────────────────────────  │                            │
        │                            │                            │
        │ 3. Display QR Code         │                            │
        │                            │                            │
        │ 4. Poll Status             │       5. Scan QR           │
        │─────────────────────────►  │◄───────────────────────────│
        │                            │                            │
        │                            │   6. Verify + Biometric    │
        │                            │◄───────────────────────────│
        │                            │                            │
        │                            │   7. Update Session        │
        │                            │    (Authenticated)         │
        │                            │                            │
        │ 8. Poll returns success    │                            │
        │◄─────────────────────────  │                            │
        │                            │                            │
        │ 9. Login complete          │                            │
        │                            │                            │
```

## Components

### 1. Supabase Edge Functions

#### `/functions/auth-qr-generate`
- Generates secure QR authentication session
- Creates unique session ID and challenge
- Stores session in `auth_qr_sessions` table
- Returns QR payload (base64 encoded JSON)
- Session expires in 5 minutes

#### `/functions/auth-qr-verify`
- Verifies QR scan from mobile app
- Validates staff JWT token
- Checks device registration status
- Verifies biometric authentication
- Generates web access tokens
- Updates session status to 'authenticated'
- Logs authentication event

#### `/functions/auth-qr-poll`
- Polls authentication status from web app
- Returns session status (pending/authenticated/expired)
- Returns access tokens and user data when authenticated
- Web app polls every 2 seconds

### 2. Database Tables

#### `auth_qr_sessions`
```sql
- id: UUID (primary key)
- session_id: TEXT (unique, indexed)
- challenge: TEXT (cryptographic challenge)
- status: TEXT (pending|authenticated|expired|cancelled)
- staff_id: UUID (foreign key to auth.users)
- device_id: TEXT (foreign key to staff_devices)
- web_access_token: TEXT (token for web session)
- web_refresh_token: TEXT (refresh token)
- token_expires_at: TIMESTAMPTZ
- biometric_verified: BOOLEAN
- browser_fingerprint: TEXT
- ip_address: TEXT
- signature: TEXT (HMAC signature)
- created_at: TIMESTAMPTZ
- authenticated_at: TIMESTAMPTZ
- expires_at: TIMESTAMPTZ
```

#### `staff_devices`
```sql
- id: UUID (primary key)
- device_id: TEXT (unique identifier)
- staff_id: UUID (foreign key to auth.users)
- device_name: TEXT
- device_model: TEXT
- os_version: TEXT
- app_version: TEXT
- push_token: TEXT (for push notifications)
- biometric_enabled: BOOLEAN
- status: TEXT (active|suspended|revoked)
- registered_at: TIMESTAMPTZ
- last_used_at: TIMESTAMPTZ
```

#### `auth_logs`
```sql
- id: UUID (primary key)
- staff_id: UUID (foreign key to auth.users)
- event_type: TEXT (qr_login, email_login, logout, etc.)
- device_id: TEXT
- session_id: TEXT
- biometric_used: BOOLEAN
- ip_address: TEXT
- browser_fingerprint: TEXT
- success: BOOLEAN
- error_message: TEXT
- metadata: JSONB
- created_at: TIMESTAMPTZ
```

### 3. PWA Web App

#### Components
- `QRAuthLogin.tsx` - QR code display and polling component
- `Login.tsx` - Login page with tabs (QR / Email)
- `qr-auth.ts` - API client for QR authentication

#### Flow
1. User opens web app
2. App calls `/auth-qr-generate` to create session
3. Displays QR code with countdown timer
4. Polls `/auth-qr-poll` every 2 seconds
5. When authenticated, stores tokens and redirects to dashboard

### 4. Android Mobile App

#### Features
- QR code scanner with camera permission handling
- Biometric authentication (fingerprint/face)
- Device registration and management
- Offline capability with sync queue

#### Flow
1. Staff opens mobile app (already logged in)
2. Taps "Scan QR Code" button
3. Camera opens with QR scanner
4. Scans QR code from web app
5. Parses QR payload (session ID + challenge)
6. Prompts for biometric authentication
7. Calls `/auth-qr-verify` with JWT token
8. Shows success confirmation
9. Web app receives authentication and logs in

## Security Features

### 1. Multi-Factor Authentication
- **Something you have**: Registered mobile device
- **Something you are**: Biometric (fingerprint/face)
- **Something you know**: Password (for initial mobile login)

### 2. Session Security
- Sessions expire after 5 minutes
- Cryptographic challenge prevents replay attacks
- HMAC signature verification
- Browser fingerprinting for device tracking
- IP address logging

### 3. Device Management
- Devices must be pre-registered
- Admin can revoke devices remotely
- Device status tracking (active/suspended/revoked)
- Last used timestamp for monitoring

### 4. Token Security
- JWT tokens for mobile app authentication
- Separate web access tokens for browser sessions
- Refresh token rotation
- Token expiration (1 hour)
- Tokens stored in-memory in PWA (not localStorage)

### 5. Audit Trail
- All authentication events logged
- IP address and browser fingerprint tracked
- Biometric usage recorded
- Failed attempts logged
- Queryable for security analysis

## Setup Instructions

### 1. Deploy Supabase Edge Functions

```bash
cd /Users/jeanbosco/workspace/ibimina

# Deploy all QR auth functions
supabase functions deploy auth-qr-generate
supabase functions deploy auth-qr-verify
supabase functions deploy auth-qr-poll

# Or deploy all at once
supabase functions deploy
```

### 2. Run Database Migration

```bash
# Apply migration
supabase db push

# Or manually run the SQL
psql $DATABASE_URL < supabase/migrations/20250103_qr_auth_tables.sql
```

### 3. Set Environment Variables

Add to `.env` or Supabase dashboard:

```bash
# Required for QR auth
HMAC_SHARED_SECRET=your-32-byte-hex-secret

# Already configured
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Generate HMAC secret:
```bash
openssl rand -hex 32
```

### 4. Configure PWA

Environment variables already set in `apps/staff-admin-pwa/.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Configure Android App

Add to `apps/staff-admin-mobile/android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Camera permission for QR scanner -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

<!-- Biometric permission -->
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

## Testing

### Test QR Authentication Flow

1. **Start PWA**:
```bash
cd apps/staff-admin-pwa
pnpm dev
# Open http://localhost:3000/login
```

2. **Start Android App**:
```bash
cd apps/staff-admin-mobile
pnpm android
```

3. **Test Flow**:
   - Open PWA in browser
   - Click "QR Code" tab
   - See QR code displayed with timer
   - Open mobile app
   - Tap "Scan QR Code"
   - Scan the QR code
   - Authenticate with biometric
   - See success message on mobile
   - PWA automatically logs in

### Test Expiration

1. Generate QR code in PWA
2. Wait 5 minutes without scanning
3. QR code should expire
4. Error message displayed
5. "Regenerate" button appears

### Test Device Revocation

1. Log in with mobile app
2. Admin revokes device from dashboard
3. Try to scan QR code
4. Should fail with "Device not registered or inactive"

## API Reference

### Generate QR Session

**POST** `/functions/v1/auth-qr-generate`

**Headers**:
```
x-browser-fingerprint: <optional-fingerprint>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "qrPayload": "base64-encoded-json",
    "expiresAt": "2025-01-03T14:00:00Z",
    "pollInterval": 2000
  }
}
```

### Verify QR Scan

**POST** `/functions/v1/auth-qr-verify`

**Headers**:
```
Authorization: Bearer <staff-jwt-token>
```

**Body**:
```json
{
  "sessionId": "uuid",
  "challenge": "hex-string",
  "staffId": "uuid",
  "deviceId": "device-uuid",
  "biometricVerified": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Authentication successful"
}
```

### Poll Authentication Status

**GET** `/functions/v1/auth-qr-poll?sessionId=<uuid>`

**Response (Pending)**:
```json
{
  "success": true,
  "status": "pending",
  "message": "Waiting for authentication"
}
```

**Response (Authenticated)**:
```json
{
  "success": true,
  "status": "authenticated",
  "data": {
    "accessToken": "uuid",
    "refreshToken": "uuid",
    "expiresAt": "2025-01-03T15:00:00Z",
    "authenticatedAt": "2025-01-03T14:00:00Z",
    "user": {
      "id": "uuid",
      "email": "staff@example.com",
      "name": "Staff Name",
      "role": "Staff",
      "status": "Active",
      "avatarUrl": "https://..."
    }
  }
}
```

## Monitoring

### Check Auth Logs

```sql
-- Recent QR authentications
SELECT 
  al.event_type,
  al.biometric_used,
  al.created_at,
  al.ip_address,
  u.email,
  sd.device_name
FROM auth_logs al
JOIN auth.users u ON al.staff_id = u.id
LEFT JOIN staff_devices sd ON al.device_id = sd.device_id
WHERE al.event_type = 'qr_login'
ORDER BY al.created_at DESC
LIMIT 50;

-- Failed authentication attempts
SELECT *
FROM auth_logs
WHERE success = FALSE
ORDER BY created_at DESC
LIMIT 50;
```

### Check Active Sessions

```sql
-- Currently active QR sessions
SELECT 
  session_id,
  status,
  created_at,
  expires_at,
  ip_address
FROM auth_qr_sessions
WHERE status = 'pending'
AND expires_at > NOW()
ORDER BY created_at DESC;
```

### Device Usage Statistics

```sql
-- Most active devices
SELECT 
  sd.device_name,
  sd.device_model,
  u.email,
  COUNT(*) as login_count,
  MAX(al.created_at) as last_login
FROM auth_logs al
JOIN staff_devices sd ON al.device_id = sd.device_id
JOIN auth.users u ON al.staff_id = u.id
WHERE al.event_type = 'qr_login'
AND al.created_at > NOW() - INTERVAL '30 days'
GROUP BY sd.device_name, sd.device_model, u.email
ORDER BY login_count DESC;
```

## Troubleshooting

### QR Code Not Generating

**Issue**: Error "Failed to generate QR code"

**Solution**:
1. Check Supabase is running: `supabase status`
2. Check edge function logs: `supabase functions logs auth-qr-generate`
3. Verify database table exists: `select * from auth_qr_sessions limit 1;`
4. Check environment variables are set

### Mobile App Can't Verify

**Issue**: Error "Device not registered or inactive"

**Solution**:
1. Check device is registered:
```sql
SELECT * FROM staff_devices WHERE device_id = 'your-device-id';
```

2. If not registered, register device from mobile app settings
3. Check device status is 'active'
4. Verify staff_id matches authenticated user

### Authentication Times Out

**Issue**: QR code expires before scanning

**Solution**:
1. Increase expiration time in `auth-qr-generate/index.ts`:
```typescript
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
```

2. Adjust poll interval if needed
3. Check network connectivity
4. Look for errors in browser console

### Biometric Not Working

**Issue**: Biometric prompt doesn't appear

**Solution**:
1. Check biometric is enrolled on device
2. Verify permission in AndroidManifest.xml
3. Test with Capacitor Biometric plugin:
```typescript
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
const result = await NativeBiometric.isAvailable();
console.log('Biometric available:', result.isAvailable);
```

## Security Recommendations

1. **Enable HTTPS**: Always use HTTPS in production for QR auth
2. **Rate Limiting**: Add rate limiting to prevent brute force:
   - Max 5 QR generations per IP per minute
   - Max 3 failed verification attempts before lockout
3. **Geolocation**: Consider adding geofencing for high-security deployments
4. **Push Notifications**: Send push notification to mobile when QR generated
5. **Device Fingerprinting**: Enhance browser fingerprinting with canvas/WebGL
6. **Session Recording**: Record session metadata for forensics
7. **Automatic Cleanup**: Schedule pg_cron job to cleanup expired sessions

## Next Steps

1. ✅ Supabase Edge Functions deployed
2. ✅ Database tables created
3. ✅ PWA QR login page implemented
4. ⏳ Android QR scanner implementation
5. ⏳ Biometric authentication integration
6. ⏳ Device registration flow
7. ⏳ Admin device management UI
8. ⏳ Push notification on QR generation

## References

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Capacitor Barcode Scanner](https://capacitorjs.com/docs/apis/barcode-scanner)
- [Capacitor Biometric](https://github.com/Cap-go/capacitor-native-biometric)
- [QR Code Specification](https://www.qrcode.com/en/about/version.html)
- [WebAuthn Standard](https://www.w3.org/TR/webauthn-2/)

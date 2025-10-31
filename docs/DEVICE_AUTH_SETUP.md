# Device-Bound Authentication - Quick Setup Guide

## Overview

This guide walks through setting up the device-bound authentication system for
the Ibimina staff mobile app to act as a "private authenticator" for web login.

## Prerequisites

- **Android Device/Emulator** with API 28+ (Android 9.0+)
- **Biometric Hardware** (fingerprint or face unlock)
- **Enrolled Biometrics** on the device
- **Supabase** database configured
- **Node.js** 20+ for admin app

## 1. Database Setup

Run the migration to create required tables:

```bash
cd supabase
supabase db push

# Or manually apply:
psql $DATABASE_URL < migrations/20251031080000_device_auth_system.sql
```

This creates:

- `device_auth_keys` - Device public key registry
- `device_auth_challenges` - Challenge store
- `device_auth_audit` - Audit trail

## 2. Backend Configuration

No additional environment variables needed - uses existing Supabase credentials.

API endpoints are automatically available at:

- `POST /api/device-auth/challenge`
- `POST /api/device-auth/verify`
- `POST /api/device-auth/enroll`
- `GET /api/device-auth/devices`
- `DELETE /api/device-auth/devices`

## 3. Android App Setup

### Build Configuration

The Android app already has required dependencies in
`apps/client/android/app/build.gradle`:

```gradle
implementation "androidx.biometric:biometric:1.2.0-alpha05"
```

Permissions are already configured in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

### Plugin Registration

The `DeviceAuthPlugin` is registered in `MainActivity.java`:

```java
registerPlugin(DeviceAuthPlugin.class);
```

### Build Android App

```bash
cd apps/client
npm run build
npx cap sync android
npx cap open android
```

## 4. Mobile App Usage

### Device Enrollment Flow

```typescript
import { deviceAuthManager } from "@/lib/device-auth";

// 1. Check availability
if (!deviceAuthManager.isAvailable()) {
  console.error("Device auth not available");
  return;
}

// 2. Check biometric
const bioStatus = await deviceAuthManager.checkBiometricAvailable();
if (!bioStatus.available) {
  console.error("Biometric not available:", bioStatus.message);
  return;
}

// 3. Enroll device (requires authenticated user)
const result = await deviceAuthManager.enrollDevice(
  userId,
  "My Samsung Galaxy", // Device label
  authToken
);

if (result.success) {
  console.log("✓ Device enrolled");
} else {
  console.error("✗ Enrollment failed:", result.error);
}
```

### QR Login Flow

```typescript
// 1. Scan QR code (use camera or QR scanner library)
const qrData = await scanQRCode(); // Your QR scanner
const challenge = JSON.parse(qrData);

// 2. Display approval UI
console.log("Sign in to:", challenge.origin);
console.log("Expires in:", challenge.exp - Date.now() / 1000, "seconds");

// 3. User approves → Sign challenge (triggers biometric)
const result = await deviceAuthManager.signChallenge(challenge, userId);

if (!result.success) {
  console.error("Signing failed:", result.error);
  return;
}

// 4. Send to backend
const verifyResult = await deviceAuthManager.verifyChallenge(
  challenge.session_id,
  deviceId,
  result.signature!,
  result.signedMessage!
);

if (verifyResult.success) {
  console.log("✓ Authenticated successfully");
} else {
  console.error("✗ Verification failed:", verifyResult.error);
}
```

## 5. Web App Usage

### Generate Login Challenge

```typescript
import { DeviceAuthClient, generateQRCode } from "@/lib/device-auth";

const client = new DeviceAuthClient();

// 1. Generate challenge
const { challenge, sessionId, expiresAt } = await client.generateChallenge();

// 2. Generate QR code (install qrcode library: npm install qrcode)
import QRCode from "qrcode";
const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(challenge));

// 3. Display QR code
return (
  <div>
    <h2>Scan with Mobile App</h2>
    <img src={qrCodeUrl} alt="Login QR Code" />
    <p>Expires at: {new Date(expiresAt).toLocaleTimeString()}</p>
  </div>
);
```

### Poll for Authentication

```typescript
// Option 1: Polling (simple)
const cleanup = client.pollForVerification(
  sessionId,
  (userId) => {
    // Success!
    router.push("/dashboard");
  },
  (error) => {
    console.error("Auth failed:", error);
  },
  () => {
    console.log("Timed out");
  }
);

// Cleanup on unmount
useEffect(() => cleanup, []);

// Option 2: WebSocket (production - TODO)
// Implement real-time updates via WebSocket/SSE
```

## 6. Device Management

### List User Devices

```typescript
const { devices } = await deviceAuthManager.listDevices(authToken);

devices?.forEach((device) => {
  console.log(`${device.device_label} - Last used: ${device.last_used_at}`);
});
```

### Revoke Device

```typescript
await deviceAuthManager.revokeDevice(deviceId, authToken);
```

## 7. Testing

### Run Unit Tests

```bash
cd apps/admin
pnpm test:unit tests/unit/device-auth/signature.test.ts
```

### Manual Testing

1. **Enrollment**
   - Open mobile app
   - Navigate to Settings → Device Authentication
   - Tap "Enroll This Device"
   - Complete biometric prompt
   - Verify device appears in web admin panel

2. **Authentication**
   - Open web app login page
   - Click "Login with Mobile Device"
   - Scan QR with mobile app
   - Approve on mobile (biometric prompt)
   - Verify redirect to dashboard

3. **Revocation**
   - Open web admin panel
   - Navigate to Settings → Devices
   - Click "Revoke" on device
   - Attempt to authenticate with revoked device
   - Verify failure

## 8. Production Checklist

### Before Going Live

- [ ] Implement Play Integrity API verification (replace mock)
- [ ] Set up WebSocket/SSE for real-time session updates
- [ ] Configure monitoring and alerting
- [ ] Test on multiple Android devices and versions
- [ ] Verify StrongBox availability on target devices
- [ ] Set up backup authentication method (passkeys, email)
- [ ] Configure rate limiting and abuse detection
- [ ] Document incident response procedures
- [ ] Train support team on device revocation
- [ ] Test account recovery flows

### Play Integrity Setup

1. Enable Play Integrity API in Google Cloud Console
2. Configure app signing in Play Console
3. Add service account credentials to backend
4. Replace mock in `/api/device-auth/verify/route.ts`

```typescript
import { google } from "googleapis";

async function verifyPlayIntegrity(token: string) {
  const playIntegrity = google.playintegrity("v1");

  const response = await playIntegrity.v1.decodeIntegrityToken({
    packageName: "rw.gov.ikanisa.ibimina.client",
    requestBody: {
      integrityToken: token,
    },
  });

  return {
    meets_device_integrity:
      response.data.deviceIntegrity?.deviceRecognitionVerdict ===
      "MEETS_DEVICE_INTEGRITY",
    // ... other fields
  };
}
```

### WebSocket Setup

Replace polling with WebSocket:

```typescript
// Backend
import { Server } from "socket.io";
const io = new Server(server);

io.on("connection", (socket) => {
  socket.on("subscribe-session", (sessionId) => {
    socket.join(sessionId);
  });
});

// On verification
io.to(sessionId).emit("authenticated", { userId });

// Frontend
import io from "socket.io-client";
const socket = io();
socket.emit("subscribe-session", sessionId);
socket.on("authenticated", ({ userId }) => {
  // Authenticated!
});
```

## 9. Troubleshooting

### "Biometric not available"

**Solution:**

- Verify device has fingerprint/face sensor
- Ensure biometrics are enrolled in device settings
- Check app permissions in Settings → Apps → Ibimina

### "Device not enrolled"

**Solution:**

- Run enrollment flow again
- Check network connectivity
- Verify auth token is valid

### "Signature verification failed"

**Solution:**

- Check server and device clocks are synchronized
- Verify public key was correctly stored
- Check for JSON canonicalization issues

### "StrongBox not available"

**Note:** This is a warning, not an error. The key will use TEE instead of
StrongBox.

**Devices with StrongBox:**

- Google Pixel 3 and newer
- Samsung Galaxy S9+ and newer
- OnePlus 6T and newer

## 10. Security Notes

### Key Strengths

✅ **Phishing-resistant** - Origin binding prevents phishing  
✅ **Replay-resistant** - One-time nonce prevents replay  
✅ **Device-bound** - Keys never leave device  
✅ **Biometric-gated** - Requires user presence  
✅ **Hardware-backed** - Keys in secure hardware (StrongBox/TEE)

### Known Limitations

⚠️ **Single platform** - Android only (iOS support planned)  
⚠️ **Network required** - Cannot authenticate offline  
⚠️ **Device loss** - Requires admin revocation and re-enrollment  
⚠️ **Clock skew** - Time sync required between device and server

### Recommended Policies

1. **Integrity enforcement** - Reject rooted/unlocked bootloader devices
2. **Multiple devices** - Allow 2-3 devices per user for redundancy
3. **Regular audits** - Review authentication logs weekly
4. **Automatic revocation** - Revoke devices inactive for 90 days
5. **Backup method** - Require passkey or admin contact for recovery

## 11. Resources

- [Full Documentation](./DEVICE_AUTHENTICATION.md)
- [Database Schema](../supabase/migrations/20251031080000_device_auth_system.sql)
- [Android Implementation](../apps/client/android/app/src/main/java/rw/gov/ikanisa/ibimina/client/auth/)
- [API Routes](../apps/admin/app/api/device-auth/)

## Support

For issues or questions:

- File issue on GitHub
- Contact: dev@ibimina.rw
- Documentation: https://docs.ibimina.rw

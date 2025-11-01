# Device-Bound Authentication System

## Overview

This system implements a WebAuthn/FIDO-style authentication mechanism where the
**staff mobile app** acts as a "private authenticator" for web login. It
provides strong, phishing-resistant authentication using device-bound
cryptographic keys and biometric verification.

## Architecture

### Components

1. **Database (Supabase)**
   - `device_auth_keys` - Stores device public keys and attestation data
   - `device_auth_challenges` - Temporary challenge storage with nonce
   - `device_auth_audit` - Comprehensive audit trail

2. **Backend API (Next.js)**
   - `POST /api/device-auth/challenge` - Generate QR challenge
   - `POST /api/device-auth/verify` - Verify signed challenge
   - `POST /api/device-auth/enroll` - Enroll new device
   - `GET /api/device-auth/devices` - List user devices
   - `DELETE /api/device-auth/devices?device_id=xxx` - Revoke device

3. **Android App (Capacitor + Kotlin)**
   - `DeviceKeyManager` - EC P-256 key generation in Android Keystore
   - `BiometricAuthHelper` - Biometric authentication wrapper
   - `ChallengeSigner` - Challenge signing logic
   - `DeviceAuthPlugin` - Capacitor plugin bridge

4. **Web Integration**
   - TypeScript client for QR generation
   - Device management UI
   - Session polling/WebSocket

## Security Features

### Device-Bound Keys

- **EC P-256** keypairs generated in Android Keystore
- **StrongBox** preference for hardware-backed security
- **Never exported** - private keys never leave the device
- **Biometric-gated** - requires Class 3 biometric (fingerprint/face) to use

### Challenge-Response Protocol

```
Web App                Mobile App              Backend
   |                       |                       |
   |-- Generate Challenge -|                       |
   |                       |                       |
   |<---- QR Code ---------|                       |
   |                       |                       |
   |                       |-- Scan QR ----------->|
   |                       |                       |
   |                       |-- Biometric Prompt -->|
   |                       |                       |
   |                       |-- Sign Challenge ---->|
   |                       |                       |
   |                       |<-- Send Signature ----|
   |                       |                       |
   |                       |                       |-- Verify Signature
   |                       |                       |
   |<-- Session Upgrade ---|<----------------------|
```

### Security Properties

1. **Phishing Resistance**
   - Origin binding: Challenge includes exact web origin
   - Origin validation: Mobile app displays and validates origin
   - Server verification: Backend checks origin matches

2. **Replay Prevention**
   - One-time nonce: Each challenge has unique random nonce
   - Single-use: Challenge marked as used after verification
   - Short expiry: 60-second challenge lifetime

3. **Device Attestation**
   - Play Integrity API integration (ready, mock for now)
   - Integrity status recorded at enrollment and each auth
   - Policy enforcement based on integrity level

4. **Audit Trail**
   - All events logged: enrollment, auth, failures
   - Metadata captured: IP, device info, integrity status
   - Immutable audit log for compliance

## Usage

### Device Enrollment (Mobile App)

```typescript
import { deviceAuthManager } from "@/lib/device-auth";

// Check if biometric is available
const bioStatus = await deviceAuthManager.checkBiometricAvailable();
if (!bioStatus.available) {
  console.error("Biometric not available:", bioStatus.message);
  return;
}

// Enroll device
const result = await deviceAuthManager.enrollDevice(
  userId,
  "My Phone", // Device label
  authToken
);

if (result.success) {
  console.log("Device enrolled successfully");
} else {
  console.error("Enrollment failed:", result.error);
}
```

### Web Login (Admin App)

```typescript
import { DeviceAuthClient } from "@/lib/device-auth";

const client = new DeviceAuthClient();

// Generate challenge
const { challenge, sessionId } = await client.generateChallenge();

// Display QR code with challenge
const qrCodeDataUrl = await generateQRCode(challenge);

// Poll for verification
const cleanup = client.pollForVerification(
  sessionId,
  (userId) => {
    // Success - upgrade session
    console.log("Authenticated as:", userId);
  },
  (error) => {
    console.error("Authentication failed:", error);
  },
  () => {
    console.log("Authentication timed out");
  }
);

// Cleanup when component unmounts
return cleanup;
```

### Challenge Signing (Mobile App)

```typescript
import { deviceAuthManager } from "@/lib/device-auth";

// Parse challenge from QR
const challenge = JSON.parse(qrCodeData);

// Sign challenge (triggers biometric prompt)
const result = await deviceAuthManager.signChallenge(challenge, userId);

if (result.success) {
  // Send to backend
  await deviceAuthManager.verifyChallenge(
    challenge.session_id,
    deviceId,
    result.signature!,
    result.signedMessage!
  );
}
```

### Device Management

```typescript
import { deviceAuthManager } from "@/lib/device-auth";

// List devices
const { devices } = await deviceAuthManager.listDevices(authToken);

// Revoke device
await deviceAuthManager.revokeDevice(deviceId, authToken);
```

## API Reference

### Challenge Data Structure

```json
{
  "ver": 1,
  "session_id": "uuid",
  "origin": "https://admin.ibimina.rw",
  "nonce": "128-bit-hex",
  "exp": 1730376123,
  "aud": "web-login"
}
```

### Signed Message Structure

```json
{
  "ver": 1,
  "user_id": "uuid",
  "device_id": "android-id",
  "session_id": "uuid",
  "origin": "https://admin.ibimina.rw",
  "nonce": "128-bit-hex",
  "ts": 1730376110,
  "scope": ["login"],
  "alg": "ES256"
}
```

### Verification Request

```json
{
  "session_id": "uuid",
  "device_id": "android-id",
  "signature": "base64-signature",
  "signed_message": {
    /* SignedMessage */
  },
  "integrity_token": "play-integrity-token"
}
```

## Database Schema

### device_auth_keys

| Column            | Type        | Description              |
| ----------------- | ----------- | ------------------------ |
| id                | UUID        | Primary key              |
| user_id           | UUID        | User reference           |
| device_id         | TEXT        | Unique device identifier |
| device_label      | TEXT        | User-friendly name       |
| public_key        | TEXT        | PEM-encoded public key   |
| key_algorithm     | TEXT        | ES256 or Ed25519         |
| device_info       | JSONB       | Device metadata          |
| integrity_verdict | JSONB       | Latest integrity check   |
| integrity_status  | TEXT        | Status enum              |
| created_at        | TIMESTAMPTZ | Creation time            |
| last_used_at      | TIMESTAMPTZ | Last authentication      |
| revoked_at        | TIMESTAMPTZ | Revocation time          |
| revoked_by        | UUID        | Who revoked              |
| revocation_reason | TEXT        | Why revoked              |

### device_auth_challenges

| Column             | Type        | Description            |
| ------------------ | ----------- | ---------------------- |
| id                 | UUID        | Primary key            |
| session_id         | TEXT        | Web session ID         |
| nonce              | TEXT        | One-time random value  |
| origin             | TEXT        | Expected web origin    |
| challenge_data     | JSONB       | Full challenge payload |
| created_at         | TIMESTAMPTZ | Creation time          |
| expires_at         | TIMESTAMPTZ | Expiry (60s)           |
| used_at            | TIMESTAMPTZ | When verified          |
| verified_by_device | UUID        | Device that verified   |

### device_auth_audit

| Column         | Type        | Description         |
| -------------- | ----------- | ------------------- |
| id             | UUID        | Primary key         |
| event_type     | TEXT        | Event type enum     |
| user_id        | UUID        | User reference      |
| device_key_id  | UUID        | Device reference    |
| challenge_id   | UUID        | Challenge reference |
| success        | BOOLEAN     | Success flag        |
| failure_reason | TEXT        | Error message       |
| metadata       | JSONB       | Additional context  |
| created_at     | TIMESTAMPTZ | Event time          |

## Android Implementation Details

### KeyGenParameterSpec Configuration

```kotlin
KeyGenParameterSpec.Builder(
    keyAlias,
    KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
)
    .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1")) // P-256
    .setDigests(KeyProperties.DIGEST_SHA256)
    .setUserAuthenticationRequired(true)
    .setUserAuthenticationParameters(
        0, // Requires auth for every use
        KeyProperties.AUTH_BIOMETRIC_STRONG
    )
    .setIsStrongBoxBacked(true) // Prefer hardware security
    .build()
```

### BiometricPrompt Usage

```kotlin
biometricPrompt.authenticate(
    BiometricPrompt.PromptInfo.Builder()
        .setTitle("Confirm Sign In")
        .setSubtitle(challenge.origin)
        .setDescription("Authenticate to sign in to the web application")
        .setNegativeButtonText("Cancel")
        .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
        .build()
)
```

### Signature Generation

```kotlin
val signature = Signature.getInstance("SHA256withECDSA")
signature.initSign(privateKey)
signature.update(messageBytes)
val signatureBytes = signature.sign()
val signatureBase64 = Base64.encodeToString(signatureBytes, Base64.NO_WRAP)
```

## Production Considerations

### Play Integrity Verification

Replace mock implementation with actual Google Play Integrity API:

```typescript
// Backend verification
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
    meets_basic_integrity:
      response.data.deviceIntegrity?.deviceRecognitionVerdict ===
      "MEETS_BASIC_INTEGRITY",
    device_recognition_verdict:
      response.data.deviceIntegrity?.deviceRecognitionVerdict,
    app_licensing_verdict: response.data.appIntegrity?.appRecognitionVerdict,
  };
}
```

### WebSocket/SSE for Real-Time Updates

Replace polling with WebSocket or Server-Sent Events:

```typescript
// Backend
import { Server } from "socket.io";

io.on("connection", (socket) => {
  socket.on("subscribe-session", (sessionId) => {
    socket.join(sessionId);
  });
});

// On verification success
io.to(sessionId).emit("authenticated", { userId });

// Frontend
const socket = io();
socket.emit("subscribe-session", sessionId);
socket.on("authenticated", ({ userId }) => {
  // Upgrade session
});
```

### Session Management

After successful verification, create authenticated session:

```typescript
// Backend
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase.auth.admin.createUser({
  email: user.email,
  password: crypto.randomBytes(32).toString("hex"),
  email_confirm: true,
});

// Set session cookie
const { data: session } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email: user.email,
});

response.cookies.set("auth-token", session.access_token, {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: 3600,
});
```

### Monitoring and Alerts

Set up monitoring for:

- High failure rates (potential attacks)
- Integrity check failures
- Unusual patterns (time, location)
- Revoked device usage attempts

### Recovery Procedures

1. **Lost Device**
   - User contacts admin
   - Admin revokes device in UI
   - User enrolls new device

2. **Compromised Key**
   - Immediate revocation via admin panel
   - Audit log review
   - User notification

3. **Account Recovery**
   - Alternative authentication method (passkeys, admin reset)
   - Re-enrollment required

## Testing

### Unit Tests

```typescript
// Test signature verification
describe("signature verification", () => {
  it("should verify valid signature", async () => {
    const result = await verifySignature(
      publicKey,
      "ES256",
      message,
      signature
    );
    expect(result).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Test full flow
describe("device authentication flow", () => {
  it("should complete authentication", async () => {
    // Generate challenge
    const challenge = await generateChallenge();

    // Sign challenge (mock)
    const { signature, signedMessage } = await signChallenge(challenge);

    // Verify
    const result = await verifyChallenge(
      sessionId,
      deviceId,
      signature,
      signedMessage
    );
    expect(result.success).toBe(true);
  });
});
```

## Troubleshooting

### Device Enrollment Fails

- Check biometric availability
- Verify StrongBox support (fallback to TEE)
- Check Android version (API 28+)

### Signature Verification Fails

- Check clock synchronization
- Verify canonical JSON encoding
- Check public key format

### Biometric Prompt Doesn't Appear

- Check biometric enrollment on device
- Verify permissions in manifest
- Check API level compatibility

## References

- [Android Keystore System](https://developer.android.com/training/articles/keystore)
- [BiometricPrompt API](https://developer.android.com/reference/androidx/biometric/BiometricPrompt)
- [Play Integrity API](https://developer.android.com/google/play/integrity)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [FIDO2 Overview](https://fidoalliance.org/fido2/)

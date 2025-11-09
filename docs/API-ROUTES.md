# Next.js API Routes Documentation

This document describes the internal API routes used by the Ibimina admin
application. These routes are implemented as Next.js API routes and handle
server-side operations that require authentication, authorization, or database
access.

## Table of Contents

- [Authentication & Authorization](#authentication--authorization)
- [Admin Routes](#admin-routes)
- [MFA Routes](#mfa-routes)
- [Health & Diagnostics](#health--diagnostics)
- [E2E Testing Routes](#e2e-testing-routes)

## Authentication & Authorization

All API routes (except health and E2E test routes) require authentication.
Authorization is enforced based on user roles:

- **SYSTEM_ADMIN**: Full access to all operations across all SACCOs
- **SACCO_MANAGER**: Can manage their assigned SACCO and perform reconciliation
- **SACCO_STAFF**: Can view and reconcile payments for their assigned SACCO

## Admin Routes

### POST /api/admin/mfa/reset

Reset multi-factor authentication for a user. Used when a user loses access to
their MFA device.

**Authorization**: SYSTEM_ADMIN only

**Request Body**:

```json
{
  "userId": "uuid", // Optional: user ID
  "email": "user@example.com", // Optional: user email (if userId not provided)
  "reason": "Lost device during field work" // Required: documented reason
}
```

**Response**:

```json
{
  "success": true,
  "userId": "uuid"
}
```

**Side Effects**:

- Clears MFA enrollment flags
- Removes TOTP secrets and backup codes
- Deletes all trusted devices
- Resets default MFA to EMAIL only
- Creates audit log entry

---

### POST /api/admin/payments/assign

Assign unallocated payments to specific ikimina and members. Used during manual
reconciliation.

**Authorization**: SACCO_STAFF, SACCO_MANAGER, SYSTEM_ADMIN (with reconciliation
permission)

**Request Body**:

```json
{
  "ids": ["payment-uuid-1", "payment-uuid-2"], // Array of payment IDs
  "ikiminaId": "ikimina-uuid", // Required: target group
  "memberId": "member-uuid", // Optional: specific member
  "saccoId": "sacco-uuid" // Optional: for SYSTEM_ADMIN only
}
```

**Response**:

```json
{
  "updated": 2 // Number of payments successfully updated
}
```

**Validation**:

- Non-admin users can only assign payments in their SACCO
- Ikimina must exist and belong to authorized SACCO
- Member (if provided) must belong to the ikimina

---

### POST /api/admin/payments/update-status

Update payment status (e.g., mark as settled, void, etc.).

**Authorization**: SACCO_STAFF, SACCO_MANAGER, SYSTEM_ADMIN

**Request Body**:

```json
{
  "ids": ["payment-uuid-1"],
  "status": "SETTLED", // One of: POSTED, UNALLOCATED, SETTLED, VOID
  "note": "Verified against bank statement"
}
```

---

### POST /api/admin/audit/export

Export audit logs as CSV for compliance and reporting.

**Authorization**: SYSTEM_ADMIN only

**Query Parameters**:

- `saccoId` (optional): Filter by SACCO
- `startDate` (optional): ISO8601 date
- `endDate` (optional): ISO8601 date
- `action` (optional): Filter by action type

**Response**: CSV file download

**Headers**:

- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="audit-{timestamp}.csv"`

---

### POST /api/admin/saccos/[saccoId]/branding

Update SACCO branding (logo, colors, etc.).

**Authorization**: SACCO_MANAGER, SYSTEM_ADMIN

**Request Body**:

```json
{
  "logoUrl": "https://example.com/logo.png",
  "primaryColor": "#1a73e8",
  "secondaryColor": "#34a853"
}
```

## MFA Routes

### POST /api/mfa/initiate

Initiate MFA challenge for authenticated user.

**Authorization**: Authenticated user

**Request Body**:

```json
{
  "method": "TOTP" // or "EMAIL", "PASSKEY"
}
```

**Response**:

```json
{
  "challengeId": "uuid",
  "method": "TOTP",
  "expiresAt": "2025-10-27T12:34:56Z"
}
```

---

### POST /api/mfa/confirm

Confirm MFA challenge with code or credential.

**Authorization**: Authenticated user with active challenge

**Request Body**:

```json
{
  "challengeId": "uuid",
  "code": "123456" // For TOTP/EMAIL
}
```

**Response**:

```json
{
  "success": true,
  "sessionToken": "encrypted-token"
}
```

---

### POST /api/mfa/email/request

Request email OTP code.

**Authorization**: Authenticated user

**Response**:

```json
{
  "success": true,
  "expiresAt": "2025-10-27T12:44:56Z"
}
```

**Side Effects**:

- Sends email with 6-digit OTP code
- OTP valid for 10 minutes
- Increments `mfa_email_sent` metric

---

### POST /api/mfa/email/verify

Verify email OTP code.

**Request Body**:

```json
{
  "code": "123456"
}
```

---

### POST /api/mfa/passkeys/auth

Authenticate with WebAuthn/passkey.

**Request Body**:

```json
{
  "credential": {
    "id": "credential-id",
    "rawId": "base64-raw-id",
    "response": {
      "authenticatorData": "base64-data",
      "clientDataJSON": "base64-json",
      "signature": "base64-signature"
    }
  }
}
```

---

### GET /api/mfa/profile

Get user's MFA profile and enrolled methods.

**Authorization**: Authenticated user

**Response**:

```json
{
  "mfaEnabled": true,
  "enrolledMethods": ["TOTP", "PASSKEY", "EMAIL"],
  "backupCodesRemaining": 8,
  "trustedDevices": 2,
  "lastMfaSuccess": "2025-10-27T10:00:00Z"
}
```

---

### GET /api/mfa/trusted-devices/[deviceId]

Get trusted device details.

**DELETE /api/mfa/trusted-devices/[deviceId]**: Remove trusted device.

## Health & Diagnostics

### GET /api/health

Health check endpoint for load balancers and monitoring.

**Authorization**: None (public)

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-27T19:53:32Z",
  "version": "1.2.3",
  "buildId": "abc123"
}
```

**Status Codes**:

- `200`: Service healthy
- `503`: Service degraded or unavailable

---

### GET /api/mfa/diagnostics

MFA system diagnostics (SYSTEM_ADMIN only).

**Response**:

```json
{
  "totpEnrolled": 45,
  "passkeyEnrolled": 23,
  "emailOnlyUsers": 12,
  "trustedDevices": 67,
  "activeChallenges": 3
}
```

## E2E Testing Routes

These routes are only available when `NEXT_PUBLIC_E2E=1` is set. They are used
by Playwright tests to set up test scenarios.

### POST /api/e2e/session

Create test session with stub authentication.

**Authorization**: E2E mode only

**Request Body**:

```json
{
  "role": "SACCO_MANAGER",
  "saccoId": "stub-sacco"
}
```

---

### POST /api/e2e/factors/verify

Bypass MFA for E2E tests.

**Authorization**: E2E mode only

---

### GET /api/e2e/automation-health

Check E2E automation health (used by CI).

**Response**:

```json
{
  "enabled": true,
  "stubAuthActive": true,
  "testDataSeeded": true
}
```

## Rate Limiting

All API routes (except health) are subject to rate limiting:

- **Default**: 5 requests per 5 minutes per IP
- **MFA routes**: 20 requests per minute per user
- **Admin routes**: 10-40 requests per minute per user (varies by route)

Rate limit violations return `429 Too Many Requests`:

```json
{
  "error": "rate_limit_exceeded",
  "retryAfter": 120
}
```

## Error Responses

All routes use consistent error response format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {} // Optional: additional error context
}
```

Common error codes:

- `unauthorized` (401): Missing or invalid authentication
- `forbidden` (403): Insufficient permissions
- `not_found` (404): Resource not found
- `invalid_payload` (400): Request validation failed
- `rate_limit_exceeded` (429): Too many requests
- `internal_error` (500): Server error

## Security Considerations

1. **CSRF Protection**: All POST routes use Next.js built-in CSRF protection
2. **Session Management**: Sessions stored in HTTP-only cookies
3. **Audit Logging**: Privileged operations logged in `app.audit_logs`
4. **PII Encryption**: All PII encrypted before storage using AES-256-GCM
5. **Rate Limiting**: Prevents abuse and brute-force attacks
6. **CORS**: Disabled for API routes (same-origin only)

## Testing

Use the included curl examples or tools like Postman for manual testing:

```bash
# Health check
curl http://localhost:3100/api/health

# MFA profile (requires authentication)
curl -H "Cookie: sb-session=..." http://localhost:3100/api/mfa/profile

# Admin MFA reset (requires SYSTEM_ADMIN)
curl -X POST http://localhost:3100/api/admin/mfa/reset \
  -H "Cookie: sb-session=..." \
  -H "Content-Type: application/json" \
  -d '{"userId":"uuid","reason":"Lost device"}'
```

For E2E testing, see `apps/admin/tests/e2e/README.md`.

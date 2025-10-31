# MFA Error Handling and User Feedback Guide

This document provides a comprehensive mapping of MFA error codes to
user-friendly messages and recommended UI patterns. This addresses Gap 3 from
the authentication security review.

## Table of Contents

1. [Error Code Overview](#error-code-overview)
2. [Rate Limiting Errors](#rate-limiting-errors)
3. [Factor-Specific Errors](#factor-specific-errors)
4. [State Management Errors](#state-management-errors)
5. [Security Errors](#security-errors)
6. [UI Implementation Guidelines](#ui-implementation-guidelines)

---

## Error Code Overview

All MFA API endpoints return errors in a consistent format:

```typescript
interface ErrorResponse {
  error: string; // Machine-readable error type
  code?: string; // Specific error code (uppercase snake_case)
  retryAt?: string; // ISO timestamp for rate-limited requests
  requestId?: string; // Request ID for support tracking
}
```

### Error Severity Levels

| Severity     | Description                     | User Action Required |
| ------------ | ------------------------------- | -------------------- |
| **INFO**     | Informational, no action needed | None                 |
| **WARNING**  | May require user attention      | Optional             |
| **ERROR**    | Requires user action            | Required             |
| **CRITICAL** | System issue, contact support   | Contact support      |

---

## Rate Limiting Errors

### `rate_limited` (429)

**Returned when**: User or IP exceeds the rate limit for MFA attempts.

#### Scopes

##### User-Level Rate Limit

- **Limit**: 5 attempts per 5 minutes per user
- **Code**: `rate_limited` with `scope: "user"`

**User Message**:

```
Too many verification attempts. For your security, please wait {X} minutes before trying again.
```

**UI Recommendations**:

- Display a countdown timer until `retryAt`
- Disable the verification form until timer expires
- Provide link to "Use a different method" to try alternative factors
- Show support contact info if user is locked out repeatedly

##### IP-Level Rate Limit

- **Limit**: 10 attempts per 5 minutes per IP address
- **Code**: `rate_limited` with `scope: "ip"`

**User Message**:

```
Too many verification attempts from your location. Please wait {X} minutes before trying again.
```

**UI Recommendations**:

- Same as user-level, but emphasize this may affect shared networks
- Suggest switching to mobile data if on shared WiFi
- Provide information about VPN/proxy impacts

#### Example Response

```json
{
  "error": "rate_limited",
  "scope": "user",
  "retryAt": "2025-10-31T08:15:00.000Z",
  "requestId": "req_abc123"
}
```

#### Implementation Example

```typescript
if (error.error === "rate_limited") {
  const retryAt = new Date(error.retryAt);
  const waitMinutes = Math.ceil((retryAt.getTime() - Date.now()) / 60000);

  showError({
    severity: "warning",
    title: "Too many attempts",
    message: `Please wait ${waitMinutes} minute(s) before trying again.`,
    countdown: retryAt,
    actions: [
      { label: "Use different method", onClick: showFactorSelector },
      { label: "Contact support", onClick: showSupport },
    ],
  });
}
```

---

## Factor-Specific Errors

### TOTP (Time-based One-Time Password)

#### `TOTP_INVALID` (400)

**Returned when**: Code doesn't match the expected value.

**User Message**:

```
The code you entered is incorrect. Please check and try again.
```

**UI Recommendations**:

- Highlight the input field
- Keep the field focused for retry
- Show remaining attempts (e.g., "2 attempts remaining")
- Suggest checking time sync if repeatedly fails

#### `TOTP_EXPIRED` (400)

**Returned when**: Code is from a previous time window.

**User Message**:

```
This code has expired. Please enter the current code from your authenticator app.
```

**UI Recommendations**:

- Clear the input field
- Add visual indicator showing code refresh countdown (30s)
- Provide tip: "Wait for your authenticator app to generate a new code"

#### `TOTP_REPLAY` (400)

**Returned when**: Same code is used twice.

**User Message**:

```
This code has already been used. Please wait for a new code.
```

**UI Recommendations**:

- Clear the input field
- Show 30-second countdown for next code
- Disable submit button until new code expected

#### `TOTP_NOT_ENROLLED` (400)

**Returned when**: User hasn't set up TOTP.

**User Message**:

```
You haven't set up an authenticator app yet. Please use a different verification method or enroll in TOTP.
```

**UI Recommendations**:

- Hide TOTP input
- Show "Enroll in TOTP" button
- Display alternative factor options

---

### Email OTP

#### `EMAIL_OTP_INVALID` (400)

**Returned when**: Email code doesn't match.

**User Message**:

```
The code you entered is incorrect. Please check your email and try again.
```

**UI Recommendations**:

- Highlight input field
- Show "Resend code" button (with cooldown)
- Display when code was sent

#### `EMAIL_OTP_EXPIRED` (400)

**Returned when**: Email code has expired (typically 10 minutes).

**User Message**:

```
This code has expired. Click below to receive a new code.
```

**UI Recommendations**:

- Clear input field
- Auto-focus "Resend code" button
- Show expiry time (e.g., "Codes expire after 10 minutes")

#### `EMAIL_DELIVERY_FAILED` (503)

**Returned when**: Email service is unavailable.

**User Message**:

```
We couldn't send the verification code. Please try a different method or contact support.
```

**UI Recommendations**:

- Show alternative factor options prominently
- Provide support contact information
- Mark as CRITICAL severity

#### `EMAIL_RATE_LIMITED` (429)

**Returned when**: Too many email requests in short time.

**User Message**:

```
Too many email requests. Please wait {X} minutes before requesting a new code.
```

**UI Recommendations**:

- Disable "Resend" button with countdown
- Suggest using existing code if recent
- Show alternative factors

---

### Passkey (WebAuthn)

#### `PASSKEY_NOT_AVAILABLE` (500)

**Returned when**: Passkey challenge generation fails.

**User Message**:

```
Passkey verification is temporarily unavailable. Please use a different method.
```

**UI Recommendations**:

- Hide passkey option
- Show alternative factors
- Mark as WARNING severity

#### `PASSKEY_VERIFICATION_FAILED` (400)

**Returned when**: Signature verification fails.

**User Message**:

```
Passkey verification failed. This may be due to a hardware or browser issue. Please try again or use a different method.
```

**UI Recommendations**:

- Allow retry (1-2 times)
- Show alternative factors
- Provide troubleshooting link

#### `PASSKEY_CANCELLED` (400)

**Returned when**: User cancels the browser prompt.

**User Message**:

```
Passkey verification was cancelled. Please try again when ready.
```

**UI Recommendations**:

- Keep passkey option visible
- Show "Try again" button
- No countdown or penalty

#### `PASSKEY_NOT_ENROLLED` (400)

**Returned when**: User hasn't registered a passkey.

**User Message**:

```
You haven't registered a passkey yet. Please use a different method or enroll a passkey.
```

**UI Recommendations**:

- Hide passkey verification UI
- Show "Register a passkey" option
- Display alternative factors

---

### Backup Codes

#### `BACKUP_CODE_INVALID` (400)

**Returned when**: Backup code doesn't match any stored codes.

**User Message**:

```
Invalid backup code. Please check and try again. Backup codes are case-sensitive.
```

**UI Recommendations**:

- Keep input field visible
- Show format hint (e.g., "XXXX-XXXX-XXXX-XXXX")
- Remind user codes are case-sensitive

#### `BACKUP_CODE_EXHAUSTED` (400)

**Returned when**: All backup codes have been used.

**User Message**:

```
You've used all your backup codes. Please use a different verification method and generate new backup codes.
```

**UI Recommendations**:

- Hide backup code input
- Show alternative factors
- Prompt to generate new codes after successful MFA

#### `BACKUP_CODE_ALREADY_USED` (400)

**Returned when**: Code has already been consumed.

**User Message**:

```
This backup code has already been used. Each code can only be used once.
```

**UI Recommendations**:

- Clear input field
- Show remaining backup codes count
- Suggest using a different code

---

### WhatsApp OTP

#### `WHATSAPP_DELIVERY_FAILED` (503)

**Returned when**: Message couldn't be sent.

**User Message**:

```
We couldn't send a verification code to your WhatsApp. Please try a different method.
```

**UI Recommendations**:

- Show alternative factors
- Verify phone number is correct
- Provide support contact

#### `WHATSAPP_RATE_LIMITED` (429)

**Returned when**: Too many WhatsApp requests.

**User Message**:

```
Too many WhatsApp requests. Please wait {X} minutes before requesting a new code.
```

**UI Recommendations**:

- Disable "Resend" button with countdown
- Show alternative factors
- Display when last code was sent

---

## State Management Errors

### `mfa_not_enabled` (400)

**Returned when**: User's MFA is disabled but endpoint requires it.

**User Message**:

```
Multi-factor authentication is not enabled for your account.
```

**UI Recommendations**:

- Redirect to MFA enrollment flow
- Show "Enable MFA" button
- Mark as INFO severity (user not yet enrolled)

### `mfa_not_enrolled` (400)

**Returned when**: Specific factor not enrolled but selected.

**User Message**:

```
You haven't enrolled in this verification method. Please choose a different method or enroll first.
```

**UI Recommendations**:

- Show available factors
- Highlight enrolled factors
- Provide "Enroll" button for selected factor

### `configuration_error` (500)

**Returned when**: Server-side configuration issue.

**User Message**:

```
A system error occurred. Please try again. If the problem persists, contact support with request ID: {requestId}.
```

**UI Recommendations**:

- Show request ID prominently
- Provide support contact
- Mark as CRITICAL severity
- Allow retry

---

## Security Errors

### `unauthenticated` (401)

**Returned when**: No valid session found.

**User Message**:

```
Your session has expired. Please sign in again.
```

**UI Recommendations**:

- Redirect to login page
- Preserve intended destination
- Clear any cached state

### `invalid_payload` (400)

**Returned when**: Request format is incorrect.

**User Message**:

```
Invalid request. Please refresh the page and try again.
```

**UI Recommendations**:

- Log error details for debugging
- Offer page refresh
- If persists, show support contact

### `verification_failed` (400)

**Generic error when specific code not provided**

**User Message**:

```
Verification failed. Please check your input and try again.
```

**UI Recommendations**:

- Use only when specific error code unavailable
- Log full error for debugging
- Provide retry option

---

## UI Implementation Guidelines

### 1. Error Display Pattern

```typescript
interface ErrorDisplayConfig {
  severity: "info" | "warning" | "error" | "critical";
  title: string;
  message: string;
  countdown?: Date; // For rate limiting
  actions?: Array<{
    label: string;
    variant: "primary" | "secondary";
    onClick: () => void;
  }>;
  dismissable?: boolean;
  autoHideDuration?: number; // milliseconds
}
```

### 2. Error Priority

When multiple errors occur, display in this priority order:

1. **CRITICAL** - System failures, configuration errors
2. **ERROR** - Failed verifications, invalid codes
3. **WARNING** - Rate limiting, service degradation
4. **INFO** - Informational messages, tips

### 3. Accessibility

- All error messages must have `role="alert"`
- Use `aria-live="polite"` for informational messages
- Use `aria-live="assertive"` for errors
- Provide focus management (move focus to error or retry button)
- Ensure sufficient color contrast (WCAG AA minimum)

```tsx
<div role="alert" aria-live="assertive" className="error-banner">
  <ErrorIcon aria-hidden="true" />
  <div>
    <strong>{error.title}</strong>
    <p>{error.message}</p>
  </div>
</div>
```

### 4. Progressive Enhancement

```typescript
function getErrorMessage(error: ErrorResponse): string {
  // Specific error codes
  const errorMessages: Record<string, string> = {
    TOTP_INVALID: "The code you entered is incorrect.",
    TOTP_EXPIRED: "This code has expired.",
    EMAIL_OTP_EXPIRED: "Your code has expired. Request a new one.",
    // ... more mappings
  };

  // Check for specific code first
  if (error.code && error.code in errorMessages) {
    return errorMessages[error.code];
  }

  // Fall back to generic error type
  const genericMessages: Record<string, string> = {
    invalid_code: "The code you entered is incorrect.",
    rate_limited: "Too many attempts. Please wait and try again.",
    verification_failed: "Verification failed. Please try again.",
  };

  return genericMessages[error.error] || "An error occurred. Please try again.";
}
```

### 5. User Context

Tailor messages based on user context:

- **First-time users**: More explanatory, include enrollment prompts
- **Experienced users**: Concise, focus on resolution
- **Repeated failures**: Escalate to support suggestions
- **Security events**: Balance transparency with security (don't reveal too
  much)

### 6. Retry Strategy

```typescript
interface RetryConfig {
  maxAttempts: number;
  currentAttempt: number;
  cooldownMs?: number;
  exponentialBackoff?: boolean;
}

function shouldAllowRetry(config: RetryConfig): boolean {
  if (config.currentAttempt >= config.maxAttempts) {
    return false;
  }

  if (config.cooldownMs) {
    // Implement cooldown logic
  }

  return true;
}
```

**Recommended retry limits**:

- TOTP/Backup: 5 attempts before rate limit
- Email OTP: 3 resends per 10 minutes
- Passkey: Unlimited (user-cancelled doesn't count)
- WhatsApp: 3 resends per 10 minutes

---

## Testing Error Handling

Create test cases for each error scenario:

```typescript
describe("MFA Error Handling", () => {
  it("displays user-friendly message for TOTP_INVALID", () => {
    const error = { error: "invalid_code", code: "TOTP_INVALID" };
    const message = getErrorMessage(error);
    expect(message).toContain("incorrect");
    expect(message).not.toContain("TOTP_INVALID"); // No raw codes
  });

  it("shows countdown for rate limiting", () => {
    const error = {
      error: "rate_limited",
      retryAt: new Date(Date.now() + 300000).toISOString(),
    };
    // Verify countdown component renders
  });

  // ... more tests
});
```

---

## Monitoring and Alerting

Track error rates to identify issues:

```typescript
// Log errors for monitoring
function logMfaError(
  error: ErrorResponse,
  context: {
    userId?: string;
    factor: string;
    attemptNumber: number;
  }
) {
  logger.warn("mfa_verification_failed", {
    error: error.error,
    code: error.code,
    factor: context.factor,
    attempt: context.attemptNumber,
    userId: hashUserId(context.userId), // Hash for privacy
  });
}
```

**Alert thresholds**:

- Rate limited errors > 100/hour: Possible attack
- Configuration errors > 10/hour: System issue
- Delivery failures > 50/hour: Service degradation

---

## Summary

This guide provides: ✅ Comprehensive error code mapping  
✅ User-friendly message templates  
✅ UI/UX recommendations per error type  
✅ Accessibility guidelines  
✅ Implementation examples  
✅ Testing strategies

**Next Steps**:

1. Implement error mapping in client-side code
2. Create reusable error display components
3. Add telemetry for error tracking
4. Conduct user testing of error messages
5. Document internal error handling for support team

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-31  
**Related**: `apps/admin/lib/auth/errors.ts`,
`apps/admin/app/api/authx/challenge/verify/route.ts`

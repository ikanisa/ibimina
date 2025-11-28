# Error Code System

This document describes the centralized error code system implemented in
`packages/lib/src/errors`.

## Overview

The error code system provides consistent, structured error handling across the
platform with:

- **Standardized error codes** following the format `DOMAIN_XXX`
- **HTTP status mapping** for API responses
- **Type-safe error handling** with TypeScript

## Error Code Format

```
DOMAIN_XXX
```

- **DOMAIN**: Subsystem (AUTH, API, DB, PAY, SMS, etc.)
- **XXX**: Sequential number within that domain (100-199, 200-299, etc.)

## Error Domains

### Authentication & Authorization (100-199)

- `AUTH_100` - Unauthorized access
- `AUTH_101` - Access forbidden
- `AUTH_102` - Invalid credentials
- `AUTH_103` - Token expired
- `AUTH_104` - MFA required
- `AUTH_105` - MFA invalid
- `AUTH_106` - User not found
- `AUTH_107` - Account locked

### API & Validation (200-299)

- `API_200` - Bad request
- `API_201` - Validation failed
- `API_202` - Rate limit exceeded
- `API_203` - Resource not found
- `API_204` - Method not allowed
- `API_205` - Internal error

### Database (300-399)

- `DB_300` - Connection failed
- `DB_301` - Query failed
- `DB_302` - Constraint violation
- `DB_303` - Record not found
- `DB_304` - Duplicate record

### Payments & Wallet (400-499)

- `PAY_400` - Insufficient funds
- `PAY_401` - Transaction failed
- `PAY_402` - Invalid amount
- `PAY_403` - Currency mismatch
- `PAY_404` - Provider error

### SMS & Messaging (500-599)

- `SMS_500` - Send failed
- `SMS_501` - Invalid number
- `SMS_502` - Provider error
- `SMS_503` - Template error

## Usage

### Throwing Errors

```typescript
import { AppError, ERROR_CODES } from "@ibimina/lib/errors";

throw new AppError(
  ERROR_CODES.AUTH_UNAUTHORIZED,
  "Custom message (optional)",
  { userId: "123" } // Additional details (optional)
);
```

### Handling Errors

```typescript
try {
  // Some operation
} catch (error) {
  if (error instanceof AppError) {
    return new Response(JSON.stringify(error.toJSON()), {
      status: error.httpStatus,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Handle other errors
}
```

### API Response Format

```json
{
  "success": false,
  "error": {
    "code": "AUTH_100",
    "message": "Unauthorized access",
    "details": { "userId": "123" }
  }
}
```

## Adding New Error Codes

1. Add the error code to `packages/lib/src/errors/codes.ts`:

```typescript
export const ERROR_CODES = {
  // ... existing codes
  NEW_DOMAIN_100: "NEW_100",
} as const;
```

2. Add mapping in `getErrorInfo()` if custom message/status needed:

```typescript
case ERROR_CODES.NEW_DOMAIN_100:
  return { code, message: "Custom message", httpStatus: 400 };
```

## Best Practices

1. **Use specific error codes** rather than generic ones
2. **Include helpful details** in the details object
3. **Don't expose sensitive information** in error messages
4. **Log errors** before throwing them for debugging
5. **Use appropriate HTTP status codes** (400s for client errors, 500s for
   server errors)

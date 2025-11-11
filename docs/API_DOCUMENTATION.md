# Ibimina API Documentation

This document provides comprehensive documentation for all APIs in the Ibimina SACCO Management Platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication](#authentication)
3. [Client App APIs](#client-app-apis)
4. [Admin App APIs](#admin-app-apis)
5. [Supabase Edge Functions](#supabase-edge-functions)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Security Considerations](#security-considerations)

## Architecture Overview

The Ibimina platform uses a multi-layered API architecture:

- **Next.js API Routes**: Server-side API routes for both client and admin apps
- **Supabase Edge Functions**: Serverless functions running on Deno runtime
- **Direct Database Access**: Through Supabase client with Row-Level Security (RLS)

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Node.js 20+ (API routes), Deno (Edge Functions)
- **Database**: PostgreSQL 15 via Supabase
- **Authentication**: Supabase Auth with custom MFA layer
- **Security**: Row-Level Security (RLS), JWT tokens, HMAC verification

## Authentication

All API requests require authentication unless explicitly marked as public.

### Authentication Methods

1. **Session Cookie**: For browser-based requests (automatic)
2. **Bearer Token**: For programmatic access
3. **Service Role Key**: For admin operations (server-side only)

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Example: Authenticated Request

```typescript
const response = await fetch('/api/groups/123/members', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Client App APIs

APIs for member-facing features (apps/client/app/api/)

### Loans

#### GET /api/loans/products

Fetch available loan products from SACCO/MFI partners.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "name": "Emergency Loan",
      "description": "Quick access loans for emergencies",
      "min_amount": 50000,
      "max_amount": 500000,
      "interest_rate": 12.5,
      "term_months": 6,
      "partner_name": "Rwanda Finance Ltd",
      "enabled": true
    }
  ]
}
```

#### POST /api/loans/applications

Submit a loan application.

**Authentication**: Required

**Request Body**:
```json
{
  "product_id": "uuid",
  "amount": 200000,
  "purpose": "Business expansion",
  "term_months": 12
}
```

**Response**:
```json
{
  "success": true,
  "application": {
    "id": "uuid",
    "status": "pending",
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

### Groups (Ibimina)

#### GET /api/groups/[id]/members

Get members of a specific group.

**Authentication**: Required (must be member or staff)

**Parameters**:
- `id` (path): Group UUID

**Response**:
```json
{
  "success": true,
  "members": [
    {
      "id": "uuid",
      "name": "Jean Paul Mugisha",
      "member_code": "M001",
      "joined_at": "2025-01-15T10:00:00Z",
      "total_contributions": 50000
    }
  ]
}
```

#### POST /api/groups/[id]/join-request

Request to join a group.

**Authentication**: Required

**Parameters**:
- `id` (path): Group UUID

**Request Body**:
```json
{
  "message": "I would like to join this group"
}
```

**Response**:
```json
{
  "success": true,
  "request": {
    "id": "uuid",
    "status": "pending",
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

### Onboarding

#### POST /api/onboard

Complete member onboarding.

**Authentication**: Required

**Request Body**:
```json
{
  "full_name": "Marie Mukamana",
  "phone": "+250781234567",
  "national_id": "1199780123456789",
  "district": "Kicukiro"
}
```

**Response**:
```json
{
  "success": true,
  "member": {
    "id": "uuid",
    "onboarded": true
  }
}
```

### Wallet & Tokens

#### GET /api/wallet/tokens

Get user's wallet tokens (vouchers, loyalty points).

**Authentication**: Required

**Query Parameters**:
- `status` (optional): Filter by status (active, redeemed, expired)

**Response**:
```json
{
  "success": true,
  "tokens": [
    {
      "id": "uuid",
      "type": "voucher",
      "display_name": "Shopping Voucher",
      "value_amount": 5000,
      "currency": "RWF",
      "status": "active",
      "expires_at": "2025-12-31T23:59:59Z"
    }
  ]
}
```

### OCR (Identity Verification)

#### POST /api/ocr/upload

Upload and process identity document.

**Authentication**: Required

**Content-Type**: multipart/form-data

**Request Body**:
- `file`: Image file (JPEG, PNG)
- `id_type`: Type of ID (NID, DL, PASSPORT)

**Response**:
```json
{
  "success": true,
  "data": {
    "id_type": "NID",
    "id_number": "1199780123456789",
    "full_name": "MUGISHA Jean Paul",
    "date_of_birth": "1997-08-15",
    "confidence": 0.95
  }
}
```

### SACCO Search

#### GET /api/saccos/search

Search for Umurenge SACCOs.

**Authentication**: Required

**Query Parameters**:
- `q`: Search query (name or district)
- `district`: Filter by district

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "id": "uuid",
      "name": "SACCO Kicukiro",
      "district": "Kicukiro",
      "sector": "Gahanga",
      "member_count": 450,
      "active": true
    }
  ]
}
```

### Push Notifications

#### POST /api/push/subscribe

Subscribe to push notifications.

**Authentication**: Required

**Request Body**:
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  },
  "topics": ["payments", "groups"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Subscribed to topics"
}
```

#### POST /api/push/unsubscribe

Unsubscribe from push notifications.

**Authentication**: Required

**Request Body**:
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "topics": ["payments"]
}
```

## Admin App APIs

APIs for staff/admin operations (apps/admin/app/api/)

### Feature Flags

#### GET /api/feature-flags

Get feature flag configuration.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "flags": {
    "loans_enabled": true,
    "wallet_enabled": false,
    "ai_support_enabled": true
  }
}
```

### Staff Management

#### GET /api/admin/staff

List all staff members.

**Authentication**: Required (Admin role)

**Query Parameters**:
- `sacco_id` (optional): Filter by SACCO
- `role` (optional): Filter by role

**Response**:
```json
{
  "success": true,
  "staff": [
    {
      "id": "uuid",
      "email": "staff@sacco.rw",
      "full_name": "John Doe",
      "role": "teller",
      "sacco_id": "uuid",
      "active": true
    }
  ]
}
```

#### POST /api/admin/staff/create

Create a new staff member.

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "email": "newstaff@sacco.rw",
  "full_name": "Jane Doe",
  "role": "teller",
  "sacco_id": "uuid"
}
```

#### POST /api/admin/staff/assign-role

Assign role to staff member.

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "user_id": "uuid",
  "role": "manager"
}
```

### Payment Management

#### POST /api/admin/payments/assign

Assign payment to group/member.

**Authentication**: Required (Staff role)

**Request Body**:
```json
{
  "payment_id": "uuid",
  "group_id": "uuid",
  "member_id": "uuid",
  "amount": 5000
}
```

#### POST /api/admin/payments/update-status

Update payment status.

**Authentication**: Required (Staff role)

**Request Body**:
```json
{
  "payment_id": "uuid",
  "status": "confirmed",
  "notes": "Payment verified"
}
```

### MFA Management

#### POST /api/admin/mfa/reset

Reset MFA for a user (admin emergency access).

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "user_id": "uuid",
  "reason": "User lost device"
}
```

### Audit & Reporting

#### POST /api/admin/audit/export

Export audit logs.

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "format": "csv"
}
```

**Response**: CSV file download

### Health Check

#### GET /api/health

System health check (public endpoint).

**Authentication**: Not required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T10:00:00Z",
  "services": {
    "database": "ok",
    "supabase": "ok"
  }
}
```

## Supabase Edge Functions

Serverless functions running on Deno runtime (supabase/functions/)

### WhatsApp OTP

#### POST /whatsapp-send-otp

Send OTP via WhatsApp.

**Authentication**: Service role key

**Request Body**:
```json
{
  "phoneNumber": "+250781234567"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent"
}
```

#### POST /whatsapp-verify-otp

Verify WhatsApp OTP.

**Authentication**: Service role key

**Request Body**:
```json
{
  "phoneNumber": "+250781234567",
  "otpCode": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "session": {
    "user_id": "uuid",
    "token": "jwt-token",
    "expires_at": "2025-11-11T11:00:00Z"
  }
}
```

### SMS Processing

#### POST /parse-sms

Parse mobile money SMS.

**Request Body**:
```json
{
  "message": "You have received RWF 5000 from...",
  "sender": "MTN"
}
```

**Response**:
```json
{
  "success": true,
  "parsed": {
    "type": "receive",
    "amount": 5000,
    "currency": "RWF",
    "reference": "REF123"
  }
}
```

#### POST /ingest-sms

Ingest SMS for reconciliation.

**Authentication**: HMAC signature

**Request Body**:
```json
{
  "message": "Transaction SMS text",
  "timestamp": "2025-11-11T10:00:00Z",
  "source": "mtn"
}
```

### Reconciliation

#### POST /reconcile

Run reconciliation process.

**Authentication**: Service role key

**Request Body**:
```json
{
  "sacco_id": "uuid",
  "date": "2025-11-11",
  "auto_confirm": false
}
```

**Response**:
```json
{
  "success": true,
  "matched": 45,
  "unmatched": 3,
  "exceptions": [...]
}
```

### Reports & Analytics

#### POST /export-report

Generate and export reports.

**Authentication**: Required

**Request Body**:
```json
{
  "type": "allocation",
  "sacco_id": "uuid",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "format": "pdf"
}
```

#### POST /analytics-forecast

Generate forecasting analytics.

**Authentication**: Required

**Request Body**:
```json
{
  "sacco_id": "uuid",
  "lookback_days": 120,
  "horizon_days": 21
}
```

### Notifications

#### POST /send-push-notification

Send push notification to users.

**Authentication**: Service role key

**Request Body**:
```json
{
  "user_ids": ["uuid1", "uuid2"],
  "title": "Payment Received",
  "body": "You received RWF 5000",
  "data": {
    "type": "payment",
    "payment_id": "uuid"
  }
}
```

#### POST /notification-dispatch-email

Send email notification.

**Authentication**: Service role key

**Request Body**:
```json
{
  "to": "user@example.com",
  "subject": "Payment Confirmation",
  "template": "payment-received",
  "data": {
    "amount": 5000,
    "reference": "REF123"
  }
}
```

## Error Handling

All APIs follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

### Error Examples

#### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "amount": "Must be greater than 0",
    "phone": "Invalid phone number format"
  }
}
```

#### Authentication Error
```json
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "details": {
    "message": "Invalid or expired token"
  }
}
```

## Rate Limiting

APIs are rate-limited to prevent abuse:

- **Default**: 120 requests per minute per user
- **Edge Functions**: 60 requests per minute
- **Admin APIs**: 300 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1699711200
```

When rate limited, you'll receive a 429 status code:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "retry_after": 60
}
```

## Security Considerations

### Best Practices

1. **Always use HTTPS** in production
2. **Never expose service role keys** in client-side code
3. **Validate all inputs** on the server side
4. **Use Row-Level Security (RLS)** for database access
5. **Implement HMAC signatures** for webhook verification
6. **Rotate secrets regularly**
7. **Monitor for suspicious activity**

### HMAC Verification

For webhook endpoints, verify HMAC signatures:

```typescript
import { createHmac } from 'crypto';

function verifyHmac(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}
```

### Data Encryption

Sensitive data is encrypted at rest:

- **PII**: Encrypted with KMS_DATA_KEY_BASE64
- **Passwords**: Hashed with bcrypt + pepper
- **MFA secrets**: Encrypted in database

### Row-Level Security (RLS)

Database access is protected by RLS policies:

- Members can only access their own data
- Staff can access data for their SACCO
- Admins have cross-SACCO access

## API Versioning

Currently, all APIs are at version 1.0. Future versions will be supported through:

1. **URL versioning**: `/api/v2/endpoint`
2. **Header versioning**: `Accept-Version: 2.0`

## Support & Contact

For API support:

- **Documentation**: [https://docs.ibimina.rw](https://docs.ibimina.rw)
- **Email**: dev@ibimina.rw
- **GitHub Issues**: [https://github.com/ikanisa/ibimina/issues](https://github.com/ikanisa/ibimina/issues)

## Changelog

### Version 1.0.0 (2025-11-11)

- Initial API documentation
- Client app APIs documented
- Admin app APIs documented
- Supabase Edge Functions documented
- Error handling and security guidelines added

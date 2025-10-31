# TapMoMo Backend Integration

This folder contains the optional Supabase backend integration for TapMoMo
library.

## Overview

The backend provides:

1. **Merchant Management**: Store merchant profiles with HMAC signing keys
2. **Transaction Reconciliation**: Server-side transaction records and status
   updates
3. **Edge Function**: API endpoint for transaction reconciliation

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and keys

### 2. Run Database Migrations

Execute `schema.sql` in your Supabase SQL editor:

```bash
# From Supabase dashboard:
# 1. Go to SQL Editor
# 2. Create new query
# 3. Paste contents of schema.sql
# 4. Run query
```

Or use Supabase CLI:

```bash
supabase db push
```

### 3. Deploy Edge Function

Deploy the reconcile Edge Function:

```bash
supabase functions deploy reconcile
```

Or manually:

1. Go to Edge Functions in Supabase dashboard
2. Create new function named "reconcile"
3. Paste contents of `reconcile/index.ts`
4. Deploy

### 4. Generate Merchant Secret Keys

For each merchant, generate a secure HMAC secret:

```sql
-- Insert merchant with generated secret
INSERT INTO merchants (user_id, display_name, network, merchant_code, secret_key)
VALUES (
    auth.uid(),
    'My Business',
    'MTN',
    '123456',
    decode(encode(gen_random_bytes(32), 'base64'), 'base64')
);
```

### 5. Configure Android App

Update your app's `TapMoMoConfig`:

```kotlin
TapMoMo.init(
    context = this,
    config = TapMoMoConfig(
        supabaseUrl = "https://your-project.supabase.co",
        supabaseAnonKey = "your-anon-key",
        reconcileFunctionUrl = "https://your-project.supabase.co/functions/v1/reconcile",
        // ... other config
    )
)
```

## Database Schema

### merchants table

| Column        | Type        | Description                             |
| ------------- | ----------- | --------------------------------------- |
| id            | UUID        | Primary key                             |
| user_id       | UUID        | Foreign key to auth.users               |
| display_name  | TEXT        | Merchant display name                   |
| network       | TEXT        | Mobile money network (MTN, Airtel)      |
| merchant_code | TEXT        | MoMo merchant code                      |
| secret_key    | BYTEA       | HMAC signing secret (encrypted at rest) |
| created_at    | TIMESTAMPTZ | Creation timestamp                      |
| updated_at    | TIMESTAMPTZ | Last update timestamp                   |

### transactions table

| Column      | Type        | Description                   |
| ----------- | ----------- | ----------------------------- |
| id          | UUID        | Primary key                   |
| merchant_id | UUID        | Foreign key to merchants      |
| nonce       | UUID        | Unique nonce from NFC payload |
| amount      | INTEGER     | Transaction amount            |
| currency    | TEXT        | Currency code (default: RWF)  |
| ref         | TEXT        | Optional reference            |
| created_at  | TIMESTAMPTZ | Creation timestamp            |
| status      | TEXT        | pending, settled, or failed   |
| payer_hint  | TEXT        | Optional payer information    |
| notes       | TEXT        | Optional notes                |

## Row Level Security (RLS)

RLS policies ensure:

- Users can only view/manage their own merchants
- Users can only view transactions for their merchants
- Service role can insert/update transactions (for reconciliation)

## Edge Function API

### POST /reconcile

Reconcile a transaction status.

**Request:**

```json
{
  "transaction_id": "uuid",
  "merchant_id": "uuid",
  "amount": 2500,
  "status": "settled",
  "payer_hint": "0788123456",
  "notes": "Optional notes"
}
```

**Response:**

```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "merchant_id": "uuid",
    "amount": 2500,
    "status": "settled",
    ...
  }
}
```

**Error Response:**

```json
{
  "error": "Error message"
}
```

## Security Best Practices

1. **Never commit secret keys** to source control
2. **Use environment variables** for configuration
3. **Rotate keys regularly** for production merchants
4. **Enable RLS** on all tables
5. **Audit access logs** in Supabase dashboard
6. **Use HTTPS** for all API calls
7. **Validate signatures** on the client side

## Fetching Merchant Secrets

The Android app can fetch merchant secrets for signature verification:

```kotlin
// In your app (not the library)
suspend fun fetchMerchantSecret(merchantId: String): String? {
    val supabase = createSupabaseClient(url, key)
    val response = supabase
        .from("merchants")
        .select("secret_key")
        .eq("id", merchantId)
        .single()

    return response.data?.getString("secret_key")
}
```

**Important**: Only fetch secrets for your own merchants. The library does not
automatically fetch secrets for security reasons.

## Testing

Test the Edge Function locally:

```bash
supabase functions serve reconcile
```

Make a test request:

```bash
curl -X POST http://localhost:54321/functions/v1/reconcile \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-uuid",
    "merchant_id": "merchant-uuid",
    "amount": 1000,
    "status": "settled"
  }'
```

## Monitoring

Monitor your backend via Supabase dashboard:

1. **Database**: View tables and run queries
2. **Edge Functions**: View logs and invocations
3. **API**: Monitor API usage and errors
4. **Auth**: Manage users and sessions

## Cost Considerations

Supabase free tier includes:

- 500 MB database space
- 2 GB file storage
- 2 GB bandwidth
- 500K Edge Function invocations

For production, consider upgrading to Pro plan for better performance and
support.

## Support

For backend issues:

1. Check Supabase logs
2. Verify RLS policies
3. Test Edge Function locally
4. Review authentication flow

For library issues, see main README.md.

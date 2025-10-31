# African Fintech Supa App - Feature Implementation Guide

## Overview

This document describes the implementation of the African fintech "supa app"
features for the Client App, including feature toggles, loans, wallet/tokens,
NFC, KYC, and AI agent support.

## Feature Toggle Matrix

The app uses a regulatory tier-based feature toggle system to ensure compliance
and safe rollout:

- **P0 (No licenses)**: Basic features requiring no special licenses
- **P1 (Partnered)**: Features enabled through partner agreements
- **P2 (Licensed)**: Features requiring full e-money/banking licenses

### Default Configuration

```typescript
{
  "savings": { "enabled": true, "tier": "P0" },
  "loans": { "enabled": false, "tier": "P0" },
  "wallet": { "enabled": false, "tier": "P0" },
  "tokens": { "enabled": false, "tier": "P0" },
  "nfc": { "enabled": false, "tier": "P0" },
  "kyc": { "enabled": true, "tier": "P0" },
  "ai_agent": { "enabled": false, "tier": "P0" }
}
```

## Database Schema

### New Tables

1. **org_feature_overrides**: Organization-specific feature flag overrides
2. **org_kb, global_kb, faq**: AI agent knowledge bases with vector embeddings
3. **tickets, ticket_messages**: Multi-channel support ticketing
4. **loan_products, loan_applications**: Intermediated loan applications
5. **wallet_tokens, wallet_transaction_evidence**: Non-custodial token
   management
6. **stablecoin_transfers**: P2-tier stablecoin metadata tracking
7. **nfc_tags, nfc_tap_events**: NFC tag management and analytics

All tables have:

- Full RLS policies for multi-tenant isolation
- Audit timestamps (created_at, updated_at)
- Appropriate indexes for performance
- Comprehensive comments for documentation

## Feature Domains

### 1. Savings (P0 - Default Enabled)

**What it does:**

- USSD deposit with reference tokens
- Allocation evidence display
- Group vault proxy (optional, P1)

**Implementation:**

- Already implemented in base client app
- `/pay` route for USSD payments
- `/statements` route for allocation evidence

### 2. Loans (P0+ - Disabled by Default)

**What it does:**

- Browse loan products from SACCO/MFI partners
- Digital loan application submission
- Document upload and status tracking
- Intermediation only (no disbursement)

**Implementation:**

- Page: `/app/loans/page.tsx`
- Component: `/components/loans/loan-product-card.tsx`
- API: `/api/loans/products/route.ts`, `/api/loans/applications/route.ts`

**Enabling:**

```sql
UPDATE configuration
SET value = jsonb_set(value, '{loans,enabled}', 'true')
WHERE key = 'client_feature_matrix';
```

Or set environment variable:

```bash
NEXT_PUBLIC_FEATURE_FLAG_LOANS_ENABLED=true
```

### 3. Wallet/Tokens (P0+ - Disabled by Default)

**What it does:**

- Display vouchers, loyalty points, attendance credits
- Non-custodial token management (evidence only)
- QR/NFC redemption support
- Transaction evidence tracking

**Implementation:**

- Page: `/app/wallet/page.tsx`
- Component: `/components/wallet/token-card.tsx`
- API: `/api/wallet/tokens/route.ts`

**Token Types:**

- VOUCHER: One-time use vouchers
- LOYALTY_POINT: Accumulating points
- ATTENDANCE_CREDIT: Group meeting attendance rewards
- CLOSED_LOOP_TOKEN: Restricted-use tokens

**Enabling:**

```sql
UPDATE configuration
SET value = jsonb_set(value, '{wallet,enabled}', 'true')
WHERE key = 'client_feature_matrix';
```

### 4. NFC (P0+ - Disabled by Default)

**What it does:**

- NDEF tag programming with reference tokens
- Tap-to-copy payment references
- Voucher redemption via NFC
- Tap event analytics

**Tag Types:**

- NDEF: Physical NFC tags
- HCE: Host Card Emulation (Android)
- CARD_EMULATION: Closed-loop card emulation (P2)

**Implementation:**

- Database: `nfc_tags`, `nfc_tap_events` tables
- Android: Capacitor NFC plugin integration required

### 5. KYC (P0 - Default Enabled)

**What it does:**

- OCR + selfie capture (P0)
- 3rd-party screening (P1)
- Full KYC for account opening (P2)

**Implementation:**

- Already implemented in base client app
- `/api/ocr/upload/route.ts` for document processing
- `members_app_profiles` table stores KYC data

### 6. AI Agent (P0+ - Disabled by Default)

**What it does:**

- In-app FAQ and USSD help
- Multi-channel support (WhatsApp, Email, IVR)
- RAG-based knowledge search
- Ticket creation and tracking

**Implementation:**

- Page: `/app/support/page.tsx`
- Component: `/components/ai-chat/ai-chat.tsx`
- API: `/api/agent/search/route.ts`, `/api/agent/tickets/route.ts`

**Knowledge Base:**

- Org-specific KB: SACCO policies, contacts, help articles
- Global KB: System-wide best practices, USSD guides
- FAQ: Common Q&A with semantic search

**Enabling:**

```sql
UPDATE configuration
SET value = jsonb_set(value, '{ai_agent,enabled}', 'true')
WHERE key = 'client_feature_matrix';
```

## API Endpoints

### Loans

- `GET /api/loans/products` - List enabled loan products
- `POST /api/loans/applications` - Create loan application
- `GET /api/loans/applications` - Get user's applications

### Wallet

- `GET /api/wallet/tokens` - Get user's wallet tokens
- `GET /api/wallet/tokens?status=ACTIVE` - Filter by status

### AI Agent

- `POST /api/agent/search` - Search knowledge base (RAG)
- `POST /api/agent/tickets` - Create support ticket
- `GET /api/agent/tickets` - Get user's tickets

## Navigation

The bottom navigation dynamically adjusts based on enabled features:

**Base (always visible):**

- Home
- Groups
- Pay
- Statements
- Profile

**Feature-flagged (when enabled):**

- Loans (when `loans-enabled` flag is true)
- Wallet (when `wallet-enabled` flag is true)

Limited to 5 items for optimal mobile UX. Priority order:

1. Home (always)
2. Groups (always)
3. Pay (always)
4. Loans (if enabled)
5. Wallet (if enabled) OR Statements
6. Profile (always)

## Security & Compliance

### Row-Level Security (RLS)

All tables have comprehensive RLS policies:

1. **User isolation**: Users see only their own data
2. **Org isolation**: Staff see only their organization's data
3. **Token-scoped access**: Group members see allocations for their tokens only
4. **Audit trails**: All status changes are logged

### Data Handling

- **No funds handling**: App is intermediation-only
- **No private keys**: Stablecoin transfers store metadata only
- **Evidence-based**: Wallet shows transaction evidence, not ledger
- **Signed URLs**: Document uploads use expiring signed URLs
- **PII protection**: Sensitive data encrypted, minimal retention

### Feature Gating

Features require:

1. **Feature flag enabled** in configuration
2. **Org-specific override** (optional) with risk sign-off
3. **Partner agreement** reference (for P1/P2 features)
4. **User consent** screens (for KYC, stablecoin)

## Testing

### Unit Tests

Test files for new features:

- `apps/client/tests/unit/feature-flags.test.ts`
- TODO: Add tests for new components

### Integration Tests

- Feature flag configuration loading
- Org-specific override application
- RLS policy enforcement

### E2E Tests

- Loan application flow
- Wallet token redemption
- AI chat interaction
- Feature flag toggling

## Deployment Checklist

Before enabling a feature in production:

1. ✅ Database migrations applied
2. ✅ RLS policies tested
3. ✅ Feature flag in configuration table
4. ✅ Partner agreements signed (if P1/P2)
5. ✅ Risk assessment completed
6. ✅ Staff training completed
7. ✅ Rollback plan documented
8. ✅ Monitoring and alerts configured

## Monitoring

Track these metrics per feature domain:

- **Loans**: Application volume, approval rate, time-to-decision
- **Wallet**: Token issuance, redemption rate, active value
- **AI Agent**: Deflection rate, ticket resolution time, CSAT
- **NFC**: Tap events, success rate, redemption patterns

## Troubleshooting

### Feature not appearing in nav

1. Check feature flag:
   `SELECT value->'loans'->>'enabled' FROM configuration WHERE key = 'client_feature_matrix';`
2. Check org override:
   `SELECT * FROM org_feature_overrides WHERE feature_domain = 'loans';`
3. Clear browser cache
4. Check console for errors

### RLS policy blocking access

1. Verify user has org_membership:
   `SELECT * FROM org_memberships WHERE user_id = auth.uid();`
2. Check table RLS policies:
   `SELECT * FROM pg_policies WHERE tablename = 'loan_applications';`
3. Test with service_role for debugging

### Vector search not working

1. Ensure pgvector extension installed: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Check embeddings exist:
   `SELECT COUNT(*) FROM org_kb WHERE embedding IS NOT NULL;`
3. Verify index:
   `SELECT * FROM pg_indexes WHERE tablename = 'org_kb' AND indexname LIKE '%embedding%';`

## Future Enhancements

- **Stablecoin on/off-ramp** (P2 tier, requires licensing)
- **WhatsApp bot** integration for AI agent
- **Voice IVR** support for AI agent
- **HCE implementation** for Android NFC
- **Full loan disbursement** tracking (P1 tier)
- **Multi-chain support** for stablecoins (P2 tier)

## References

- Problem statement: Original blueprint document
- Database migrations: `/supabase/migrations/20251031*.sql`
- Type definitions: `/apps/client/lib/types/supa-app.ts`
- Feature flag utilities: `/apps/client/lib/utils/feature-flags.ts`

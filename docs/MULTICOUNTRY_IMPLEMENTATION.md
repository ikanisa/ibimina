# Multi-Country Intermediation Implementation

This document describes the multi-country support implementation for the SACCO+
platform, enabling expansion beyond Rwanda to other African markets.

## Overview

The multi-country implementation adds primitives for:

- Country configuration with localization and compliance settings
- Telco provider management per country
- Partner (organization) specific overrides
- Country-scoped data isolation via RLS
- Pluggable SMS/statement parsing adapters

**Scope**: Intermediation-only - SACCO+ digitizes ibimina, standardizes USSD
references, ingests statements/SMS, and produces allocation evidence. Funds land
directly in SACCO/MFI merchant accounts; no core integrations, no custody.

## Database Schema

### Core Tables

#### `public.countries`

Master table of supported countries.

```sql
- id: UUID primary key
- iso2: CHAR(2) - 'RW', 'SN', 'CI', 'GH'
- iso3: CHAR(3) - 'RWA', 'SEN', 'CIV', 'GHS'
- name: TEXT - 'Rwanda', 'Senegal', etc.
- default_locale: TEXT - 'rw-RW', 'fr-SN'
- currency_code: CHAR(3) - 'RWF', 'XOF', 'GHS'
- timezone: TEXT - 'Africa/Kigali'
- is_active: BOOLEAN - whether country is enabled
```

#### `public.telco_providers`

Mobile money providers per country.

```sql
- id: UUID primary key
- country_id: UUID FK to countries
- name: TEXT - 'MTN', 'Airtel', 'Orange'
- ussd_pattern: TEXT - '*182#'
- merchant_field_name: TEXT - field name in statements
- reference_field_name: TEXT - field name for references
- notes: TEXT
```

#### `public.country_config`

Per-country configuration and compliance.

```sql
- country_id: UUID primary key FK to countries
- languages: TEXT[] - ['rw-RW', 'en-RW', 'fr-RW']
- enabled_features: TEXT[] - ['USSD', 'OCR', 'SMS_INGEST', 'NFC']
- kyc_required_docs: JSONB - {NID: true, Passport: false}
- legal_pages: JSONB - {terms: 'url', privacy: 'url'}
- telco_ids: UUID[] - array of telco_provider IDs
- reference_format: TEXT - 'C3.D3.S3.G4.M3'
- number_format: JSONB - locale-specific formatting
- settlement_notes: TEXT
```

#### `public.partner_config`

Partner (organization) specific overrides.

```sql
- org_id: UUID primary key FK to organizations
- enabled_features: TEXT[] - override country defaults
- merchant_code: TEXT - partner's MoMo merchant code
- telco_ids: UUID[] - subset of country telcos
- language_pack: TEXT[] - override language preferences
- reference_prefix: TEXT - custom prefix (e.g., 'RWA.NYA.GAS.TWIZ')
- contact: JSONB - {phone, email, hours}
```

### Enhanced Tables

#### `public.organizations`

Added `country_id` column linking to countries table.

#### Tenant Tables

All tenant-scoped tables now include `country_id` with auto-population triggers:

- `public.groups` - ibimina groups
- `public.group_members` - group membership
- `public.uploads` - staff OCR/CSV uploads
- `public.allocations` - MoMo transaction evidence
- `public.org_kb` - organization knowledge base
- `public.tickets` - support tickets

**Trigger Behavior**: When a new record is inserted, if `country_id` is NULL,
it's automatically populated from the parent organization's `country_id`.

### RLS Policies

All tables have Row-Level Security enabled with policies ensuring:

1. System admins see all data
2. Users only see data from countries where they have organization memberships
3. Users only see data from their organizations (or child organizations for
   district managers)
4. Cross-country data access requires explicit membership in orgs in both
   countries

Helper functions:

- `public.user_org_ids()` - Returns org IDs for current user
- `public.user_country_ids()` - Returns country IDs for current user
- `public.is_system_admin()` - Checks if user is system admin

## Edge Function Adapters

### Provider Architecture

Located in `/infra/edge/providers/`, the adapter system allows pluggable parsers
for different country/telco combinations.

#### Type Definitions (`types.ts`)

```typescript
type NormalizedTxn = {
  amount: number; // in minor unit or integer
  txnId: string;
  ts: string; // ISO timestamp
  payerMsisdn?: string;
  rawRef?: string;
};

interface SmsAdapter {
  name: string; // e.g., "RW.MTN.sms.v1"
  parseSms: (text: string) => NormalizedTxn | null;
}

interface StatementAdapter {
  name: string; // e.g., "RW.MTN.statement.v1"
  parseRow: (row: Record<string, string>) => NormalizedTxn | null;
}

interface ReferenceDecoder {
  name: string; // e.g., "ref.C3.D3.S3.G4.M3"
  decode: (rawRef: string) => {
    country?: string;
    district?: string;
    sacco?: string;
    group?: string;
    member?: string;
  } | null;
}
```

#### Provider Registry (`index.ts`)

```typescript
export const registry: ProviderRegistry = {
  statement: {
    // "rw.mtn.statement": RW_MTN_STATEMENT_V1
  },
  sms: {
    "rw.mtn.sms": RW_MTN_SMS_V1,
  },
  decoder: Decoder,
};
```

#### Example: RW MTN SMS Adapter (`rw-mtn.sms.ts`)

Parses Rwanda MTN mobile money confirmation SMS messages:

```typescript
const RW_MTN_SMS_V1: SmsAdapter = {
  name: "RW.MTN.sms.v1",
  parseSms(text: string): NormalizedTxn | null {
    // Regex pattern for MTN Rwanda SMS format
    const re =
      /RWF\s*([\d,]+).*?(from|to)\s*(\+?2507\d{8}|07\d{8}).*?Ref[: ]\s*([A-Z]{3}\.[A-Z]{3}\.[A-Z0-9]{3,8}\.[0-9]{3}).*?(Txn|TXN)[: ]\s*([A-Za-z0-9]+).*?(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/i;
    // ... parsing logic
  },
};
```

#### Reference Decoder (`ref.C3D3S3G4M3.ts`)

Decodes structured references in format: `COUNTRY.DISTRICT.SACCO.GROUP.MEMBER`

```typescript
const Decoder: ReferenceDecoder = {
  name: "ref.C3.D3.S3.G4.M3",
  decode(rawRef: string) {
    const parts = rawRef.trim().split(".");
    if (parts.length !== 5) return null;
    const [country, district, sacco, group, member] = parts;
    return { country, district, sacco, group, member };
  },
};
```

### Enhanced `ingest-sms` Function

Located in `/infra/edge/functions/ingest-sms/index.ts`, uses adapters for
parsing:

```typescript
// Lookup adapter by country + telco
const key = `${country_iso2}.${telco}.sms`;
const adapter = registry.sms[key];

// Parse SMS
const norm = adapter.parseSms(sms);

// Decode reference
const decoded = registry.decoder.decode(norm.rawRef || "");

// Insert to allocations (country_id auto-populated via trigger)
await supabase.from("allocations").insert({
  org_id,
  momo_txn_id: norm.txnId,
  payer_msisdn: norm.payerMsisdn,
  amount: norm.amount,
  ts: norm.ts,
  raw_ref: norm.rawRef,
  decoded_district: decoded?.district,
  decoded_sacco: decoded?.sacco,
  decoded_group: decoded?.group,
  decoded_member: decoded?.member,
  match_status: "UNALLOCATED",
});
```

## Admin UI

New Next.js pages for country and partner configuration management.

### Countries Management

**List Page**: `/countries`

- View all configured countries
- Quick add new country
- Navigate to configuration

**Config Page**: `/countries/[id]`

- View country details (name, ISO codes, currency, timezone)
- View telco providers for country
- View country configuration (languages, features, KYC requirements)
- TODO: Edit forms (currently view-only)

### Partners Management

**List Page**: `/partners`

- View all partner organizations (SACCO/MFI/BANK)
- Shows country association
- Navigate to partner configuration

**Config Page**: `/partners/[id]`

- View organization details
- View available telco providers
- View partner-specific configuration overrides
- TODO: Edit forms (currently view-only)

### UI Components

All pages follow the admin app's design system:

- Tailwind CSS for styling
- Dark mode support
- Responsive layouts
- Loading states and error handling

## Usage Guide

### Adding a New Country

1. **Insert Country Record**:

```sql
INSERT INTO public.countries (iso2, iso3, name, default_locale, currency_code, timezone, is_active)
VALUES ('SN', 'SEN', 'Senegal', 'fr-SN', 'XOF', 'Africa/Dakar', true);
```

2. **Add Telco Providers**:

```sql
INSERT INTO public.telco_providers (country_id, name, ussd_pattern, merchant_field_name, reference_field_name)
VALUES
  ((SELECT id FROM countries WHERE iso2='SN'), 'Orange Money', '*144#', 'merchant', 'reference'),
  ((SELECT id FROM countries WHERE iso2='SN'), 'Free Money', '*155#', 'merchant', 'reference');
```

3. **Create Country Config**:

```sql
INSERT INTO public.country_config (
  country_id,
  languages,
  enabled_features,
  kyc_required_docs,
  legal_pages,
  telco_ids,
  reference_format
) VALUES (
  (SELECT id FROM countries WHERE iso2='SN'),
  ARRAY['fr-SN', 'wo-SN'],
  ARRAY['USSD', 'SMS_INGEST', 'OCR'],
  '{"NID": true, "Passport": true}'::jsonb,
  '{"terms": "https://example.com/sn/terms", "privacy": "https://example.com/sn/privacy"}'::jsonb,
  ARRAY[(SELECT id FROM telco_providers WHERE name='Orange Money' AND country_id=(SELECT id FROM countries WHERE iso2='SN'))],
  'C3.D3.S3.G4.M3'
);
```

4. **Create SMS Adapter**: Create `/infra/edge/providers/sn-orange.sms.ts`:

```typescript
import { SmsAdapter, NormalizedTxn } from "./types.ts";

const SN_ORANGE_SMS_V1: SmsAdapter = {
  name: "SN.ORANGE.sms.v1",
  parseSms(text: string): NormalizedTxn | null {
    // Implement parsing for Senegal Orange Money SMS format
    // ...
  },
};
export default SN_ORANGE_SMS_V1;
```

5. **Register Adapter**: Update `/infra/edge/providers/index.ts`:

```typescript
import SN_ORANGE_SMS_V1 from "./sn-orange.sms.ts";

export const registry: ProviderRegistry = {
  sms: {
    "rw.mtn.sms": RW_MTN_SMS_V1,
    "sn.orange.sms": SN_ORANGE_SMS_V1, // Add here
  },
  // ...
};
```

### Backfilling Existing Data

After deployment, backfill `country_id` for existing records:

```sql
-- Backfill organizations (set to Rwanda by default)
UPDATE public.organizations
SET country_id = (SELECT id FROM public.countries WHERE iso2='RW')
WHERE country_id IS NULL;

-- Then set NOT NULL constraint
ALTER TABLE public.organizations ALTER COLUMN country_id SET NOT NULL;

-- Triggers will handle future records automatically
```

### Partner Configuration

To configure a partner organization:

```sql
INSERT INTO public.partner_config (
  org_id,
  enabled_features,
  merchant_code,
  telco_ids,
  language_pack,
  reference_prefix,
  contact
) VALUES (
  '00000000-0000-0000-0000-000000000000',  -- org UUID
  ARRAY['USSD', 'SMS_INGEST'],
  'MERCHANT123',
  ARRAY[(SELECT id FROM telco_providers WHERE name='MTN' LIMIT 1)],
  ARRAY['rw-RW', 'en-RW'],
  'RWA.NYA.GAS',
  '{"phone": "+250788123456", "email": "support@partner.rw", "hours": "8am-5pm EAT"}'::jsonb
);
```

## Security Considerations

1. **Data Isolation**: RLS policies ensure strict country-level data isolation
2. **Feature Flags**: Enable features per country via
   `country_config.enabled_features`
3. **Audit Trail**: All changes should be logged via existing audit system
4. **Compliance**: `kyc_required_docs` enforces country-specific KYC
   requirements
5. **API Security**: Edge functions use HMAC signature validation

## Testing

### RLS Policy Tests

Add tests in `/supabase/tests/rls/`:

```sql
-- Test country-scoped access
BEGIN;
  SELECT plan(3);

  -- User in Rwanda org can't see Senegal data
  SET LOCAL role = 'authenticated';
  SET LOCAL request.jwt.claims.sub = '<rwanda_user_id>';

  SELECT is(
    COUNT(*)::int,
    0,
    'Rwanda user cannot see Senegal allocations'
  ) FROM public.allocations WHERE country_id = '<senegal_country_id>';

  SELECT * FROM finish();
ROLLBACK;
```

### Edge Function Tests

Test adapters in `/infra/edge/providers/_tests/`:

```typescript
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import RW_MTN_SMS_V1 from "../rw-mtn.sms.ts";

Deno.test("RW MTN SMS parser - successful parse", () => {
  const sms =
    "You received RWF 5,000 from +250788123456. Ref: RWA.NYA.GAS.TWIZ.001 Txn: MP123456789 2024-12-01 14:30";
  const result = RW_MTN_SMS_V1.parseSms(sms);

  assertEquals(result?.amount, 5000);
  assertEquals(result?.txnId, "MP123456789");
  assertEquals(result?.rawRef, "RWA.NYA.GAS.TWIZ.001");
});
```

## Migration Notes

- Migration file:
  `/supabase/migrations/20251201100000_multicountry_intermediation.sql`
- Safe to run on existing databases (uses `IF NOT EXISTS`, nullable country_id
  initially)
- Backfill required before setting NOT NULL constraints
- Triggers handle automatic country_id propagation for new records
- No breaking changes to existing functionality

## Future Enhancements

1. **Edit Forms**: Add full CRUD forms for country and partner config in admin
   UI
2. **Statement Adapters**: Implement CSV/Excel statement parsing per telco
3. **Feature Toggle UI**: Admin UI for enabling/disabling features per country
4. **Telco Management UI**: Add/edit telco providers via admin panel
5. **Multi-Currency**: Enhanced support for currency conversion and reporting
6. **Compliance Rules**: Automated KYC validation based on country requirements
7. **Legal Pages**: Dynamic legal document management per country/locale

## Support

For questions or issues:

- Review existing adapter implementations in `/infra/edge/providers/`
- Check RLS policies in migration file
- Refer to admin UI pages for data structure examples
- Consult Supabase documentation for RLS best practices

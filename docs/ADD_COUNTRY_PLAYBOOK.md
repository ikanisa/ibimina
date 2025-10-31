# Add a New Country Playbook

This guide walks through the process of expanding SACCO+ to a new Sub-Saharan
African country. The system is designed to add countries through configuration,
not code forks.

## Prerequisites

- Admin access to Supabase project
- Legal approval for the target country
- Partner SACCO/MFI/Bank agreements in place
- Mobile money provider details (USSD codes, API documentation)

## Time Estimate

**1-2 days** for technical setup + testing + pilot launch

## Step-by-Step Process

### 1. Insert Country Record (5 minutes)

Add the country to the `countries` table:

```sql
-- Example: Adding Ghana
INSERT INTO public.countries (iso2, iso3, name, default_locale, currency_code, timezone, is_active)
VALUES (
  'GH',                    -- ISO 3166-1 alpha-2
  'GHA',                   -- ISO 3166-1 alpha-3 (used in reference tokens)
  'Ghana',                 -- Full country name
  'en-GH',                 -- Default locale
  'GHS',                   -- ISO 4217 currency code
  'Africa/Accra',          -- IANA timezone
  true                     -- Activate immediately
);
```

**Country ISO3 codes are used in reference tokens**: `GHA.ACC.XXX.YYYY.001`

### 2. Add Telecom Providers (15 minutes)

Add mobile money providers for the country:

```sql
-- Get country ID
DO $$
DECLARE
  ghana_id UUID;
BEGIN
  SELECT id INTO ghana_id FROM public.countries WHERE iso2 = 'GH';

  -- MTN Ghana
  INSERT INTO public.telco_providers (
    country_id,
    name,
    ussd_pattern,
    merchant_field_name,
    reference_field_name,
    notes,
    is_active
  )
  VALUES (
    ghana_id,
    'MTN Mobile Money Ghana',
    '*170#',                    -- USSD code for payments
    'merchant',                 -- Field name in statements
    'reference',                -- Field name in statements
    'Primary mobile money provider',
    true
  );

  -- AirtelTigo Ghana
  INSERT INTO public.telco_providers (
    country_id,
    name,
    ussd_pattern,
    merchant_field_name,
    reference_field_name,
    notes,
    is_active
  )
  VALUES (
    ghana_id,
    'AirtelTigo Money',
    '*110#',
    'merchant',
    'reference',
    'Secondary provider',
    true
  );
END $$;
```

### 3. Create Country Configuration (20 minutes)

Define country-level policies and features:

```sql
DO $$
DECLARE
  ghana_id UUID;
  mtn_id UUID;
  airteltigo_id UUID;
BEGIN
  SELECT id INTO ghana_id FROM public.countries WHERE iso2 = 'GH';
  SELECT id INTO mtn_id FROM public.telco_providers
    WHERE country_id = ghana_id AND name LIKE 'MTN%';
  SELECT id INTO airteltigo_id FROM public.telco_providers
    WHERE country_id = ghana_id AND name LIKE 'AirtelTigo%';

  INSERT INTO public.country_config (
    country_id,
    languages,                  -- Supported locales
    enabled_features,           -- Feature flags
    kyc_required_docs,          -- KYC document requirements
    legal_pages,                -- URLs to legal documents
    telco_ids,                  -- Provider IDs
    reference_format,           -- Token format pattern
    number_format               -- MSISDN normalization rules
  )
  VALUES (
    ghana_id,
    ARRAY['en-GH', 'en-US'],    -- English (Ghana) and fallback
    ARRAY['USSD', 'OCR', 'SMS_INGEST', 'STATEMENT_UPLOAD'],  -- Safe features
    jsonb_build_object(
      'NationalID', true,        -- Ghana Card
      'Passport', false,
      'Selfie', true,
      'ProofOfAddress', false
    ),
    jsonb_build_object(
      'terms', jsonb_build_object(
        'en-GH', '/legal/terms?country=gh&lang=en'
      ),
      'privacy', jsonb_build_object(
        'en-GH', '/legal/privacy?country=gh&lang=en'
      )
    ),
    ARRAY[mtn_id, airteltigo_id],
    'C3.D3.S3.G4.M3',           -- Standard format: COUNTRY.DISTRICT.SACCO.GROUP.MEMBER
    jsonb_build_object(
      'pattern', '^(233)?[0-9]{9}$',  -- Ghana phone pattern
      'prefix', '233',
      'format', '+233 XX XXX XXXX'
    )
  );
END $$;
```

**Important**: Only enable features that are legally approved in the country. Do
NOT enable:

- `TOKENS` (wallet/stablecoin) without crypto clearance
- `LOANS` without lending license
- `NFC` without device infrastructure

### 4. Create Provider Adapters (2-4 hours)

Create statement and SMS parsers for each provider:

#### a. Statement Adapter

Create `packages/providers/src/adapters/GH/MTNStatementAdapter.ts`:

```typescript
import type {
  StatementAdapter,
  ParseResult,
  ParsedTransaction,
} from "../../types/adapter.js";

export class MTNGhanaStatementAdapter implements StatementAdapter {
  readonly name = "MTN Ghana";
  readonly countryISO3 = "GHA";

  getExpectedHeaders(): string[] {
    // Based on actual MTN Ghana CSV format
    return ["Date", "Time", "Transaction ID", "Details", "Amount", "Balance"];
  }

  validateHeaders(headers: string[]): boolean {
    // Implement header validation
  }

  canHandle(input: string): boolean {
    // Detection logic
  }

  parseRow(row: string[]): ParseResult {
    // Parse MTN Ghana CSV row
    // Extract: amount, txn_id, timestamp, payer_msisdn, reference
  }

  parse(input: string): ParseResult {
    const row = input.split(/[,\t;|]/);
    return this.parseRow(row);
  }
}
```

#### b. SMS Adapter

Create `packages/providers/src/adapters/GH/MTNSmsAdapter.ts`:

```typescript
import type {
  SmsAdapter,
  ParseResult,
  ParsedTransaction,
} from "../../types/adapter.js";

export class MTNGhanaSmsAdapter implements SmsAdapter {
  readonly name = "MTN Ghana SMS";
  readonly countryISO3 = "GHA";

  getSenderPatterns(): string[] {
    return ["MTN", "MoMo", "MTN-GH"];
  }

  canHandle(input: string): boolean {
    // Check if SMS is from MTN Ghana
  }

  parseSms(smsText: string): ParseResult {
    // Extract: amount, txn_id, msisdn, reference from SMS
  }

  parse(input: string): ParseResult {
    return this.parseSms(input);
  }
}
```

#### c. Register Adapters

Update `packages/providers/src/registry/index.ts`:

```typescript
import { MTNGhanaStatementAdapter } from "../adapters/GH/MTNStatementAdapter.js";
import { MTNGhanaSmsAdapter } from "../adapters/GH/MTNSmsAdapter.js";

export function registerDefaultAdapters(): void {
  // ... existing registrations ...

  // Ghana - MTN Statement
  adapterRegistry.register({
    adapter: new MTNGhanaStatementAdapter(),
    type: "statement",
    countryISO3: "GHA",
    providerName: "MTN Ghana",
    priority: 100,
  });

  // Ghana - MTN SMS
  adapterRegistry.register({
    adapter: new MTNGhanaSmsAdapter(),
    type: "sms",
    countryISO3: "GHA",
    providerName: "MTN Ghana",
    priority: 100,
  });
}
```

### 5. Create Content Pack (1-2 hours)

Create locale files with country-specific content:

Create `packages/locales/src/locales/en-GH.ts`:

```typescript
import type {
  CountryContentPack,
  TranslationMessages,
} from "../types/index.js";

export const enGHContentPack: CountryContentPack = {
  locale: "en-GH",
  countryISO3: "GHA",
  countryName: "Ghana",

  ussd: {
    providers: [
      {
        name: "MTN Mobile Money",
        code: "*170#",
        instructions: [
          "Dial *170#",
          'Select "Pay Bills"',
          "Enter merchant code",
          "Enter reference: GHA.ACC.XXX.YYYY.001",
          "Enter amount in GHS",
          "Confirm with PIN",
        ],
      },
    ],
    generalInstructions: [
      "Use exact reference from your card",
      "Verify amount before confirming",
      "Keep SMS confirmation",
    ],
  },

  legal: {
    termsUrl: "/legal/terms?country=gh",
    privacyUrl: "/legal/privacy?country=gh",
  },

  help: {
    paymentGuide: [
      "Ensure sufficient balance in mobile money account",
      "Use reference exactly as shown on card",
      "Contact your institution if payment fails",
    ],
    troubleshooting: [
      "If USSD fails: Try different location or time",
      "If payment rejected: Check reference number",
      "If no SMS: Check transaction history via *170#",
    ],
    contactInfo: {
      helpline: "+233 XX XXX XXXX",
      email: "support@sacco-plus.gh",
      hours: "Monday - Friday, 8:00 AM - 5:00 PM",
    },
  },
};

export const enGHMessages: TranslationMessages = {
  // ... translations ...
};
```

Update `packages/locales/src/index.ts` to export new locale.

### 6. Unit Test Adapters (1 hour)

Create `packages/providers/tests/GH/MTNStatementAdapter.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { MTNGhanaStatementAdapter } from "../../src/adapters/GH/MTNStatementAdapter.js";

test("MTN Ghana Statement Adapter - parses valid row", () => {
  const adapter = new MTNGhanaStatementAdapter();
  const row = [
    "2024-03-15",
    "14:30",
    "TXN123456",
    "Payment GHA.ACC.XXX.YYYY.001",
    "50.00",
    "150.00",
  ];

  const result = adapter.parseRow(row);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.transaction?.amount, 50.0);
  assert.strictEqual(result.transaction?.raw_reference, "GHA.ACC.XXX.YYYY.001");
});

// Add more test cases...
```

Run tests:

```bash
pnpm --filter @ibimina/providers test
```

### 7. Dry-Run Ingestion (30 minutes)

Test with redacted/anonymized real data:

```typescript
import { adapterRegistry } from "@ibimina/providers";

// Test statement parsing
const testStatement = `
Date,Time,Transaction ID,Details,Amount,Balance
2024-03-15,14:30,TXN123456,Payment GHA.ACC.XXX.YYYY.001,50.00,150.00
`;

const result = adapterRegistry.autoParse(testStatement, "statement");
console.log("Parse result:", result);
```

Verify:

- ✅ Amount extracted correctly
- ✅ Reference token parsed
- ✅ Timestamp parsed
- ✅ High confidence score (>0.7)

### 8. Create District & Partner Organizations (15 minutes)

```sql
-- Insert district organization
INSERT INTO public.organizations (type, name, district_code, country_id)
SELECT 'DISTRICT', 'Greater Accra', 'ACC', id
FROM public.countries WHERE iso2 = 'GH';

-- Insert SACCO under district
INSERT INTO public.organizations (type, name, parent_id, country_id)
SELECT
  'SACCO',
  'Accra Women SACCO',
  d.id,
  c.id
FROM public.organizations d
JOIN public.countries c ON c.id = d.country_id
WHERE d.district_code = 'ACC' AND c.iso2 = 'GH';
```

### 9. Configure Partner Settings (10 minutes)

```sql
-- Get SACCO org ID
DO $$
DECLARE
  sacco_org_id UUID;
BEGIN
  SELECT o.id INTO sacco_org_id
  FROM public.organizations o
  JOIN public.countries c ON c.id = o.country_id
  WHERE o.name = 'Accra Women SACCO' AND c.iso2 = 'GH';

  -- Add partner config
  INSERT INTO public.partner_config (
    org_id,
    enabled_features,
    merchant_code,
    contact
  )
  VALUES (
    sacco_org_id,
    ARRAY['USSD', 'SMS_INGEST'],  -- Start with basics
    'ACC001',                      -- Merchant code from MTN
    jsonb_build_object(
      'helpline', '+233 XX XXX XXXX',
      'email', 'support@accrawomen.sacco',
      'hours', 'Mon-Fri 8AM-5PM'
    )
  );
END $$;
```

### 10. Staff Training & Pilot (2-3 days)

1. **Train SACCO staff** on:
   - Uploading member lists (CSV with Ghana Card numbers)
   - OCR approval workflow
   - USSD instructions for members
   - Exception handling

2. **Print materials**:
   - Member cards with reference tokens (GHA.ACC.XXX.YYYY.001)
   - USSD instruction posters (A4) with \*170# steps
   - Dual-SIM tips if applicable

3. **Pilot group**:
   - Start with 1-2 ibimina (20-50 members)
   - Test full payment cycle
   - Collect feedback
   - Monitor exception rates

### 11. Monitor & Iterate (Ongoing)

- **Dashboard metrics**:
  - Uploads approved per week
  - Allocation quality (auto vs manual)
  - Exception closure times
  - Member payment adoption

- **Weekly reviews**:
  - What's working?
  - What's broken?
  - Feature requests
  - Adapter accuracy

- **Iterate**:
  - Improve adapters based on real data
  - Add missing USSD codes
  - Update help content
  - Expand to more groups

## Country-Specific Checklist

Before launching in a new country, ensure:

- [ ] Legal clearance obtained
- [ ] Terms & Privacy policy localized
- [ ] Partner agreements signed
- [ ] Mobile money providers documented (USSD codes, statement formats)
- [ ] KYC document types identified
- [ ] Phone number format documented
- [ ] Currency and timezone configured
- [ ] Provider adapters implemented and tested
- [ ] Content pack created with local language
- [ ] Reference token format agreed
- [ ] Staff trained
- [ ] Pilot group identified
- [ ] Helpline and support email set up
- [ ] Monitoring dashboards configured

## Feature Flags

**Safe to enable immediately**:

- `USSD` - Mobile money payments
- `OCR` - Document scanning
- `SMS_INGEST` - SMS forwarding
- `STATEMENT_UPLOAD` - CSV uploads
- `MANUAL_ENTRY` - Manual payment entry

**Require legal/regulatory approval**:

- `TOKENS` - Digital wallet/stablecoin features
- `LOANS` - Loan disbursement and management
- `NFC` - NFC-based payments
- `AI_WHATSAPP` - WhatsApp bot integration

## Rollback Procedure

If issues arise:

1. **Pause new onboarding**:

   ```sql
   UPDATE public.countries SET is_active = false WHERE iso2 = 'GH';
   ```

2. **Disable features**:

   ```sql
   UPDATE public.country_config
   SET enabled_features = ARRAY['MANUAL_ENTRY']::text[]
   WHERE country_id = (SELECT id FROM public.countries WHERE iso2 = 'GH');
   ```

3. **Notify partners** via admin dashboard

4. **Investigate** issues, fix adapters/config

5. **Re-enable** when ready

## Support Escalation

- **Adapter issues**: Update parser, redeploy Edge Functions
- **USSD changes**: Update `telco_providers.ussd_pattern`
- **Legal/compliance**: Contact country legal team
- **Partner issues**: Use admin interface to adjust configs

## Success Metrics

Track these KPIs per country:

- **Onboarding**: SACCOs onboarded per month
- **Adoption**: % of members using mobile money
- **Quality**: Auto-allocation success rate (target >80%)
- **Support**: Exception resolution time (target <24h)
- **Retention**: Active groups month-over-month

## Next Steps After Launch

1. Onboard more partners in the same country
2. Expand to neighboring districts
3. Add additional mobile money providers
4. Enable advanced features (loans, tokens) if approved
5. Replicate to next country

---

**Remember**: Country expansion is **configuration, not code**. If you're
writing country-specific code outside of adapters and content packs, you're
doing it wrong. 🚫

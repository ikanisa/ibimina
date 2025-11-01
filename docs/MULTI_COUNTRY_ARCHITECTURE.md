# Multi-Country Architecture

This document describes the architecture of the multi-country, multi-tenant
expansion system for SACCO+.

## Design Principles

### 1. Country-Aware Tenancy

Every entity in the system carries a `country_id` to enable:

- **Data isolation**: RLS policies enforce country boundaries
- **Compliance**: Data residency and regional regulations
- **Scaling**: Partition by country for performance
- **Federation**: Future cross-country dashboards

### 2. No Core Integrations, No Custody

SACCO+ is an **intermediation-only platform**:

- Money flows **directly** to partner merchant accounts
- We **never** move or hold funds
- We digitize ibimina, standardize references, supply allocation evidence
- Partners own the banking relationship

### 3. Pluggable Components

Add countries through **configuration + content**, not code forks:

- **Adapters**: Country/telco-specific statement/SMS parsers
- **Policies**: Country-level KYC, features, legal pages
- **Content**: Localized USSD guides, help articles, translations
- **Feature flags**: Country and partner-level toggles

### 4. Hard Isolation

Multi-layer security model:

- **RLS by org_id AND country_id**: Database-level enforcement
- **Server-side guards**: API endpoints check country access
- **Audit trails**: All cross-country access logged
- **Optional sharding**: Regional Supabase projects for data residency

### 5. Single Product, Many Configurations

One codebase serves all countries:

- Admin/Staff/Client apps are country-agnostic
- Country selection changes content pack, not code path
- No feature branches per country
- Same CI/CD pipeline, different environment configs

## Database Schema

### Core Tables

#### `countries`

Catalog of supported markets.

```sql
CREATE TABLE public.countries (
  id UUID PRIMARY KEY,
  iso2 CHAR(2) UNIQUE,          -- 'RW', 'SN', 'GH'
  iso3 CHAR(3) UNIQUE,          -- 'RWA', 'SEN', 'GHA' (used in tokens)
  name TEXT UNIQUE,
  default_locale TEXT,          -- 'rw-RW', 'fr-SN', 'en-GH'
  currency_code CHAR(3),        -- 'RWF', 'XOF', 'GHS'
  timezone TEXT,                -- 'Africa/Kigali'
  is_active BOOLEAN
);
```

#### `telco_providers`

Mobile money providers per country.

```sql
CREATE TABLE public.telco_providers (
  id UUID PRIMARY KEY,
  country_id UUID REFERENCES countries(id),
  name TEXT,                    -- 'MTN Rwanda', 'Orange Senegal'
  ussd_pattern TEXT,            -- '*182*8*1#'
  merchant_field_name TEXT,     -- Field name in statements
  reference_field_name TEXT,    -- Field name in statements
  is_active BOOLEAN
);
```

#### `country_config`

Country-level policies and features.

```sql
CREATE TABLE public.country_config (
  country_id UUID PRIMARY KEY REFERENCES countries(id),
  languages TEXT[],             -- ['rw-RW', 'en-RW', 'fr-RW']
  enabled_features TEXT[],      -- ['USSD', 'OCR', 'SMS_INGEST']
  kyc_required_docs JSONB,      -- {"NID": true, "Selfie": true}
  legal_pages JSONB,            -- {terms_url, privacy_url per locale}
  telco_ids UUID[],             -- Provider IDs
  reference_format TEXT,        -- 'C3.D3.S3.G4.M3'
  number_format JSONB           -- MSISDN normalization rules
);
```

#### `partner_config`

Partner-specific overrides.

```sql
CREATE TABLE public.partner_config (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),
  enabled_features TEXT[],      -- Override/additive
  merchant_code TEXT,           -- SACCO/MFI merchant code
  telco_ids UUID[],             -- Specific providers
  language_pack TEXT[],         -- Force languages
  reference_prefix TEXT,        -- Override prefix
  contact JSONB                 -- {helpline, email, hours}
);
```

### Country Propagation

All tenant tables carry `country_id`:

```sql
-- Trigger to auto-set country_id from org
CREATE FUNCTION set_country_from_org() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.country_id IS NULL AND NEW.org_id IS NOT NULL THEN
    SELECT country_id INTO NEW.country_id
    FROM organizations WHERE id = NEW.org_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to: saccos, ikimina, members, payments, import_files, sms_inbox, etc.
CREATE TRIGGER trg_ikimina_set_country
  BEFORE INSERT ON app.ikimina
  FOR EACH ROW EXECUTE FUNCTION set_country_from_org();
```

## Row-Level Security (RLS)

### Country + Org Isolation

All RLS policies check **both** `country_id` and `org_id`:

```sql
CREATE POLICY ikimina_select_multitenancy_country
  ON app.ikimina FOR SELECT
  USING (
    is_platform_admin()
    OR (
      country_id IN (SELECT user_country_ids())  -- Country check
      AND (org_id IS NULL OR user_can_access_org(org_id))  -- Org check
    )
  );
```

### Helper Functions

- `user_country_ids()`: Returns countries accessible by current user
- `user_can_access_country(country_id)`: Check country access
- `user_org_ids()`: Returns user's org memberships
- `user_accessible_org_ids()`: Includes child orgs (for district managers)
- `is_platform_admin()`: Global admin override

### District Hierarchy

District managers see child SACCOs **within same country**:

```sql
CREATE FUNCTION user_accessible_org_ids() RETURNS SETOF UUID AS $$
  WITH RECURSIVE org_hierarchy AS (
    SELECT o.id, o.parent_id, o.country_id, om.role
    FROM organizations o
    JOIN org_memberships om ON om.org_id = o.id
    WHERE om.user_id = auth.uid()

    UNION

    SELECT o.id, o.parent_id, o.country_id, oh.role
    FROM organizations o
    JOIN org_hierarchy oh ON o.parent_id = oh.id
    WHERE oh.role = 'DISTRICT_MANAGER'
      AND o.country_id = oh.country_id  -- Same country only
  )
  SELECT DISTINCT id FROM org_hierarchy;
$$ LANGUAGE SQL;
```

## Reference Token v2

### Format

**Country-aware**: `COUNTRY3.DISTRICT3.SACCO3.GROUP4.MEMBER3`

Example: `RWA.NYA.GAS.TWIZ.001`

- `RWA` = Rwanda (ISO 3166-1 alpha-3)
- `NYA` = Nyanza district (3-char)
- `GAS` = Gasabo SACCO (3-char)
- `TWIZ` = Twizerane group (4-char, padded)
- `001` = Member sequence (3-digit, zero-padded)

**Legacy format** (backward compatible): `DISTRICT3.SACCO3.GROUP4.MEMBER3`

### Generation

```sql
SELECT generate_reference_token(
  'RWA',    -- country_iso3
  'NYA',    -- district_code
  'GAS',    -- sacco_code
  'TWIZ',   -- group_code
  1         -- member_seq
);
-- Returns: 'RWA.NYA.GAS.TWIZ.001'
```

### Parsing

```sql
SELECT * FROM parse_reference_token('RWA.NYA.GAS.TWIZ.001');
-- Returns: (country_iso3, district_code, sacco_code, group_code, member_seq)
```

### Edge Function

`reference-decode` Edge Function resolves tokens to actual member records:

```bash
GET /reference-decode?token=RWA.NYA.GAS.TWIZ.001
```

Returns:

```json
{
  "success": true,
  "token": {
    "country": "RWA",
    "district": "NYA",
    "sacco": "GAS",
    "group": "TWIZ",
    "member": "001"
  },
  "member": {
    "id": "uuid",
    "full_name": "Jean Baptiste",
    "member_code": "TWIZ.001"
  },
  "group": { ... },
  "sacco": { ... }
}
```

## Provider Adapters

### Architecture

**Pluggable parsers** for country/telco-specific ingestion:

```
packages/providers/src/
├── types/
│   └── adapter.ts          # Interfaces
├── adapters/
│   ├── RW/                 # Rwanda
│   │   ├── MTNStatementAdapter.ts
│   │   └── MTNSmsAdapter.ts
│   ├── SN/                 # Senegal
│   │   └── OrangeStatementAdapter.ts
│   └── GH/                 # Ghana
│       └── MTNStatementAdapter.ts
└── registry/
    └── index.ts            # Adapter registry
```

### Adapter Interface

```typescript
interface ProviderAdapter {
  readonly name: string; // 'MTN Rwanda'
  readonly countryISO3: string; // 'RWA'

  parse(input: string): ParseResult;
  canHandle(input: string): boolean;
}

interface StatementAdapter extends ProviderAdapter {
  parseRow(row: string[]): ParseResult;
  getExpectedHeaders(): string[];
  validateHeaders(headers: string[]): boolean;
}

interface SmsAdapter extends ProviderAdapter {
  parseSms(smsText: string): ParseResult;
  getSenderPatterns(): string[];
}
```

### Usage

```typescript
import { adapterRegistry } from "@ibimina/providers";

// Auto-detect and parse
const result = adapterRegistry.autoParse(statementLine, "statement");

// Or get specific adapter
const adapter = adapterRegistry.getAdapter("RWA", "MTN Rwanda", "statement");
const result = adapter.parse(statementLine);
```

### Adding New Adapter

1. Create adapter class implementing interface
2. Register in `registry/index.ts`
3. Add unit tests with real (redacted) examples
4. Deploy and test with live data

## Localization

### Content Packs

Country-specific content organized by locale:

```typescript
// packages/locales/src/locales/en-GH.ts
export const enGHContentPack: CountryContentPack = {
  locale: 'en-GH',
  countryISO3: 'GHA',
  countryName: 'Ghana',

  ussd: {
    providers: [
      { name: 'MTN', code: '*170#', instructions: [...] }
    ],
    generalInstructions: [...]
  },

  legal: {
    termsUrl: '/legal/terms?country=gh',
    privacyUrl: '/legal/privacy?country=gh'
  },

  help: {
    paymentGuide: [...],
    troubleshooting: [...],
    contactInfo: { helpline, email, hours }
  },

  tips: {
    dualSim: [...],
    networkIssues: [...]
  }
};
```

### Translation Messages

UI strings per locale:

```typescript
export const enGHMessages: TranslationMessages = {
  common: { welcome: 'Welcome', save: 'Save', ... },
  payment: { title: 'Payment', amount: 'Amount', ... },
  member: { title: 'Member', name: 'Name', ... },
  group: { title: 'Group', groupName: 'Group Name', ... }
};
```

### Usage

```typescript
import { getContentPack, getMessages } from "@ibimina/locales";

const contentPack = getContentPack("en-GH");
const messages = getMessages("en-GH");

// Or by country
const pack = getContentPackByCountry("GHA");
```

## Feature Flags

### Three-Level Hierarchy

1. **Global**: Default for all countries
2. **Country**: Override in `country_config.enabled_features`
3. **Partner**: Override in `partner_config.enabled_features`

### Checking Flags

```sql
SELECT is_feature_enabled(
  'USSD',           -- feature_key
  country_id,       -- check_country_id
  org_id            -- check_org_id
);
```

Precedence: Partner > Country > Global

### Available Features

**Safe (enabled by default)**:

- `USSD` - Mobile money payments
- `OCR` - Document scanning
- `SMS_INGEST` - SMS forwarding
- `STATEMENT_UPLOAD` - CSV uploads
- `MANUAL_ENTRY` - Manual payment entry

**Restricted (require approval)**:

- `TOKENS` - Digital wallet/stablecoin
- `LOANS` - Loan disbursement
- `NFC` - NFC payments
- `AI_WHATSAPP` - WhatsApp bot
- `AI_IVR` - Voice assistant

## Data Flow

### Payment Ingestion

```
1. Member pays via USSD (*182#)
   ↓
2. MTN sends confirmation SMS to member
   ↓
3. Member forwards SMS to SACCO+ GSM hub
   OR
   MTN posts to webhook (if available)
   ↓
4. SMS stored in app.sms_inbox with country_id
   ↓
5. Provider adapter parses SMS
   - Extracts: amount, txn_id, reference, msisdn
   - Confidence score: 0.0-1.0
   ↓
6. Reference decoder resolves token
   - Finds: member_id, ikimina_id, sacco_id
   ↓
7. Auto-allocate if confidence > 0.8
   OR
   Create exception for staff review
   ↓
8. Update member account balance
   ↓
9. Notify member (SMS/in-app)
```

### Country Boundary Enforcement

Every step checks `country_id`:

```typescript
// Edge Function
const { data: sms } = await supabase
  .from("sms_inbox")
  .select("*, sacco:sacco_id(country_id)")
  .eq("id", sms_id)
  .single();

// RLS automatically filters by user's countries
// But explicit check for clarity
if (!user.countries.includes(sms.sacco.country_id)) {
  throw new Error("Country access denied");
}
```

## Scaling Strategy

### Phase 1: Single Project (Current)

- One Supabase project
- All countries in same database
- RLS enforces country isolation
- Per-country storage buckets
- Regional edge function deployments

**Capacity**: Up to ~10 countries, 1000 SACCOs, 100k members

### Phase 2: Regional Sharding

When needed:

- West Africa FR project (Senegal, Côte d'Ivoire)
- West Africa EN project (Ghana, Zambia)
- Central Africa project (Rwanda, Burundi, DRC)

**Same schema**, different projects.

Benefits:

- Data residency compliance
- Lower latency
- Independent scaling
- Regional maintenance windows

### Phase 3: Federated Dashboards

Cross-project read replicas for:

- Global KPI dashboards
- Cross-country analytics
- Compliance reporting

Keep `org_id` and `country_id` stable across projects.

## Observability

### Per-Country Metrics

**Sentry tags**:

```javascript
Sentry.setTag("country", countryISO3);
Sentry.setTag("org_id", orgId);
Sentry.setTag("app", "staff");
```

**PostHog funnels**:

- Pay view → Copy reference → Dial USSD (per country)
- Statement upload → Parse → Approve (per country)
- Exception created → Assigned → Resolved (per country)

**Custom metrics**:

- `uploads_approved_per_week{country="RWA"}`
- `allocation_quality{country="GHA", method="auto"}`
- `exception_closure_time_hours{country="SEN"}`

### Dashboards

Grafana dashboards scoped by country:

- Payment volume (by country/SACCO/group)
- Parse success rate (by country/provider)
- Exception backlog (by country/age)
- User adoption (by country/locale)

## Security Considerations

### Data Leakage Prevention

1. **RLS first**: All queries filtered by `country_id`
2. **Server guards**: Edge functions check country access
3. **Audit logs**: Cross-country access triggers alerts
4. **Per-country buckets**: Storage isolation
5. **Staff restrictions**: Limit support staff to their org(s)

### Residency Compliance

- Store country_id in all tables for partitioning
- Per-country storage buckets
- Optional: Regional Supabase projects
- Legal agreements per country

### KYC & PII

- Capture-only, no integration
- Partner-side verification
- Encrypted at rest (AES-256-GCM)
- Access logs for all PII reads

## Migration Path

### Existing Deployments

Zero breaking changes:

1. `country_id` is **optional** initially
2. Existing data defaults to Rwanda
3. Legacy reference format still works
4. New adapters are additive

### Rollout

1. Deploy schema migrations
2. Seed Rwanda as primary country
3. Link existing data to Rwanda
4. Test backward compatibility
5. Add new countries incrementally

## API Changes

### New Endpoints

- `GET /countries` - List active countries
- `GET /countries/:id/config` - Country configuration
- `GET /countries/:id/providers` - Telco providers
- `POST /reference-decode` - Decode reference token

### Modified Endpoints

All endpoints respect country context:

```typescript
// Auto-filtered by RLS
GET /saccos
GET /ikimina
GET /members
GET /payments

// Include country in response
{
  "id": "uuid",
  "name": "Gasabo SACCO",
  "country_id": "rwanda-uuid",
  "country": {
    "iso3": "RWA",
    "name": "Rwanda",
    "currency": "RWF"
  }
}
```

## Future Enhancements

### Short-term

- Admin UI for country/partner management
- Country-specific reporting templates
- Multi-currency ledger (if needed)

### Medium-term

- Regional data residency
- Cross-country federation
- Multi-language AI agent

### Long-term

- Real-time provider APIs (vs batch)
- Blockchain settlement (if compliant)
- Cross-border remittances

## References

- [Add Country Playbook](./ADD_COUNTRY_PLAYBOOK.md)
- [Provider Adapter Guide](../packages/providers/README.md) (TODO)
- [Localization Guide](../packages/locales/README.md) (TODO)
- [Database Schema](../supabase/migrations/)
- [Edge Functions](../supabase/functions/)

---

**Key Takeaway**: Multi-country expansion is **configuration-driven**. Add
countries by inserting data and content, not by forking code. 🌍

# @ibimina/providers

Provider adapters for country and telecom-specific statement and SMS parsing.

## Overview

This package provides a pluggable architecture for parsing mobile money
statements and SMS messages across different countries and providers. Each
adapter is responsible for parsing provider-specific formats and extracting
transaction data.

## Architecture

```
packages/providers/src/
├── types/
│   └── adapter.ts          # Adapter interfaces
├── adapters/
│   ├── RW/                 # Rwanda adapters
│   │   ├── MTNStatementAdapter.ts
│   │   └── MTNSmsAdapter.ts
│   ├── SN/                 # Senegal adapters
│   ├── GH/                 # Ghana adapters
│   └── ...                 # More countries
└── registry/
    └── index.ts            # Central adapter registry
```

## Usage

### Auto-detect and parse

```typescript
import { adapterRegistry } from "@ibimina/providers";

// Auto-detect provider and parse
const result = adapterRegistry.autoParse(inputText, "statement");

if (result.success) {
  console.log("Amount:", result.transaction.amount);
  console.log("Reference:", result.transaction.raw_reference);
  console.log("Confidence:", result.confidence);
}
```

### Use specific adapter

```typescript
import { adapterRegistry } from "@ibimina/providers";

// Get adapter for specific country/provider
const adapter = adapterRegistry.getAdapter("RWA", "MTN Rwanda", "statement");

if (adapter) {
  const result = adapter.parse(statementLine);
}
```

### Direct import

```typescript
import { MTNRwandaStatementAdapter } from "@ibimina/providers";

const adapter = new MTNRwandaStatementAdapter();
const result = adapter.parse(csvLine);
```

## Adapter Interface

### ProviderAdapter (Base)

```typescript
interface ProviderAdapter {
  readonly name: string; // 'MTN Rwanda'
  readonly countryISO3: string; // 'RWA'

  parse(input: string): ParseResult;
  canHandle(input: string): boolean;
}
```

### StatementAdapter

For CSV/Excel file parsing:

```typescript
interface StatementAdapter extends ProviderAdapter {
  parseRow(row: string[]): ParseResult;
  getExpectedHeaders(): string[];
  validateHeaders(headers: string[]): boolean;
}
```

### SmsAdapter

For SMS message parsing:

```typescript
interface SmsAdapter extends ProviderAdapter {
  parseSms(smsText: string): ParseResult;
  getSenderPatterns(): string[];
}
```

## ParseResult

All adapters return a `ParseResult`:

```typescript
interface ParseResult {
  success: boolean;
  transaction?: ParsedTransaction;
  confidence: number; // 0.0 to 1.0
  error?: string;
  warnings?: string[];
}

interface ParsedTransaction {
  amount: number;
  txn_id: string;
  timestamp: Date;
  payer_msisdn?: string;
  raw_reference?: string;
  merchant_code?: string;
  fee?: number;
  balance?: number;
  raw_data: Record<string, unknown>;
}
```

## Creating a New Adapter

### 1. Create adapter file

Create `src/adapters/{COUNTRY}/{Provider}StatementAdapter.ts`:

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
    return ["Date", "Time", "Transaction ID", "Details", "Amount", "Balance"];
  }

  validateHeaders(headers: string[]): boolean {
    // Implement header validation
    const normalized = headers.map((h) => h.toLowerCase());
    return normalized.some((h) => h.includes("transaction"));
  }

  canHandle(input: string): boolean {
    // Detection logic
    return input.toLowerCase().includes("mtn") || input.includes("+233");
  }

  parseRow(row: string[]): ParseResult {
    try {
      // Extract fields based on MTN Ghana format
      const amount = this.parseAmount(row[4]);
      const txnId = row[2];
      const timestamp = this.parseTimestamp(row[0], row[1]);
      const reference = this.extractReference(row[3]);

      return {
        success: true,
        transaction: {
          amount,
          txn_id: txnId,
          timestamp,
          raw_reference: reference,
          raw_data: {
            /* ... */
          },
        },
        confidence: 0.9,
      };
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        error: error.message,
      };
    }
  }

  parse(input: string): ParseResult {
    const row = input.split(/[,\t;]/);
    return this.parseRow(row);
  }

  private parseAmount(str: string): number {
    // Remove currency symbols, commas
    const cleaned = str.replace(/[GHS,\s]/g, "");
    return parseFloat(cleaned);
  }

  private parseTimestamp(date: string, time: string): Date {
    return new Date(`${date}T${time}`);
  }

  private extractReference(details: string): string | undefined {
    // Look for reference pattern: GHA.XXX.YYY.ZZZZ.001
    const match = details.match(
      /([A-Z]{3}\.[A-Z0-9]{3}\.[A-Z0-9]{3,4}\.[A-Z0-9]{3,4}\.[0-9]{3})/i
    );
    return match?.[1];
  }
}
```

### 2. Register adapter

Add to `src/registry/index.ts`:

```typescript
import { MTNGhanaStatementAdapter } from "../adapters/GH/MTNStatementAdapter.js";

export function registerDefaultAdapters(): void {
  // ... existing registrations ...

  adapterRegistry.register({
    adapter: new MTNGhanaStatementAdapter(),
    type: "statement",
    countryISO3: "GHA",
    providerName: "MTN Ghana",
    priority: 100,
  });
}
```

### 3. Export from index

Update `src/index.ts`:

```typescript
export { MTNGhanaStatementAdapter } from "./adapters/GH/MTNStatementAdapter.js";
```

### 4. Add tests

Create `tests/GH/MTNStatementAdapter.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { MTNGhanaStatementAdapter } from "../../src/adapters/GH/MTNStatementAdapter.js";

test("MTN Ghana - parses valid statement row", () => {
  const adapter = new MTNGhanaStatementAdapter();
  const row = [
    "2024-03-15",
    "14:30",
    "TXN123",
    "Payment GHA.ACC.XXX.YYYY.001",
    "GHS 50.00",
    "GHS 150.00",
  ];

  const result = adapter.parseRow(row);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.transaction?.amount, 50.0);
  assert.strictEqual(result.transaction?.raw_reference, "GHA.ACC.XXX.YYYY.001");
  assert(result.confidence > 0.8);
});

test("MTN Ghana - handles invalid data", () => {
  const adapter = new MTNGhanaStatementAdapter();
  const row = ["invalid", "data"];

  const result = adapter.parseRow(row);

  assert.strictEqual(result.success, false);
  assert(result.error);
});
```

Run tests:

```bash
pnpm test
```

## Best Practices

### 1. Use Real Examples

Test with real (redacted) statement/SMS samples from the provider.

### 2. Handle Variations

Providers change formats. Be flexible:

- Case-insensitive matching
- Multiple date formats
- Optional fields

### 3. Confidence Scoring

Return honest confidence scores:

- `0.9+`: All fields parsed correctly
- `0.7-0.9`: Minor fields missing (e.g., no balance)
- `0.5-0.7`: Core fields only (amount, txn_id)
- `<0.5`: Uncertain parse

### 4. Reference Extraction

Look for reference patterns:

- New format: `COUNTRY3.DISTRICT3.SACCO3.GROUP4.MEMBER3`
- Legacy format: `DISTRICT3.SACCO3.GROUP4.MEMBER3`

Use regex:
`/\b([A-Z]{3}\.[A-Z0-9]{3}\.[A-Z0-9]{3,4}\.[A-Z0-9]{3,4}\.[0-9]{3})\b/i`

### 5. Error Handling

Never throw. Always return `ParseResult`:

```typescript
try {
  // Parse logic
} catch (error) {
  return {
    success: false,
    confidence: 0,
    error: error instanceof Error ? error.message : "Unknown error",
  };
}
```

## Available Adapters

### Rwanda (RWA)

- ✅ MTN Rwanda Statement
- ✅ MTN Rwanda SMS
- ⏳ Airtel Rwanda Statement
- ⏳ Airtel Rwanda SMS

### Senegal (SEN)

- ⏳ Orange Senegal Statement
- ⏳ Orange Senegal SMS

### Ghana (GHA)

- ⏳ MTN Ghana Statement
- ⏳ MTN Ghana SMS
- ⏳ AirtelTigo Ghana Statement

### More countries

See [Add Country Playbook](../../docs/ADD_COUNTRY_PLAYBOOK.md) for adding new
countries.

## Development

### Install dependencies

```bash
pnpm install
```

### Type check

```bash
pnpm typecheck
```

### Run tests

```bash
pnpm test
```

## Related

- [Multi-Country Architecture](../../docs/MULTI_COUNTRY_ARCHITECTURE.md)
- [Add Country Playbook](../../docs/ADD_COUNTRY_PLAYBOOK.md)
- [@ibimina/locales](../locales/README.md) - Localization package

## License

Private - Ibimina SACCO+ Platform

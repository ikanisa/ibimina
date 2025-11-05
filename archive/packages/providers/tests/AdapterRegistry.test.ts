import { describe, expect, it } from "vitest";

import { adapterRegistry } from "../src/registry/index.js";

describe("Adapter Registry", () => {
  it("has registered adapters", () => {
    const adapters = adapterRegistry.getAll();

    expect(adapters.length).toBeGreaterThan(0);

    const rwandaAdapters = adapterRegistry.getAdaptersByCountry("RWA");
    expect(rwandaAdapters.length).toBeGreaterThanOrEqual(2);
  });

  it("gets adapter by country and provider", () => {
    const adapter = adapterRegistry.getAdapter("RWA", "MTN Rwanda", "statement");

    expect(adapter).toBeDefined();
    expect(adapter?.countryISO3).toBe("RWA");
    expect(adapter?.name).toBe("MTN Rwanda");
  });

  it("gets adapters by type", () => {
    const statementAdapters = adapterRegistry.getAdaptersByType("statement");
    const smsAdapters = adapterRegistry.getAdaptersByType("sms");

    expect(statementAdapters.length).toBeGreaterThan(0);
    expect(smsAdapters.length).toBeGreaterThan(0);
  });

  it("auto-parses with correct adapter", () => {
    const statementLine =
      "2024-03-15,14:30,MP240315.1430.A12345,Payment for RWA.NYA.GAS.TWIZ.001,5000,15000,Success";

    const result = adapterRegistry.autoParse(statementLine, "statement");

    expect(result.success).toBe(true);
    expect(result.transaction).toBeDefined();
    expect(result.confidence ?? 0).toBeGreaterThan(0);
  });

  it("returns error for unparseable input", () => {
    const invalidInput = "This is not a valid statement or SMS";

    const result = adapterRegistry.autoParse(invalidInput);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

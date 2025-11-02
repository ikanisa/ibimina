import { describe, expect, it } from "vitest";

import { MTNRwandaStatementAdapter } from "../src/adapters/RW/MTNStatementAdapter.js";

describe("MTN Rwanda Statement Adapter", () => {
  it("parses valid CSV row", () => {
    const adapter = new MTNRwandaStatementAdapter();

    const row = [
      "2024-03-15",
      "14:30:45",
      "MP240315.1430.A12345",
      "Payment for RWA.NYA.GAS.TWIZ.001 from 250788123456",
      "5000",
      "15000",
      "Success",
    ];

    const result = adapter.parseRow(row);

    expect(result.success).toBe(true);
    expect(result.transaction).toBeDefined();
    expect(result.transaction?.amount).toBe(5000);
    expect(result.transaction?.txn_id).toBe("MP240315.1430.A12345");
    expect(result.transaction?.raw_reference).toBe("RWA.NYA.GAS.TWIZ.001");
    expect(result.transaction?.payer_msisdn).toBe("250788123456");
    expect(result.confidence ?? 0).toBeGreaterThan(0.7);
  });

  it("handles missing reference", () => {
    const adapter = new MTNRwandaStatementAdapter();

    const row = [
      "2024-03-15",
      "14:30:45",
      "MP240315.1430.A12345",
      "Payment without reference",
      "5000",
      "15000",
      "Success",
    ];

    const result = adapter.parseRow(row);

    expect(result.success).toBe(true);
    expect(result.transaction).toBeDefined();
    expect(result.transaction?.raw_reference).toBeUndefined();
    expect(result.confidence ?? 0).toBeLessThan(0.9);
  });

  it("handles invalid row", () => {
    const adapter = new MTNRwandaStatementAdapter();

    const result = adapter.parseRow(["invalid", "data"]);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.confidence ?? 0).toBe(0);
  });

  it("validates headers", () => {
    const adapter = new MTNRwandaStatementAdapter();

    const validHeaders = ["Date", "Time", "Transaction ID", "Details", "Amount", "Balance"];
    expect(adapter.validateHeaders(validHeaders)).toBe(true);

    const invalidHeaders = ["Column1", "Column2", "Column3"];
    expect(adapter.validateHeaders(invalidHeaders)).toBe(false);
  });

  it("detects handleable rows", () => {
    const adapter = new MTNRwandaStatementAdapter();

    expect(adapter.canHandle("MTN Mobile Money Statement")).toBe(true);
    expect(adapter.canHandle("2024-03-15,14:30,MP240315")).toBe(true);
    expect(adapter.canHandle("Orange Money Statement")).toBe(false);
  });

  it("parses legacy reference format", () => {
    const adapter = new MTNRwandaStatementAdapter();

    const row = [
      "2024-03-15",
      "14:30:45",
      "MP240315.1430.A12345",
      "Payment for NYA.GAS.TWIZ.001",
      "5000",
      "15000",
      "Success",
    ];

    const result = adapter.parseRow(row);

    expect(result.success).toBe(true);
    expect(result.transaction?.raw_reference).toBe("NYA.GAS.TWIZ.001");
  });
});

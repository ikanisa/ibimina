import { describe, expect, it } from "vitest";

import { MTNRwandaSmsAdapter } from "../src/adapters/RW/MTNSmsAdapter.js";

describe("MTN Rwanda SMS Adapter", () => {
  it("parses valid SMS", () => {
    const adapter = new MTNRwandaSmsAdapter();

    const smsText = `
      You have received RWF 5,000 from 250788123456.
      Transaction ID: MP240315.1430.A12345.
      Reference: RWA.NYA.GAS.TWIZ.001.
      Balance: RWF 15,000.
    `.trim();

    const result = adapter.parseSms(smsText);

    expect(result.success).toBe(true);
    expect(result.transaction).toBeDefined();
    expect(result.transaction?.amount).toBe(5000);
    expect(result.transaction?.txn_id).toBe("MP240315.1430.A12345");
    expect(result.transaction?.raw_reference).toBe("RWA.NYA.GAS.TWIZ.001");
    expect(result.transaction?.payer_msisdn).toBe("250788123456");
    expect(result.transaction?.balance).toBe(15000);
    expect(result.confidence ?? 0).toBeGreaterThan(0.7);
  });

  it("handles SMS without reference", () => {
    const adapter = new MTNRwandaSmsAdapter();

    const smsText = `
      You have received RWF 5,000 from 250788123456.
      Transaction ID: MP240315.1430.A12345.
    `.trim();

    const result = adapter.parseSms(smsText);

    expect(result.success).toBe(true);
    expect(result.transaction).toBeDefined();
    expect(result.transaction?.raw_reference).toBeUndefined();
    expect(result.confidence ?? 0).toBeLessThan(0.9);
  });

  it("handles invalid SMS", () => {
    const adapter = new MTNRwandaSmsAdapter();

    const result = adapter.parseSms("This is not a valid MTN SMS");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns sender patterns", () => {
    const adapter = new MTNRwandaSmsAdapter();

    const patterns = adapter.getSenderPatterns();

    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns).toContain("MTN");
  });

  it("detects handleable messages", () => {
    const adapter = new MTNRwandaSmsAdapter();

    expect(adapter.canHandle("You have received RWF 5000 from MTN")).toBe(true);
    expect(adapter.canHandle("Your MoMo payment was confirmed")).toBe(true);
    expect(adapter.canHandle("Your Orange Money payment")).toBe(false);
  });

  it("handles local phone format", () => {
    const adapter = new MTNRwandaSmsAdapter();

    const smsText = `
      You have received RWF 5,000 from 0788123456.
      Transaction ID: MP240315.1430.A12345.
      Reference: RWA.NYA.GAS.TWIZ.001.
    `.trim();

    const result = adapter.parseSms(smsText);

    expect(result.success).toBe(true);
    expect(result.transaction?.payer_msisdn).toBe("250788123456");
  });

  it("handles legacy reference format", () => {
    const adapter = new MTNRwandaSmsAdapter();

    const smsText = `
      You have received RWF 5,000 from 250788123456.
      Transaction ID: MP240315.1430.A12345.
      Reference: NYA.GAS.TWIZ.001.
    `.trim();

    const result = adapter.parseSms(smsText);

    expect(result.success).toBe(true);
    expect(result.transaction?.raw_reference).toBe("NYA.GAS.TWIZ.001");
  });
});

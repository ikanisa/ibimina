/**
 * Tests for Adapter Registry
 */

import { test } from "node:test";
import assert from "node:assert";
import { adapterRegistry } from "../src/registry/index.js";

test("Adapter Registry - has registered adapters", () => {
  const adapters = adapterRegistry.getAll();

  assert.ok(adapters.length > 0, "Registry should have adapters");

  // Should have Rwanda adapters
  const rwandaAdapters = adapterRegistry.getAdaptersByCountry("RWA");
  assert.ok(rwandaAdapters.length >= 2, "Should have at least 2 Rwanda adapters");
});

test("Adapter Registry - gets adapter by country and provider", () => {
  const adapter = adapterRegistry.getAdapter("RWA", "MTN Rwanda", "statement");

  assert.ok(adapter, "Should find MTN Rwanda statement adapter");
  assert.strictEqual(adapter?.countryISO3, "RWA");
  assert.strictEqual(adapter?.name, "MTN Rwanda");
});

test("Adapter Registry - gets adapters by type", () => {
  const statementAdapters = adapterRegistry.getAdaptersByType("statement");
  const smsAdapters = adapterRegistry.getAdaptersByType("sms");

  assert.ok(statementAdapters.length > 0, "Should have statement adapters");
  assert.ok(smsAdapters.length > 0, "Should have SMS adapters");
});

test("Adapter Registry - auto-parses with correct adapter", () => {
  const statementLine =
    "2024-03-15,14:30,MP240315.1430.A12345,Payment for RWA.NYA.GAS.TWIZ.001,5000,15000,Success";

  const result = adapterRegistry.autoParse(statementLine, "statement");

  assert.strictEqual(result.success, true, "Should successfully auto-parse");
  assert.ok(result.transaction, "Should have transaction data");
  assert.ok(result.confidence > 0, "Should have positive confidence");
});

test("Adapter Registry - returns error for unparseable input", () => {
  const invalidInput = "This is not a valid statement or SMS";

  const result = adapterRegistry.autoParse(invalidInput);

  assert.strictEqual(result.success, false, "Should fail to parse");
  assert.ok(result.error, "Should have error message");
});

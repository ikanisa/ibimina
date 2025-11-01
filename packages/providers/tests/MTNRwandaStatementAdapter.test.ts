/**
 * Tests for MTN Rwanda Statement Adapter
 */

import { test } from "node:test";
import assert from "node:assert";
import { MTNRwandaStatementAdapter } from "../src/adapters/RW/MTNStatementAdapter.js";

test("MTN Rwanda Statement Adapter - parses valid CSV row", () => {
  const adapter = new MTNRwandaStatementAdapter();

  // Simulate a typical MTN Rwanda statement row
  const row = [
    "2024-03-15", // Date
    "14:30:45", // Time
    "MP240315.1430.A12345", // Transaction ID
    "Payment for RWA.NYA.GAS.TWIZ.001 from 250788123456", // Details
    "5000", // Amount
    "15000", // Balance
    "Success", // Status
  ];

  const result = adapter.parseRow(row);

  assert.strictEqual(result.success, true, "Parse should succeed");
  assert.ok(result.transaction, "Transaction should be defined");
  assert.strictEqual(result.transaction?.amount, 5000, "Amount should be 5000");
  assert.strictEqual(
    result.transaction?.txn_id,
    "MP240315.1430.A12345",
    "Transaction ID should match"
  );
  assert.strictEqual(
    result.transaction?.raw_reference,
    "RWA.NYA.GAS.TWIZ.001",
    "Reference should be extracted"
  );
  assert.strictEqual(
    result.transaction?.payer_msisdn,
    "250788123456",
    "MSISDN should be extracted"
  );
  assert.ok(result.confidence > 0.7, "Confidence should be high");
});

test("MTN Rwanda Statement Adapter - handles missing reference", () => {
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

  assert.strictEqual(result.success, true, "Parse should succeed");
  assert.ok(result.transaction, "Transaction should be defined");
  assert.strictEqual(result.transaction?.raw_reference, undefined, "Reference should be undefined");
  assert.ok(result.confidence < 0.9, "Confidence should be lower without reference");
});

test("MTN Rwanda Statement Adapter - handles invalid row", () => {
  const adapter = new MTNRwandaStatementAdapter();

  const row = ["invalid", "data"];

  const result = adapter.parseRow(row);

  assert.strictEqual(result.success, false, "Parse should fail");
  assert.ok(result.error, "Error message should be present");
  assert.strictEqual(result.confidence, 0, "Confidence should be 0");
});

test("MTN Rwanda Statement Adapter - validates headers", () => {
  const adapter = new MTNRwandaStatementAdapter();

  const validHeaders = ["Date", "Time", "Transaction ID", "Details", "Amount", "Balance"];
  assert.strictEqual(
    adapter.validateHeaders(validHeaders),
    true,
    "Should validate correct headers"
  );

  const invalidHeaders = ["Column1", "Column2", "Column3"];
  assert.strictEqual(
    adapter.validateHeaders(invalidHeaders),
    false,
    "Should reject invalid headers"
  );
});

test("MTN Rwanda Statement Adapter - canHandle detection", () => {
  const adapter = new MTNRwandaStatementAdapter();

  assert.strictEqual(adapter.canHandle("MTN Mobile Money Statement"), true);
  assert.strictEqual(adapter.canHandle("2024-03-15,14:30,MP240315"), true);
  assert.strictEqual(adapter.canHandle("Orange Money Statement"), false);
});

test("MTN Rwanda Statement Adapter - parses legacy reference format", () => {
  const adapter = new MTNRwandaStatementAdapter();

  const row = [
    "2024-03-15",
    "14:30:45",
    "MP240315.1430.A12345",
    "Payment for NYA.GAS.TWIZ.001", // Legacy format (no country)
    "5000",
    "15000",
    "Success",
  ];

  const result = adapter.parseRow(row);

  assert.strictEqual(result.success, true);
  assert.strictEqual(
    result.transaction?.raw_reference,
    "NYA.GAS.TWIZ.001",
    "Legacy reference should be extracted"
  );
});

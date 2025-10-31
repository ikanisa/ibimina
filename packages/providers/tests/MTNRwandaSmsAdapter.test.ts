/**
 * Tests for MTN Rwanda SMS Adapter
 */

import { test } from "node:test";
import assert from "node:assert";
import { MTNRwandaSmsAdapter } from "../src/adapters/RW/MTNSmsAdapter.js";

test("MTN Rwanda SMS Adapter - parses valid SMS", () => {
  const adapter = new MTNRwandaSmsAdapter();

  const smsText = `
    You have received RWF 5,000 from 250788123456.
    Transaction ID: MP240315.1430.A12345.
    Reference: RWA.NYA.GAS.TWIZ.001.
    Balance: RWF 15,000.
  `.trim();

  const result = adapter.parseSms(smsText);

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
  assert.strictEqual(result.transaction?.balance, 15000, "Balance should be 15000");
  assert.ok(result.confidence > 0.7, "Confidence should be high");
});

test("MTN Rwanda SMS Adapter - handles SMS without reference", () => {
  const adapter = new MTNRwandaSmsAdapter();

  const smsText = `
    You have received RWF 5,000 from 250788123456.
    Transaction ID: MP240315.1430.A12345.
  `.trim();

  const result = adapter.parseSms(smsText);

  assert.strictEqual(result.success, true, "Parse should succeed");
  assert.ok(result.transaction, "Transaction should be defined");
  assert.strictEqual(result.transaction?.raw_reference, undefined, "Reference should be undefined");
  assert.ok(result.confidence < 0.9, "Confidence should be lower without reference");
});

test("MTN Rwanda SMS Adapter - handles invalid SMS", () => {
  const adapter = new MTNRwandaSmsAdapter();

  const smsText = "This is not a valid MTN SMS";

  const result = adapter.parseSms(smsText);

  assert.strictEqual(result.success, false, "Parse should fail");
  assert.ok(result.error, "Error message should be present");
});

test("MTN Rwanda SMS Adapter - getSenderPatterns", () => {
  const adapter = new MTNRwandaSmsAdapter();

  const patterns = adapter.getSenderPatterns();

  assert.ok(patterns.length > 0, "Should have sender patterns");
  assert.ok(patterns.includes("MTN"), "Should include MTN pattern");
});

test("MTN Rwanda SMS Adapter - canHandle detection", () => {
  const adapter = new MTNRwandaSmsAdapter();

  assert.strictEqual(
    adapter.canHandle("You have received RWF 5000 from MTN"),
    true,
    "Should handle MTN SMS"
  );

  assert.strictEqual(
    adapter.canHandle("Your MoMo payment was confirmed"),
    true,
    "Should handle MoMo SMS"
  );

  assert.strictEqual(
    adapter.canHandle("Your Orange Money payment"),
    false,
    "Should not handle Orange SMS"
  );
});

test("MTN Rwanda SMS Adapter - handles local phone format", () => {
  const adapter = new MTNRwandaSmsAdapter();

  const smsText = `
    You have received RWF 5,000 from 0788123456.
    Transaction ID: MP240315.1430.A12345.
    Reference: RWA.NYA.GAS.TWIZ.001.
  `.trim();

  const result = adapter.parseSms(smsText);

  assert.strictEqual(result.success, true);
  assert.strictEqual(
    result.transaction?.payer_msisdn,
    "250788123456",
    "Local number should be converted to international format"
  );
});

test("MTN Rwanda SMS Adapter - handles legacy reference format", () => {
  const adapter = new MTNRwandaSmsAdapter();

  const smsText = `
    You have received RWF 5,000 from 250788123456.
    Transaction ID: MP240315.1430.A12345.
    Reference: NYA.GAS.TWIZ.001.
  `.trim();

  const result = adapter.parseSms(smsText);

  assert.strictEqual(result.success, true);
  assert.strictEqual(
    result.transaction?.raw_reference,
    "NYA.GAS.TWIZ.001",
    "Legacy reference should be extracted"
  );
});

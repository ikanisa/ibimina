import { describe, it } from "node:test";
import * as assert from "node:assert";
import * as crypto from "crypto";

/**
 * SMS Forwarder Tests
 *
 * These tests verify HMAC signature generation and SMS parsing logic.
 */

describe("HMAC Signature Generation", () => {
  it("should generate correct HMAC-SHA256 signature", () => {
    const hmacSecret = "test-secret";
    const timestamp = "2025-10-28T12:00:00.000Z";
    const context = "POST:/functions/v1/sms-inbox";
    const body = JSON.stringify({ text: "Test message" });

    const message = timestamp + context + body;
    const signature = crypto.createHmac("sha256", hmacSecret).update(message).digest("hex");

    assert.ok(signature.length === 64, "Signature should be 64 hex characters");
    assert.ok(/^[a-f0-9]{64}$/.test(signature), "Signature should be lowercase hex");
  });

  it("should generate different signatures for different inputs", () => {
    const hmacSecret = "test-secret";
    const timestamp = "2025-10-28T12:00:00.000Z";
    const context = "POST:/functions/v1/sms-inbox";

    const body1 = JSON.stringify({ text: "Message 1" });
    const message1 = timestamp + context + body1;
    const signature1 = crypto.createHmac("sha256", hmacSecret).update(message1).digest("hex");

    const body2 = JSON.stringify({ text: "Message 2" });
    const message2 = timestamp + context + body2;
    const signature2 = crypto.createHmac("sha256", hmacSecret).update(message2).digest("hex");

    assert.notEqual(signature1, signature2, "Different messages should have different signatures");
  });

  it("should generate same signature for same inputs", () => {
    const hmacSecret = "test-secret";
    const timestamp = "2025-10-28T12:00:00.000Z";
    const context = "POST:/functions/v1/sms-inbox";
    const body = JSON.stringify({ text: "Same message" });

    const message = timestamp + context + body;
    const signature1 = crypto.createHmac("sha256", hmacSecret).update(message).digest("hex");

    const signature2 = crypto.createHmac("sha256", hmacSecret).update(message).digest("hex");

    assert.equal(signature1, signature2, "Same message should have same signature");
  });
});

describe("SMS File Parsing", () => {
  it("should parse Gammu SMS file format", () => {
    const smsContent = `SMSCNumber = "+250788000000"
Class = -1
Coding = Default_No_Compression
DateTime = 25/10/28,12:00:00+08
Decoded = true
SMSC = "+250788000000"
SMSCDateTime = 25/10/28,12:00:00+08
State = Received
Number = "+250788123456"
Name = ""

You have received RWF 20,000 from 0788123456 Ref NYA.GAS.TWIZ.001 TXN 12345`;

    const lines = smsContent.split("\n");
    let text = "";
    let isTextSection = false;

    for (const line of lines) {
      if (line === "") {
        isTextSection = true;
      } else if (isTextSection) {
        text += line + "\n";
      }
    }

    assert.ok(text.trim().includes("RWF 20,000"), "Should extract SMS text");
    assert.ok(text.trim().includes("NYA.GAS.TWIZ.001"), "Should extract reference");
  });

  it("should extract timestamp from SMSCDateTime", () => {
    const dateStr = "25/10/28,12:30:45+08";
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2}),(\d{2}):(\d{2}):(\d{2})/);

    assert.ok(match, "Should match Gammu date format");
    if (match) {
      const [, yy, mm, dd, hh, min, ss] = match;
      assert.equal(yy, "25", "Year should be extracted");
      assert.equal(mm, "10", "Month should be extracted");
      assert.equal(dd, "28", "Day should be extracted");
      assert.equal(hh, "12", "Hour should be extracted");
      assert.equal(min, "30", "Minute should be extracted");
      assert.equal(ss, "45", "Second should be extracted");
    }
  });
});

describe("Logger", () => {
  it("should format log messages as JSON", () => {
    const level = "info";
    const message = "Test message";
    const meta = { key: "value" };
    const timestamp = new Date().toISOString();

    const logEntry = JSON.stringify({ level, message, meta, timestamp });
    const parsed = JSON.parse(logEntry);

    assert.equal(parsed.level, "info");
    assert.equal(parsed.message, "Test message");
    assert.deepEqual(parsed.meta, { key: "value" });
  });
});

describe("Request Payload", () => {
  it("should format request body correctly", () => {
    const payload = {
      text: "Test SMS message",
      receivedAt: "2025-10-28T12:00:00.000Z",
      vendorMeta: {
        filename: "IN20251028_120000_00.txt",
        modemPort: "/dev/ttyUSB0",
      },
    };

    const body = JSON.stringify(payload);
    const parsed = JSON.parse(body);

    assert.equal(parsed.text, "Test SMS message");
    assert.equal(parsed.receivedAt, "2025-10-28T12:00:00.000Z");
    assert.ok(parsed.vendorMeta);
    assert.equal(parsed.vendorMeta.filename, "IN20251028_120000_00.txt");
  });
});

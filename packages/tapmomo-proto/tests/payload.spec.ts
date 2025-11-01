import { describe, expect, it } from "vitest";
import {
  TAPMOMO_PAYLOAD_SCHEMA_JSON,
  NonceMemoryStore,
  TapMoMoPayload,
  createSignableMessage,
  decodePayload,
  encodePayload,
  isTimestampWithinTtl,
  signPayload,
  verifyPayload,
} from "../src/index.js";

const basePayload: TapMoMoPayload = {
  ver: 1,
  network: "MTN",
  merchantId: "merchant-123",
  currency: "NGN",
  amount: 5000,
  ref: "INV-1",
  ts: 1_700_000_000_000,
  nonce: "abc-123",
};

describe("TapMoMo protocol helpers", () => {
  it("creates deterministic signable message", () => {
    expect(createSignableMessage(basePayload)).toBe(
      "ver=1&network=MTN&merchantId=merchant-123&currency=NGN&amount=5000&ref=INV-1&ts=1700000000000&nonce=abc-123"
    );
  });

  it("signs and verifies payload", async () => {
    const secret = "super-secret";
    const signature = await signPayload(basePayload, secret);
    const verified = await verifyPayload({ ...basePayload, sig: signature }, secret);
    expect(verified).toBe(true);
  });

  it("fails verification with incorrect secret", async () => {
    const secret = "super-secret";
    const signature = await signPayload(basePayload, secret);
    const verified = await verifyPayload({ ...basePayload, sig: signature }, "other-secret");
    expect(verified).toBe(false);
  });

  it("rejects expired timestamp", () => {
    expect(isTimestampWithinTtl(basePayload.ts, 120_000, basePayload.ts + 120_001)).toBe(false);
  });

  it("detects nonce replay", () => {
    const store = new NonceMemoryStore(10_000);
    expect(store.checkAndStore("nonce-1", basePayload.ts, basePayload.ts)).toBe(true);
    expect(store.checkAndStore("nonce-1", basePayload.ts + 500, basePayload.ts + 500)).toBe(false);
  });

  it("round-trips JSON payload", () => {
    const json = encodePayload(basePayload);
    expect(decodePayload(json)).toEqual(basePayload);
  });

  it("exposes schema metadata", () => {
    expect(TAPMOMO_PAYLOAD_SCHEMA_JSON.title).toBe("TapMoMoPayload");
    expect(TAPMOMO_PAYLOAD_SCHEMA_JSON.required).toContain("network");
  });

  it("throws on malformed JSON", () => {
    expect(() => decodePayload("not json")).toThrow();
  });

  it("throws when required fields are missing", () => {
    const minimal = JSON.stringify({ ver: 1, merchantId: "m" });
    expect(() => decodePayload(minimal)).toThrow(/network/);
  });
});

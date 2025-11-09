/**
 * Unit tests for Device Authentication signature verification
 */

import { describe, it, expect, beforeAll } from "vitest";
import crypto from "node:crypto";

// Test utilities
function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1", // P-256
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { publicKey, privateKey };
}

function signMessage(privateKeyPem: string, message: any): string {
  const messageJson = JSON.stringify(message, Object.keys(message).sort());
  const messageBuffer = Buffer.from(messageJson, "utf-8");

  const sign = crypto.createSign("SHA256");
  sign.update(messageBuffer);
  sign.end();

  const privateKey = crypto.createPrivateKey({
    key: privateKeyPem,
    format: "pem",
  });

  const signatureBuffer = sign.sign(privateKey);
  return signatureBuffer.toString("base64");
}

function verifySignature(publicKeyPem: string, message: any, signatureBase64: string): boolean {
  const messageJson = JSON.stringify(message, Object.keys(message).sort());
  const messageBuffer = Buffer.from(messageJson, "utf-8");
  const signatureBuffer = Buffer.from(signatureBase64, "base64");

  const verify = crypto.createVerify("SHA256");
  verify.update(messageBuffer);
  verify.end();

  const publicKey = crypto.createPublicKey({
    key: publicKeyPem,
    format: "pem",
  });

  return verify.verify(publicKey, signatureBuffer);
}

describe("Device Authentication - Signature Verification", () => {
  let keyPair: { publicKey: string; privateKey: string };

  beforeAll(() => {
    keyPair = generateKeyPair();
  });

  it("should generate valid EC P-256 keypair", () => {
    expect(keyPair.publicKey).toContain("BEGIN PUBLIC KEY");
    expect(keyPair.publicKey).toContain("END PUBLIC KEY");
    expect(keyPair.privateKey).toContain("BEGIN PRIVATE KEY");
  });

  it("should sign and verify message correctly", () => {
    const message = {
      ver: 1,
      user_id: "test-user-123",
      device_id: "test-device-456",
      session_id: "test-session-789",
      origin: "https://admin.ibimina.rw",
      nonce: "abcdef1234567890",
      ts: Math.floor(Date.now() / 1000),
      scope: ["login"],
      alg: "ES256",
    };

    const signature = signMessage(keyPair.privateKey, message);
    expect(signature).toBeTruthy();
    expect(signature.length).toBeGreaterThan(0);

    const isValid = verifySignature(keyPair.publicKey, message, signature);
    expect(isValid).toBe(true);
  });

  it("should fail verification with wrong signature", () => {
    const message = {
      ver: 1,
      user_id: "test-user-123",
      device_id: "test-device-456",
      session_id: "test-session-789",
      origin: "https://admin.ibimina.rw",
      nonce: "abcdef1234567890",
      ts: Math.floor(Date.now() / 1000),
      scope: ["login"],
      alg: "ES256",
    };

    const wrongSignature = Buffer.from("invalid-signature").toString("base64");
    const isValid = verifySignature(keyPair.publicKey, message, wrongSignature);
    expect(isValid).toBe(false);
  });

  it("should fail verification with modified message", () => {
    const message = {
      ver: 1,
      user_id: "test-user-123",
      device_id: "test-device-456",
      session_id: "test-session-789",
      origin: "https://admin.ibimina.rw",
      nonce: "abcdef1234567890",
      ts: Math.floor(Date.now() / 1000),
      scope: ["login"],
      alg: "ES256",
    };

    const signature = signMessage(keyPair.privateKey, message);

    // Modify message
    const modifiedMessage = { ...message, nonce: "different-nonce" };

    const isValid = verifySignature(keyPair.publicKey, modifiedMessage, signature);
    expect(isValid).toBe(false);
  });

  it("should use canonical JSON for signing", () => {
    // Test that key order doesn't matter
    const message1 = {
      alg: "ES256",
      device_id: "test-device",
      nonce: "abc123",
      origin: "https://example.com",
      scope: ["login"],
      session_id: "session-123",
      ts: 1234567890,
      user_id: "user-123",
      ver: 1,
    };

    const message2 = {
      ver: 1,
      user_id: "user-123",
      device_id: "test-device",
      session_id: "session-123",
      origin: "https://example.com",
      nonce: "abc123",
      ts: 1234567890,
      scope: ["login"],
      alg: "ES256",
    };

    const sig1 = signMessage(keyPair.privateKey, message1);
    const sig2 = signMessage(keyPair.privateKey, message2);

    // Both signatures should be valid for both message representations
    expect(verifySignature(keyPair.publicKey, message1, sig1)).toBe(true);
    expect(verifySignature(keyPair.publicKey, message2, sig1)).toBe(true);
    expect(verifySignature(keyPair.publicKey, message1, sig2)).toBe(true);
    expect(verifySignature(keyPair.publicKey, message2, sig2)).toBe(true);
  });

  it("should validate challenge structure", () => {
    const validChallenge = {
      ver: 1,
      session_id: crypto.randomUUID(),
      origin: "https://admin.ibimina.rw",
      nonce: crypto.randomBytes(16).toString("hex"),
      exp: Math.floor(Date.now() / 1000) + 60,
      aud: "web-login",
    };

    // Check required fields
    expect(validChallenge.ver).toBe(1);
    expect(validChallenge.session_id).toBeTruthy();
    expect(validChallenge.origin).toMatch(/^https:\/\//);
    expect(validChallenge.nonce).toHaveLength(32); // 16 bytes hex = 32 chars
    expect(validChallenge.exp).toBeGreaterThan(Date.now() / 1000);
    expect(validChallenge.aud).toBe("web-login");
  });

  it("should validate signed message structure", () => {
    const validSignedMessage = {
      ver: 1,
      user_id: crypto.randomUUID(),
      device_id: "test-device-id",
      session_id: crypto.randomUUID(),
      origin: "https://admin.ibimina.rw",
      nonce: crypto.randomBytes(16).toString("hex"),
      ts: Math.floor(Date.now() / 1000),
      scope: ["login"],
      alg: "ES256",
    };

    // Check required fields
    expect(validSignedMessage.ver).toBe(1);
    expect(validSignedMessage.user_id).toBeTruthy();
    expect(validSignedMessage.device_id).toBeTruthy();
    expect(validSignedMessage.session_id).toBeTruthy();
    expect(validSignedMessage.origin).toMatch(/^https:\/\//);
    expect(validSignedMessage.nonce).toHaveLength(32);
    expect(validSignedMessage.ts).toBeGreaterThan(0);
    expect(validSignedMessage.scope).toEqual(["login"]);
    expect(validSignedMessage.alg).toBe("ES256");
  });

  it("should reject expired challenge", () => {
    const expiredChallenge = {
      ver: 1,
      session_id: crypto.randomUUID(),
      origin: "https://admin.ibimina.rw",
      nonce: crypto.randomBytes(16).toString("hex"),
      exp: Math.floor(Date.now() / 1000) - 10, // 10 seconds ago
      aud: "web-login",
    };

    const isExpired = expiredChallenge.exp < Math.floor(Date.now() / 1000);
    expect(isExpired).toBe(true);
  });

  it("should validate origin format", () => {
    const validOrigins = [
      "https://admin.ibimina.rw",
      "https://staff.ibimina.gov.rw",
      "http://localhost:3100",
    ];

    const invalidOrigins = [
      "http://example.com", // HTTP not HTTPS (except localhost)
      "ftp://example.com",
      "example.com",
      "",
    ];

    validOrigins.forEach((origin) => {
      const isValid = origin.startsWith("https://") || origin.startsWith("http://localhost");
      expect(isValid).toBe(true);
    });

    invalidOrigins.forEach((origin) => {
      const isValid = origin.startsWith("https://") || origin.startsWith("http://localhost");
      expect(isValid).toBe(false);
    });
  });
});

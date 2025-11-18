import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { Capacitor } from "@capacitor/core";
import { DeviceAuthManager } from "@/lib/device-auth/manager";
import type { DeviceAuthPlugin, ChallengeData, SignedMessage } from "@/lib/device-auth/types";

const baseChallenge: ChallengeData = {
  ver: 1,
  session_id: "session-123",
  origin: "app",
  nonce: "nonce-abc",
  exp: Date.now() / 1000 + 60,
  aud: "client",
};

function createPluginStub(): DeviceAuthPlugin {
  return {
    async hasKeyPair() {
      return { hasKeyPair: false };
    },
    async generateKeyPair() {
      return { success: true, publicKey: "PUB", algorithm: "ES256" };
    },
    async getPublicKey() {
      return { publicKey: "PUB", algorithm: "ES256" };
    },
    async getDeviceId() {
      return { deviceId: "device-1" };
    },
    async getDeviceInfo() {
      return {
        deviceId: "device-1",
        model: "Pixel",
        manufacturer: "Google",
        osVersion: "14",
        sdkVersion: 34,
      };
    },
    async checkBiometricAvailable() {
      return { available: true, message: "OK" };
    },
    async signChallenge() {
      return {
        success: true,
        signature: "sig-1",
        signedMessage: {
          ver: 1,
          user_id: "user-1",
          device_id: "device-1",
          session_id: "session-123",
          origin: "app",
          nonce: "nonce-abc",
          ts: Date.now() / 1000,
          scope: ["login"],
          alg: "ES256",
        } satisfies SignedMessage,
      };
    },
    async deleteKeyPair() {
      return { success: true };
    },
  };
}

describe("DeviceAuthManager", () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it("detects platform availability", () => {
    mock.method(Capacitor, "isNativePlatform", () => false);
    const manager = new DeviceAuthManager();
    assert.equal(manager.isAvailable(), false);

    mock.restoreAll();
    mock.method(Capacitor, "isNativePlatform", () => true);
    mock.method(Capacitor, "getPlatform", () => "android");
    const androidManager = new DeviceAuthManager();
    assert.equal(androidManager.isAvailable(), true);
  });

  it("checks enrollment and handles plugin errors gracefully", async () => {
    mock.method(Capacitor, "isNativePlatform", () => true);
    mock.method(Capacitor, "getPlatform", () => "android");

    const plugin = createPluginStub();
    const manager = new DeviceAuthManager("http://localhost:4000", plugin);

    assert.equal(await manager.isEnrolled(), false);

    plugin.hasKeyPair = async () => {
      throw new Error("hardware failure");
    };
    assert.equal(await manager.isEnrolled(), false);
  });

  it("signs a challenge only after enrollment", async () => {
    mock.method(Capacitor, "isNativePlatform", () => true);
    mock.method(Capacitor, "getPlatform", () => "android");

    const plugin = createPluginStub();
    const manager = new DeviceAuthManager("http://localhost:4000", plugin);

    const notEnrolled = await manager.signChallenge(baseChallenge, "user-1");
    assert.equal(notEnrolled.success, false);
    assert.match(notEnrolled.error ?? "", /enroll/i);

    plugin.hasKeyPair = async () => ({ hasKeyPair: true });
    const signed = await manager.signChallenge(baseChallenge, "user-1");
    assert.equal(signed.success, true);
    assert.equal(signed.signature, "sig-1");
    assert.equal(signed.signedMessage?.device_id, "device-1");
  });

  it("verifies challenges against the API", async () => {
    mock.method(Capacitor, "isNativePlatform", () => true);
    mock.method(Capacitor, "getPlatform", () => "android");

    const plugin = createPluginStub();
    const manager = new DeviceAuthManager("http://localhost:4000", plugin);

    const responseBody = { user_id: "user-99" };
    mock.method(
      global,
      "fetch",
      async () =>
        new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { "content-type": "application/json" },
        }) as unknown as Promise<Response>
    );

    const result = await manager.verifyChallenge("sess", "device-1", "sig", {
      ver: 1,
      user_id: "user-99",
      device_id: "device-1",
      session_id: "sess",
      origin: "app",
      nonce: "n-1",
      ts: 1,
      scope: ["login"],
      alg: "ES256",
    });

    assert.equal(result.success, true);
    assert.equal(result.userId, "user-99");
  });
});

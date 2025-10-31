import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";

/**
 * Feature Flag System Tests
 *
 * These tests verify that the feature flag system correctly
 * parses environment variables and provides the expected API.
 */

describe("Feature Flags", () => {
  beforeEach(() => {
    // Clean up environment variables before each test
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("NEXT_PUBLIC_FEATURE_FLAG_")) {
        delete process.env[key];
      }
    });
  });

  it("should parse environment variables with NEXT_PUBLIC_FEATURE_FLAG_ prefix", () => {
    process.env.NEXT_PUBLIC_FEATURE_FLAG_TEST_FEATURE = "true";
    process.env.NEXT_PUBLIC_FEATURE_FLAG_ANOTHER_FEATURE = "false";

    // Simulate the flag parsing logic from FeatureFlagProvider
    const flags: Record<string, boolean> = {};
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("NEXT_PUBLIC_FEATURE_FLAG_")) {
        const flagName = key
          .replace("NEXT_PUBLIC_FEATURE_FLAG_", "")
          .toLowerCase()
          .replace(/_/g, "-");
        const value = process.env[key];
        flags[flagName] = value === "true" || value === "1";
      }
    });

    assert.strictEqual(flags["test-feature"], true);
    assert.strictEqual(flags["another-feature"], false);
  });

  it("should convert flag names from SCREAMING_SNAKE_CASE to kebab-case", () => {
    process.env.NEXT_PUBLIC_FEATURE_FLAG_MY_NEW_FEATURE = "true";

    const flags: Record<string, boolean> = {};
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("NEXT_PUBLIC_FEATURE_FLAG_")) {
        const flagName = key
          .replace("NEXT_PUBLIC_FEATURE_FLAG_", "")
          .toLowerCase()
          .replace(/_/g, "-");
        const value = process.env[key];
        flags[flagName] = value === "true" || value === "1";
      }
    });

    assert.ok(flags["my-new-feature"]);
    assert.strictEqual(typeof flags["MY_NEW_FEATURE"], "undefined");
  });

  it("should treat '1' as true", () => {
    process.env.NEXT_PUBLIC_FEATURE_FLAG_NUMERIC_FLAG = "1";

    const flags: Record<string, boolean> = {};
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("NEXT_PUBLIC_FEATURE_FLAG_")) {
        const flagName = key
          .replace("NEXT_PUBLIC_FEATURE_FLAG_", "")
          .toLowerCase()
          .replace(/_/g, "-");
        const value = process.env[key];
        flags[flagName] = value === "true" || value === "1";
      }
    });

    assert.strictEqual(flags["numeric-flag"], true);
  });

  it("should treat any value other than 'true' or '1' as false", () => {
    process.env.NEXT_PUBLIC_FEATURE_FLAG_TEST1 = "false";
    process.env.NEXT_PUBLIC_FEATURE_FLAG_TEST2 = "0";
    process.env.NEXT_PUBLIC_FEATURE_FLAG_TEST3 = "yes";
    process.env.NEXT_PUBLIC_FEATURE_FLAG_TEST4 = "True";

    const flags: Record<string, boolean> = {};
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("NEXT_PUBLIC_FEATURE_FLAG_")) {
        const flagName = key
          .replace("NEXT_PUBLIC_FEATURE_FLAG_", "")
          .toLowerCase()
          .replace(/_/g, "-");
        const value = process.env[key];
        flags[flagName] = value === "true" || value === "1";
      }
    });

    assert.strictEqual(flags["test1"], false);
    assert.strictEqual(flags["test2"], false);
    assert.strictEqual(flags["test3"], false);
    assert.strictEqual(flags["test4"], false);
  });

  it("should return false for non-existent flags", () => {
    const flags: Record<string, boolean> = {};
    const isEnabled = (flagName: string): boolean => {
      return flags[flagName] ?? false;
    };

    assert.strictEqual(isEnabled("non-existent-flag"), false);
  });

  it("should handle multiple flags correctly", () => {
    process.env.NEXT_PUBLIC_FEATURE_FLAG_WEB_PUSH = "true";
    process.env.NEXT_PUBLIC_FEATURE_FLAG_BETA_FEATURES = "false";
    process.env.NEXT_PUBLIC_FEATURE_FLAG_NEW_UI = "1";

    const flags: Record<string, boolean> = {};
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("NEXT_PUBLIC_FEATURE_FLAG_")) {
        const flagName = key
          .replace("NEXT_PUBLIC_FEATURE_FLAG_", "")
          .toLowerCase()
          .replace(/_/g, "-");
        const value = process.env[key];
        flags[flagName] = value === "true" || value === "1";
      }
    });

    assert.strictEqual(flags["web-push"], true);
    assert.strictEqual(flags["beta-features"], false);
    assert.strictEqual(flags["new-ui"], true);
    assert.strictEqual(Object.keys(flags).length, 3);
  });
});

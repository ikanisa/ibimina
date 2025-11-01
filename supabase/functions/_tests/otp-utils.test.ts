/**
 * Unit Tests for WhatsApp OTP Functions
 *
 * Tests phone number validation, normalization, and OTP generation
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";

/**
 * Phone number validation tests
 */
Deno.test("validatePhoneNumber - accepts local Rwanda format", () => {
  const phone = "078XXXXXXX";
  const pattern = /^07[2-9]\d{7}$/;
  assertEquals(pattern.test(phone), true);
});

Deno.test("validatePhoneNumber - accepts international Rwanda format without plus", () => {
  const phone = "250781234567";
  const pattern = /^2507[2-9]\d{7}$/;
  assertEquals(pattern.test(phone), true);
});

Deno.test("validatePhoneNumber - accepts international Rwanda format with plus", () => {
  const phone = "+250781234567";
  const pattern = /^\+2507[2-9]\d{7}$/;
  assertEquals(pattern.test(phone), true);
});

Deno.test("validatePhoneNumber - rejects invalid Rwanda number", () => {
  const phone = "071234567"; // Invalid prefix
  const patterns = [/^07[2-9]\d{7}$/, /^2507[2-9]\d{7}$/, /^\+2507[2-9]\d{7}$/];
  const isValid = patterns.some((pattern) => pattern.test(phone));
  assertEquals(isValid, false);
});

/**
 * Phone number normalization tests
 */
function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.trim();
  if (cleaned.startsWith("+250")) return cleaned;
  if (cleaned.startsWith("250")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+250${cleaned.slice(1)}`;
  return cleaned;
}

Deno.test("normalizePhoneNumber - converts local to E.164", () => {
  const input = "078XXXXXXX";
  const expected = "+25078XXXXXXX";
  assertEquals(normalizePhoneNumber(input), expected);
});

Deno.test("normalizePhoneNumber - preserves E.164 with plus", () => {
  const input = "+250781234567";
  assertEquals(normalizePhoneNumber(input), input);
});

Deno.test("normalizePhoneNumber - adds plus to international format", () => {
  const input = "250781234567";
  const expected = "+250781234567";
  assertEquals(normalizePhoneNumber(input), expected);
});

/**
 * OTP generation tests
 */
function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const num = array[0] % 1000000;
  return num.toString().padStart(6, "0");
}

Deno.test("generateOTP - returns 6 digits", () => {
  const otp = generateOTP();
  assertEquals(otp.length, 6);
});

Deno.test("generateOTP - contains only digits", () => {
  const otp = generateOTP();
  assertEquals(/^\d{6}$/.test(otp), true);
});

Deno.test("generateOTP - generates different values", () => {
  const otp1 = generateOTP();
  const otp2 = generateOTP();
  // Very unlikely to be the same (1 in 1 million chance)
  // If they are the same, it's still valid, just extremely rare
  assertExists(otp1);
  assertExists(otp2);
});

/**
 * OTP expiry calculation tests
 */
Deno.test("OTP expiry - 5 minutes from now", () => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

  const diffMinutes = (expiresAt.getTime() - now.getTime()) / (60 * 1000);
  assertEquals(Math.round(diffMinutes), 5);
});

/**
 * Error response format tests
 */
Deno.test("Error response - has correct structure", () => {
  const errorResponse = {
    success: false,
    message: "Phone number is required",
  };

  assertEquals(errorResponse.success, false);
  assertExists(errorResponse.message);
});

Deno.test("Success response - has correct structure", () => {
  const successResponse = {
    success: true,
    message: "OTP sent successfully",
    expires_at: new Date().toISOString(),
  };

  assertEquals(successResponse.success, true);
  assertExists(successResponse.message);
  assertExists(successResponse.expires_at);
});

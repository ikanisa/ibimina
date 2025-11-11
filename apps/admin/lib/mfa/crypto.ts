/**
 * Multi-Factor Authentication (MFA) Cryptography Utilities
 *
 * This module provides cryptographic functions for TOTP (Time-based One-Time Password)
 * generation and verification, as well as secure encryption for MFA backup codes.
 *
 * Key features:
 * - TOTP generation and verification (RFC 6238)
 * - Base32 secret generation
 * - AES-256-GCM encryption for backup codes
 * - Secure key management using environment variables
 *
 * @module lib/mfa/crypto
 */

import crypto from "node:crypto";
import { base32Decode, generateBase32Secret } from "@/lib/mfa/base32";

/** TOTP period in seconds (standard is 30 seconds) */
const PERIOD_SECONDS = 30;
/** Number of digits in generated TOTP codes */
const DIGITS = 6;

/**
 * Retrieves a required environment variable or throws an error
 * @param key - Environment variable name
 * @returns Environment variable value
 * @throws Error if the environment variable is not set
 */
const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
};

// Accept either KMS_DATA_KEY (preferred) or KMS_DATA_KEY_BASE64 (legacy)
const resolveDataKeyB64 = () => process.env.KMS_DATA_KEY ?? process.env.KMS_DATA_KEY_BASE64 ?? "";

/**
 * Retrieves and validates the data encryption key from environment
 * @returns 32-byte encryption key buffer
 * @throws Error if key is not configured or has invalid length
 */
const dataKey = () => {
  const keyB64 = resolveDataKeyB64();
  if (!keyB64) throw new Error("KMS_DATA_KEY (or KMS_DATA_KEY_BASE64) is not configured");
  const buf = Buffer.from(keyB64, "base64");
  if (buf.length !== 32) throw new Error("KMS_DATA_KEY must be a 32-byte base64 value");
  return buf;
};
const backupPepper = () => requireEnv("BACKUP_PEPPER");

const padLeft = (value: number, size: number) => value.toString().padStart(size, "0");

/**
 * Generates a new base32-encoded TOTP secret (20 bytes = 160 bits)
 * @returns Base32-encoded secret string
 */
export const generateTotpSecret = () => generateBase32Secret(20);

/**
 * Creates an otpauth:// URI for TOTP configuration
 * This URI can be encoded as a QR code for easy setup in authenticator apps
 *
 * @param issuer - Service name (e.g., "Ibimina SACCO+")
 * @param account - User identifier (typically email or username)
 * @param secret - Base32-encoded TOTP secret
 * @returns otpauth URI string compatible with RFC 6238
 */
export const createOtpAuthUri = (issuer: string, account: string, secret: string) => {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    digits: String(DIGITS),
    period: String(PERIOD_SECONDS),
    algorithm: "SHA1",
  });

  return `otpauth://totp/${label}?${params.toString()}`;
};

/**
 * Generates an HMAC-based One-Time Password at a specific counter value
 * This is the core HOTP algorithm (RFC 4226) used by TOTP
 *
 * @param secret - Base32-encoded secret
 * @param counter - Counter value (for TOTP, this is the time step)
 * @returns 6-digit OTP string
 */
const hotpAt = (secret: string, counter: number) => {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** DIGITS;
  return padLeft(code, DIGITS);
};

/**
 * Calculates the current TOTP time step
 * @param now - Current timestamp in milliseconds (defaults to Date.now())
 * @returns Time step number
 */
export const currentStep = (now = Date.now()) => Math.floor(now / 1000 / PERIOD_SECONDS);

/**
 * Verifies a TOTP token against a secret with time window tolerance
 *
 * @param secret - Base32-encoded TOTP secret
 * @param token - User-provided TOTP token (6 digits)
 * @param window - Time window tolerance (number of steps before/after current, default 1)
 * @returns Verification result with success status and optional step offset
 */
export const verifyTotp = (secret: string, token: string, window = 1) => {
  const sanitized = token.replace(/[^0-9]/g, "");
  if (sanitized.length !== DIGITS) {
    return { ok: false as const };
  }

  const step = currentStep();
  for (let offset = -window; offset <= window; offset += 1) {
    const candidateStep = step + offset;
    if (candidateStep < 0) continue;
    if (hotpAt(secret, candidateStep) === sanitized) {
      return { ok: true as const, step: candidateStep };
    }
  }

  return { ok: false as const };
};

export const encryptSensitiveString = (value: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", dataKey(), iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
};

const normalizeEncryptedPayload = (payload: string | ArrayBuffer | ArrayBufferView) => {
  if (typeof payload === "string") {
    if (payload.startsWith("\\x")) {
      return Buffer.from(payload.slice(2), "hex");
    }
    return Buffer.from(payload, "base64");
  }

  if (payload instanceof ArrayBuffer) {
    return Buffer.from(payload);
  }

  if (ArrayBuffer.isView(payload)) {
    return Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);
  }

  throw new Error("Unsupported encrypted payload type");
};

export const decryptSensitiveString = (payload: string | ArrayBuffer | ArrayBufferView) => {
  const blob = normalizeEncryptedPayload(payload);
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const enc = blob.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", dataKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
};

type BackupCodeRecord = {
  code: string;
  hash: string;
};

/**
 * Internal function to hash a backup code using PBKDF2 with pepper and salt
 *
 * Security considerations:
 * - Uses PBKDF2 with 250,000 iterations (OWASP recommendation)
 * - SHA-256 hash algorithm
 * - 32-byte output length
 * - Combines pepper (from env) with per-code salt
 * - Returns format: "{salt}${hash}" for storage
 *
 * @param code - Plain text backup code to hash
 * @param salt - Optional salt (if not provided, generates new 16-byte random salt)
 * @returns Salted hash string in format "salt$hash" (both base64 encoded)
 */
const hashBackupCodeInternal = (code: string, salt?: string) => {
  const pepper = backupPepper();
  const effectiveSalt = salt ?? crypto.randomBytes(16).toString("base64");
  const hash = crypto
    .pbkdf2Sync(`${pepper}${code}`, effectiveSalt, 250000, 32, "sha256")
    .toString("base64");
  return `${effectiveSalt}$${hash}`;
};

/**
 * Generates a set of one-time backup codes for MFA recovery
 * Each code is 10 characters (uppercase alphanumeric) and cryptographically hashed
 *
 * @param count - Number of backup codes to generate (default: 10)
 * @returns Array of backup code records with plaintext code and secure hash
 */
export const generateBackupCodes = (count = 10): BackupCodeRecord[] => {
  const records: BackupCodeRecord[] = [];
  for (let i = 0; i < count; i += 1) {
    const raw = crypto
      .randomBytes(8)
      .toString("base64")
      .replace(/[^A-Z0-9]/gi, "A")
      .slice(0, 10)
      .toUpperCase();
    records.push({ code: raw, hash: hashBackupCodeInternal(raw) });
  }
  return records;
};

export const consumeBackupCode = (input: string, hashes: string[]) => {
  const normalized = input.trim().toUpperCase();
  const index = hashes.findIndex((stored) => {
    const [salt] = stored.split("$");
    const computed = hashBackupCodeInternal(normalized, salt);
    return computed === stored;
  });

  if (index === -1) {
    return null;
  }

  const next = [...hashes];
  next.splice(index, 1);
  return next;
};

export const previewSecret = (secret: string, visible = 4) => {
  if (secret.length <= visible) return secret;
  return `${secret.slice(0, visible)}••••`;
};

export const encodePendingEnrollment = (payload: {
  userId: string;
  secret: string;
  issuedAt: number;
}) => encryptSensitiveString(JSON.stringify(payload));

export const decodePendingEnrollment = (token: string) => {
  const json = decryptSensitiveString(token);
  return JSON.parse(json) as { userId: string; secret: string; issuedAt: number };
};

export const getOtpForStep = (secret: string, step: number) => hotpAt(secret, step);

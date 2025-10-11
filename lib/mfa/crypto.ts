import crypto from "node:crypto";
import { base32Decode, generateBase32Secret } from "@/lib/mfa/base32";

const PERIOD_SECONDS = 30;
const DIGITS = 6;

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
};

const dataKey = () => Buffer.from(requireEnv("KMS_DATA_KEY"), "base64");
const backupPepper = () => requireEnv("BACKUP_PEPPER");

const padLeft = (value: number, size: number) => value.toString().padStart(size, "0");

export const generateTotpSecret = () => generateBase32Secret(20);

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

const hotpAt = (secret: string, counter: number) => {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** DIGITS;
  return padLeft(code, DIGITS);
};

export const currentStep = (now = Date.now()) => Math.floor(now / 1000 / PERIOD_SECONDS);

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

const hashBackupCodeInternal = (code: string, salt?: string) => {
  const pepper = backupPepper();
  const effectiveSalt = salt ?? crypto.randomBytes(16).toString("base64");
  const hash = crypto.pbkdf2Sync(`${pepper}${code}`, effectiveSalt, 250000, 32, "sha256").toString("base64");
  return `${effectiveSalt}$${hash}`;
};

export const generateBackupCodes = (count = 10): BackupCodeRecord[] => {
  const records: BackupCodeRecord[] = [];
  for (let i = 0; i < count; i += 1) {
    const raw = crypto.randomBytes(8).toString("base64").replace(/[^A-Z0-9]/gi, "A").slice(0, 10).toUpperCase();
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

export const encodePendingEnrollment = (payload: { userId: string; secret: string; issuedAt: number }) =>
  encryptSensitiveString(JSON.stringify(payload));

export const decodePendingEnrollment = (token: string) => {
  const json = decryptSensitiveString(token);
  return JSON.parse(json) as { userId: string; secret: string; issuedAt: number };
};

export const getOtpForStep = (secret: string, step: number) => hotpAt(secret, step);

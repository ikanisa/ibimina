import crypto from "node:crypto";
import { decryptSensitiveString, encryptSensitiveString } from "@/lib/mfa/crypto";

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
};

const otpPepper = () => requireEnv("BACKUP_PEPPER");

export const decryptTotpSecret = (payload: string | ArrayBuffer | ArrayBufferView) =>
  decryptSensitiveString(payload);

export const encryptTotpSecret = (secret: string) => encryptSensitiveString(secret);

export const sha256Hex = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export const randomDigits = (length: number) => {
  if (length <= 0) {
    throw new Error("length must be positive");
  }
  const digits = "0123456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    const index = crypto.randomInt(0, digits.length);
    result += digits[index];
  }
  return result;
};

export const redactSecret = (value: string | null | undefined, visible = 3) => {
  if (!value) return value ?? undefined;
  if (value.length <= visible) return value;
  return `${value.slice(0, visible)}…`;
};

export const hashOneTimeCode = (code: string, salt?: string) => {
  const effectiveSalt = salt ?? crypto.randomBytes(16).toString("base64");
  const digest = crypto
    .createHash("sha256")
    .update(`${otpPepper()}|${effectiveSalt}|${code}`)
    .digest("base64");
  return `${effectiveSalt}$${digest}`;
};

export const verifyOneTimeCode = (code: string, stored: string) => {
  const [salt] = stored.split("$");
  return hashOneTimeCode(code, salt) === stored;
};

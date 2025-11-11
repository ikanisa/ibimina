import crypto from "node:crypto";

export const decryptAesGcmB64 = (blobB64: string, keyB64: string) => {
  const key = Buffer.from(keyB64, "base64");
  const blob = Buffer.from(blobB64, "base64");
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const enc = blob.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
};

export const sha256Hex = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export const randDigits = (length: number) => {
  const digits: string[] = [];
  for (let i = 0; i < length; i += 1) {
    digits.push(String(crypto.randomInt(0, 10)));
  }
  return digits.join("");
};

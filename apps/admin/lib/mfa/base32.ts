import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const ALPHABET_MAP = new Map<string, number>(
  ALPHABET.split("").map((char, index) => [char, index])
);

export const base32Encode = (buffer: Buffer): string => {
  let bits = "";
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }

  const output: string[] = [];
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    if (chunk.length < 5) {
      output.push(ALPHABET[parseInt(chunk.padEnd(5, "0"), 2)]);
    } else {
      output.push(ALPHABET[parseInt(chunk, 2)]);
    }
  }

  return output.join("");
};

export const base32Decode = (value: string): Buffer => {
  const sanitized = value.replace(/=+$/u, "").toUpperCase();
  let bits = "";

  for (const char of sanitized) {
    const index = ALPHABET_MAP.get(char);
    if (index === undefined) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    bits += index.toString(2).padStart(5, "0");
  }

  const chunks: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const chunk = bits.slice(i, i + 8);
    chunks.push(parseInt(chunk, 2));
  }

  return Buffer.from(chunks);
};

export const generateBase32Secret = (byteLength = 20): string => {
  const random = crypto.randomBytes(byteLength);
  return base32Encode(random);
};

const encoder = new TextEncoder();

const toBase64 = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const fromBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

let cachedKey: CryptoKey | null = null;

const getKey = async () => {
  if (cachedKey) {
    return cachedKey;
  }

  const secret = Deno.env.get("FIELD_ENCRYPTION_KEY");

  if (!secret) {
    throw new Error("FIELD_ENCRYPTION_KEY not configured");
  }

  const raw = fromBase64(secret.trim());

  if (raw.length !== 32) {
    throw new Error("FIELD_ENCRYPTION_KEY must be a 32-byte base64 string");
  }

  cachedKey = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
  return cachedKey;
};

export const encryptField = async (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(value));
  const ciphertext = toBase64(cipherBuffer);
  const ivEncoded = toBase64(iv);
  return `${ivEncoded}:${ciphertext}`;
};

export const decryptField = async (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const [ivEncoded, cipher] = value.split(":");

  if (!ivEncoded || !cipher) {
    throw new Error("Invalid ciphertext format");
  }

  const key = await getKey();
  const iv = fromBase64(ivEncoded);
  const ciphertext = fromBase64(cipher);
  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  const decoder = new TextDecoder();
  return decoder.decode(plainBuffer);
};

export const hashField = async (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const maskMsisdn = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const digits = value.replace(/[^0-9+]/g, "");
  if (digits.length < 4) {
    return "••••";
  }

  const prefix = digits.slice(0, 5);
  const suffix = digits.slice(-3);
  return `${prefix}••••${suffix}`;
};

export const maskNationalId = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const clean = value.replace(/[^0-9]/g, "");
  if (clean.length <= 4) {
    return "••••";
  }

  return `${"•".repeat(clean.length - 4)}${clean.slice(-4)}`;
};

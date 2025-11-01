export interface TapMoMoPayload {
  ver: 1;
  network: string;
  merchantId: string;
  currency: string;
  amount?: number;
  ref?: string;
  ts: number;
  nonce: string;
  sig?: string;
}

export const TAPMOMO_PAYLOAD_SCHEMA_JSON = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://schemas.ibimina.com/tapmomo/payload.json",
  title: "TapMoMoPayload",
  type: "object",
  required: ["ver", "network", "merchantId", "currency", "ts", "nonce"],
  properties: {
    ver: { type: "integer", enum: [1] },
    network: { type: "string", minLength: 1 },
    merchantId: { type: "string", minLength: 1 },
    currency: { type: "string", minLength: 1 },
    amount: { type: "integer", minimum: 0 },
    ref: { type: "string", minLength: 1 },
    ts: { type: "integer", minimum: 0 },
    nonce: { type: "string", minLength: 1 },
    sig: { type: "string", minLength: 44 },
  },
  additionalProperties: false,
} as const;

const encoder = new TextEncoder();

function toBase64(data: ArrayBuffer): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(data).toString("base64");
  }
  let binary = "";
  const bytes = new Uint8Array(data);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64");
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function createSignableMessage(payload: TapMoMoPayload): string {
  const segments = [
    `ver=${payload.ver}`,
    `network=${payload.network}`,
    `merchantId=${payload.merchantId}`,
    `currency=${payload.currency}`,
  ];
  if (typeof payload.amount === "number") {
    segments.push(`amount=${payload.amount}`);
  }
  if (typeof payload.ref === "string") {
    segments.push(`ref=${payload.ref}`);
  }
  segments.push(`ts=${payload.ts}`);
  segments.push(`nonce=${payload.nonce}`);
  return segments.join("&");
}

export async function signMessage(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64(signature);
}

export async function signPayload(payload: TapMoMoPayload, secret: string): Promise<string> {
  const message = createSignableMessage(payload);
  return signMessage(message, secret);
}

export async function verifyPayload(payload: TapMoMoPayload, secret: string): Promise<boolean> {
  if (!payload.sig) return false;
  const expected = await signPayload({ ...payload, sig: undefined }, secret);
  return constantTimeEquals(fromBase64(expected), fromBase64(payload.sig));
}

export function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export function encodePayload(payload: TapMoMoPayload): string {
  return JSON.stringify(payload);
}

export function decodePayload(raw: string): TapMoMoPayload {
  const parsed = JSON.parse(raw);
  const required = ["ver", "network", "merchantId", "currency", "ts", "nonce"] as const;
  for (const key of required) {
    if (!(key in parsed)) {
      throw new Error(`Missing required field: ${key}`);
    }
  }
  if (parsed.ver !== 1) {
    throw new Error("Unsupported payload version");
  }
  return parsed as TapMoMoPayload;
}

export function isTimestampWithinTtl(ts: number, ttlMs: number, now: number = Date.now()): boolean {
  const age = now - ts;
  return age >= 0 && age <= ttlMs;
}

export const DEFAULT_TTL_MS = 120_000;

export class NonceMemoryStore {
  private readonly ttlMs: number;
  private readonly entries = new Map<string, number>();

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  purge(now: number): void {
    for (const [nonce, seenAt] of this.entries.entries()) {
      if (now - seenAt > this.ttlMs) {
        this.entries.delete(nonce);
      }
    }
  }

  checkAndStore(nonce: string, timestamp: number, now: number = Date.now()): boolean {
    this.purge(now);
    const seenAt = this.entries.get(nonce);
    if (seenAt !== undefined && now - seenAt <= this.ttlMs) {
      return false;
    }
    this.entries.set(nonce, timestamp);
    return true;
  }
}

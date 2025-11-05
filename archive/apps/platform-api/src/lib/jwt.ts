const textEncoder = new TextEncoder();

const toBase64 = (bytes: Uint8Array) => {
  if (typeof btoa === "function") {
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  const bufferModule = (globalThis as Record<string, unknown>).Buffer as
    | { from: (value: Uint8Array) => { toString: (encoding: string) => string } }
    | undefined;
  if (bufferModule?.from) {
    return bufferModule.from(bytes).toString("base64");
  }

  throw new Error("Base64 encoding is not supported in this environment");
};

const fromBase64 = (input: string): Uint8Array => {
  if (typeof atob === "function") {
    const binary = atob(input);
    const result = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      result[i] = binary.charCodeAt(i);
    }
    return result;
  }

  const bufferModule = (globalThis as Record<string, unknown>).Buffer as
    | { from: (value: string, encoding: string) => Uint8Array }
    | undefined;
  if (bufferModule?.from) {
    const buffer = bufferModule.from(input, "base64");
    return new Uint8Array(buffer);
  }

  throw new Error("Base64 decoding is not supported in this environment");
};

const base64UrlEncode = (input: Uint8Array | string) => {
  const bytes = typeof input === "string" ? textEncoder.encode(input) : input;
  const base64 = toBase64(bytes);
  return base64.replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};

const base64UrlDecode = (input: string): Uint8Array => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const normalized = padded + "=".repeat(padLength);
  return fromBase64(normalized);
};

const getEnv = (key: string): string | undefined => {
  const global = globalThis as Record<string, unknown>;
  const denoEnv =
    typeof global.Deno === "object" && global.Deno !== null
      ? (global.Deno as { env?: { get?: (name: string) => string | undefined } }).env
      : undefined;
  const denoValue = denoEnv?.get?.(key);
  if (denoValue) {
    return denoValue;
  }

  const nodeProcess =
    typeof global.process === "object" && global.process !== null
      ? (global.process as { env?: Record<string, string | undefined> })
      : undefined;
  const nodeValue = nodeProcess?.env?.[key];
  if (nodeValue) {
    return nodeValue;
  }

  return undefined;
};

const getJwtSecret = (override?: string) => {
  const secret = override ?? getEnv("JWT_SECRET");
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

const importJwtSecret = async (secret: string) => {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
};

const signHmac = async (key: CryptoKey, data: string) => {
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(data));
  return new Uint8Array(signature);
};

const verifyHmac = async (key: CryptoKey, data: string, signature: Uint8Array) => {
  const signatureCopy = signature.slice();
  return crypto.subtle.verify("HMAC", key, signatureCopy, textEncoder.encode(data));
};

export interface AuthJwtClaims {
  sub: string;
  auth: string;
  exp: number;
  [key: string]: unknown;
}

export interface JwtHeader {
  alg: string;
  typ: string;
  [key: string]: unknown;
}

export interface SignJwtOptions {
  secret?: string;
  issuedAt?: number;
}

export interface VerifyJwtOptions {
  secret?: string;
  clockToleranceSeconds?: number;
}

export interface VerifiedJwt<T extends Record<string, unknown> = AuthJwtClaims> {
  header: JwtHeader;
  payload: T;
}

export const signAuthJwt = async (
  claims: AuthJwtClaims,
  options?: SignJwtOptions
): Promise<string> => {
  const secret = getJwtSecret(options?.secret);
  const header: JwtHeader = { alg: "HS256", typ: "JWT" };

  const issuedAt = options?.issuedAt ?? Math.floor(Date.now() / 1000);
  const payload = { ...claims, iat: issuedAt };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const cryptoKey = await importJwtSecret(secret);
  const signatureBytes = await signHmac(cryptoKey, signingInput);
  const encodedSignature = base64UrlEncode(signatureBytes);

  return `${signingInput}.${encodedSignature}`;
};

export const verifyAuthJwt = async <T extends Record<string, unknown> = AuthJwtClaims>(
  token: string,
  options?: VerifyJwtOptions
): Promise<VerifiedJwt<T>> => {
  const secret = getJwtSecret(options?.secret);
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT structure");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const headerBytes = base64UrlDecode(encodedHeader);
  const payloadBytes = base64UrlDecode(encodedPayload);
  const signatureBytes = base64UrlDecode(encodedSignature);

  const decoder = new TextDecoder();
  const header = JSON.parse(decoder.decode(headerBytes)) as JwtHeader;
  const payload = JSON.parse(decoder.decode(payloadBytes)) as T;

  if (header.alg !== "HS256") {
    throw new Error(`Unsupported JWT algorithm: ${header.alg}`);
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const cryptoKey = await importJwtSecret(secret);
  const isValid = await verifyHmac(cryptoKey, signingInput, signatureBytes);

  if (!isValid) {
    throw new Error("Invalid JWT signature");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const tolerance = options?.clockToleranceSeconds ?? 0;
  const payloadRecord = payload as Record<string, unknown>;
  const expValue = payloadRecord.exp;
  const exp = typeof expValue === "number" ? expValue : null;

  if (exp !== null && nowSeconds - tolerance > exp) {
    throw new Error("JWT has expired");
  }

  return { header, payload };
};

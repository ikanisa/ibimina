import crypto from "node:crypto";

const HMAC_ALGORITHM = "sha256";
const JWT_HEADER = {
  alg: "HS256",
  typ: "JWT",
  kid: "qr-auth",
};

export type QrTokenPayload = {
  sid: string;
  challenge: string;
  exp: number;
  iat: number;
  v: 1;
  purpose: "qr-auth";
};

const base64UrlEncode = (input: crypto.BinaryLike) =>
  Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const timingSafeEqual = (a: Buffer, b: Buffer) => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

const resolveSecret = () => {
  const secret = process.env.HMAC_SHARED_SECRET || process.env.BACKUP_PEPPER;
  if (!secret) {
    throw new Error("HMAC_SHARED_SECRET is not configured");
  }
  return secret;
};

export const signQrToken = (payload: Omit<QrTokenPayload, "iat" | "v" | "purpose">) => {
  const secret = resolveSecret();
  const fullPayload: QrTokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    v: 1,
    purpose: "qr-auth",
  };

  const header = base64UrlEncode(JSON.stringify(JWT_HEADER));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const message = `${header}.${body}`;
  const signature = crypto.createHmac(HMAC_ALGORITHM, secret).update(message).digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${message}.${encodedSignature}`;
};

export const hashQrToken = (token: string) => {
  const secret = resolveSecret();
  return crypto.createHmac(HMAC_ALGORITHM, secret).update(token).digest("hex");
};

export const verifyQrToken = (token: string): QrTokenPayload => {
  const secret = resolveSecret();
  const [encodedHeader, encodedBody, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedBody || !encodedSignature) {
    throw new Error("invalid_token_format");
  }

  const message = `${encodedHeader}.${encodedBody}`;
  const expected = crypto.createHmac(HMAC_ALGORITHM, secret).update(message).digest();
  const provided = Buffer.from(encodedSignature.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  if (!timingSafeEqual(expected, provided)) {
    throw new Error("invalid_token_signature");
  }

  const payload = JSON.parse(Buffer.from(encodedBody, "base64").toString()) as QrTokenPayload;

  if (payload.purpose !== "qr-auth" || payload.v !== 1) {
    throw new Error("invalid_token_purpose");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new Error("token_expired");
  }

  return payload;
};

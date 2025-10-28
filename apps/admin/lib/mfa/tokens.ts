import crypto from "node:crypto";

const encode = (buffer: Buffer) => buffer.toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url");

const sign = (payload: string, secret: string) =>
  encode(crypto.createHmac("sha256", secret).update(payload).digest());

export const createSignedToken = <T extends Record<string, unknown>>(
  payload: T,
  secret: string
) => {
  const json = JSON.stringify(payload);
  const body = encode(Buffer.from(json, "utf8"));
  const signature = sign(body, secret);
  return `${body}.${signature}`;
};

export const verifySignedToken = <T>(token: string, secret: string): T | null => {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body, secret);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const json = decode(body).toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

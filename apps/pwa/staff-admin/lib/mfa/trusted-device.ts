import crypto from "node:crypto";

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export const hashUserAgent = (userAgent: string) => sha256(userAgent.trim().toLowerCase());

export const deriveIpPrefix = (ipRaw: string | null) => {
  if (!ipRaw) return null;
  const ip = ipRaw.split(",")[0]?.trim();
  if (!ip) return null;
  if (ip.includes(":")) {
    const segments = ip.split(":");
    return segments.slice(0, 4).join(":");
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
};

export const hashDeviceFingerprint = (
  userId: string,
  userAgentHash: string,
  ipPrefix: string | null
) => sha256(`${userId}:${userAgentHash}:${ipPrefix ?? "unknown"}`);

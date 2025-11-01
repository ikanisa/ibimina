import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export interface SecureTokenMetadata {
  readonly tenantId: string;
  readonly issuedBy: string;
  readonly scopes: readonly string[];
  readonly expiresAt: Date;
}

export interface StoredToken {
  readonly key: string;
  readonly hash: string;
  readonly salt: string;
  readonly metadata: SecureTokenMetadata;
  readonly createdAt: Date;
}

export interface TokenVerificationResult {
  readonly valid: boolean;
  readonly metadata?: SecureTokenMetadata;
}

function hashSecret(secret: string, salt: string): string {
  const derived = scryptSync(secret, salt, 64, { N: 32768, r: 8, p: 1 });
  return derived.toString("base64");
}

export class SecureTokenVault {
  private readonly tokens = new Map<string, StoredToken>();

  constructor(private readonly clock: () => Date = () => new Date()) {}

  issueToken(key: string, secret: string, metadata: SecureTokenMetadata): StoredToken {
    const normalizedKey = key.trim().toLowerCase();
    if (!normalizedKey) {
      throw new Error("Token key must be provided");
    }
    const salt = randomBytes(16).toString("hex");
    const hash = hashSecret(secret, salt);
    const record: StoredToken = {
      key: normalizedKey,
      hash,
      salt,
      metadata,
      createdAt: this.clock(),
    };
    this.tokens.set(normalizedKey, record);
    return record;
  }

  revokeToken(key: string): boolean {
    const normalizedKey = key.trim().toLowerCase();
    return this.tokens.delete(normalizedKey);
  }

  verifyToken(key: string, candidate: string): TokenVerificationResult {
    const normalizedKey = key.trim().toLowerCase();
    const record = this.tokens.get(normalizedKey);
    if (!record) {
      return { valid: false };
    }

    if (this.clock() > record.metadata.expiresAt) {
      this.tokens.delete(normalizedKey);
      return { valid: false };
    }

    const expected = Buffer.from(record.hash, "base64");
    const actual = Buffer.from(hashSecret(candidate, record.salt), "base64");
    const valid = expected.length === actual.length && timingSafeEqual(expected, actual);

    return valid ? { valid: true, metadata: record.metadata } : { valid: false };
  }

  listActiveTokens(): readonly StoredToken[] {
    const now = this.clock();
    return Array.from(this.tokens.values()).filter((token) => token.metadata.expiresAt > now);
  }
}

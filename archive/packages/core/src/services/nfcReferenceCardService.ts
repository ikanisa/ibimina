import { SecureTokenVault, type SecureTokenMetadata } from "./tokenVault";
import type { FeatureFlagSnapshot } from "./types";

export interface ReferenceCardPayload {
  readonly memberId: string;
  readonly cardSerial: string;
  readonly tenantId: string;
  readonly issuedBy: string;
  readonly expiresAt: Date;
}

export interface NFCReferenceCard {
  readonly memberId: string;
  readonly cardSerial: string;
  readonly tenantId: string;
  readonly provisionedAt: Date;
  readonly tokenKey: string;
}

export class NFCReferenceCardService {
  private readonly vault: SecureTokenVault;
  private readonly cards = new Map<string, NFCReferenceCard>();

  constructor(
    private readonly flags: FeatureFlagSnapshot,
    vault: SecureTokenVault = new SecureTokenVault()
  ) {
    this.vault = vault;
  }

  issue(payload: ReferenceCardPayload, secret: string): NFCReferenceCard {
    if (!this.flags.nfcReferenceCards) {
      throw new Error("NFC reference cards are disabled for this tenant");
    }
    const tokenMetadata: SecureTokenMetadata = {
      tenantId: payload.tenantId,
      issuedBy: payload.issuedBy,
      scopes: ["nfc:issue", "nfc:provision"],
      expiresAt: payload.expiresAt,
    };

    const tokenKey = `${payload.tenantId}:${payload.cardSerial}`;
    this.vault.issueToken(tokenKey, secret, tokenMetadata);

    const card: NFCReferenceCard = {
      memberId: payload.memberId,
      cardSerial: payload.cardSerial,
      tenantId: payload.tenantId,
      provisionedAt: new Date(),
      tokenKey,
    };

    this.cards.set(card.cardSerial, card);
    return card;
  }

  verify(cardSerial: string, token: string): boolean {
    const card = this.cards.get(cardSerial);
    if (!card) {
      return false;
    }

    const verification = this.vault.verifyToken(card.tokenKey, token);
    return verification.valid && verification.metadata?.tenantId === card.tenantId;
  }

  revoke(cardSerial: string): boolean {
    const card = this.cards.get(cardSerial);
    if (!card) {
      return false;
    }
    this.cards.delete(cardSerial);
    return this.vault.revokeToken(card.tokenKey);
  }
}

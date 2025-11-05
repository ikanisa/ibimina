import { SecureTokenVault } from "./tokenVault";
import type { FeatureFlagSnapshot } from "./types";

export interface VoucherPayload {
  readonly voucherId: string;
  readonly memberId: string;
  readonly amount: number;
  readonly currency: string;
  readonly issuedBy: string;
  readonly tenantId: string;
  readonly expiresAt: Date;
}

export interface VoucherRedemption {
  readonly voucherId: string;
  readonly redeemedAt: Date;
  readonly merchantCode: string;
  readonly amount: number;
}

export class VoucherService {
  private readonly vault: SecureTokenVault;
  private readonly vouchers = new Map<string, VoucherPayload>();
  private readonly redemptions = new Map<string, VoucherRedemption>();

  constructor(
    private readonly flags: FeatureFlagSnapshot,
    vault: SecureTokenVault = new SecureTokenVault()
  ) {
    this.vault = vault;
  }

  issue(payload: VoucherPayload): VoucherPayload {
    if (!this.flags.memberVouchers) {
      throw new Error("Member vouchers are disabled for this tenant");
    }

    this.vouchers.set(payload.voucherId, payload);
    this.vault.issueToken(`voucher:${payload.voucherId}`, `${payload.memberId}:${payload.amount}`, {
      tenantId: payload.tenantId,
      issuedBy: payload.issuedBy,
      scopes: ["voucher:redeem"],
      expiresAt: payload.expiresAt,
    });

    return payload;
  }

  redeem(voucherId: string, merchantCode: string, amount: number): VoucherRedemption {
    const voucher = this.vouchers.get(voucherId);
    if (!voucher) {
      throw new Error("Voucher not found");
    }
    if (this.redemptions.has(voucherId)) {
      throw new Error("Voucher already redeemed");
    }

    const redemption: VoucherRedemption = {
      voucherId,
      merchantCode,
      amount,
      redeemedAt: new Date(),
    };

    this.redemptions.set(voucherId, redemption);
    this.vault.revokeToken(`voucher:${voucherId}`);
    return redemption;
  }

  getVoucher(voucherId: string): VoucherPayload | undefined {
    return this.vouchers.get(voucherId);
  }
}

import type { Database } from "@/lib/supabase/types";
import { verifyBackupFactor } from "./backup";
import { initiateEmailFactor, verifyEmailFactor } from "./email";
import { verifyPasskeyFactor } from "./passkey";
import { verifyTotpFactor } from "./totp";
import { initiateWhatsAppFactor, verifyWhatsAppFactor } from "./whatsapp";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

type VerifyHandler = (input: FactorVerifyInput) => Promise<FactorSuccess | FactorFailure>;
type InitiateHandler = (input: FactorInitiateInput) => Promise<FactorInitiateResult>;

const verifyHandlerOverrides = new Map<Factor, VerifyHandler>();
const initiateHandlerOverrides = new Map<Factor, InitiateHandler>();

export function overrideVerifyHandlers(overrides: Partial<Record<Factor, VerifyHandler>>) {
  for (const [factor, handler] of Object.entries(overrides) as Array<[Factor, VerifyHandler | undefined]>) {
    if (handler) {
      verifyHandlerOverrides.set(factor, handler);
    } else {
      verifyHandlerOverrides.delete(factor);
    }
  }
}

export function overrideInitiateHandlers(overrides: Partial<Record<Factor, InitiateHandler>>) {
  for (const [factor, handler] of Object.entries(overrides) as Array<[Factor, InitiateHandler | undefined]>) {
    if (handler) {
      initiateHandlerOverrides.set(factor, handler);
    } else {
      initiateHandlerOverrides.delete(factor);
    }
  }
}

export function resetFactorOverrides() {
  verifyHandlerOverrides.clear();
  initiateHandlerOverrides.clear();
}

export type Factor = "totp" | "email" | "whatsapp" | "backup" | "passkey";

export interface FactorState {
  totpSecret?: UserRow["mfa_secret_enc"];
  lastStep?: UserRow["last_mfa_step"];
  backupHashes?: UserRow["mfa_backup_hashes"];
}

export interface FactorVerifyInput {
  factor: Factor;
  token?: string;
  userId: string;
  email?: string | null;
  state: FactorState;
  rememberDevice?: boolean;
}

export interface FactorSuccess {
  ok: true;
  status: number;
  factor: Factor;
  auditAction: string;
  auditDiff: Record<string, unknown> | null;
  nextBackupHashes?: string[];
  nextLastStep?: number | null;
  usedBackup?: boolean;
  step?: number | null;
}

export interface FactorFailure {
  ok: false;
  status: number;
  error: string;
  code?: string;
  payload?: Record<string, unknown>;
}

export interface FactorInitiateInput {
  factor: Factor;
  userId: string;
  email?: string | null;
  phone?: string | null;
}

export type FactorInitiateResult =
  | { ok: true; status: number; payload?: Record<string, unknown> }
  | (FactorFailure & { ok: false });

export const verifyFactor = async (
  input: FactorVerifyInput,
): Promise<FactorSuccess | FactorFailure> => {
  const override = verifyHandlerOverrides.get(input.factor);
  if (override) {
    return override(input);
  }

  switch (input.factor) {
    case "totp":
      return verifyTotpFactor(input);
    case "backup":
      return verifyBackupFactor(input);
    case "email":
      return verifyEmailFactor(input);
    case "whatsapp":
      return verifyWhatsAppFactor(input);
    case "passkey":
      return verifyPasskeyFactor(input);
    default:
      return { ok: false, status: 400, error: "unsupported_factor", code: "UNSUPPORTED_FACTOR" };
  }
};

export const initiateFactor = async (
  input: FactorInitiateInput,
): Promise<FactorInitiateResult> => {
  const override = initiateHandlerOverrides.get(input.factor);
  if (override) {
    return override(input);
  }

  switch (input.factor) {
    case "email":
      return initiateEmailFactor(input);
    case "whatsapp":
      return initiateWhatsAppFactor(input);
    case "totp":
    case "backup":
      return { ok: true, status: 200, payload: { channel: input.factor } };
    case "passkey":
      return { ok: false, status: 501, error: "passkey_not_enabled", code: "PASSKEY_NOT_ENABLED" };
    default:
      return { ok: false, status: 400, error: "unsupported_factor", code: "UNSUPPORTED_FACTOR" };
  }
};

import { Buffer } from "node:buffer";
import type { FactorFailure, FactorSuccess, FactorVerifyInput } from "./index";
import { verifyPasskey, type PasskeyVerificationPayload } from "@/lib/authx/verify";

const parsePasskeyPayload = (token: string | undefined): PasskeyVerificationPayload | null => {
  if (!token) {
    return null;
  }

  try {
    return JSON.parse(token) as PasskeyVerificationPayload;
  } catch (jsonError) {
    try {
      const decoded = Buffer.from(token, "base64").toString("utf8");
      return JSON.parse(decoded) as PasskeyVerificationPayload;
    } catch (base64Error) {
      console.error("passkey_factor_parse_failed", jsonError, base64Error);
      return null;
    }
  }
};

export const verifyPasskeyFactor = async (
  input: FactorVerifyInput
): Promise<FactorSuccess | FactorFailure> => {
  const payload = parsePasskeyPayload(input.token);

  if (!payload) {
    return {
      ok: false,
      status: 400,
      error: "invalid_payload",
      code: "INVALID_PASSKEY_PAYLOAD",
    } satisfies FactorFailure;
  }

  const result = await verifyPasskey({ id: input.userId }, payload);
  if (!result.ok) {
    return {
      ok: false,
      status: 401,
      error: "invalid_or_expired",
      code: "PASSKEY_REJECTED",
    } satisfies FactorFailure;
  }

  return {
    ok: true,
    status: 200,
    factor: "passkey",
    auditAction: "MFA_SUCCESS",
    auditDiff: { factor: "passkey" },
    rememberDevice: result.rememberDevice ?? input.rememberDevice ?? false,
  } satisfies FactorSuccess;
};

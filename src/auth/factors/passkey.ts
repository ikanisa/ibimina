import type { FactorFailure, FactorSuccess, FactorVerifyInput } from "./index";

const notReady: FactorFailure = {
  ok: false,
  status: 501,
  error: "passkey_not_enabled",
  code: "PASSKEY_NOT_ENABLED",
};

export const verifyPasskeyFactor = async (
  input: FactorVerifyInput,
): Promise<FactorSuccess | FactorFailure> => {
  void input;
  return { ...notReady };
};

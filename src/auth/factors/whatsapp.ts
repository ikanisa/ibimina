import type {
  FactorFailure,
  FactorInitiateInput,
  FactorInitiateResult,
  FactorSuccess,
  FactorVerifyInput,
} from "./index";

const notEnabledResponse = {
  ok: false as const,
  status: 501,
  error: "whatsapp_not_enabled",
  code: "WHATSAPP_NOT_ENABLED",
} satisfies FactorFailure;

export const initiateWhatsAppFactor = async (
  input: FactorInitiateInput,
): Promise<FactorInitiateResult> => {
  void input;
  return { ...notEnabledResponse };
};

export const verifyWhatsAppFactor = async (
  input: FactorVerifyInput,
): Promise<FactorSuccess | FactorFailure> => {
  void input;
  return { ...notEnabledResponse };
};

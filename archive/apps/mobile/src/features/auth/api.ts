import { apiFetch } from "../../services/api/client";

export interface StartWhatsAppAuthResponse {
  attemptId: string;
  expiresIn: number;
  resendIn?: number;
}

export interface VerifyWhatsAppAuthResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

export async function startWhatsAppAuth(whatsappNumber: string) {
  const payload = { whatsappNumber: whatsappNumber.trim() };
  const response = await apiFetch<StartWhatsAppAuthResponse>("/auth/whatsapp/start", {
    method: "POST",
    body: JSON.stringify(payload),
    includeAuth: false,
  });
  return response;
}

export async function verifyWhatsAppAuth(whatsappNumber: string, code: string, attemptId?: string) {
  const payload = { whatsappNumber: whatsappNumber.trim(), code: code.trim(), attemptId };
  const response = await apiFetch<VerifyWhatsAppAuthResponse>("/auth/whatsapp/verify", {
    method: "POST",
    body: JSON.stringify(payload),
    includeAuth: false,
  });
  return response;
}

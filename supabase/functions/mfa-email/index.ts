import { z } from "zod";
import { createServiceClient, jsonResponse, requireEnv } from "../_shared/mod.ts";
import { recordMetric } from "../_shared/metrics.ts";
import { serveWithObservability } from "../_shared/observability.ts";

const requestSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(12),
  ttlMinutes: z.number().int().positive().max(60),
  expiresAt: z.string().optional(),
  locale: z.enum(["en", "fr", "rw"]).optional(),
});

const emailContent = (locale: string, code: string, ttlMinutes: number) => {
  switch (locale) {
    case "fr":
      return {
        subject: "Code de sécurité Ibimina",
        text: [
          "Bonjour,",
          "",
          "Votre code de sécurité Ibimina est :",
          "",
          `    ${code}`,
          "",
          `Il expire dans ${ttlMinutes} minutes. Si vous n’êtes pas à l’origine de cette demande, contactez immédiatement un administrateur.`,
          "",
          "— Ibimina SACCO+ Sécurité",
        ].join("\n"),
      };
    case "rw":
      return {
        subject: "Kode y'umutekano ya Ibimina",
        text: [
          "Muraho,",
          "",
          "Kode y'umutekano ya Ibimina ni:",
          "",
          `    ${code}`,
          "",
          `Irangira mu minota ${ttlMinutes}. Niba utasabye iyi kode, hamagara umuyobozi ako kanya.`,
          "",
          "— Ibimina SACCO+ Umutekano",
        ].join("\n"),
      };
    default:
      return {
        subject: "Ibimina security code",
        text: [
          "Hi,",
          "",
          "Your Ibimina security code is:",
          "",
          `    ${code}`,
          "",
          `It expires in ${ttlMinutes} minutes. If you did not request this code, please contact an administrator immediately.`,
          "",
          "— Ibimina SACCO+ Security",
        ].join("\n"),
      };
  }
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST,OPTIONS",
};

const errorWithCors = (message: string, status = 400) =>
  jsonResponse({ error: message }, { status, headers: corsHeaders });

serveWithObservability("mfa-email", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorWithCors("method_not_allowed", 405);
  }

  try {
    const payload = requestSchema.parse(await req.json());
    const resendApiKey = requireEnv("RESEND_API_KEY");
    const fromAddress = requireEnv("MFA_EMAIL_FROM");
    const { subject, text } = emailContent(
      payload.locale ?? "en",
      payload.code,
      payload.ttlMinutes
    );

    const domain = payload.email.split("@")[1] ?? "unknown";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: payload.email,
        subject,
        text,
      }),
    });

    const supabase = createServiceClient();

    if (!response.ok) {
      const body = await response.text().catch(() => "unknown");
      console.error("mfa-email send failed", response.status, body);
      await recordMetric(supabase, "mfa_email_failure", 1, { domain, status: response.status });
      return errorWithCors("send_failed", 502);
    }

    await recordMetric(supabase, "mfa_email_sent", 1, { domain });

    return jsonResponse({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("mfa-email error", error);
    const status = error instanceof z.ZodError ? 400 : 500;
    const message = error instanceof z.ZodError ? "invalid_payload" : "internal_error";
    try {
      const supabase = createServiceClient();
      await recordMetric(supabase, "mfa_email_failure", 1, { reason: message });
    } catch (metricError) {
      console.error("mfa-email metric failure", metricError);
    }
    return errorWithCors(message, status);
  }
});

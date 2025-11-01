import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { once } from "node:events";
import type { Logger } from "pino";
import { z } from "zod";

import {
  hashBody,
  processWebhookPayload,
  verifyMetaSignature,
  type WhatsAppStatusRecord,
  type WhatsAppWebhookPayload,
} from "../../src/webhooks/whatsapp.js";
import { createRequestLogger } from "../../src/lib/logger.js";

interface AlertPayload {
  event: string;
  failures: Array<
    Pick<
      WhatsAppStatusRecord,
      "message_id" | "status" | "failure_reason" | "error_code" | "error_message" | "error_title"
    >
  >;
  summary: { count: number; hash: string };
}

let cachedClient: SupabaseClient | null = null;

const getSupabaseClient = () => {
  const override = (globalThis as { __TEST_SUPABASE_CLIENT__?: SupabaseClient | null })
    .__TEST_SUPABASE_CLIENT__;
  if (override) {
    cachedClient = override;
    return cachedClient;
  }

  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for the WhatsApp webhook."
    );
  }

  cachedClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedClient;
};

const readRequestBody = async (req: VercelRequest): Promise<Buffer> => {
  if (req.body) {
    if (typeof req.body === "string") {
      return Buffer.from(req.body);
    }
    if (Buffer.isBuffer(req.body)) {
      return req.body;
    }
  }

  const chunks: Buffer[] = [];

  req.on("data", (chunk) => {
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(chunk);
    }
  });

  await once(req, "end");

  return Buffer.concat(chunks);
};

const persistStatuses = async (records: WhatsAppStatusRecord[], log: Logger) => {
  if (!records.length) return { inserted: 0 };

  const supabase = getSupabaseClient();
  const { error } = await supabase.schema("ops").from("whatsapp_delivery_events").upsert(records, {
    ignoreDuplicates: true,
    onConflict: "message_id,status,message_timestamp",
  });

  if (error) {
    log.error(
      { err: error, event: "whatsapp_webhook.persist_error" },
      "Failed to persist WhatsApp statuses"
    );
    throw new Error(`Failed to persist WhatsApp statuses: ${error.message}`);
  }

  return { inserted: records.length };
};

const postAlert = async (payload: AlertPayload, log: Logger) => {
  const webhook = process.env.WHATSAPP_ALERT_WEBHOOK?.trim();
  if (!webhook) return;

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  const token = process.env.WHATSAPP_ALERT_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      log.warn(
        {
          event: "whatsapp_webhook.alert_non_200",
          status: response.status,
          statusText: response.statusText,
        },
        "Alert webhook responded with non-200"
      );
    }
  } catch (error) {
    log.error(
      { err: error, event: "whatsapp_webhook.alert_failed" },
      "Failed to dispatch alert webhook"
    );
  }
};

const verificationQuerySchema = z.object({
  mode: z.literal("subscribe"),
  challenge: z.string().min(1),
  verifyToken: z.string().min(1),
});

const extractQueryValue = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const [first] = value;
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
};

const handleVerification = (req: VercelRequest, res: VercelResponse, log: Logger) => {
  const result = verificationQuerySchema.safeParse({
    mode: extractQueryValue(req.query["hub.mode"]),
    challenge: extractQueryValue(req.query["hub.challenge"]),
    verifyToken: extractQueryValue(req.query["hub.verify_token"]),
  });

  if (!result.success) {
    log.warn(
      { event: "whatsapp_webhook.invalid_verification", issues: result.error.issues },
      "Invalid verification request"
    );
    res.status(400).json({ error: "Unsupported verification request" });
    return;
  }

  const expected = process.env.META_WHATSAPP_VERIFY_TOKEN;
  if (!expected || result.data.verifyToken !== expected) {
    log.warn({ event: "whatsapp_webhook.invalid_token" }, "Verification token mismatch");
    res.status(403).json({ error: "Invalid verification token" });
    return;
  }

  res.status(200).send(result.data.challenge);
};

const buildAlertPayload = (failures: WhatsAppStatusRecord[], bodyHash: string): AlertPayload => ({
  event: "whatsapp.delivery_failed",
  failures: failures.map((failure) => ({
    message_id: failure.message_id,
    status: failure.status,
    failure_reason: failure.failure_reason ?? null,
    error_code: failure.error_code ?? null,
    error_message: failure.error_message ?? null,
    error_title: failure.error_title ?? null,
  })),
  summary: {
    count: failures.length,
    hash: bodyHash,
  },
});

const parsePayload = (rawBody: Buffer): WhatsAppWebhookPayload => {
  try {
    const text = rawBody.toString("utf8");
    return JSON.parse(text) as WhatsAppWebhookPayload;
  } catch {
    throw new Error("Invalid JSON payload");
  }
};

const whatsappStatusSchema = z
  .object({
    id: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
    timestamp: z.string().optional(),
    recipient_id: z.string().optional(),
    conversation: z
      .object({
        id: z.string().optional(),
        origin: z.object({ type: z.string().optional() }).partial().optional(),
      })
      .partial()
      .optional(),
    errors: z
      .array(
        z
          .object({
            code: z.string().optional(),
            title: z.string().optional(),
            message: z.string().optional(),
          })
          .partial()
      )
      .optional(),
  })
  .passthrough();

const webhookPayloadSchema = z
  .object({
    entry: z
      .array(
        z
          .object({
            changes: z
              .array(
                z
                  .object({
                    value: z
                      .object({
                        messages: z.array(z.record(z.unknown())).optional(),
                        statuses: z.array(whatsappStatusSchema).optional(),
                      })
                      .passthrough()
                      .optional(),
                  })
                  .passthrough()
              )
              .optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const log = createRequestLogger(req);

  if (req.method === "GET") {
    handleVerification(req, res, log);
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    log.warn(
      { event: "whatsapp_webhook.method_not_allowed", method: req.method },
      "Received unsupported method"
    );
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawBody = await readRequestBody(req);
  const signatureHeader = req.headers["x-hub-signature-256"];
  const appSecret = process.env.META_WHATSAPP_APP_SECRET;

  if (!appSecret) {
    log.error(
      { event: "whatsapp_webhook.misconfigured", reason: "missing_app_secret" },
      "WhatsApp webhook is misconfigured"
    );
    res.status(500).json({ error: "WhatsApp webhook misconfigured" });
    return;
  }

  const verification = verifyMetaSignature(
    appSecret,
    rawBody,
    typeof signatureHeader === "string"
      ? signatureHeader
      : Array.isArray(signatureHeader)
        ? signatureHeader[0]
        : undefined
  );

  if (!verification.ok) {
    log.warn(
      { event: "whatsapp_webhook.signature_invalid", reason: verification.reason },
      "Invalid webhook signature"
    );
    res.status(403).json({ error: "Invalid signature" });
    return;
  }

  let payload: WhatsAppWebhookPayload;

  try {
    payload = parsePayload(rawBody);
  } catch (error) {
    log.warn(
      { event: "whatsapp_webhook.parse_error", err: error },
      "Failed to parse webhook payload"
    );
    res.status(400).json({ error: (error as Error).message });
    return;
  }

  const validation = webhookPayloadSchema.safeParse(payload);
  if (!validation.success) {
    log.warn(
      { event: "whatsapp_webhook.validation_failed", issues: validation.error.issues },
      "Webhook payload validation failed"
    );
    res.status(400).json({ error: "Invalid webhook payload" });
    return;
  }

  const safePayload = validation.data as WhatsAppWebhookPayload;
  const summary = processWebhookPayload(safePayload);

  try {
    await persistStatuses(summary.statuses, log);
  } catch (error) {
    log.error(
      { event: "whatsapp_webhook.persist_error", err: error },
      "Failed to persist webhook statuses"
    );
    res.status(500).json({ error: "Failed to persist statuses" });
    return;
  }

  if (summary.failures.length) {
    const hash = hashBody(rawBody);
    await postAlert(buildAlertPayload(summary.failures, hash), log);
  }

  log.info(
    {
      event: "whatsapp_webhook.processed",
      inboundMessages: summary.inboundMessages,
      statuses: summary.statuses.length,
      failures: summary.failures.length,
    },
    "WhatsApp webhook processed"
  );

  res.status(200).json({
    ok: true,
    inboundMessages: summary.inboundMessages,
    statuses: summary.statuses.length,
    failures: summary.failures.length,
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

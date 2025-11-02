import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { once } from "node:events";

import { withHttpObservability } from "../../src/observability";
import type { StructuredLogger } from "../../src/observability";

import {
  hashBody,
  processWebhookPayload,
  verifyMetaSignature,
  type WhatsAppStatusRecord,
  type WhatsAppWebhookPayload,
} from "../../src/webhooks/whatsapp.js";

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

const persistStatuses = async (records: WhatsAppStatusRecord[]) => {
  if (!records.length) return { inserted: 0 };

  const supabase = getSupabaseClient();
  const { error } = await supabase.schema("ops").from("whatsapp_delivery_events").upsert(records, {
    ignoreDuplicates: true,
    onConflict: "message_id,status,message_timestamp",
  });

  if (error) {
    throw new Error(`Failed to persist WhatsApp statuses: ${error.message}`);
  }

  return { inserted: records.length };
};

const postAlert = async (payload: AlertPayload, logger: StructuredLogger) => {
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
      logger.warn("whatsapp_webhook.alert_non_200", {
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    logger.error("whatsapp_webhook.alert_failed", { error });
  }
};

const handleVerification = (req: VercelRequest, res: VercelResponse) => {
  const mode = req.query["hub.mode"]; // Provided by Meta for verification
  const challenge = req.query["hub.challenge"];
  const verifyToken = req.query["hub.verify_token"];

  if (mode === "subscribe" && typeof challenge === "string") {
    const expected = process.env.META_WHATSAPP_VERIFY_TOKEN;
    if (!expected || verifyToken !== expected) {
      res.status(403).json({ error: "Invalid verification token" });
      return;
    }

    res.status(200).send(challenge);
    return;
  }

  res.status(400).json({ error: "Unsupported verification request" });
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
  } catch (error) {
    console.error("whatsapp_webhook.parse_error", error);
    throw new Error("Invalid JSON payload");
  }
};

export default withHttpObservability("webhook.whatsapp", async (req, res, context) => {
  if (req.method === "GET") {
    handleVerification(req, res);
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawBody = await readRequestBody(req);
  const signatureHeader = req.headers["x-hub-signature-256"];
  const appSecret = process.env.META_WHATSAPP_APP_SECRET;

  if (!appSecret) {
    context.logger.error("whatsapp_webhook.misconfigured", { reason: "missing_app_secret" });
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
    context.logger.warn("whatsapp_webhook.signature_invalid", { reason: verification.reason });
    res.status(403).json({ error: "Invalid signature" });
    return;
  }

  let payload: WhatsAppWebhookPayload;

  try {
    payload = parsePayload(rawBody);
  } catch (error) {
    context.logger.warn("whatsapp_webhook.invalid_payload", { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
    return;
  }

  const summary = processWebhookPayload(payload);

  try {
    await persistStatuses(summary.statuses);
  } catch (error) {
    context.logger.error("whatsapp_webhook.persist_error", { error });
    context.captureException(error, { path: req.url ?? "/api/webhook/whatsapp" });
    res.status(500).json({ error: "Failed to persist statuses" });
    return;
  }

  if (summary.failures.length) {
    const hash = hashBody(rawBody);
    await postAlert(buildAlertPayload(summary.failures, hash), context.logger);
    await context.track("whatsapp.delivery_failure", {
      failures: summary.failures.length,
    });
  }

  res.status(200).json({
    ok: true,
    inboundMessages: summary.inboundMessages,
    statuses: summary.statuses.length,
    failures: summary.failures.length,
  });
});

export const config = {
  api: {
    bodyParser: false,
  },
};

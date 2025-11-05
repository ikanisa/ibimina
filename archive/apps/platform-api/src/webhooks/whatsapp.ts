import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export interface MetaSignatureVerificationResult {
  ok: boolean;
  reason?: "missing" | "malformed" | "mismatch";
}

export interface WhatsAppWebhookStatusError {
  code?: string;
  title?: string;
  message?: string;
}

export interface WhatsAppWebhookStatus {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
  conversation?: {
    id?: string;
    origin?: { type?: string };
  };
  errors?: WhatsAppWebhookStatusError[];
  [key: string]: unknown;
}

export interface WhatsAppWebhookEntryChangeValue {
  messages?: Array<Record<string, unknown>>;
  statuses?: WhatsAppWebhookStatus[];
  [key: string]: unknown;
}

export interface WhatsAppWebhookEntryChange {
  value?: WhatsAppWebhookEntryChangeValue;
}

export interface WhatsAppWebhookEntry {
  changes?: WhatsAppWebhookEntryChange[];
}

export interface WhatsAppWebhookPayload {
  entry?: WhatsAppWebhookEntry[];
  [key: string]: unknown;
}

export interface WhatsAppStatusRecord {
  message_id: string;
  status: string;
  message_timestamp: string;
  recipient?: string | null;
  conversation_id?: string | null;
  conversation_origin?: string | null;
  error_code?: string | null;
  error_title?: string | null;
  error_message?: string | null;
  failure_reason?: string | null;
  raw_payload: WhatsAppWebhookStatus;
}

export interface WhatsAppWebhookProcessingResult {
  inboundMessages: number;
  statuses: WhatsAppStatusRecord[];
  failures: WhatsAppStatusRecord[];
}

const FAILURE_STATUSES = new Set(["failed", "undelivered", "canceled", "rejected"]);

const buildFailureReason = (status: WhatsAppWebhookStatus): string | null => {
  const errors = status.errors ?? [];

  if (!errors.length) {
    return null;
  }

  const parts = errors
    .map((error) => error?.message || error?.title || error?.code)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return parts.length ? parts.join("; ") : null;
};

export const verifyMetaSignature = (
  appSecret: string,
  rawBody: Uint8Array,
  signatureHeader?: string | null
): MetaSignatureVerificationResult => {
  if (!signatureHeader) {
    return { ok: false, reason: "missing" };
  }

  const [prefix, digest] = signatureHeader.split("=");

  if (prefix !== "sha256" || !digest) {
    return { ok: false, reason: "malformed" };
  }

  const hmac = createHmac("sha256", appSecret);
  hmac.update(rawBody);
  const expected = hmac.digest("hex");

  const providedBytes = Buffer.from(digest, "hex");
  const expectedBytes = Buffer.from(expected, "hex");

  if (providedBytes.length !== expectedBytes.length) {
    return { ok: false, reason: "mismatch" };
  }

  const matches = timingSafeEqual(providedBytes, expectedBytes);

  return matches ? { ok: true } : { ok: false, reason: "mismatch" };
};

const parseUnixTimestamp = (value?: string): string => {
  if (!value) {
    return new Date().toISOString();
  }

  const numeric = Number.parseInt(value, 10);

  if (Number.isNaN(numeric)) {
    return new Date().toISOString();
  }

  // Meta timestamps are seconds since epoch
  return new Date(numeric * 1000).toISOString();
};

const normaliseText = (value?: string): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const processWebhookPayload = (
  payload: WhatsAppWebhookPayload
): WhatsAppWebhookProcessingResult => {
  const entries = payload.entry ?? [];
  const statuses: WhatsAppStatusRecord[] = [];
  let inboundMessages = 0;

  for (const entry of entries) {
    const changes = entry?.changes ?? [];

    for (const change of changes) {
      const value = change?.value;
      if (!value) continue;

      inboundMessages += value.messages?.length ?? 0;

      for (const status of value.statuses ?? []) {
        const messageId = normaliseText(status.id) ?? "unknown";
        const statusName = normaliseText(status.status) ?? "unknown";
        const record: WhatsAppStatusRecord = {
          message_id: messageId,
          status: statusName,
          message_timestamp: parseUnixTimestamp(status.timestamp),
          recipient: normaliseText(status.recipient_id),
          conversation_id: normaliseText(status.conversation?.id),
          conversation_origin: normaliseText(status.conversation?.origin?.type),
          error_code: normaliseText(status.errors?.[0]?.code),
          error_title: normaliseText(status.errors?.[0]?.title),
          error_message: normaliseText(status.errors?.[0]?.message),
          failure_reason: buildFailureReason(status),
          raw_payload: status,
        };

        statuses.push(record);
      }
    }
  }

  const failures = statuses.filter(
    (status) => FAILURE_STATUSES.has(status.status.toLowerCase()) || Boolean(status.failure_reason)
  );

  return {
    inboundMessages,
    statuses,
    failures,
  };
};

export const hashBody = (rawBody: Uint8Array) => {
  const hash = createHash("sha256");
  hash.update(rawBody);
  return hash.digest("hex");
};
